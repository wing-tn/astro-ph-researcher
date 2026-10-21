// astro-ph-researcher :: fetch/parse thesis-format documents locally.
// No server: the host downloads official pages/files into $DSH_HOME/astro-ph-researcher/formats.
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { DATA_DIR } from './store.js';
import { getThesisFormat } from './writing.js';
import { readZipEntries } from './dictionary.js';
import { fetchWithTimeout, log, warn } from './util.js';

const FORMATS_DIR = join(DATA_DIR, 'formats');
const MAX_DOWNLOAD = 25 * 1024 * 1024;
const MAX_TEXT = 80_000;
const FILE_EXT = /\.(pdf|docx?|zip|wps|rtf)(?:$|[?#])/i;
const REQUIREMENT_WORDS = /学位论文|论文|撰写|格式|规范|模板|template|thesis|dissertation|format/i;

function safeId(value) {
  return String(value ?? 'format').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 100) || 'format';
}

function safeFileName(value, fallback = 'file') {
  const base = String(value ?? '')
    .split(/[?#]/)[0]
    .replace(/\\/g, '/')
    .split('/')
    .pop() || fallback;
  let decoded = base;
  try {
    decoded = decodeURIComponent(base);
  } catch {
    // keep raw
  }
  return decoded
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140) || fallback;
}

function decodeEntities(text) {
  return String(text)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)));
}

