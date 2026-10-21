import { createHash } from 'node:crypto';

export const SECTION_DEFS = [
  { id: 'title', nameZh: '标题', nameEn: 'Title', minWords: 3 },
  { id: 'abstract', nameZh: '摘要', nameEn: 'Abstract', minWords: 40 },
  { id: 'introduction', nameZh: '引言', nameEn: 'Introduction', minWords: 120 },
  { id: 'methods', nameZh: '数据与方法', nameEn: 'Data & Methods', minWords: 100 },
  { id: 'results', nameZh: '结果', nameEn: 'Results', minWords: 100 },
  { id: 'discussion', nameZh: '讨论', nameEn: 'Discussion', minWords: 80 },
  { id: 'conclusion', nameZh: '结论', nameEn: 'Conclusion', minWords: 40 },
  { id: 'figures', nameZh: '图表说明', nameEn: 'Figures & Tables', minWords: 10 },
  { id: 'references', nameZh: '参考文献', nameEn: 'References', minWords: 10 },
  { id: 'formatting', nameZh: '格式检查', nameEn: 'Formatting', minWords: 5 },
];

const STATUS = new Set(['todo', 'ai_draft', 'author_editing', 'needs_evidence', 'ready_for_review', 'author_confirmed', 'locked']);

export function sha256(text) {
  return createHash('sha256').update(String(text ?? ''), 'utf8').digest('hex');
}

export function createSections(existing = {}) {
  const out = {};
  for (const def of SECTION_DEFS) {
    const old = existing?.[def.id] ?? {};
    out[def.id] = {
      id: def.id,
      nameZh: def.nameZh,
      status: STATUS.has(old.status) ? old.status : 'todo',
      content: String(old.content ?? ''),
      contentHash: sha256(old.content ?? ''),
      score: old.score ?? null,
      confirmation: old.confirmation ?? null,
      updatedAt: String(old.updatedAt ?? ''),
    };
  }
  return out;
}

export function setSection(sections, sectionId, patch = {}) {
  const next = createSections(sections);
  const section = next[sectionId];
  if (!section) throw new Error(`unknown section: ${sectionId}`);
  if (patch.content !== undefined) {
    const content = String(patch.content ?? '');
    const hash = sha256(content);
    section.content = content;
    if (hash !== section.contentHash) {
      section.contentHash = hash;
      section.status = 'author_editing';
      section.confirmation = null;
      section.score = null;
    }
  }
  if (patch.status !== undefined) {
    if (!STATUS.has(patch.status)) throw new Error('invalid section status');
    if (patch.status === 'author_confirmed' || patch.status === 'locked') {
      throw new Error('confirmation is only allowed through the author confirmation route');
    }
    section.status = patch.status;
  }
  section.updatedAt = new Date().toISOString();
  return next;
}

function count(text, regex) {
  return (String(text ?? '').match(regex) ?? []).length;
}

export function scoreSection({ content, sectionId, goalId }) {
  const text = String(content ?? '').trim();
  const def = SECTION_DEFS.find((item) => item.id === sectionId) ?? SECTION_DEFS[0];
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const zhChars = count(text, /[\u4e00-\u9fff]/g);
  const lengthOk = words >= def.minWords || (def.id !== 'title' && zhChars >= def.minWords);
  const numbers = count(text, /\b\d+(?:\.\d+)?\s*(?:%|σ|sigma|keV|MeV|GeV|TeV|pc|kpc|Mpc|Gpc|yr|s|cm|erg|Jy|mag)?\b/gi);
  const citations = count(text, /\[\d+(?:[,–-]\d+)*\]|\([A-Z][A-Za-z-]+(?:\s+(?:et al\.|&|and)\s+[A-Z][A-Za-z-]+)?\s+\d{4}\)/g);
  const evidence = count(text, /\b(data|sample|figure|fig\.|table|error|uncertainty|confidence|significance|spectrum|fit|residual|model|observation)\b/gi);
  const overclaim = count(text, /\b(prove[sd]?|first ever|unprecedented|definitive(?:ly)?|perfect(?:ly)?|always|never)\b/gi);
  const hedge = count(text, /\b(consistent with|suggest|indicate|could|may|likely|within|upper limit|no significant)\b/gi);
  const reproducible = count(text, /\b(code|script|pipeline|repository|public|available|version|calibrat|reduction|procedure|parameter)\b/gi);
  const sentences = text.split(/[.!?。！？]+/).filter((part) => part.trim()).length || 1;
  const avgSentence = words / sentences;

  let claimEvidence = Math.min(95, 25 + numbers * 6 + citations * 8 + evidence * 3 + (lengthOk ? 10 : -15) - overclaim * 6);
  let citation = Math.min(95, 20 + citations * 14 + (sectionId === 'introduction' || sectionId === 'discussion' ? 10 : 0));
  let consistency = Math.min(95, 45 + (numbers > 0 ? 20 : -15) + (count(text, /±|\\pm|error|uncertainty/gi) > 0 ? 15 : 0) + (lengthOk ? 5 : -10));
  let reproducibility = Math.min(95, 30 + reproducible * 7 + (numbers > 0 ? 10 : -10));
  let styleFit = Math.min(95, 50 + hedge * 5 - overclaim * 8 + (lengthOk ? 10 : -10));
  let language = Math.min(95, 40 + Math.min(30, words / 20) + (avgSentence > 12 && avgSentence < 40 ? 15 : -10));
  claimEvidence = Math.max(0, claimEvidence);
  citation = Math.max(0, citation);
  consistency = Math.max(0, consistency);
  reproducibility = Math.max(0, reproducibility);
  styleFit = Math.max(0, styleFit);
  language = Math.max(0, language);

  const blockers = [];
  const suggestions = [];
  if (!text) blockers.push('本节还没有内容。');
  if (text && !lengthOk) blockers.push(`内容偏短（${words} words / ${zhChars} 汉字，建议至少 ${def.minWords} 词/字）。`);
  if (sectionId !== 'title' && text && numbers === 0) blockers.push('没有可追溯的数字/单位/图引用。');
  if ((sectionId === 'introduction' || sectionId === 'discussion') && text && citations === 0) blockers.push('没有引用；需要原始文献或明确说明。');
  if (overclaim > 0) suggestions.push('检测到绝对化措辞；把 “proves/first ever” 降级为 “is consistent with / we report”。');
  if (evidence === 0) suggestions.push('补充证据词（图/表/误差/显著性/样本）。');
  if (reproducible === 0 && (sectionId === 'methods' || sectionId === 'results')) suggestions.push('补充数据/代码/参数/版本的可复现信息。');
  if (words > 600 && avgSentence > 45) suggestions.push('句子偏长，拆分以提高可读性。');

  const scores = { claimEvidence: Math.round(claimEvidence), citation: Math.round(citation), consistency: Math.round(consistency), reproducibility: Math.round(reproducibility), styleFit: Math.round(styleFit), language: Math.round(language) };
  const weights = { claimEvidence: 0.25, citation: 0.15, consistency: 0.15, reproducibility: 0.15, styleFit: 0.15, language: 0.15 };
  const overall = Math.round(Object.entries(scores).reduce((sum, [key, value]) => sum + value * weights[key], 0));
  return {
    sectionId,
    rubricVersion: 'section-v2.0',
    contentHash: sha256(content),
    scores,
    overall,
    blockers,
    suggestions,
    source: 'heuristic',
    wordCount: words,
    zhCharCount: zhChars,
    goalId: String(goalId ?? ''),
    scoredAt: new Date().toISOString(),
    notice: '启发式评分，仅辅助修改；作者可覆盖并必须本人确认。',
  };
}

export function buildConfirmation({ projectId, section, checklist, note, content }) {
  const hash = sha256(content);
  const checks = {
    numbersMatch: checklist?.numbersMatch === true,
    citationsVerified: checklist?.citationsVerified === true,
    claimsSupported: checklist?.claimsSupported === true,
    styleApplied: checklist?.styleApplied === true,
  };
  if (!Object.values(checks).every(Boolean)) throw new Error('all author checklist items must be confirmed');
  if (section.contentHash !== hash) throw new Error('content changed; re-read and re-confirm');
  return {
    confirmationId: `conf_${sha256(`${projectId}:${section.id}:${hash}:${Date.now()}`).slice(0, 12)}`,
    projectId,
    section: section.id,
    contentHash: hash,
    rubricVersion: section.score?.rubricVersion ?? 'section-v2.0',
    scoreSnapshot: section.score?.overall ?? null,
    checklist: checks,
    confirmedBy: 'author',
    confirmedAt: new Date().toISOString(),
    note: String(note ?? '').slice(0, 2000),
  };
}