function htmlToText(html) {
  return decodeEntities(
    String(html ?? '')
      .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractMainText(html) {
  const source = String(html ?? '');
  const patterns = [
    /<article\b[^>]*>([\s\S]*?)<\/article>/i,
    /<main\b[^>]*>([\s\S]*?)<\/main>/i,
    /<div\b[^>]*(?:id|class)=["'][^"']*(?:vsb_content|v_news_content|article-content|articleContent|content|main-content|wp_articlecontent)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(source);
    if (match) {
      const text = htmlToText(match[1]);
      if (text.length > 80) return text;
    }
  }
  return htmlToText(source);
}

export function isBlockedUrl(url) {
  let parsed;
  try {
    parsed = new URL(String(url));
  } catch {
    return true;
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return true;
  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost') || host === '::1') return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const [a, b] = host.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
  }
  return false;
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

function extensionOf(name, contentType = '') {
  const fromName = String(name).toLowerCase().match(/\.(pdf|docx?|zip|txt|md|html?|wps|rtf)$/);
  if (fromName) return `.${fromName[1]}`;
  const type = String(contentType).toLowerCase();
  if (type.includes('pdf')) return '.pdf';
  if (type.includes('wordprocessingml')) return '.docx';
  if (type.includes('msword')) return '.doc';
  if (type.includes('zip')) return '.zip';
  if (type.includes('html')) return '.html';
  if (type.startsWith('text/')) return '.txt';
  return '';
}

function normalizeText(value) {
  return String(value ?? '').replace(/\r\n?/g, '\n').replace(/\u0000/g, '').trim().slice(0, MAX_TEXT);
}

export function parseDocxBuffer(buffer) {
  const entries = readZipEntries(buffer);
  const xml = entries.get('word/document.xml');
  if (!xml) throw new Error('DOCX has no word/document.xml');
  const text = decodeEntities(
    xml
      .toString('utf8')
      .replace(/<w:tab\b[^>]*\/>/gi, '\t')
      .replace(/<w:br\b[^>]*\/>/gi, '\n')
      .replace(/<\/w:p>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
  return normalizeText(text);
}

export function parseDocumentBuffer(buffer, filename, contentType = '') {
  const ext = extensionOf(filename, contentType);
  if (ext === '.docx') {
    return { text: parseDocxBuffer(buffer), kind: 'docx', needsDsh: false };
  }
  if (ext === '.zip') {
    const entries = readZipEntries(buffer);
    const docxEntry = [...entries.keys()].find((name) => name.toLowerCase().endsWith('.docx'));
    if (docxEntry) {
      return { text: parseDocxBuffer(entries.get(docxEntry)), kind: 'zip/docx', needsDsh: false, note: `ZIP 内解析 ${docxEntry}` };
    }
    return { text: '', kind: 'zip', needsDsh: true, note: 'ZIP 已保存；未发现可直接解析的 DOCX，请交给 DSH 查看压缩包内容。' };
  }
  if (['.txt', '.md', '.html', '.htm'].includes(ext)) {
    const raw = buffer.toString('utf8');
    return { text: normalizeText(ext.startsWith('.htm') ? htmlToText(raw) : raw), kind: ext.slice(1), needsDsh: false };
  }
  if (ext === '.pdf') {
    return { text: '', kind: 'pdf', needsDsh: true, note: 'PDF 已保存；插件不内置 PDF 文字抽取，请点「交给 DSH 解析」使用 PDF 阅读/转录能力。' };
  }
  if (ext === '.doc' || ext === '.wps' || ext === '.rtf') {
    return { text: '', kind: ext.slice(1), needsDsh: true, note: '旧版 Word/WPS/RTF 已保存；建议用 DSH 或 LibreOffice 转为 DOCX/文本后解析。' };
  }
  return { text: '', kind: ext.slice(1) || 'unknown', needsDsh: true, note: '未知格式已保存，请交给 DSH 解析。' };
}

function extractLinks(html, baseUrl) {
  const links = [];
  const seen = new Set();
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(String(html ?? '')))) {
    const rawHref = decodeEntities(match[1]).trim();
    const label = htmlToText(match[2]).replace(/\s+/g, ' ').trim();
    if (/^(下载区|下载专区|更多|首页|返回|登录|English|EN)$/i.test(label)) continue;
    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('javascript:')) continue;
    let url;
    try {
      url = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }
    if (seen.has(url) || isBlockedUrl(url)) continue;
    seen.add(url);
    const looksFile = FILE_EXT.test(url) || /(?:download|attach|附件)/i.test(`${label} ${url}`);
    const looksHtml = /\.(?:html?)(?:$|[?#])/i.test(url);
    const relevant = REQUIREMENT_WORDS.test(`${label} ${url}`) && /(?:学位论文|论文|撰写|格式|规范|模板|thesis|dissertation|template)/i.test(label);
    if (looksHtml && !relevant) continue;
    if (!looksFile && !relevant) continue;
    let score = 0;
    if (/\.pdf(?:$|[?#])/i.test(url)) score += 5;
    if (/\.docx?(?:$|[?#])/i.test(url)) score += 4;
    if (/\.zip(?:$|[?#])/i.test(url)) score += 2;
    if (/学位论文|论文|撰写|格式|规范|模板|template|thesis|dissertation/i.test(label)) score += 6;
    if (/附件|下载|download/i.test(label)) score += 3;
    if (/\.(js|css|png|jpe?g|gif|svg)(?:$|[?#])/i.test(url)) score -= 20;
    links.push({ url, label: label || safeFileName(url), score });
  }
  return links.sort((a, b) => b.score - a.score).slice(0, 8);
}

async function downloadCandidate(candidate, targetDir) {
  if (isBlockedUrl(candidate.url)) throw new Error('blocked URL');
  const response = await fetchWithTimeout(candidate.url, {
    timeoutMs: 25000,
    headers: { accept: 'application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/zip, text/html, */*;q=0.5' },
    redirect: 'follow',
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (isBlockedUrl(response.url)) throw new Error('blocked redirect');
  const contentLength = Number(response.headers.get('content-length') ?? 0);
  if (contentLength > MAX_DOWNLOAD) throw new Error(`file too large: ${contentLength} bytes`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > MAX_DOWNLOAD) throw new Error(`file too large: ${buffer.length} bytes`);
  const type = response.headers.get('content-type') ?? '';
  if (/text\/html/i.test(type) && /验证码|登录|暂无权限|captcha|login/i.test(buffer.toString('utf8', 0, 3000))) {
    throw new Error('页面返回验证码/登录/权限提示，未取到文件');
  }
  const disposition = response.headers.get('content-disposition') ?? '';
  let dispositionName = '';
  const dispositionMatch = /filename\*?=(?:UTF-8'')?["']?([^;"']+)/i.exec(disposition);
  if (dispositionMatch) {
    try {
      dispositionName = decodeURIComponent(dispositionMatch[1].trim());
    } catch {
      dispositionName = dispositionMatch[1].trim();
    }
  }
  const name = safeFileName(dispositionName || candidate.label || candidate.url, 'format');
  const ext = extensionOf(name, type) || extensionOf(candidate.url, type);
  const filename = ext && !name.toLowerCase().endsWith(ext) ? `${name}${ext}` : name;
  const targetPath = join(targetDir, filename);
  await writeFile(targetPath, buffer);
  let parsed;
  try {
    parsed = parseDocumentBuffer(buffer, filename, type);
  } catch (error) {
    parsed = { text: '', kind: ext.slice(1) || 'unknown', needsDsh: true, note: `解析失败：${error?.message ?? error}` };
  }
  return {
    name: filename,
    path: targetPath,
    url: response.url,
    contentType: type,
    bytes: buffer.length,
    sha256: sha256(buffer),
    text: parsed.text,
    needsDsh: parsed.needsDsh,
    note: parsed.note ?? '',
  };
}

async function readManifest(formatId) {
  try {
    return JSON.parse(await readFile(join(FORMATS_DIR, safeId(formatId), 'manifest.json'), 'utf8'));
  } catch {
    return null;
  }
}

async function writeManifest(formatId, manifest) {
  const dir = join(FORMATS_DIR, safeId(formatId));
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

export async function getFormatWorkspace(formatId) {
  return readManifest(formatId);
}

export async function fetchThesisFormat(formatId, options = {}) {
  const format = getThesisFormat(String(formatId));
  if (!format) throw new Error('unknown thesis format');
  if (!format.url) {
    throw new Error('该单位没有可公开访问的官方格式页；请使用“上传格式/模板”自行提供。');
  }
  const previous = await readManifest(formatId);
  if (!options.force && previous?.files?.length) return previous;
  const dir = join(FORMATS_DIR, safeId(formatId));
  await mkdir(join(dir, 'downloads'), { recursive: true });
  const fetchedAt = new Date().toISOString();
  const errors = [];
  const candidates = [];
  if (format.templateUrl) candidates.push({ url: format.templateUrl, label: '官方模板', score: 100 });
  let pageText = '';
  let pageTitle = '';
  try {
    const response = await fetchWithTimeout(format.url, { timeoutMs: 20000, redirect: 'follow', headers: { accept: 'text/html,application/xhtml+xml,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,*/*;q=0.5' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    if (isBlockedUrl(response.url)) throw new Error('blocked redirect');
    const type = response.headers.get('content-type') ?? '';
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > MAX_DOWNLOAD) throw new Error('page too large');
    if (/application\/pdf/i.test(type) || /\.pdf(?:$|[?#])/i.test(response.url)) {
      candidates.push({ url: response.url, label: '官方格式文件', score: 100 });
    } else {
      const html = buffer.toString('utf8');
      pageTitle = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '').replace(/\s+/g, ' ').trim();
      pageText = extractMainText(html).slice(0, MAX_TEXT);
      candidates.push(...extractLinks(html, response.url));
    }
  } catch (error) {
    errors.push(`读取官方页失败：${error?.message ?? error}`);
  }

  const seen = new Set();
  const seenLabels = new Set();
  const files = [];
  for (const candidate of candidates) {
    if (seen.has(candidate.url)) continue;
    const labelKey = String(candidate.label ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
    if (labelKey && seenLabels.has(labelKey)) continue;
    seen.add(candidate.url);
    if (labelKey) seenLabels.add(labelKey);
    if (files.length >= 6) break;
    try {
      const file = await downloadCandidate(candidate, join(dir, 'downloads'));
      if (files.some((existing) => existing.name === file.name)) continue;
      file.label = candidate.label;
      files.push(file);
    } catch (error) {
      errors.push(`${candidate.label || candidate.url}: ${error?.message ?? error}`);
    }
  }

  const parsedText = normalizeText(
    [pageTitle, ...files.map((file) => file.text), files.length ? '' : pageText].filter(Boolean).join('\n\n'),
  );
  const manifest = {
    formatId: format.id,
    university: format.university,
    yearVersion: format.yearVersion,
    sourceUrl: format.url,
    templateUrl: format.templateUrl ?? '',
    fetchedAt,
    files,
    text: parsedText,
    needsDsh: files.some((file) => file.needsDsh),
    errors,
    note: files.length ? '' : '未找到可下载的格式文件；可将官方页链接或文件交给 DSH 继续解析。',
  };
  await writeManifest(formatId, manifest);
  log(`thesis format fetched: ${format.university} files=${files.length} errors=${errors.length}`);
  return manifest;
}

export async function uploadThesisFormat(formatId, upload = {}) {
  const format = getThesisFormat(String(formatId));
  const dir = join(FORMATS_DIR, safeId(formatId || `custom-${Date.now()}`), 'uploads');
  await mkdir(dir, { recursive: true });
  const name = safeFileName(upload.name || 'uploaded-format', 'uploaded-format');
  const buffer = upload.encoding === 'base64'
    ? Buffer.from(String(upload.content ?? ''), 'base64')
    : Buffer.from(String(upload.content ?? ''), 'utf8');
  if (!buffer.length) throw new Error('empty upload');
  if (buffer.length > MAX_DOWNLOAD) throw new Error('file too large');
  const targetPath = join(dir, name);
  await writeFile(targetPath, buffer);
  const parsed = parseDocumentBuffer(buffer, name, upload.type ?? '');
  const manifest = await readManifest(formatId) ?? {
    formatId: String(formatId),
    university: format?.university ?? '',
    yearVersion: format?.yearVersion ?? '',
    sourceUrl: format?.url ?? '',
    templateUrl: format?.templateUrl ?? '',
    fetchedAt: new Date().toISOString(),
    files: [],
    text: '',
    needsDsh: false,
    errors: [],
    note: '',
  };
  manifest.files = [
    ...(manifest.files ?? []),
    {
      name,
      path: targetPath,
      url: '',
      contentType: upload.type ?? '',
      bytes: buffer.length,
      sha256: sha256(buffer),
      text: parsed.text,
      needsDsh: parsed.needsDsh,
      note: parsed.note ?? '',
      uploadedAt: new Date().toISOString(),
    },
  ];
  manifest.text = normalizeText([manifest.text, parsed.text].filter(Boolean).join('\n\n'));
  manifest.needsDsh = manifest.needsDsh || parsed.needsDsh;
  manifest.uploadedAt = new Date().toISOString();
  await writeManifest(formatId, manifest);
  log(`thesis format uploaded: ${formatId} ${name} bytes=${buffer.length}`);
  return manifest;
}

export function formatWorkspaceSummary(manifest) {
  if (!manifest) return '尚未下载/上传格式材料。';
  const lines = [
    `${manifest.university ?? ''} ${manifest.yearVersion ?? ''}`.trim(),
    `来源：${manifest.sourceUrl || '用户上传'}`,
    `获取时间：${manifest.fetchedAt ?? ''}`,
  ];
  if (manifest.files?.length) {
    lines.push('文件：');
    for (const file of manifest.files) {
      lines.push(`- ${file.name}（${Math.round((file.bytes ?? 0) / 1024)} KB${file.needsDsh ? '，需 DSH 解析' : '，已解析'}）`);
      lines.push(`  ${file.path}`);
    }
  }
  if (manifest.text) lines.push('', '已解析文本（节选）：', manifest.text.slice(0, 2000));
  if (manifest.errors?.length) lines.push('', '未完成：', ...manifest.errors.map((item) => `- ${item}`));
  return lines.join('\n');
}

export { FORMATS_DIR, safeId };
