window.__ModuleLoader__.load({
  id: 'astro-ph-researcher',
  factory: (require) => {
    const React = require('react');
    const h = React.createElement;
    const { useEffect, useMemo, useRef, useState, useSyncExternalStore } = React;

    const API = '/api/astro-ph-researcher';
    const CSS_ID = 'astro-ph-researcher-style';
    const PLUGIN_ID = 'astro-ph-researcher';

    const CSS = `
.aw-panel{position:fixed;z-index:2147483000;top:16px;bottom:16px;left:284px;width:min(var(--aw-panel-width,460px),calc(100vw - 304px));zoom:var(--aw-font-scale,1);display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-layer-1,#fff));color:var(--dsw-alias-label-primary,#18181b);border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.12));border-radius:16px;box-shadow:0 24px 70px rgba(0,0,0,.28);overflow:hidden;font-family:inherit;font-size:13px;line-height:1.55;pointer-events:auto}
@media (max-width:900px){.aw-panel{left:10px;right:10px;width:auto;top:10px;bottom:10px}}
.aw-head{display:flex;align-items:center;gap:10px;padding:13px 14px 11px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));background:linear-gradient(135deg,color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 9%,transparent),transparent 70%)}
.aw-logo{width:30px;height:30px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex:0 0 auto;color:var(--dsw-alias-brand-primary,#4d6bfe);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 12%,transparent)}
.aw-title{font-size:14px;font-weight:650;letter-spacing:.01em;white-space:nowrap}
.aw-sub{font-size:11px;color:var(--dsw-alias-label-secondary,#71717a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.aw-spacer{flex:1}
.aw-iconbtn{border:0;background:transparent;color:var(--dsw-alias-label-secondary,#71717a);width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
.aw-iconbtn:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.06));color:var(--dsw-alias-label-primary,#18181b)}
.aw-tabs{display:flex;gap:4px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));overflow-x:auto}
.aw-tab{border:0;background:transparent;color:var(--dsw-alias-label-secondary,#71717a);padding:6px 10px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:550;white-space:nowrap}
.aw-tab:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.06));color:var(--dsw-alias-label-primary,#18181b)}
.aw-tab.on{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 13%,transparent);color:var(--dsw-alias-brand-primary,#4d6bfe)}
.aw-body{flex:1;overflow:auto;padding:12px 14px 26px;overscroll-behavior:contain}
.aw-row{display:flex;align-items:center;gap:8px}
.aw-stack{display:flex;flex-direction:column;gap:8px}
.aw-input{flex:1;min-width:0;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));background:var(--dsw-alias-bg-base,transparent);color:var(--dsw-alias-label-primary,#18181b);border-radius:9px;padding:8px 10px;font:inherit;font-size:12.5px;outline:none}
.aw-input:focus{border-color:var(--dsw-alias-brand-primary,#4d6bfe);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 16%,transparent)}
.aw-input::placeholder{color:var(--dsw-alias-label-secondary,#9ca3af)}
.aw-btn{border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.16));background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#18181b);border-radius:8px;padding:6px 10px;font:inherit;font-size:12px;font-weight:550;cursor:pointer;white-space:nowrap;display:inline-flex;align-items:center;gap:5px}
.aw-btn:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.05))}
.aw-btn.primary{border-color:transparent;background:var(--dsw-alias-brand-primary,#4d6bfe);color:#fff}
.aw-btn.primary:hover{filter:brightness(1.06)}
.aw-btn.ghost{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary,#71717a);padding:5px 7px}
.aw-btn.ghost:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.05));color:var(--dsw-alias-label-primary,#18181b)}
.aw-btn.danger{color:var(--dsw-alias-state-error-primary,#dc2626);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary,#dc2626) 30%,transparent)}
.aw-btn:disabled{opacity:.5;cursor:not-allowed}
.aw-chip{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:2px 7px;font-size:10.5px;font-weight:600;line-height:1.6;white-space:nowrap;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.06));color:var(--dsw-alias-label-secondary,#52525b)}
.aw-chip.ok{background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#16a34a) 14%,transparent);color:var(--dsw-alias-state-success-primary,#15803d)}
.aw-chip.warn{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#d97706) 15%,transparent);color:var(--dsw-alias-state-warn-primary,#b45309)}
.aw-chip.err{background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#dc2626) 13%,transparent);color:var(--dsw-alias-state-error-primary,#b91c1c)}
.aw-chip.brand{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 13%,transparent);color:var(--dsw-alias-brand-primary,#4d6bfe)}
.aw-hint{color:var(--dsw-alias-label-secondary,#71717a);font-size:11px;line-height:1.5}
.aw-term-card{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));border-radius:13px;padding:12px;background:var(--dsw-alias-bg-layer-1,transparent);display:flex;flex-direction:column;gap:8px}
.aw-term-head{display:flex;align-items:flex-start;gap:8px}
.aw-zh{font-size:25px;font-weight:680;line-height:1.2;letter-spacing:.01em}
.aw-en{font-size:12.5px;color:var(--dsw-alias-label-secondary,#71717a);margin-top:2px;word-break:break-word}
.aw-src{font-size:11px;color:var(--dsw-alias-label-secondary,#71717a);display:flex;flex-wrap:wrap;gap:5px 10px;align-items:center}
.aw-link{color:var(--dsw-alias-brand-primary,#4d6bfe);text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 30%,transparent);cursor:pointer}
.aw-link:hover{border-bottom-color:currentColor}
.aw-explain{font-size:12.5px;line-height:1.7;margin:0;color:var(--dsw-alias-label-primary,#27272a)}
.aw-def{border-left:3px solid var(--dsw-alias-brand-primary,#4d6bfe);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 6%,transparent);border-radius:8px;padding:8px 10px;display:flex;flex-direction:column;gap:4px}
.aw-def-label{font-size:10px;font-weight:750;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-brand-primary,#4d6bfe)}
.aw-def p{margin:0;font-size:12.5px;line-height:1.65;color:var(--dsw-alias-label-primary,#27272a)}
.aw-formula{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.05));border-radius:8px;padding:7px 9px;word-break:break-word}
.aw-math{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.12));background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));border-radius:9px;padding:9px 10px;overflow-x:auto}
.aw-math .katex{font-size:1.02em;color:var(--dsw-alias-label-primary,#27272a)}
.aw-math .katex-display{margin:.25em 0;overflow-x:auto;overflow-y:hidden}
.aw-math-fallback{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;white-space:pre-wrap;word-break:break-word;color:var(--dsw-alias-label-secondary,#71717a)}
.aw-math-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:6px}
.aw-math-copy{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.12));background:transparent;color:var(--dsw-alias-brand-primary,#4d6bfe);border-radius:6px;padding:2px 7px;font:inherit;font-size:10.5px;cursor:pointer}
.aw-math-copy:hover{border-color:currentColor}
.aw-math details{font-size:10.5px;color:var(--dsw-alias-label-secondary,#71717a)}
.aw-math summary{cursor:pointer}
.aw-math-code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.5px;white-space:pre-wrap;word-break:break-word;background:var(--dsw-alias-bg-layer-3,rgba(0,0,0,.06));border-radius:6px;padding:6px;margin-top:4px}
.aw-section-title{font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;font-weight:700;color:var(--dsw-alias-label-secondary,#71717a);margin:4px 0 2px}
.aw-related{display:flex;flex-wrap:wrap;gap:5px}
.aw-related button{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.12));background:transparent;color:var(--dsw-alias-label-primary,#27272a);border-radius:999px;padding:3px 8px;font:inherit;font-size:11px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.aw-related button:hover{border-color:var(--dsw-alias-brand-primary,#4d6bfe);color:var(--dsw-alias-brand-primary,#4d6bfe)}
.aw-actions{display:flex;flex-wrap:wrap;gap:6px;padding-top:2px}
.aw-empty{border:1px dashed var(--dsw-alias-border-l2,rgba(0,0,0,.18));border-radius:12px;padding:18px 14px;text-align:center;color:var(--dsw-alias-label-secondary,#71717a);font-size:12px}
.aw-error{border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary,#dc2626) 30%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#dc2626) 7%,transparent);color:var(--dsw-alias-state-error-primary,#b91c1c);border-radius:10px;padding:9px 10px;font-size:12px;word-break:break-word}
.aw-segment{display:flex;flex-wrap:wrap;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.05));border-radius:9px;padding:2px;gap:2px}
.aw-segment button{border:0;background:transparent;color:var(--dsw-alias-label-secondary,#71717a);padding:4px 8px;border-radius:7px;font:inherit;font-size:11px;cursor:pointer;white-space:nowrap}
.aw-segment button.on{background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,#18181b);box-shadow:0 1px 4px rgba(0,0,0,.12)}
.aw-filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.aw-num{width:70px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));background:transparent;color:inherit;border-radius:8px;padding:5px 7px;font:inherit;font-size:11.5px;outline:none}
.aw-check{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;color:var(--dsw-alias-label-secondary,#52525b);cursor:pointer;user-select:none}
.aw-paper{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));border-radius:12px;padding:10px 11px;display:flex;flex-direction:column;gap:6px;background:var(--dsw-alias-bg-layer-1,transparent)}
.aw-paper.sel{border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 5%,transparent)}
.aw-paper-top{display:flex;gap:8px;align-items:flex-start}
.aw-paper-title{font-size:12.5px;font-weight:600;line-height:1.45;color:var(--dsw-alias-label-primary,#18181b);text-decoration:none;word-break:break-word}
.aw-paper-title:hover{color:var(--dsw-alias-brand-primary,#4d6bfe)}
.aw-paper-meta{font-size:11px;color:var(--dsw-alias-label-secondary,#71717a);display:flex;flex-wrap:wrap;gap:4px 8px}
.aw-paper-abs{font-size:11.5px;color:var(--dsw-alias-label-secondary,#52525b);line-height:1.55;margin:0}
.aw-paper-links{display:flex;flex-wrap:wrap;gap:7px;font-size:11px}
.aw-paper-links a{color:var(--dsw-alias-brand-primary,#4d6bfe);text-decoration:none}
.aw-paper-links a:hover{text-decoration:underline}
.aw-meter{height:4px;border-radius:99px;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.08));overflow:hidden;flex:1;min-width:40px}
.aw-meter i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,var(--dsw-alias-brand-primary,#4d6bfe),color-mix(in srgb,var(--dsw-alias-brand-primary,#4d6bfe) 45%,#a78bfa))}
.aw-select{width:100%;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));background:var(--dsw-alias-bg-base,transparent);color:inherit;border-radius:8px;padding:6px 8px;font:inherit;font-size:12px;outline:none}
.aw-field{display:flex;flex-direction:column;gap:4px}
.aw-field label{font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary,#52525b)}
.aw-settings{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));border-radius:12px;padding:11px;display:flex;flex-direction:column;gap:10px}
.aw-foot-btn{border:0;background:transparent;color:var(--dsw-alias-label-secondary,#71717a);display:inline-flex;align-items:center;justify-content:center;gap:6px;width:32px;height:32px;border-radius:9px;cursor:pointer;font:inherit;font-size:12px}
.aw-foot-btn:hover{background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.07));color:var(--dsw-alias-brand-primary,#4d6bfe)}
.aw-foot-btn.wide{width:auto;padding:0 9px}
.aw-legal{border-top:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));padding:6px 12px;font-size:10px;line-height:1.45;color:var(--dsw-alias-label-secondary,#71717a);background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.03))}
.aw-toast{position:absolute;left:14px;right:14px;bottom:14px;z-index:2;border-radius:10px;padding:9px 11px;font-size:12px;box-shadow:0 8px 30px rgba(0,0,0,.18);background:var(--dsw-alias-label-primary,#18181b);color:var(--dsw-alias-bg-layer-1,#fff);animation:aw-in .18s ease-out}
.aw-toast.err{background:var(--dsw-alias-state-error-primary,#dc2626);color:#fff}
.aw-toast.ok{background:var(--dsw-alias-state-success-primary,#15803d);color:#fff}
@keyframes aw-in{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.aw-spin{width:13px;height:13px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;display:inline-block;animation:aw-sp .7s linear infinite}
@keyframes aw-sp{to{transform:rotate(360deg)}}
.aw-kbd{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10px;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.18));border-bottom-width:2px;border-radius:4px;padding:0 4px;color:var(--dsw-alias-label-secondary,#71717a)}
.aw-saved{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));border-radius:11px;padding:9px 10px;display:flex;flex-direction:column;gap:5px}
.aw-saved-head{display:flex;align-items:baseline;gap:7px;flex-wrap:wrap}
.aw-saved-zh{font-size:13.5px;font-weight:650}
.aw-saved-en{font-size:11px;color:var(--dsw-alias-label-secondary,#71717a)}
.aw-saved-actions{display:flex;flex-wrap:wrap;gap:2px}
.aw-divider{height:1px;background:var(--dsw-alias-border-l1,rgba(0,0,0,.1));margin:10px 0}
.aw-kv{display:grid;grid-template-columns:88px 1fr;gap:3px 8px;font-size:11.5px}
.aw-kv dt{color:var(--dsw-alias-label-secondary,#71717a)}
.aw-kv dd{margin:0;color:var(--dsw-alias-label-primary,#27272a);word-break:break-word}
.aw-panel input[type=file]{max-width:100%;font-size:11px;color:var(--dsw-alias-label-secondary,#71717a)}
.aw-code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:10.8px;line-height:1.55;background:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.05));border-radius:8px;padding:8px 9px;overflow:auto;max-height:240px;white-space:pre;margin:4px 0}
.aw-data-card{border:1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1));border-radius:12px;padding:11px;display:flex;flex-direction:column;gap:6px;background:var(--dsw-alias-bg-layer-1,transparent)}

/* ---- v3 appearance / plan / handoff ---------------------------------- */
.aw-panel{--aw-bg:var(--dsw-alias-bg-overlay,#fff);--aw-fg:var(--dsw-alias-label-primary,#18181b);--aw-muted:var(--dsw-alias-label-secondary,#71717a);--aw-line:var(--dsw-alias-border-l1,rgba(0,0,0,.12));--aw-card:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.04));--aw-accent:var(--dsw-alias-brand-primary,#4d6bfe);background:var(--aw-bg)!important;color:var(--aw-fg)!important;background-size:cover!important;background-position:center!important}
.aw-panel.aw-has-image{background-image:linear-gradient(rgba(8,12,22,.52),rgba(8,12,22,.66)),var(--aw-bg-image)!important}
.aw-panel .aw-head{background:linear-gradient(135deg,color-mix(in srgb,var(--aw-accent) 18%,transparent),transparent 70%)!important;border-color:var(--aw-line)!important}
.aw-panel .aw-title,.aw-panel .aw-saved-zh,.aw-panel .aw-data-card,.aw-panel .aw-paper-title{color:var(--aw-fg)!important}
.aw-panel .aw-sub,.aw-panel .aw-hint,.aw-panel .aw-explain,.aw-panel .aw-paper-meta{color:var(--aw-muted)!important}
.aw-panel .aw-tabs,.aw-panel .aw-head,.aw-panel .aw-legal{border-color:var(--aw-line)!important}
.aw-panel .aw-tabs{background:color-mix(in srgb,var(--aw-bg) 86%,#000 14%)}
.aw-panel .aw-tab{color:var(--aw-muted)!important}
.aw-panel .aw-tab.on{color:var(--aw-fg)!important;background:var(--aw-card)!important}
.aw-panel .aw-btn,.aw-panel .aw-iconbtn,.aw-panel .aw-segment button,.aw-panel .aw-pill{color:var(--aw-fg)!important;border-color:var(--aw-line)!important}
.aw-panel .aw-btn.primary{background:var(--aw-accent)!important;color:var(--aw-accent-fg,#fff)!important;border-color:transparent!important}
.aw-panel .aw-btn.ghost,.aw-panel .aw-iconbtn{background:color-mix(in srgb,var(--aw-bg) 70%,var(--aw-fg) 8%)!important}
.aw-panel .aw-input,.aw-panel .aw-select,.aw-panel .aw-num{background:color-mix(in srgb,var(--aw-bg) 82%,var(--aw-fg) 8%)!important;color:var(--aw-fg)!important;border-color:var(--aw-line)!important}
.aw-panel .aw-data-card,.aw-panel .aw-paper,.aw-panel .aw-settings{background:color-mix(in srgb,var(--aw-card) 82%,transparent)!important;border-color:var(--aw-line)!important}
.aw-panel .aw-settings{padding:10px;border:1px solid var(--aw-line);border-radius:12px}
.aw-panel .aw-legal{background:color-mix(in srgb,var(--aw-bg) 88%,#000 12%)!important}
.aw-panel.aw-contrast-high{--aw-muted:var(--aw-fg);--aw-line:currentColor;--aw-card:color-mix(in srgb,var(--aw-bg) 70%,var(--aw-fg) 12%)}
.aw-panel.aw-contrast-high .aw-btn,.aw-panel.aw-contrast-high .aw-input,.aw-panel.aw-contrast-high .aw-select{border-width:1.5px!important}
.aw-theme-row{display:flex;gap:6px;flex-wrap:wrap}
.aw-theme-chip{width:26px;height:26px;border-radius:999px;border:2px solid transparent;cursor:pointer;padding:0;box-shadow:0 0 0 1px var(--aw-line)}
.aw-theme-chip.on{border-color:var(--aw-fg);transform:scale(1.08)}
.aw-file{display:none}
.aw-bg-preview{height:54px;border-radius:10px;border:1px solid var(--aw-line);background-color:var(--aw-card);background-size:cover;background-position:center}
.aw-plan-tree{display:flex;flex-direction:column;gap:4px}
.aw-plan-node{border:1px solid var(--aw-line);border-radius:10px;padding:7px 8px;background:color-mix(in srgb,var(--aw-card) 82%,transparent);margin-left:calc(var(--depth,0)*14px)}
.aw-plan-node.done{opacity:.72}
.aw-plan-node.doing{border-left:3px solid var(--aw-accent)}
.aw-plan-node.blocked{border-left:3px solid #d97706}
.aw-plan-title{font-size:12px;font-weight:650;color:var(--aw-fg);display:flex;gap:6px;align-items:center;flex-wrap:wrap}
.aw-plan-note{font-size:11px;color:var(--aw-muted);white-space:pre-wrap;margin-top:3px}
.aw-plan-meta{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px}
.aw-plan-actions{display:flex;gap:4px;flex-wrap:wrap;margin-top:5px}
.aw-plan-actions button{font-size:10px;padding:2px 6px;border-radius:7px;border:1px solid var(--aw-line);background:transparent;color:var(--aw-muted);cursor:pointer}
.aw-plan-actions button:hover{color:var(--aw-fg);background:var(--aw-card)}
.aw-modal-mask{position:absolute;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;padding:14px;z-index:10;backdrop-filter:blur(3px)}
.aw-modal{width:min(430px,100%);max-height:88%;overflow:auto;background:var(--aw-bg);color:var(--aw-fg);border:1px solid var(--aw-line);border-radius:14px;padding:14px;box-shadow:0 20px 50px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:9px}
.aw-modal h3{margin:0;font-size:14px}
.aw-modal .aw-row{justify-content:flex-end}
.aw-handoff-option{display:flex;gap:7px;align-items:center;font-size:12px;padding:6px 8px;border:1px solid var(--aw-line);border-radius:9px;cursor:pointer;background:var(--aw-card)}
.aw-handoff-option.on{border-color:var(--aw-accent);background:color-mix(in srgb,var(--aw-accent) 12%,transparent)}
.aw-handoff-result{text-align:left;width:100%;border:1px solid var(--aw-line);background:transparent;color:var(--aw-fg);border-radius:8px;padding:6px;font-size:11px;cursor:pointer}
.aw-composer-bar{--aw-fg:var(--dsw-alias-label-primary,#18181b);--aw-muted:var(--dsw-alias-label-secondary,#71717a);--aw-line:var(--dsw-alias-border-l1,rgba(0,0,0,.14));--aw-card:var(--dsw-alias-bg-layer-2,rgba(0,0,0,.05));--aw-bg:var(--dsw-alias-bg-layer-1,#fff);--aw-accent:var(--dsw-alias-brand-primary,#4d6bfe);display:flex;align-items:center;gap:5px;flex-wrap:wrap;padding:4px 6px;border:1px solid var(--aw-line);border-radius:10px;background:color-mix(in srgb,var(--aw-bg) 92%,transparent);color:var(--aw-fg);font-size:11px;max-width:min(620px,92vw)}
.aw-composer-bar button,.aw-composer-bar select{border:1px solid var(--aw-line);background:var(--aw-card);color:var(--aw-fg);border-radius:7px;padding:2px 6px;font:inherit;font-size:10.5px;cursor:pointer;max-width:160px}
.aw-composer-bar button:hover{background:color-mix(in srgb,var(--aw-accent) 18%,transparent)}
.aw-composer-dot{color:var(--aw-muted);font-size:10px}
.aw-contrast-preview{display:flex;gap:4px;align-items:center;font-size:10px;color:var(--aw-muted)}
.aw-contrast-preview b{background:var(--aw-accent);color:#fff;padding:1px 5px;border-radius:5px}
.aw-quick-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.aw-quick-grid button{text-align:left;border:1px solid var(--aw-line);background:var(--aw-card);color:var(--aw-fg);border-radius:9px;padding:7px;font:inherit;font-size:11px;cursor:pointer}
.aw-quick-grid button:hover{border-color:var(--aw-accent)}
.aw-quick-grid b{display:block;font-size:11.5px}
.aw-quick-grid span{display:block;font-size:10px;color:var(--aw-muted);margin-top:2px}
`;

    // ---------------------------------------------------------------------
    // tiny observable store shared by the footer entry and the overlay panel
    // ---------------------------------------------------------------------
    const store = {
      state: {
        open: false,
        tab: 'term',
        toast: null,
        booted: false,
        loadingBoot: false,
        lookupQuery: '',
        lookup: null,
        lookupLoading: false,
        lookupError: '',
        litQuery: '',
        litSort: 'balanced',
        lit: null,
        litLoading: false,
        litError: '',
        terms: [],
        termsLoading: false,
        refs: [],
        refStats: null,
        refLoading: false,
        refFilter: '',
        refTag: '',
        writing: { projects: [], journals: [], thesisFormats: [], goals: [], selectedId: null, loading: false, uploading: false, formatWorkspace: null, formatLoading: false, sections: null, activeSection: 'abstract', sectionDraft: '', sectionScore: null, sectionSaving: false, confirmChecks: { numbersMatch: false, citationsVerified: false, claimsSupported: false, styleApplied: false } },
        dataLibrary: { methods: [], statistics: [], instruments: [], workflows: [], stats: null },
        seed: [],
        config: null,
        health: null,
        dictionary: null,
        dictionaryDownloading: false,
        role: 'grad',
        sessionId: null,
        sessionReady: false,
        handoff: null,
        planVersion: 0,
        appearanceVersion: 0,
      },
      listeners: new Set(),
      subscribe(fn) {
        store.listeners.add(fn);
        return () => store.listeners.delete(fn);
      },
      get() {
        return store.state;
      },
      set(patch) {
        store.state = { ...store.state, ...patch };
        for (const fn of store.listeners) {
          try {
            fn();
          } catch {
            /* noop */
          }
        }
      },
    };

    function useStore() {
      return useSyncExternalStore(store.subscribe, store.get, store.get);
    }


    // v3 appearance presets. All colors are explicit so contrast is predictable.
    const THEMES = {
      midnight: { label: '深空', bg: '#0f1524', fg: '#f1f5ff', muted: '#aebbd4', card: 'rgba(255,255,255,.075)', accent: '#8ea8ff', line: 'rgba(255,255,255,.17)', onAccent: '#081020' },
      paper: { label: '纸张', bg: '#fbf8f1', fg: '#201d18', muted: '#615b52', card: 'rgba(40,32,20,.055)', accent: '#8a5a2b', line: 'rgba(40,32,20,.18)', onAccent: '#fffaf2' },
      nebula: { label: '星云', bg: '#181327', fg: '#fff4ff', muted: '#d7bfe6', card: 'rgba(255,255,255,.08)', accent: '#f0a6ff', line: 'rgba(255,255,255,.18)', onAccent: '#1a071d' },
      forest: { label: '森林', bg: '#10201b', fg: '#f0fff8', muted: '#b7d6c7', card: 'rgba(255,255,255,.07)', accent: '#7fe0b1', line: 'rgba(255,255,255,.16)', onAccent: '#06140d' },
      contrast: { label: '高对比', bg: '#000000', fg: '#ffffff', muted: '#ffffff', card: 'rgba(255,255,255,.12)', accent: '#ffff00', line: '#ffffff', onAccent: '#000000' },
      light: { label: '高亮', bg: '#ffffff', fg: '#111111', muted: '#454545', card: 'rgba(0,0,0,.05)', accent: '#0b57d0', line: 'rgba(0,0,0,.24)', onAccent: '#ffffff' },
    };
    const SKILLS = [
      ['astro-research-workflow', '研究流程'],
      ['astro-literature-research', '文献研究'],
      ['astro-code-writing', '代码'],
      ['astro-english-journal-writing', '英文期刊'],
      ['astro-phd-thesis-writing', '学位论文'],
      ['astro-writing-goals', '写作目标'],
      ['astro-discovery-writing', '发现叙述'],
      ['astro-critical-writing', '批判叙述'],
      ['astro-incremental-method-writing', '增量方法'],
    ];
    const MODES = ['研究', '查词', '文献', '写作', '数据', '计划'];
    const BG_KEY = 'astro-ph-researcher:background-image';
    function readBackgroundImage() {
      try { return window.localStorage.getItem(BG_KEY) || ''; } catch { return ''; }
    }
    function writeBackgroundImage(dataUrl) {
      try {
        if (dataUrl) window.localStorage.setItem(BG_KEY, dataUrl);
        else window.localStorage.removeItem(BG_KEY);
      } catch { /* quota/private mode */ }
    }
    function themeVars(ui = {}, image = '') {
      const t = THEMES[ui.theme] || THEMES.midnight;
      return {
        '--aw-bg': t.bg,
        '--aw-fg': t.fg,
        '--aw-muted': t.muted,
        '--aw-card': t.card,
        '--aw-accent': t.accent,
        '--aw-accent-fg': t.onAccent ?? '#fff',
        '--aw-line': t.line,
        '--aw-bg-image': image ? `url(${JSON.stringify(image)})` : 'none',
      };
    }

    let toastTimer = null;
    function toast(message, kind = '') {
      if (!message) return;
      store.set({ toast: { message: String(message), kind } });
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => store.set({ toast: null }), 4200);
    }

    async function api(path, options = {}) {
      const { method = 'GET', body } = options;
      const init = { method, headers: {} };
      if (body !== undefined) {
        init.headers['content-type'] = 'application/json';
        init.body = JSON.stringify(body);
      }
      let response;
      try {
        response = await fetch(`${API}${path}`, init);
      } catch (error) {
        throw new Error(`无法连接本地天文插件服务：${error?.message ?? error}`);
      }
      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { error: text };
      }
      if (!response.ok) {
        const error = new Error(data.error || data.message || `HTTP ${response.status}`);
        error.data = data;
        error.status = response.status;
        throw error;
      }
      return data;
    }



    async function loadPlan() {
      const data = await api('/plan');
      store.set({ plan: data.plan, planSummary: data.summary, planVersion: (store.state.planVersion ?? 0) + 1 });
      return data;
    }

    async function savePlanNode(node) {
      const data = await api('/plan/nodes', { method: 'POST', body: node });
      store.set({ plan: data.plan, planVersion: (store.state.planVersion ?? 0) + 1 });
      return data;
    }

    async function patchPlanNode(id, patch) {
      const data = await api(`/plan/nodes/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch });
      store.set({ plan: data.plan, planVersion: (store.state.planVersion ?? 0) + 1 });
      return data;
    }

    async function removePlanNode(id) {
      const data = await api(`/plan/nodes/${encodeURIComponent(id)}`, { method: 'DELETE' });
      store.set({ plan: data.plan, planVersion: (store.state.planVersion ?? 0) + 1 });
      return data;
    }

    const runtimeRef = { current: null };

    async function requestHandoffPrompt(handoff, sessionId) {
      const kind = handoff?.kind;
      if (kind === 'analyze') {
        return api('/analyze', { method: 'POST', body: { type: handoff.type, payload: handoff.payload, role: store.state.config?.ui?.role ?? 'grad', sessionId, dryRun: true, ...(handoff.extra ?? {}) } });
      }
      if (kind === 'writing') {
        return api('/writing/handoff', { method: 'POST', body: { projectId: handoff.projectId, mode: handoff.mode, sessionId, dryRun: true } });
      }
      if (kind === 'instrument') {
        return api('/data/handoff', { method: 'POST', body: { instrumentId: handoff.instrumentId, methodId: handoff.methodId, sessionId, dryRun: true } });
      }
      return { prompt: '' };
    }

    async function executeHandoff(handoff, target, sessionId) {
      if (target === 'new') {
        const promptData = await requestHandoffPrompt(handoff, undefined).catch(() => ({ prompt: '' }));
        const prompt = promptData?.prompt ?? '';
        if (prompt) copyText(prompt);
        if (runtimeRef.current?.uiWorkspace?.startSession) runtimeRef.current.uiWorkspace.startSession();
        toast(prompt ? '新对话已打开；提示词已复制，请粘贴发送。' : '新对话已打开。', 'ok');
        return { newSession: true };
      }
      if (target === 'existing' && sessionId && runtimeRef.current?.sessions?.retain) {
        const promptData = await requestHandoffPrompt(handoff, sessionId).catch(() => ({ prompt: '' }));
        if (!promptData?.prompt) throw new Error('无法生成该任务的提示词');
        const reference = runtimeRef.current.sessions.retain(sessionId, { source: 'controllerOperation' });
        try {
          await reference.ready;
          await reference.binding.session.prompt([{ type: 'text', text: promptData.prompt }], 'queue');
          runtimeRef.current.uiWorkspace?.openSession?.(sessionId);
          toast('已发送到所选对话', 'ok');
          return { sessionId };
        } finally {
          reference.release?.();
        }
      }
      const body = handoff.kind === 'analyze'
        ? { type: handoff.type, payload: handoff.payload, role: store.state.config?.ui?.role ?? 'grad', sessionId, ...(handoff.extra ?? {}) }
        : handoff.kind === 'writing'
          ? { projectId: handoff.projectId, mode: handoff.mode, sessionId }
          : { instrumentId: handoff.instrumentId, methodId: handoff.methodId, sessionId };
      const path = handoff.kind === 'analyze' ? '/analyze' : handoff.kind === 'writing' ? '/writing/handoff' : '/data/handoff';
      const data = await api(path, { method: 'POST', body });
      toast('已交给 DSH，请在主对话中查看。', 'ok');
      if (data?.sessionId) store.set({ open: false });
      return data;
    }

    // KaTeX is vendored locally and served by the host route; no CDN/network.
    let katexPromise = null;
    function ensureKatex() {
      if (window.katex?.renderToString) return Promise.resolve(window.katex);
      if (katexPromise) return katexPromise;
      const cssId = 'aw-katex-css';
      if (!document.getElementById(cssId)) {
        const link = document.createElement('link');
        link.id = cssId;
        link.rel = 'stylesheet';
        link.href = `${API}/assets/katex/katex.min.css`;
        document.head.appendChild(link);
      }
      const scriptId = 'aw-katex-js';
      katexPromise = new Promise((resolve) => {
        const existing = document.getElementById(scriptId);
        const done = () => resolve(window.katex ?? null);
        if (existing) {
          if (window.katex?.renderToString) return resolve(window.katex);
          existing.addEventListener('load', done, { once: true });
          existing.addEventListener('error', () => { katexPromise = null; existing.remove(); resolve(null); }, { once: true });
          return;
        }
        const script = document.createElement('script');
        script.id = scriptId;
        script.async = true;
        script.src = `${API}/assets/katex/katex.min.js`;
        script.onload = done;
        script.onerror = () => { katexPromise = null; script.remove(); resolve(null); };
        document.head.appendChild(script);
      });
      return katexPromise;
    }

    function Formula({ latex }) {
      const source = String(latex ?? '').trim();
      const [html, setHtml] = useState('');
      const [copied, setCopied] = useState(false);
      useEffect(() => {
        let live = true;
        if (!source) return undefined;
        ensureKatex()
          .then((katex) => {
            if (!live || !katex?.renderToString) return;
            try {
              const rendered = katex.renderToString(source, {
                displayMode: true,
                throwOnError: false,
                strict: 'ignore',
                trust: false,
              });
              if (live) setHtml(rendered);
            } catch {
              if (live) setHtml('');
            }
          })
          .catch(() => {});
        return () => {
          live = false;
        };
      }, [source]);
      if (!source) return null;
      const copy = () => {
        copyText(source);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      };
      return h(
        'div',
        { className: 'aw-math' },
        html
          ? h('div', { dangerouslySetInnerHTML: { __html: html } })
          : h('div', { className: 'aw-math-fallback' }, source, h('div', { className: 'aw-hint', style: { marginTop: 4 } }, '公式引擎未加载时显示 LaTeX 源码；仍可复制。')),
        h(
          'div',
          { className: 'aw-math-actions' },
          h('button', { type: 'button', className: 'aw-math-copy', onClick: copy }, copied ? '已复制' : '复制 LaTeX'),
          h('details', null, h('summary', null, '查看/粘贴 LaTeX'), h('div', { className: 'aw-math-code' }, source)),
        ),
      );
    }

    function copyText(text) {
      try {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
          return true;
        }
        const area = document.createElement('textarea');
        area.value = text;
        area.style.position = 'fixed';
        area.style.opacity = '0';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        area.remove();
        return true;
      } catch {
        return false;
      }
    }

    function openExternal(url) {
      if (!url) return;
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    // ---------------------------------------------------------------------
    // data actions
    // ---------------------------------------------------------------------
    async function boot() {
      if (store.state.booted || store.state.loadingBoot) return;
      store.set({ loadingBoot: true });
      const results = await Promise.allSettled([
        api('/terms'),
        api('/seed'),
        api('/config'),
        api('/health'),
        api('/session'),
        api('/dictionary/status'),
        api('/references'),
        api('/writing/projects'),
        api('/data/meta'),
      ]);
      const [terms, seed, config, health, session, dictionary, references, writing, dataLibrary] = results;
      const patch = { booted: true, loadingBoot: false };
      if (terms.status === 'fulfilled') patch.terms = terms.value.terms ?? [];
      if (seed.status === 'fulfilled') patch.seed = seed.value.terms ?? [];
      if (config.status === 'fulfilled') {
        patch.config = config.value.config ?? null;
        patch.role = config.value.config?.ui?.role ?? 'grad';
        patch.litSort = config.value.config?.literature?.defaultSort ?? 'balanced';
      }
      if (health.status === 'fulfilled') patch.health = health.value;
      if (dictionary.status === 'fulfilled') patch.dictionary = dictionary.value.dictionary ?? null;
      if (references.status === 'fulfilled') {
        patch.refs = references.value.references ?? [];
        patch.refStats = references.value.stats ?? null;
      }
      if (writing.status === 'fulfilled') {
        patch.writing = {
          ...store.state.writing,
          projects: writing.value.projects ?? [],
          journals: writing.value.journals ?? [],
          thesisFormats: writing.value.thesisFormats ?? [],
          goals: writing.value.goals ?? store.state.writing.goals ?? [],
        };
      }
      if (dataLibrary.status === 'fulfilled') {
        patch.dataLibrary = {
          methods: dataLibrary.value.methods ?? [],
          statistics: dataLibrary.value.statistics ?? [],
          instruments: dataLibrary.value.instruments ?? [],
          workflows: dataLibrary.value.workflows ?? [],
          stats: dataLibrary.value.stats ?? null,
        };
      }
      if (session.status === 'fulfilled' && session.value?.sessionId) {
        patch.sessionId = session.value.sessionId;
        patch.sessionReady = true;
      }
      store.set(patch);
      const failure = results.find((result) => result.status === 'rejected');
      if (failure) toast(`插件服务未就绪：${failure.reason?.message ?? failure.reason}`, 'err');
    }

    async function refreshTerms() {
      store.set({ termsLoading: true });
      try {
        const data = await api('/terms');
        store.set({ terms: data.terms ?? [], termsLoading: false });
      } catch (error) {
        store.set({ termsLoading: false });
        toast(error.message, 'err');
      }
    }

    async function refreshReferences() {
      store.set({ refLoading: true });
      try {
        const data = await api('/references');
        store.set({ refs: data.references ?? [], refStats: data.stats ?? null, refLoading: false });
      } catch (error) {
        store.set({ refLoading: false });
        toast(error.message, 'err');
      }
    }

    async function saveReference(paper) {
      if (!paper) return;
      try {
        const data = await api('/references', { method: 'POST', body: { item: paper } });
        store.set({
          refs: [data.reference, ...(store.state.refs ?? []).filter((item) => item.id !== data.reference.id)],
          refStats: data.stats ?? store.state.refStats,
        });
        toast(`已保存到文献库：${data.reference.title.slice(0, 48)}`, 'ok');
      } catch (error) {
        toast(`保存文献失败：${error.message}`, 'err');
      }
    }

    async function updateReference(id, patch) {
      try {
        const data = await api(`/references/${encodeURIComponent(id)}`, { method: 'PATCH', body: { patch } });
        store.set({
          refs: (store.state.refs ?? []).map((item) => (item.id === data.reference.id ? data.reference : item)),
          refStats: data.stats ?? store.state.refStats,
        });
        toast('文献信息已更新', 'ok');
        return data.reference;
      } catch (error) {
        toast(error.message, 'err');
        return null;
      }
    }

    async function deleteReference(id) {
      try {
        await api(`/references/${encodeURIComponent(id)}`, { method: 'DELETE' });
        store.set({ refs: (store.state.refs ?? []).filter((item) => item.id !== id) });
        toast('已从文献库删除');
      } catch (error) {
        toast(error.message, 'err');
      }
    }

    async function copyCitation(id, style) {
      try {
        const data = await api('/references/cite', { method: 'POST', body: { id, style } });
        copyText(data.text ?? '');
        toast(`已复制 ${style.toUpperCase()} 引用`, 'ok');
      } catch (error) {
        toast(error.message, 'err');
      }
    }

    async function exportBibtex() {
      try {
        const response = await fetch(`${API}/references/export?format=bibtex`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `astro-references-${new Date().toISOString().slice(0, 10)}.bib`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast('已导出 BibTeX', 'ok');
      } catch (error) {
        toast(`导出失败：${error.message}`, 'err');
      }
    }

    async function downloadDictionary() {
      if (store.state.dictionaryDownloading) return;
      store.set({ dictionaryDownloading: true });
      try {
        const data = await api('/dictionary/download', { method: 'POST' });
        store.set({ dictionary: data.dictionary ?? null, dictionaryDownloading: false });
        toast(`离线词表已安装：${data.dictionary?.count ?? 0} 条`, 'ok');
      } catch (error) {
        store.set({ dictionaryDownloading: false });
        toast(`离线词表下载失败：${error.message}`, 'err');
      }
    }

    async function refreshWriting() {
      try {
        const data = await api('/writing/projects');
        store.set({
          writing: {
            ...store.state.writing,
            projects: data.projects ?? [],
            journals: data.journals ?? [],
            thesisFormats: data.thesisFormats ?? [],
            goals: data.goals ?? store.state.writing.goals ?? [],
          },
        });
      } catch (error) {
        toast(error.message, 'err');
      }
    }

    function fileToBase64(buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const chunk = 0x8000;
      for (let i = 0; i < bytes.length; i += chunk) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
      }
      return btoa(binary);
    }

    async function filesToPayload(fileList) {
      const files = [];
      for (const file of Array.from(fileList ?? [])) {
        if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} 超过 8 MB`);
        const textLike = /^text\//i.test(file.type) || /\.(txt|md|markdown|csv|tsv|json|tex|bib|yaml|yml|py|dat|log)$/i.test(file.name);
        if (textLike) {
          files.push({ name: file.name, type: file.type || 'text/plain', content: await file.text(), encoding: 'utf8' });
        } else {
          files.push({ name: file.name, type: file.type || 'application/octet-stream', content: fileToBase64(await file.arrayBuffer()), encoding: 'base64' });
        }
      }
      return files;
    }

    async function createWritingProject(form) {
      try {
        const data = await api('/writing/projects', { method: 'POST', body: form });
        store.set({
          writing: {
            ...store.state.writing,
            projects: [data.project, ...(store.state.writing.projects ?? []).filter((item) => item.id !== data.project.id)],
            selectedId: data.project.id,
          },
        });
        toast(`写作项目已创建：${data.project.title}`, 'ok');
        return data.project;
      } catch (error) {
        toast(error.message, 'err');
        return null;
      }
    }

    async function updateWritingProject(id, patch) {
      try {
        const data = await api(`/writing/projects/${encodeURIComponent(id)}`, { method: 'PATCH', body: { patch } });
        store.set({
          writing: {
            ...store.state.writing,
            projects: (store.state.writing.projects ?? []).map((item) => (item.id === data.project.id ? data.project : item)),
          },
        });
        toast('写作项目已更新', 'ok');
        return data.project;
      } catch (error) {
        toast(error.message, 'err');
        return null;
      }
    }

    async function uploadWritingFiles(id, fileList) {
      store.set({ writing: { ...store.state.writing, uploading: true } });
      try {
        const files = await filesToPayload(fileList);
        const data = await api(`/writing/projects/${encodeURIComponent(id)}/files`, { method: 'POST', body: { files } });
        store.set({
          writing: {
            ...store.state.writing,
            uploading: false,
            projects: (store.state.writing.projects ?? []).map((item) => (item.id === data.project.id ? data.project : item)),
          },
        });
        toast(`已上传 ${data.added?.length ?? 0} 个文件`, 'ok');
        return data.project;
      } catch (error) {
        store.set({ writing: { ...store.state.writing, uploading: false } });
        toast(`上传失败：${error.message}`, 'err');
        return null;
      }
    }

    async function handoffWriting(projectId, mode) {
      store.set({ handoff: { kind: 'writing', projectId, mode } });
    }

    async function loadWritingSections(projectId) {
      if (!projectId) return null;
      try {
        const data = await api(`/writing/projects/${encodeURIComponent(projectId)}/sections`);
        const sections = data.sections ?? {};
        const active = sections[store.state.writing.activeSection] ? store.state.writing.activeSection : 'abstract';
        store.set({ writing: { ...store.state.writing, sections, activeSection: active, sectionDraft: sections[active]?.content ?? '', sectionScore: sections[active]?.score ?? null } });
        return sections;
      } catch (error) {
        toast(error.message, 'err');
        return null;
      }
    }

    function setSectionDraft(sectionId) {
      const sections = store.state.writing.sections ?? {};
      const sec = sections[sectionId];
      store.set({ writing: { ...store.state.writing, activeSection: sectionId, sectionDraft: sec?.content ?? '', sectionScore: sec?.score ?? null } });
    }

    async function saveWritingSection(projectId, sectionId, content) {
      try {
        const data = await api(`/writing/projects/${encodeURIComponent(projectId)}/sections/${encodeURIComponent(sectionId)}`, { method: 'PATCH', body: { content, status: 'author_editing' } });
        store.set({ writing: { ...store.state.writing, sections: data.sections, sectionDraft: content } });
        toast('本节已保存（旧确认已失效）', 'ok');
        return data.sections;
      } catch (error) {
        toast(error.message, 'err');
        return null;
      }
    }

    async function scoreWritingSection(projectId, sectionId, content) {
      try {
        const data = await api(`/writing/projects/${encodeURIComponent(projectId)}/sections/${encodeURIComponent(sectionId)}/score`, { method: 'POST', body: { content } });
        store.set({ writing: { ...store.state.writing, sections: { ...(store.state.writing.sections ?? {}), [sectionId]: data.section }, sectionScore: data.score, sectionDraft: content } });
        return data.score;
      } catch (error) {
        toast(error.message, 'err');
        return null;
      }
    }

    async function confirmWritingSection(projectId, sectionId) {
      const checks = store.state.writing.confirmChecks;
      if (!checks || !Object.values(checks).every(Boolean)) {
        toast('请先勾选全部作者核对项', 'err');
        return null;
      }
      try {
        const data = await api(`/writing/projects/${encodeURIComponent(projectId)}/sections/${encodeURIComponent(sectionId)}/confirm`, { method: 'POST', body: { checklist: checks, note: '' } });
        store.set({ writing: { ...store.state.writing, sections: { ...(store.state.writing.sections ?? {}), [sectionId]: data.section }, sectionScore: data.section.score ?? null } });
        toast('已记录作者确认；内容变更后需重新确认', 'ok');
        return data.confirmation;
      } catch (error) {
        toast(error.message, 'err');
        return null;
      }
    }

    async function fetchThesisFormat(formatId) {
      store.set({ writing: { ...store.state.writing, formatLoading: true } });
      try {
        const data = await api(`/writing/thesis-formats/${encodeURIComponent(formatId)}/fetch`, {
          method: 'POST',
          body: { force: true },
        });
        store.set({
          writing: {
            ...store.state.writing,
            formatLoading: false,
            formatWorkspace: data.workspace ?? null,
          },
        });
        const count = data.workspace?.files?.length ?? 0;
        toast(count ? `已下载 ${count} 个官方格式/模板文件` : '没有找到可下载文件；已保留官方页文本', count ? 'ok' : 'err');
        return data.workspace;
      } catch (error) {
        store.set({ writing: { ...store.state.writing, formatLoading: false } });
        toast(`获取格式失败：${error.message}`, 'err');
        return null;
      }
    }

    async function uploadThesisFormatFile(formatId, file) {
      try {
        const payload = await filesToPayload([file]);
        if (!payload.length) throw new Error('empty file');
        const data = await api(`/writing/thesis-formats/${encodeURIComponent(formatId)}/upload`, {
          method: 'POST',
          body: { file: payload[0] },
        });
        store.set({
          writing: {
            ...store.state.writing,
            formatWorkspace: data.workspace ?? null,
          },
        });
        toast('格式/模板已上传并解析', 'ok');
        return data.workspace;
      } catch (error) {
        toast(`上传格式失败：${error.message}`, 'err');
        return null;
      }
    }

    async function loadThesisFormatWorkspace(formatId) {
      try {
        const data = await api(`/writing/thesis-formats/${encodeURIComponent(formatId)}/workspace`);
        store.set({
          writing: {
            ...store.state.writing,
            formatWorkspace: data.workspace ?? null,
          },
        });
        return data.workspace ?? null;
      } catch {
        store.set({ writing: { ...store.state.writing, formatWorkspace: null } });
        return null;
      }
    }

    async function addCustomThesisFormat(payload) {
      try {
        const data = await api('/writing/thesis-formats/custom', { method: 'POST', body: payload });
        store.set({
          writing: {
            ...store.state.writing,
            thesisFormats: data.thesisFormats ?? store.state.writing.thesisFormats,
          },
        });
        toast(`已保存自定义格式：${data.format?.university ?? ''}`, 'ok');
        return data.format;
      } catch (error) {
        toast(error.message, 'err');
        return null;
      }
    }

    async function exportFormatPack() {
      try {
        const response = await fetch(`${API}/writing/formats/export`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `astro-writing-formats-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast('已导出格式包', 'ok');
      } catch (error) {
        toast(`导出失败：${error.message}`, 'err');
      }
    }

    async function saveInstrumentWorkflow(item) {
      if (!item) return;
      try {
        const data = await api('/data/workflows', {
          method: 'POST',
          body: {
            instrumentId: item.id,
            name: `${item.name} 数据分析工作流`,
            steps: item.workflow ?? [],
            notes: item.advice ?? '',
            links: [...(item.dataLinks ?? []), ...(item.analysisLinks ?? [])],
          },
        });
        store.set({
          dataLibrary: {
            ...store.state.dataLibrary,
            workflows: data.workflows ?? [store.state.dataLibrary?.workflows ?? []].flat(),
          },
        });
        toast(`已保存工作流：${data.workflow?.name ?? item.name}`, 'ok');
      } catch (error) {
        toast(`保存工作流失败：${error.message}`, 'err');
      }
    }

    async function deleteDataWorkflow(id) {
      try {
        await api(`/data/workflows/${encodeURIComponent(id)}`, { method: 'DELETE' });
        store.set({
          dataLibrary: {
            ...store.state.dataLibrary,
            workflows: (store.state.dataLibrary?.workflows ?? []).filter((item) => item.id !== id),
          },
        });
        toast('已删除工作流');
      } catch (error) {
        toast(error.message, 'err');
      }
    }

    async function handoffInstrument(item) {
      store.set({ handoff: { kind: 'instrument', instrumentId: item.id } });
    }

    async function doLookup(input, options = {}) {
      const term = String(input ?? store.state.lookupQuery ?? '').trim();
      if (!term && !options.astrodictId) return;
      store.set({ lookupQuery: term, lookupLoading: true, lookupError: '', tab: 'term' });
      try {
        const data = await api('/lookup', {
          method: 'POST',
          body: { term, astrodictId: options.astrodictId, includeRelated: true, relatedLimit: 8 },
        });
        const patch = { lookup: data, lookupLoading: false };
        if (data?.found && data.term) {
          patch.litQuery = data.term.literatureQuery || data.term.en || term;
        }
        if (data?.savedTerm) {
          patch.terms = [data.savedTerm, ...(store.state.terms ?? [])];
        }
        store.set(patch);
      } catch (error) {
        store.set({ lookupLoading: false, lookupError: error.message });
      }
    }

    async function doSearch(overrides = {}) {
      const state = store.state;
      const query = String(overrides.query ?? state.litQuery ?? '').trim();
      if (!query) return;
      const sort = overrides.sort ?? state.litSort ?? 'balanced';
      const filters = overrides.filters ?? state.litFilters ?? {};
      store.set({ litQuery: query, litSort: sort, litLoading: true, litError: '', tab: 'lit' });
      try {
        const data = await api('/search', {
          method: 'POST',
          body: {
            query,
            sort,
            limit: 8,
            yearFrom: filters.yearFrom || undefined,
            yearTo: filters.yearTo || undefined,
            minCitations: filters.minCitations || undefined,
            openAccess: Boolean(filters.openAccess),
            includePreprints: filters.includePreprints !== false,
            strictPriority: filters.strictPriority ?? store.state.config?.literature?.strictPriority ?? false,
          },
        });
        if (data?.error) {
          store.set({ lit: data, litLoading: false });
          return;
        }
        store.set({ lit: data, litLoading: false });
      } catch (error) {
        store.set({ litLoading: false, litError: error.message });
      }
    }

    async function saveTerm(term) {
      if (!term) return;
      try {
        const data = await api('/terms', { method: 'POST', body: { term } });
        store.set({ terms: [data.term, ...(store.state.terms ?? []).filter((item) => item.id !== data.term.id)] });
        toast(`已保存「${data.term.zh || data.term.en}」到术语本`, 'ok');
      } catch (error) {
        toast(error.message, 'err');
      }
    }

    async function deleteTerm(id) {
      try {
        await api(`/terms/${encodeURIComponent(id)}`, { method: 'DELETE' });
        store.set({ terms: (store.state.terms ?? []).filter((term) => term.id !== id) });
        toast('已删除该词条');
      } catch (error) {
        toast(error.message, 'err');
      }
    }

    async function analyze(type, payload, extra = {}) {
      store.set({ handoff: { kind: 'analyze', type, payload, extra } });
    }

    async function saveSettings(patch) {
      const current = store.state.config ?? {};
      const next = {
        ...current,
        ...patch,
        literature: { ...(current.literature ?? {}), ...(patch.literature ?? {}) },
        ui: { ...(current.ui ?? {}), ...(patch.ui ?? {}) },
      };
      try {
        const data = await api('/config', { method: 'POST', body: { config: next } });
        store.set({ config: data.config, role: data.config?.ui?.role ?? store.state.role });
        toast('设置已保存', 'ok');
      } catch (error) {
        toast(error.message, 'err');
      }
    }

    async function downloadExport(format) {
      try {
        const response = await fetch(`${API}/export?format=${encodeURIComponent(format)}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `astro-terms-${new Date().toISOString().slice(0, 10)}.${format === 'anki' ? 'txt' : format}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast('已导出术语本', 'ok');
      } catch (error) {
        toast(`导出失败：${error.message}`, 'err');
      }
    }

    // ---------------------------------------------------------------------
    // icons
    // ---------------------------------------------------------------------
    function Icon({ size = 16, children, fill = 'none' }) {
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill,
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        },
        children,
      );
    }

    function OrbitIcon({ size = 18 }) {
      return h(
        Icon,
        { size },
        h('circle', { cx: 12, cy: 12, r: 2.4, fill: 'currentColor', stroke: 'none' }),
        h('ellipse', { cx: 12, cy: 12, rx: 9.2, ry: 4.2, transform: 'rotate(-24 12 12)' }),
        h('circle', { cx: 20, cy: 7.2, r: 1.2, fill: 'currentColor', stroke: 'none' }),
      );
    }

    function CloseIcon({ size = 16 }) {
      return h(Icon, { size }, h('path', { d: 'M6 6l12 12M18 6L6 18' }));
    }

    function ArrowIcon({ size = 14 }) {
      return h(Icon, { size }, h('path', { d: 'M5 12h13M13 6l6 6-6 6' }));
    }

    // ---------------------------------------------------------------------
    // small UI atoms
    // ---------------------------------------------------------------------
    function Chip({ children, tone = '' }) {
      return h('span', { className: `aw-chip ${tone}`.trim() }, children);
    }

    function Spinner() {
      return h('span', { className: 'aw-spin', 'aria-hidden': 'true' });
    }

    function ExternalLink({ href, children, title }) {
      return h(
        'a',
        {
          className: 'aw-link',
          href,
          title: title ?? href,
          target: '_blank',
          rel: 'noopener noreferrer',
          onClick: (event) => {
            event.preventDefault();
            openExternal(href);
          },
        },
        children,
      );
    }

    function Empty({ title, children }) {
      return h('div', { className: 'aw-empty' }, h('div', { style: { fontWeight: 650, marginBottom: 4 } }, title), children);
    }

    // ---------------------------------------------------------------------
    // footer entry
    // ---------------------------------------------------------------------
    function FooterButton({ wide }) {
      const state = useStore();
      return h(
        'button',
        {
          type: 'button',
          className: `aw-foot-btn${wide ? ' wide' : ''}`,
          title: 'astro-ph-researcher · 天文研究工作台（NADC 核验）',
          'aria-label': '打开 astro-ph-researcher 天文研究工作台',
          onClick: () => {
            const open = !state.open;
            store.set({ open });
            if (open) boot();
          },
        },
        h(OrbitIcon, { size: 18 }),
        wide ? h('span', null, '天文术语') : null,
      );
    }

    // ---------------------------------------------------------------------
    // term lookup tab
    // ---------------------------------------------------------------------
    function TermTab() {
      const state = useStore();
      const result = state.lookup;
      const term = result?.found ? result.term : null;
      const saved = useMemo(() => {
        if (!term) return null;
        return (state.terms ?? []).find(
          (item) => (term.astrodictId && item.astrodictId === term.astrodictId) || (item.en && item.en.toLowerCase() === term.en.toLowerCase()),
        );
      }, [state.terms, term]);

      const seedChips = (state.seed ?? []).slice(0, 12);

      return h(
        'div',
        { className: 'aw-stack' },
        h(
          'div',
          { className: 'aw-stack', style: { gap: 6 } },
          h(
            'div',
            { className: 'aw-row' },
            h('input', {
              className: 'aw-input',
              placeholder: '英文或中文术语，例如 redshift / 引力透镜',
              value: state.lookupQuery ?? '',
              spellCheck: false,
              onChange: (event) => store.set({ lookupQuery: event.target.value }),
              onKeyDown: (event) => {
                if (event.key === 'Enter') doLookup(event.currentTarget.value);
              },
            }),
            h(
              'button',
              { className: 'aw-btn primary', type: 'button', disabled: state.lookupLoading, onClick: () => doLookup() },
              state.lookupLoading ? h(Spinner) : null,
              state.lookupLoading ? '查询中' : '查词',
            ),
          ),
          h('div', { className: 'aw-hint' }, '中文译名按国家天文台天文学名词库（NADC）逐条核验；释义由 DSH 生成，会明确标注。'),
        ),
        (state.terms ?? []).length === 0
          ? h(
              'div',
              { className: 'aw-settings', style: { gap: 4 } },
              h('div', { className: 'aw-section-title' }, '新手三步'),
              h('div', { className: 'aw-hint' }, '1. 查一个术语（redshift / 引力透镜）并保存到术语本。'),
              h('div', { className: 'aw-hint' }, '2. 切到「文献」搜一篇论文，保存并写一句总结。'),
              h('div', { className: 'aw-hint' }, '3. 切到「写作」新建项目，选目标期刊/学校与写作目标。'),
              h('div', { className: 'aw-hint' }, '公式：方法/统计展开后可见编译公式，点「复制 LaTeX」可粘贴。'),
            )
          : null,

        state.lookupError ? h('div', { className: 'aw-error' }, state.lookupError) : null,

        result && !result.found
          ? h(
              'div',
              { className: 'aw-stack' },
              h(Empty, { title: 'NADC 没有直接匹配' }, result.note ?? '换用英文全称、单数或缩写再试。'),
              (result.candidates ?? []).length
                ? h(
                    'div',
                    { className: 'aw-stack' },
                    h('div', { className: 'aw-section-title' }, '近邻词条'),
                    ...(result.candidates ?? []).map((candidate) =>
                      h(
                        'button',
                        {
                          key: candidate.id,
                          type: 'button',
                          className: 'aw-btn',
                          style: { justifyContent: 'space-between' },
                          onClick: () => doLookup(candidate.en || candidate.zh),
                        },
                        h('span', null, `${candidate.zh}（${candidate.en}）`),
                        h('span', { className: 'aw-hint' }, `${Math.round((candidate.score ?? 0) * 100)}%`),
                      ),
                    ),
                  )
                : null,
            )
          : null,

        term
          ? h(
              'div',
              { className: 'aw-term-card' },
              h(
                'div',
                { className: 'aw-term-head' },
                h(
                  'div',
                  { style: { flex: 1, minWidth: 0 } },
                  h('div', { className: 'aw-zh' }, term.zh || term.en),
                  h('div', { className: 'aw-en' }, `${term.en}${term.abbr ? ` · ${term.abbr}` : ''}`),
                ),
                h(Chip, { tone: term.status?.includes('已出版') ? 'ok' : 'warn' }, term.status || 'NADC 词条'),
              ),
              h(
                'div',
                { className: 'aw-src' },
                h('span', null, term.astrodictId ? `NADC #${term.astrodictId}` : result.matchedBy?.startsWith('seed') ? '本地词表（离线）' : 'NADC'),
                term.astrodictUrl ? h(ExternalLink, { href: term.astrodictUrl }, '打开词条') : null,
                term.lastRevised ? h('span', null, `修订 ${term.lastRevised}`) : null,
                ...(term.nadcTags ?? []).slice(0, 3).map((tag, index) => h(Chip, { key: `t${index}` }, tag)),
                result.dictionary?.used ? h(Chip, { tone: 'warn' }, '离线词表') : null,
                saved ? h(Chip, { tone: 'ok' }, '已在术语本') : null,
              ),
              term.definition
                ? h(
                    'div',
                    { className: 'aw-def' },
                    h('div', { className: 'aw-def-label' }, 'NADC 审定定义'),
                    h('p', null, term.definition),
                    h('div', { className: 'aw-hint' }, term.definitionSource || 'NADC《天文学名词（定义版）》· 名词委原文'),
                  )
                : h('div', { className: 'aw-hint' }, '该词条 NADC 未提供“定义”字段，只收录译名与依据。'),
              h('div', { className: 'aw-section-title' }, 'DSH 释义（非名词委原文）'),
              h(
                'p',
                { className: 'aw-explain' },
                term.explanation ||
                  '本地词表暂无该词释义。点击「交给 DSH 讲解」，DSH 会按“定义 → 物理图像 → 公式/单位 → 观测意义 → 易混概念”生成，并标注为 DSH 释义。',
              ),
              term.formulaLatex ? h(Formula, { latex: term.formulaLatex }) : term.formula ? h('div', { className: 'aw-formula' }, term.formula) : null,
              term.units ? h('div', { className: 'aw-hint' }, `单位/量纲：${term.units}`) : null,
              term.examples?.length
                ? h(
                    'div',
                    null,
                    h('div', { className: 'aw-section-title' }, 'NADC 范例'),
                    ...term.examples.map((item, index) => h('div', { key: index, className: 'aw-hint' }, `• ${item.length > 300 ? `${item.slice(0, 300)}…` : item}`)),
                  )
                : null,
              term.notes ? h('div', { className: 'aw-hint' }, `NADC 备注：${term.notes}`) : null,
              (term.misconceptions ?? []).length
                ? h(
                    'div',
                    null,
                    h('div', { className: 'aw-section-title' }, '常见误解'),
                    ...(term.misconceptions ?? []).map((item, index) => h('div', { key: index, className: 'aw-hint' }, `• ${item}`)),
                  )
                : null,
              (result.alternatives ?? []).length
                ? h(
                    'div',
                    null,
                    h('div', { className: 'aw-section-title' }, '同名词条 / 其他译名（请确认具体指哪一个）'),
                    h(
                      'div',
                      { className: 'aw-related' },
                      ...(result.alternatives ?? []).slice(0, 6).map((item, index) =>
                        h(
                          'button',
                          {
                            key: `${item.id || item.en}-${index}`,
                            type: 'button',
                            title: item.url || item.en,
                            disabled: !item.id,
                            onClick: () => doLookup(item.en, { astrodictId: item.id }),
                          },
                          `${item.zh}${item.en ? ` · ${item.en}` : ''}${item.id ? ` #${item.id}` : ''}`,
                        ),
                      ),
                    ),
                    h('div', { className: 'aw-hint' }, '点击可切换到对应 NADC 词条；保存时记录当前词条 id。'),
                  )
                : null,
              (result.related ?? []).length
                ? h(
                    'div',
                    null,
                    h('div', { className: 'aw-section-title' }, '相关术语（点击继续查）'),
                    h(
                      'div',
                      { className: 'aw-related' },
                      ...(result.related ?? []).slice(0, 8).map((item, index) =>
                        h(
                          'button',
                          {
                            key: `${item.zh}-${index}`,
                            type: 'button',
                            title: item.reason ?? '',
                            onClick: () => doLookup(item.en || item.zh),
                          },
                          item.zh || item.en,
                        ),
                      ),
                    ),
                  )
                : null,
              h(
                'div',
                { className: 'aw-actions' },
                h(
                  'button',
                  {
                    className: 'aw-btn primary',
                    type: 'button',
                    disabled: Boolean(saved),
                    onClick: () =>
                      saveTerm({
                        ...term,
                        related: (result.related ?? []).map((item) => item.zh || item.en).filter(Boolean),
                      }),
                  },
                  saved ? '已保存' : '保存到术语本',
                ),
                h(
                  'button',
                  {
                    className: 'aw-btn',
                    type: 'button',
                    onClick: () => doSearch({ query: term.literatureQuery || term.en }),
                  },
                  '搜相关文献',
                  h(ArrowIcon, { size: 12 }),
                ),
                h(
                  'button',
                  { className: 'aw-btn', type: 'button', onClick: () => analyze('term', term) },
                  '交给 DSH 讲解',
                ),
                h(
                  'button',
                  { className: 'aw-btn ghost', type: 'button', onClick: () => analyze('session-search', term) },
                  '在对话中搜索',
                ),
              ),
              term.sources?.length ? h('div', { className: 'aw-hint' }, `依据：${term.sources.join('；')}`) : null,
            )
          : null,

        !result && !state.lookupLoading
          ? h(
              'div',
              { className: 'aw-stack' },
              h(Empty, { title: '查一个天文术语' }, '例如 redshift、gravitational lensing、红移、活动星系核。'),
              seedChips.length
                ? h(
                    'div',
                    null,
                    h('div', { className: 'aw-section-title' }, '推荐术语（已核验）'),
                    h(
                      'div',
                      { className: 'aw-related' },
                      ...seedChips.map((item) =>
                        h(
                          'button',
                          {
                            key: item.key,
                            type: 'button',
                            title: item.explanation ?? '',
                            onClick: () => doLookup(item.en),
                          },
                          `${item.zh} · ${item.en}`,
                        ),
                      ),
                    ),
                  )
                : null,
            )
          : null,
      );
    }

    // ---------------------------------------------------------------------
    // literature tab
    // ---------------------------------------------------------------------
    function PaperCard({ paper, selected, onToggle, onAnalyze, onSave }) {
      const primaryLink = paper.links?.find((link) => link.kind === 'doi' || link.kind === 'landing')?.url;
      const titleNode = primaryLink
        ? h(
            'a',
            {
              className: 'aw-paper-title',
              href: primaryLink,
              target: '_blank',
              rel: 'noopener noreferrer',
              onClick: (event) => {
                event.preventDefault();
                openExternal(primaryLink);
              },
            },
            paper.title,
          )
        : h('span', { className: 'aw-paper-title' }, paper.title);

      return h(
        'div',
        { className: `aw-paper${selected ? ' sel' : ''}` },
        h(
          'div',
          { className: 'aw-paper-top' },
          h('input', {
            type: 'checkbox',
            checked: selected,
            onChange: () => onToggle(paper.id),
            'aria-label': '选择这篇文献用于分析',
          }),
          h(
            'div',
            { style: { flex: 1, minWidth: 0 } },
            titleNode,
            h(
              'div',
              { className: 'aw-paper-meta' },
              paper.year ? h('span', null, paper.year) : null,
              paper.venue ? h('span', null, paper.venue) : null,
              paper.volume ? h('span', null, `${paper.volume}${paper.issue ? `(${paper.issue})` : ''}${paper.pages ? `, ${paper.pages}` : ''}`) : null,
              h('span', null, `被引 ${paper.citations ?? 0}`),
              paper.typeLabel ? h('span', null, paper.typeLabel) : null,
              ...(paper.badges ?? []).map((badge, index) => h(Chip, { key: index, tone: badge === '综述' ? 'brand' : badge === '高引' ? 'warn' : 'ok' }, badge)),
            ),
          ),
        ),
        h(
          'div',
          { className: 'aw-row', style: { gap: 6 } },
          h('span', { className: 'aw-hint', style: { whiteSpace: 'nowrap' } }, `评分 ${(paper.score ?? 0).toFixed(2)}`),
          h('span', { className: 'aw-meter' }, h('i', { style: { width: `${Math.round((paper.score ?? 0) * 100)}%` } })),
        ),
        paper.why?.length ? h('div', { className: 'aw-hint' }, `为什么相关：${paper.why.slice(0, 3).join('；')}`) : null,
        paper.abstract ? h('p', { className: 'aw-paper-abs' }, paper.abstract.length > 260 ? `${paper.abstract.slice(0, 260)}…` : paper.abstract) : null,
        (paper.links ?? []).length
          ? h(
              'div',
              { className: 'aw-paper-links' },
              ...(paper.links ?? []).slice(0, 6).map((link) =>
                h(
                  'a',
                  {
                    key: link.url,
                    href: link.url,
                    target: '_blank',
                    rel: 'noopener noreferrer',
                    onClick: (event) => {
                      event.preventDefault();
                      openExternal(link.url);
                    },
                  },
                  link.label,
                ),
              ),
            )
          : null,
        h(
          'div',
          { className: 'aw-row', style: { justifyContent: 'space-between' } },
          h(
            'span',
            { className: 'aw-hint' },
            (paper.firstThreeAuthors ?? []).map((author) => author.name).slice(0, 3).join(', ') +
              ((paper.authors ?? []).length > 3 ? ', et al.' : ''),
          ),
          h(
            'div',
            { className: 'aw-row', style: { gap: 2 } },
            h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => onSave(paper) }, '保存到文献库'),
            h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => onAnalyze(paper) }, '分析这篇'),
          ),
        ),
        paper.affiliations?.length ? h('div', { className: 'aw-hint' }, `单位：${paper.affiliations.slice(0, 2).join('; ')}`) : null,
      );
    }

    function LiteratureTab() {
      const state = useStore();
      const [filters, setFilters] = useState({
        yearFrom: '',
        yearTo: '',
        minCitations: '',
        openAccess: false,
        includePreprints: true,
        strictPriority: store.state.config?.literature?.strictPriority ?? false,
      });
      const [selected, setSelected] = useState([]);
      const [cnkiQuery, setCnkiQuery] = useState('');
      const lit = state.lit;

      useEffect(() => {
        setSelected([]);
      }, [lit?.query, lit?.sort]);

      const patchFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));
      const results = lit?.results ?? [];
      const selectedPapers = results.filter((paper) => selected.includes(paper.id));
      const toggle = (id) => setSelected((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));

      const runSearch = () => doSearch({ filters });

      return h(
        'div',
        { className: 'aw-stack' },
        h(
          'div',
          { className: 'aw-row' },
          h('input', {
            className: 'aw-input',
            placeholder: '英文文献检索式，例如 gravitational lensing galaxy clusters',
            value: state.litQuery ?? '',
            spellCheck: false,
            onChange: (event) => store.set({ litQuery: event.target.value }),
            onKeyDown: (event) => {
              if (event.key === 'Enter') runSearch();
            },
          }),
          h(
            'button',
            { className: 'aw-btn primary', type: 'button', disabled: state.litLoading, onClick: runSearch },
            state.litLoading ? h(Spinner) : null,
            state.litLoading ? '检索中' : '检索',
          ),
        ),
        h(
          'div',
          { className: 'aw-row', style: { justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 } },
          h(
            'div',
            { className: 'aw-segment', role: 'tablist', 'aria-label': '排序方式' },
            ...['balanced', 'relevance', 'time', 'citations'].map((sort) =>
              h(
                'button',
                {
                  key: sort,
                  type: 'button',
                  className: state.litSort === sort ? 'on' : '',
                  title: { balanced: '相关性为主，时间次之，引用数再次', relevance: '相关性优先', time: '时间优先', citations: '引用数优先' }[sort],
                  onClick: () => {
                    store.set({ litSort: sort });
                    if (lit) doSearch({ sort, filters });
                  },
                },
                { balanced: '综合', relevance: '相关', time: '最新', citations: '高引' }[sort],
              ),
            ),
          ),
          h(
            'div',
            { className: 'aw-filters' },
            h('input', { className: 'aw-num', placeholder: '起始年', inputMode: 'numeric', value: filters.yearFrom, onChange: (e) => patchFilter('yearFrom', e.target.value) }),
            h('input', { className: 'aw-num', placeholder: '截止年', inputMode: 'numeric', value: filters.yearTo, onChange: (e) => patchFilter('yearTo', e.target.value) }),
            h('input', { className: 'aw-num', placeholder: '最低被引', inputMode: 'numeric', value: filters.minCitations, onChange: (e) => patchFilter('minCitations', e.target.value) }),
            h(
              'label',
              { className: 'aw-check' },
              h('input', { type: 'checkbox', checked: filters.openAccess, onChange: (e) => patchFilter('openAccess', e.target.checked) }),
              '开放获取',
            ),
            h(
              'label',
              { className: 'aw-check' },
              h('input', { type: 'checkbox', checked: filters.includePreprints, onChange: (e) => patchFilter('includePreprints', e.target.checked) }),
              '含预印本',
            ),
            h(
              'label',
              { className: 'aw-check', title: '相关性 5% 一档，档内先比时间再比引用' },
              h('input', { type: 'checkbox', checked: filters.strictPriority, onChange: (e) => patchFilter('strictPriority', e.target.checked) }),
              '严格优先级',
            ),
          ),
        ),

        state.litError ? h('div', { className: 'aw-error' }, state.litError) : null,

        lit?.error
          ? h(
              'div',
              { className: 'aw-stack' },
              h('div', { className: 'aw-error' }, lit.message ?? lit.error),
              (lit.candidates ?? []).length
                ? h(
                    'div',
                    { className: 'aw-related' },
                    ...(lit.candidates ?? []).map((candidate) =>
                      h(
                        'button',
                        {
                          key: candidate.id,
                          type: 'button',
                          onClick: () => {
                            store.set({ lookupQuery: candidate.en });
                            doLookup(candidate.en);
                          },
                        },
                        `${candidate.zh} · ${candidate.en}`,
                      ),
                    ),
                  )
                : null,
            )
          : null,

        lit && !lit.error
          ? h(
              'div',
              { className: 'aw-hint' },
              `${lit.sourceUsed ?? ''} · ${lit.count ?? 0} 条 · ${lit.sortLabel ?? ''} · 相关性 0.60 / 时间 0.25 / 引用 0.15`,
            )
          : null,

        state.litLoading
          ? h('div', { className: 'aw-empty' }, h(Spinner), ' 正在检索并计算综合评分…')
          : results.length
            ? h(
                'div',
                { className: 'aw-stack' },
                ...results.map((paper) =>
                  h(PaperCard, {
                    key: paper.id,
                    paper,
                    selected: selected.includes(paper.id),
                    onToggle: toggle,
                    onAnalyze: (item) => analyze('literature', [item], { focus: 'overview' }),
                    onSave: (item) => saveReference(item),
                  }),
                ),
              )
            : lit
              ? h(Empty, { title: '没有返回结果' }, '可放宽年份/被引限制，或换更宽的英文关键词。')
              : h(Empty, { title: '检索英文学术文献' }, '默认按相关性、时间、引用数综合排序；结果带 DOI/ADS/arXiv/Scholar 链接。'),

        selectedPapers.length
          ? h(
              'div',
              {
                style: {
                  position: 'sticky',
                  bottom: -8,
                  background: 'var(--dsw-alias-bg-overlay,#fff)',
                  padding: '8px 0 2px',
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  borderTop: '1px solid var(--dsw-alias-border-l1,rgba(0,0,0,.1))',
                },
              },
              h('span', { className: 'aw-hint', style: { flex: 1 } }, `已选 ${selectedPapers.length} 篇`),
              h(
                'button',
                { className: 'aw-btn primary', type: 'button', onClick: () => analyze('literature', selectedPapers, { focus: 'overview' }) },
                '交给 DSH 分析所选',
              ),
            )
          : null,

        h('div', { className: 'aw-divider' }),
        h(
          'div',
          { className: 'aw-stack', style: { gap: 6 } },
          h('div', { className: 'aw-section-title' }, '知网学位论文（人工检索）'),
          h(
            'div',
            { className: 'aw-row' },
            h('input', {
              className: 'aw-input',
              placeholder: '中文关键词，例如 引力透镜 星系团',
              value: cnkiQuery,
              onChange: (event) => setCnkiQuery(event.target.value),
            }),
            h(
              'button',
              {
                className: 'aw-btn',
                type: 'button',
                disabled: !cnkiQuery.trim(),
                onClick: () =>
                  openExternal(`https://search.cnki.com.cn/Search/Result?content=${encodeURIComponent(cnkiQuery.trim())}`),
              },
              '知网搜索',
            ),
            h(
              'button',
              {
                className: 'aw-btn ghost',
                type: 'button',
                disabled: !cnkiQuery.trim(),
                onClick: () =>
                  openExternal(`https://kns.cnki.net/kns8s/defaultresult/index?kw=${encodeURIComponent(cnkiQuery.trim())}&korder=SU`),
              },
              '知网总库',
            ),
          ),
          h(
            'div',
            { className: 'aw-hint' },
            '知网没有公开 API；知网总库常触发滑块验证码，知网搜索通常可直接打开但结果为前端渲染。本插件只提供检索深链，不抓取、不绕过登录或付费墙；学位论文筛选参数未验证。',
          ),
        ),
      );
    }

    // ---------------------------------------------------------------------
    // saved term book
    // ---------------------------------------------------------------------
    function TermBookTab() {
      const state = useStore();
      const [filter, setFilter] = useState('');
      const [expanded, setExpanded] = useState('');
      const rows = useMemo(() => {
        const q = filter.trim().toLowerCase();
        const list = state.terms ?? [];
        if (!q) return list;
        return list.filter((term) =>
          [term.en, term.zh, term.abbr, term.explanation, term.note, ...(term.tags ?? [])]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(q),
        );
      }, [state.terms, filter]);

      return h(
        'div',
        { className: 'aw-stack' },
        h(
          'div',
          { className: 'aw-row' },
          h('input', {
            className: 'aw-input',
            placeholder: '搜索术语本',
            value: filter,
            onChange: (event) => setFilter(event.target.value),
          }),
          h('span', { className: 'aw-hint', style: { whiteSpace: 'nowrap' } }, `${rows.length} 条`),
        ),
        h(
          'div',
          { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
          h('button', { className: 'aw-btn', type: 'button', onClick: () => refreshTerms() }, state.termsLoading ? h(Spinner) : null, '刷新'),
          h('button', { className: 'aw-btn', type: 'button', onClick: () => downloadExport('md') }, '导出 Markdown'),
          h('button', { className: 'aw-btn', type: 'button', onClick: () => downloadExport('csv') }, '导出 CSV'),
          h('button', { className: 'aw-btn', type: 'button', onClick: () => downloadExport('anki') }, '导出 Anki'),
        ),
        rows.length
          ? h(
              'div',
              { className: 'aw-stack' },
              ...rows.map((term) =>
                h(
                  'div',
                  { key: term.id, className: 'aw-saved' },
                  h(
                    'div',
                    { className: 'aw-saved-head' },
                    h('span', { className: 'aw-saved-zh' }, term.zh || term.en),
                    h('span', { className: 'aw-saved-en' }, term.en),
                    term.verified ? h(Chip, { tone: 'ok' }, 'NADC') : h(Chip, { tone: 'warn' }, '未核验'),
                    ...(term.tags ?? []).slice(0, 3).map((tag, index) => h(Chip, { key: index }, `#${tag}`)),
                  ),
                  expanded === term.id && term.definition
                    ? h(
                        'div',
                        { className: 'aw-def' },
                        h('div', { className: 'aw-def-label' }, 'NADC 审定定义'),
                        h('p', null, term.definition),
                        h('div', { className: 'aw-hint' }, term.definitionSource || 'NADC《天文学名词（定义版）》'),
                      )
                    : null,
                  expanded === term.id && term.explanation ? h('p', { className: 'aw-explain' }, term.explanation) : null,
                  expanded === term.id && term.note ? h('div', { className: 'aw-hint' }, `笔记：${term.note}`) : null,
                  h(
                    'div',
                    { className: 'aw-saved-actions' },
                    term.explanation
                      ? h(
                          'button',
                          {
                            className: 'aw-btn ghost',
                            type: 'button',
                            onClick: () => setExpanded(expanded === term.id ? '' : term.id),
                          },
                          expanded === term.id ? '收起' : '释义',
                        )
                      : null,
                    term.astrodictUrl
                      ? h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => openExternal(term.astrodictUrl) }, 'NADC 链接')
                      : null,
                    h(
                      'button',
                      {
                        className: 'aw-btn ghost',
                        type: 'button',
                        onClick: () => {
                          store.set({ tab: 'lit' });
                          doSearch({ query: term.literatureQuery || term.en });
                        },
                      },
                      '搜文献',
                    ),
                    h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => analyze('session-search', term) }, '搜对话'),
                    h(
                      'button',
                      {
                        className: 'aw-btn ghost',
                        type: 'button',
                        onClick: () => {
                          copyText(`${term.zh || term.en}（${term.en}）\n${term.explanation || ''}\n${term.astrodictUrl || ''}`.trim());
                          toast('词条已复制', 'ok');
                        },
                      },
                      '复制',
                    ),
                    h('button', { className: 'aw-btn ghost danger', type: 'button', onClick: () => deleteTerm(term.id) }, '删除'),
                  ),
                ),
              ),
            )
          : h(Empty, { title: '术语本还是空的' }, '查词后点「保存到术语本」，或把论文里遇到的术语交给我核验。'),
      );
    }

    // ---------------------------------------------------------------------
    // settings
    // ---------------------------------------------------------------------
    // ---------------------------------------------------------------------
    // reference library
    // ---------------------------------------------------------------------
    function ReferenceCard({ item }) {
      const [style, setStyle] = useState('bibtex');
      const [editing, setEditing] = useState(false);
      const [summary, setSummary] = useState(item.summary ?? '');
      const [notes, setNotes] = useState(item.notes ?? '');
      const [fields, setFields] = useState((item.tags?.fields ?? []).join(', '));
      const [keywords, setKeywords] = useState((item.tags?.keywords ?? []).join(', '));
      const [collections, setCollections] = useState((item.tags?.collections ?? []).join(', '));
      const [keyResults, setKeyResults] = useState((item.keyResults ?? []).join('\n'));

      const split = (value) => String(value ?? '').split(/[,，;；]/).map((part) => part.trim()).filter(Boolean);
      const authors = (item.firstThreeAuthors ?? []).length
        ? item.firstThreeAuthors
        : (item.authors ?? []).slice(0, 3).map((name) => ({ name, orcid: '', affiliations: [] }));
      const journalLine = [item.journal, item.year, item.volume, item.issue ? `(${item.issue})` : '', item.pages ? `: ${item.pages}` : '']
        .filter(Boolean)
        .join(' ');

      const save = async () => {
        const updated = await updateReference(item.id, {
          summary: summary.trim(),
          notes: notes.trim(),
          keyResults: split(keyResults.replace(/\n/g, ';')),
          tags: { fields: split(fields), keywords: split(keywords), collections: split(collections) },
        });
        if (updated) setEditing(false);
      };

      return h(
        'div',
        { className: 'aw-saved' },
        h(
          'div',
          { className: 'aw-saved-head' },
          h(
            'a',
            {
              className: 'aw-saved-zh',
              href: item.doi || item.publisherUrl || item.scixUrl || '#',
              target: '_blank',
              rel: 'noopener noreferrer',
              onClick: (event) => {
                event.preventDefault();
                openExternal(item.doi || item.publisherUrl || item.scixUrl);
              },
            },
            item.title,
          ),
        ),
        h(
          'div',
          { className: 'aw-saved-en' },
          authors.map((author, index) =>
            h(
              'span',
              { key: `${author.name}-${index}` },
              author.orcid
                ? h(
                    'a',
                    {
                      className: 'aw-link',
                      href: author.orcid,
                      target: '_blank',
                      rel: 'noopener noreferrer',
                      onClick: (event) => {
                        event.preventDefault();
                        openExternal(author.orcid);
                      },
                    },
                    author.name,
                  )
                : author.name,
              index < authors.length - 1 ? ', ' : '',
            ),
          ),
          (item.authors?.length ?? 0) > 3 ? ' et al.' : '',
        ),
        journalLine ? h('div', { className: 'aw-hint' }, journalLine) : null,
        item.affiliations?.length ? h('div', { className: 'aw-hint' }, `单位：${item.affiliations.slice(0, 3).join('; ')}`) : null,
        h(
          'div',
          { className: 'aw-paper-links' },
          item.doi
            ? h('a', { href: item.doi, target: '_blank', rel: 'noopener noreferrer', onClick: (e) => { e.preventDefault(); openExternal(item.doi); } }, 'DOI')
            : null,
          item.scixUrl
            ? h('a', { href: item.scixUrl, target: '_blank', rel: 'noopener noreferrer', onClick: (e) => { e.preventDefault(); openExternal(item.scixUrl); } }, 'SciX')
            : null,
          item.adsUrl
            ? h('a', { href: item.adsUrl, target: '_blank', rel: 'noopener noreferrer', onClick: (e) => { e.preventDefault(); openExternal(item.adsUrl); } }, 'ADS')
            : null,
          item.arxivUrl
            ? h('a', { href: item.arxivUrl, target: '_blank', rel: 'noopener noreferrer', onClick: (e) => { e.preventDefault(); openExternal(item.arxivUrl); } }, 'arXiv')
            : null,
        ),
        summary ? h('p', { className: 'aw-explain' }, summary) : h('div', { className: 'aw-hint' }, '尚未填写总结；可在「编辑归类」中补充，或让 DSH 分析后写入。'),
        (item.keyResults ?? []).length
          ? h(
              'div',
              null,
              h('div', { className: 'aw-section-title' }, '可引用关键结果'),
              ...(item.keyResults ?? []).map((result, index) => h('div', { key: index, className: 'aw-hint' }, `• ${result}`)),
            )
          : null,
        h(
          'div',
          { className: 'aw-related' },
          ...[
            ...(item.tags?.fields ?? []).map((tag) => `领域:${tag}`),
            ...(item.tags?.keywords ?? []).map((tag) => `关键词:${tag}`),
            ...(item.tags?.collections ?? []).map((tag) => `专题:${tag}`),
          ].map((tag, index) => h('span', { key: index, className: 'aw-chip' }, tag)),
        ),
        editing
          ? h(
              'div',
              { className: 'aw-stack', style: { gap: 6 } },
              h('div', { className: 'aw-field' }, h('label', null, '总结 / 可引用摘要成果'), h('textarea', { className: 'aw-input', rows: 3, value: summary, onChange: (e) => setSummary(e.target.value) })),
              h('div', { className: 'aw-field' }, h('label', null, '关键结果（每行一条）'), h('textarea', { className: 'aw-input', rows: 3, value: keyResults, onChange: (e) => setKeyResults(e.target.value) })),
              h('div', { className: 'aw-field' }, h('label', null, '领域（逗号分隔）'), h('input', { className: 'aw-input', value: fields, onChange: (e) => setFields(e.target.value) })),
              h('div', { className: 'aw-field' }, h('label', null, '关键词（逗号分隔）'), h('input', { className: 'aw-input', value: keywords, onChange: (e) => setKeywords(e.target.value) })),
              h('div', { className: 'aw-field' }, h('label', null, '专题（逗号分隔）'), h('input', { className: 'aw-input', value: collections, onChange: (e) => setCollections(e.target.value) })),
              h('div', { className: 'aw-field' }, h('label', null, '笔记'), h('textarea', { className: 'aw-input', rows: 2, value: notes, onChange: (e) => setNotes(e.target.value) })),
              h(
                'div',
                { className: 'aw-row', style: { gap: 6 } },
                h('button', { className: 'aw-btn primary', type: 'button', onClick: save }, '保存修改'),
                h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => setEditing(false) }, '取消'),
              ),
            )
          : null,
        h(
          'div',
          { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
          h(
            'select',
            { className: 'aw-select', style: { width: 100 }, value: style, onChange: (e) => setStyle(e.target.value) },
            h('option', { value: 'bibtex' }, 'BibTeX'),
            h('option', { value: 'apa' }, 'APA'),
            h('option', { value: 'gb7714' }, 'GB/T 7714'),
            h('option', { value: 'mla' }, 'MLA'),
          ),
          h('button', { className: 'aw-btn', type: 'button', onClick: () => copyCitation(item.id, style) }, '复制引用'),
          h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => setEditing((value) => !value) }, editing ? '收起编辑' : '编辑归类'),
          h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => { if (window.confirm('从文献库删除这条记录？')) deleteReference(item.id); } }, '删除'),
        ),
      );
    }

    function ReferenceTab() {
      const state = useStore();
      const [query, setQuery] = useState('');
      const [tag, setTag] = useState('');
      const allTags = useMemo(() => {
        const stats = state.refStats ?? {};
        return [...new Set([...(stats.fields ?? []), ...(stats.keywords ?? []), ...(stats.collections ?? [])])];
      }, [state.refStats]);
      const rows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (state.refs ?? []).filter((item) => {
          if (tag && ![...(item.tags?.fields ?? []), ...(item.tags?.keywords ?? []), ...(item.tags?.collections ?? [])].includes(tag)) return false;
          if (!q) return true;
          const haystack = [item.title, item.journal, item.summary, item.notes, item.doi, ...(item.authors ?? [])].filter(Boolean).join(' ').toLowerCase();
          return haystack.includes(q);
        });
      }, [state.refs, query, tag]);

      return h(
        'div',
        { className: 'aw-stack' },
        h(
          'div',
          { className: 'aw-row' },
          h('input', {
            className: 'aw-input',
            placeholder: '搜索文献库（标题/作者/期刊/标签）',
            value: query,
            onChange: (e) => setQuery(e.target.value),
          }),
          h('button', { className: 'aw-btn', type: 'button', onClick: () => refreshReferences() }, state.refLoading ? h(Spinner) : null, '刷新'),
          h('button', { className: 'aw-btn', type: 'button', onClick: exportBibtex }, '导出 BibTeX'),
        ),
        allTags.length
          ? h(
              'div',
              { className: 'aw-related' },
              h('button', { type: 'button', className: tag ? '' : 'on', onClick: () => setTag('') }, '全部'),
              ...allTags.slice(0, 20).map((item) => h('button', { key: item, type: 'button', onClick: () => setTag(tag === item ? '' : item) }, item)),
            )
          : null,
        h('div', { className: 'aw-hint' }, `共 ${state.refs?.length ?? 0} 条；显示 ${rows.length} 条。前三位作者、单位、期刊卷期页、DOI/SciX/ADS/arXiv 均可在引用时使用。`),
        rows.length
          ? h('div', { className: 'aw-stack' }, ...rows.map((item) => h(ReferenceCard, { key: item.id, item })))
          : h(Empty, { title: '文献库还是空的' }, '在「文献」页检索后点「保存到文献库」；保存后可编辑领域/关键词/专题与可引用总结。'),
      );
    }

    // ---------------------------------------------------------------------
    // writing studio
    // ---------------------------------------------------------------------
    function WritingTab() {
      const state = useStore();
      const writing = state.writing ?? { projects: [], journals: [], thesisFormats: [] };
      const [title, setTitle] = useState('');
      const [type, setType] = useState('journal');
      const [targetId, setTargetId] = useState('');
      const [goalId, setGoalId] = useState('');
      const [language, setLanguage] = useState('en');
      const [styleNotes, setStyleNotes] = useState('');
      const [analyzeAfterUpload, setAnalyzeAfterUpload] = useState(true);
      const [uploading, setUploading] = useState(false);
      const [customUniversity, setCustomUniversity] = useState('');
      const [customYear, setCustomYear] = useState('');
      const [customUrl, setCustomUrl] = useState('');
      const [customText, setCustomText] = useState('');
      const [customFile, setCustomFile] = useState('');
      const selected = (writing.projects ?? []).find((project) => project.id === writing.selectedId) ?? null;
      const targets = type === 'journal' ? writing.journals ?? [] : writing.thesisFormats ?? [];
      const target = selected
        ? selected.type === 'journal'
          ? (writing.journals ?? []).find((journal) => journal.id === selected.targetId)
          : (writing.thesisFormats ?? []).find((format) => format.id === selected.targetId)
        : null;
      const selectedGoal = (writing.goals ?? []).find((goal) => goal.id === selected?.goalId) ?? null;
      const sections = writing.sections ?? {};
      const activeSection = sections[writing.activeSection] ?? null;
      const sectionChecks = writing.confirmChecks ?? { numbersMatch: false, citationsVerified: false, claimsSupported: false, styleApplied: false };
      const formatWorkspace = writing.formatWorkspace?.formatId === selected?.targetId ? writing.formatWorkspace : null;

      const selectProject = async (id) => {
        store.set({ writing: { ...writing, selectedId: id } });
        await loadWritingSections(id);
        const project = (writing.projects ?? []).find((item) => item.id === id);
        if (project?.type === 'thesis' && project.targetId) {
          const workspace = await loadThesisFormatWorkspace(project.targetId);
          const format = (writing.thesisFormats ?? []).find((item) => item.id === project.targetId);
          if (!workspace && format?.url) await fetchThesisFormat(project.targetId);
        }
      };

      const create = async () => {
        if (!title.trim()) {
          toast('请先填写项目标题', 'err');
          return;
        }
        const project = await createWritingProject({
          title: title.trim(),
          type,
          language,
          goalId,
          targetId,
          styleNotes: styleNotes.trim(),
        });
        if (project) {
          setTitle('');
          setStyleNotes('');
          await loadWritingSections(project.id);
          if (project.type === 'thesis' && project.targetId) {
            const workspace = await loadThesisFormatWorkspace(project.targetId);
            const format = (writing.thesisFormats ?? []).find((item) => item.id === project.targetId);
            if (!workspace && format?.url) await fetchThesisFormat(project.targetId);
          }
        }
      };

      const onUpload = async (fileList) => {
        if (!selected || !fileList?.length) return;
        const project = await uploadWritingFiles(selected.id, fileList);
        if (project && analyzeAfterUpload) await handoffWriting(project.id, 'analyze');
      };

      return h(
        'div',
        { className: 'aw-stack' },
        h(
          'div',
          { className: 'aw-settings' },
          h('div', { className: 'aw-section-title' }, '新建写作项目'),
          h('input', { className: 'aw-input', placeholder: '项目标题（如：JWST 高红移星系的光谱分析）', value: title, onChange: (e) => setTitle(e.target.value) }),
          h(
            'div',
            { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
            h(
              'div',
              { className: 'aw-segment' },
              h('button', { type: 'button', className: type === 'journal' ? 'on' : '', onClick: () => { setType('journal'); setTargetId(''); } }, '英文期刊论文'),
              h('button', { type: 'button', className: type === 'thesis' ? 'on' : '', onClick: () => { setType('thesis'); setTargetId(''); } }, '学位论文'),
            ),
            h(
              'select',
              { className: 'aw-select', style: { width: 210 }, value: targetId, onChange: (e) => setTargetId(e.target.value) },
              h('option', { value: '' }, type === 'journal' ? '选择目标期刊（可选）' : '选择高校格式（可选）'),
              ...targets.map((item) =>
                h('option', { key: item.id, value: item.id }, type === 'journal' ? `${item.abbrev} · ${item.name}` : `${item.university} · ${item.yearVersion}`),
              ),
            ),
            h(
              'select',
              { className: 'aw-select', style: { width: 220 }, value: goalId, onChange: (e) => setGoalId(e.target.value) },
              h('option', { value: '' }, '写作目标/叙述风格（可选）'),
              ...(writing.goals ?? []).map((goal) => h('option', { key: goal.id, value: goal.id }, `${goal.nameZh} · ${goal.nameEn}`)),
            ),
            h(
              'select',
              { className: 'aw-select', style: { width: 120 }, value: language, onChange: (e) => setLanguage(e.target.value) },
              h('option', { value: 'en' }, '英文'),
              h('option', { value: 'zh' }, '中文'),
              h('option', { value: 'bilingual' }, '中英双语'),
            ),
          ),
          h('textarea', {
            className: 'aw-input',
            rows: 2,
            placeholder: '额外风格/格式要求（可选）：目标期刊、导师要求、章节长度、必须引用的文献等',
            value: styleNotes,
            onChange: (e) => setStyleNotes(e.target.value),
          }),
          h('button', { className: 'aw-btn primary', type: 'button', onClick: create }, '创建写作项目'),
        ),
        (writing.projects ?? []).length
          ? h(
              'div',
              { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
              ...(writing.projects ?? []).map((project) =>
                h(
                  'button',
                  {
                    key: project.id,
                    type: 'button',
                    className: `aw-btn${project.id === writing.selectedId ? ' primary' : ''}`,
                    onClick: () => selectProject(project.id),
                  },
                  `${project.type === 'journal' ? '期刊' : '学位'} · ${project.title}`,
                ),
              ),
            )
          : null,
        selected
          ? h(
              'div',
              { className: 'aw-settings' },
              h('div', { className: 'aw-section-title' }, selected.title),
              h(
                'div',
                { className: 'aw-hint' },
                `${selected.type === 'journal' ? '英文期刊论文' : '学位论文'} · ${selected.language} · ${(selected.files ?? []).length} 个文件`,
              ),
              target
                ? h(
                    'div',
                    { className: 'aw-stack', style: { gap: 4 } },
                    h('div', { className: 'aw-hint' }, selected.type === 'journal'
                      ? `目标期刊：${target.abbrev} · ${target.name}`
                      : `目标格式：${target.university} · ${target.yearVersion}`),
                    selected.type === 'journal'
                      ? h(
                          'div',
                          { className: 'aw-paper-links' },
                          target.authorGuidelines ? h('a', { href: target.authorGuidelines, target: '_blank', rel: 'noopener noreferrer', onClick: (e) => { e.preventDefault(); openExternal(target.authorGuidelines); } }, '作者指南') : null,
                          target.overleafTemplate ? h('a', { href: target.overleafTemplate, target: '_blank', rel: 'noopener noreferrer', onClick: (e) => { e.preventDefault(); openExternal(target.overleafTemplate); } }, 'Overleaf 模板') : null,
                          target.homepage ? h('a', { href: target.homepage, target: '_blank', rel: 'noopener noreferrer', onClick: (e) => { e.preventDefault(); openExternal(target.homepage); } }, '期刊主页') : null,
                        )
                      : h(
                          'div',
                          { className: 'aw-paper-links' },
                          target.url ? h('a', { href: target.url, target: '_blank', rel: 'noopener noreferrer', onClick: (e) => { e.preventDefault(); openExternal(target.url); } }, '格式要求') : null,
                          target.templateUrl ? h('a', { href: target.templateUrl, target: '_blank', rel: 'noopener noreferrer', onClick: (e) => { e.preventDefault(); openExternal(target.templateUrl); } }, '模板') : null,
                        ),
                  )
                : h('div', { className: 'aw-hint' }, '未选择目标；写作前建议选择期刊或高校格式。'),
              target && target.verified === false
                ? h('div', { className: 'aw-hint' }, '该目标页面在调研时未能在线验证（出版商反爬或未找到官方页）；使用前请点开确认。')
                : null,
              selected.type === 'thesis'
                ? h(
                    'div',
                    { className: 'aw-settings' },
                    h('div', { className: 'aw-section-title' }, '格式材料：下载 / 上传 / 解析'),
                    h('div', { className: 'aw-hint' }, '选择学校/院所后，插件会从官方页抓取格式要求与模板到本地；DOCX/文本自动解析，PDF/DOC 交给 DSH 阅读。'),
                    h(
                      'div',
                      { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
                      h(
                        'button',
                        {
                          className: 'aw-btn primary',
                          type: 'button',
                          disabled: writing.formatLoading,
                          onClick: () => fetchThesisFormat(selected.targetId),
                        },
                        writing.formatLoading ? '正在抓取…' : '搜索并下载官方最新格式/模板',
                      ),
                      h('input', {
                        type: 'file',
                        accept: '.pdf,.doc,.docx,.zip,.txt,.md,.html,.wps,.rtf',
                        onChange: async (event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          if (file) await uploadThesisFormatFile(selected.targetId, file);
                        },
                      }),
                    ),
                    !target?.url
                      ? h('div', { className: 'aw-hint' }, '该单位没有公开可访问的官方格式页；请用上面的文件上传自行提供格式/模板。')
                      : null,
                    formatWorkspace
                      ? h(
                          'div',
                          { className: 'aw-stack', style: { gap: 6 } },
                          h('div', { className: 'aw-hint' }, `来源：${formatWorkspace.sourceUrl || '用户上传'} · ${formatWorkspace.files?.length ?? 0} 个文件`),
                          ...(formatWorkspace.files ?? []).map((file, index) =>
                            h('div', { key: `${file.name}-${index}`, className: 'aw-hint' },
                              `• ${file.name}（${Math.round((file.bytes ?? 0) / 1024)} KB）${file.needsDsh ? ' · 需 DSH 解析' : ' · 已解析'}`),
                          ),
                          formatWorkspace.text
                            ? h('pre', { className: 'aw-code' }, formatWorkspace.text.slice(0, 1200))
                            : h('div', { className: 'aw-hint' }, '暂无可自动解析的文本。'),
                          formatWorkspace.errors?.length
                            ? h('div', { className: 'aw-hint' }, `未完成：${formatWorkspace.errors.slice(0, 3).join('；')}`)
                            : null,
                          h(
                            'button',
                            { className: 'aw-btn', type: 'button', onClick: () => handoffWriting(selected.id, 'format') },
                            '交给 DSH 解析/使用这份格式',
                          ),
                        )
                      : null,
                  )
                : null,
              (selected.files ?? []).length
                ? h(
                    'div',
                    null,
                    h('div', { className: 'aw-section-title' }, '已上传研究结果'),
                    ...(selected.files ?? []).map((file, index) => h('div', { key: `${file.name}-${index}`, className: 'aw-hint' }, `• ${file.name}（${Math.round((file.size ?? 0) / 1024)} KB）`)),
                  )
                : h('div', { className: 'aw-hint' }, '尚未上传研究结果文件。'),
              h(
                'div',
                { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
                h('input', {
                  type: 'file',
                  multiple: true,
                  disabled: uploading || writing.uploading,
                  onChange: async (event) => {
                    const files = event.target.files;
                    event.target.value = '';
                    setUploading(true);
                    await onUpload(files);
                    setUploading(false);
                  },
                }),
                h(
                  'label',
                  { className: 'aw-check' },
                  h('input', { type: 'checkbox', checked: analyzeAfterUpload, onChange: (e) => setAnalyzeAfterUpload(e.target.checked) }),
                  '上传后让 DSH 分析这些结果',
                ),
                writing.uploading || uploading ? h(Spinner) : null,
              ),
              h(
                'div',
                { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
                h('span', { className: 'aw-hint' }, '写作目标'),
                h(
                  'select',
                  {
                    className: 'aw-select',
                    style: { width: 240 },
                    value: selected.goalId ?? '',
                    onChange: (e) => updateWritingProject(selected.id, { goalId: e.target.value }),
                  },
                  h('option', { value: '' }, '未设置（通用学术风格）'),
                  ...(writing.goals ?? []).map((goal) => h('option', { key: goal.id, value: goal.id }, `${goal.nameZh} · ${goal.nameEn}`)),
                ),
              ),
              selectedGoal
                ? h('div', { className: 'aw-hint' }, `风格：${selectedGoal.coreStance}；期刊匹配：${selectedGoal.journalFit.join(' / ')}`)
                : null,
              h(
                'div',
                { className: 'aw-settings' },
                h('div', { className: 'aw-section-title' }, 'v2 逐节写作 · 作者确认'),
                h(
                  'div',
                  { className: 'aw-related' },
                  ...Object.values(sections).map((sec) =>
                    h(
                      'button',
                      {
                        key: sec.id,
                        type: 'button',
                        className: sec.id === writing.activeSection ? 'on' : '',
                        title: `${sec.nameZh} · ${sec.status}`,
                        onClick: () => setSectionDraft(sec.id),
                      },
                      `${sec.nameZh}${sec.confirmation ? ' ✓' : ''}${sec.score?.overall ? ` ${sec.score.overall}` : ''}`,
                    ),
                  ),
                ),
                activeSection
                  ? h(
                      'div',
                      { className: 'aw-stack', style: { gap: 6 } },
                      h('div', { className: 'aw-hint' }, `状态：${activeSection.status} · 内容 hash：${String(activeSection.contentHash ?? '').slice(0, 10)}…`),
                      h('textarea', {
                        className: 'aw-input',
                        rows: 7,
                        placeholder: '在这里写/粘贴本节内容；AI 起草后由你修改，再评分和确认。',
                        value: writing.sectionDraft ?? '',
                        onChange: (e) => store.set({ writing: { ...writing, sectionDraft: e.target.value } }),
                      }),
                      h(
                        'div',
                        { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
                        h('button', { className: 'aw-btn', type: 'button', onClick: () => saveWritingSection(selected.id, activeSection.id, writing.sectionDraft ?? '') }, '保存本节'),
                        h('button', { className: 'aw-btn', type: 'button', onClick: () => scoreWritingSection(selected.id, activeSection.id, writing.sectionDraft ?? '') }, '评分'),
                        h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => handoffWriting(selected.id, 'draft') }, '让 DSH 起草本节'),
                      ),
                      activeSection.score
                        ? h(
                            'div',
                            { className: 'aw-settings', style: { gap: 3 } },
                            h('div', { className: 'aw-hint' }, `评分 ${activeSection.score.overall}/100 · ${activeSection.score.rubricVersion} · ${activeSection.score.source}`),
                            h('div', { className: 'aw-hint' }, `主张-证据 ${activeSection.score.scores.claimEvidence} · 引用 ${activeSection.score.scores.citation} · 一致 ${activeSection.score.scores.consistency} · 可复现 ${activeSection.score.scores.reproducibility} · 风格 ${activeSection.score.scores.styleFit} · 语言 ${activeSection.score.scores.language}`),
                            ...(activeSection.score.blockers ?? []).map((x, i) => h('div', { key: 'b' + i, className: 'aw-error' }, '阻塞：' + x)),
                            ...(activeSection.score.suggestions ?? []).slice(0, 3).map((x, i) => h('div', { key: 's' + i, className: 'aw-hint' }, '建议：' + x)),
                          )
                        : null,
                      h('div', { className: 'aw-section-title' }, '作者本人确认（AI 不能代替）'),
                      ...[
                        ['numbersMatch', '数字/单位/图已核对'],
                        ['citationsVerified', '引用已核验，无虚构 DOI'],
                        ['claimsSupported', '主张有证据，未超出数据'],
                        ['styleApplied', '写作目标/格式已应用'],
                      ].map(([key, label]) =>
                        h(
                          'label',
                          { key, className: 'aw-hint', style: { display: 'flex', gap: 6, alignItems: 'center' } },
                          h('input', {
                            type: 'checkbox',
                            checked: sectionChecks[key],
                            onChange: (e) => store.set({ writing: { ...writing, confirmChecks: { ...sectionChecks, [key]: e.target.checked } } }),
                          }),
                          label,
                        ),
                      ),
                      h(
                        'button',
                        {
                          className: 'aw-btn primary',
                          type: 'button',
                          disabled: !Object.values(sectionChecks).every(Boolean),
                          onClick: () => confirmWritingSection(selected.id, activeSection.id),
                        },
                        '我本人确认本节',
                      ),
                      activeSection.confirmation
                        ? h('div', { className: 'aw-hint' }, `已确认：${activeSection.confirmation.confirmedAt} · hash ${String(activeSection.confirmation.contentHash ?? '').slice(0, 10)}…（内容变更自动失效）`)
                        : h('div', { className: 'aw-hint' }, '未确认。内容修改后旧确认自动失效；确认记录用于审计，不替代同行评审。'),
                    )
                  : h('div', { className: 'aw-hint' }, '章节尚未加载；重新选择项目或刷新。'),
              ),
              h(
                'div',
                { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
                h('button', { className: 'aw-btn primary', type: 'button', onClick: () => handoffWriting(selected.id, 'analyze') }, '分析研究结果'),
                h('button', { className: 'aw-btn', type: 'button', onClick: () => handoffWriting(selected.id, 'outline') }, '生成写作大纲'),
                h('button', { className: 'aw-btn', type: 'button', onClick: () => handoffWriting(selected.id, 'draft') }, '逐节起草'),
                h('button', { className: 'aw-btn', type: 'button', onClick: () => handoffWriting(selected.id, 'format') }, '检查格式'),
                h('button', { className: 'aw-btn', type: 'button', onClick: () => handoffWriting(selected.id, 'audit') }, '投稿前审计'),
              ),
              h('div', { className: 'aw-hint' }, `将自动带上文献库 ${(state.refs ?? []).length} 条文献（若项目未单独指定）与 ${(selected.files ?? []).length} 个文件预览。`),
            )
          : null,
        h(
          'div',
          { className: 'aw-settings' },
          h('div', { className: 'aw-section-title' }, '格式库：上传/导出学校或期刊格式'),
          h(
            'div',
            { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
            h('input', { className: 'aw-input', placeholder: '学校名称', value: customUniversity, onChange: (e) => setCustomUniversity(e.target.value) }),
            h('input', { className: 'aw-input', placeholder: '年份版本（如 2025 版）', value: customYear, onChange: (e) => setCustomYear(e.target.value) }),
            h('input', { className: 'aw-input', placeholder: '格式要求/模板 URL', value: customUrl, onChange: (e) => setCustomUrl(e.target.value) }),
          ),
          h('textarea', { className: 'aw-input', rows: 3, placeholder: '粘贴格式要求要点（字体/行距/页边距/章节/GB/T 7714 等）', value: customText, onChange: (e) => setCustomText(e.target.value) }),
          h(
            'div',
            { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
            h('input', {
              type: 'file',
              accept: '.txt,.md,.json,.csv',
              onChange: async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                try {
                  const text = await file.text();
                  setCustomText((current) => `${current}${current ? '\n\n' : ''}${text.slice(0, 20000)}`);
                  setCustomFile(file.name);
                  toast(`已读取 ${file.name} 到格式文本`, 'ok');
                } catch (error) {
                  toast(`读取文件失败：${error.message}`, 'err');
                }
              },
            }),
            h(
              'button',
              {
                className: 'aw-btn primary',
                type: 'button',
                disabled: !customUniversity.trim(),
                onClick: async () => {
                  const format = await addCustomThesisFormat({
                    university: customUniversity.trim(),
                    yearVersion: customYear.trim() || '未标注版本',
                    url: customUrl.trim(),
                    formatText: customText.trim(),
                    sourceFile: customFile,
                    notes: `用户上传格式要求${customFile ? `：${customFile}` : ''}`,
                  });
                  if (format) {
                    setCustomUniversity('');
                    setCustomYear('');
                    setCustomUrl('');
                    setCustomText('');
                    setCustomFile('');
                  }
                },
              },
              '保存自定义格式',
            ),
            h('button', { className: 'aw-btn', type: 'button', onClick: exportFormatPack }, '导出格式包'),
            h('input', {
              type: 'file',
              accept: '.json',
              onChange: async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                try {
                  const pack = JSON.parse(await file.text());
                  await api('/writing/formats/import', { method: 'POST', body: pack });
                  await refreshWriting();
                  toast(`已导入格式包：${file.name}`, 'ok');
                } catch (error) {
                  toast(`导入失败：${error.message}`, 'err');
                }
              },
            }),
          ),
          h('div', { className: 'aw-hint' }, '格式包导出为 JSON，可交给其他人导入/审阅；当前版本不提供云端账户同步。'),
        ),
        !(writing.projects ?? []).length
          ? h(Empty, { title: '还没有写作项目' }, '先创建一个项目，上传研究结果，选择目标期刊或学校格式，然后交给 DSH 生成大纲/起草。')
          : null,
      );
    }

    // ---------------------------------------------------------------------
    // data methods + instruments + workflows
    // ---------------------------------------------------------------------
    function DataTab() {
      const state = useStore();
      const library = state.dataLibrary ?? { methods: [], statistics: [], instruments: [], workflows: [] };
      const [section, setSection] = useState('methods');
      const [query, setQuery] = useState('');
      const [category, setCategory] = useState('');
      const [status, setStatus] = useState('');
      const [policy, setPolicy] = useState('');
      const [expanded, setExpanded] = useState('');
      const [resources, setResources] = useState({ formats: [], books: [], recommended: [], tools: [] });

      useEffect(() => {
        let alive = true;
        Promise.all([
          api('/file-formats').catch(() => ({ formats: [] })),
          api('/physics/books').catch(() => ({ books: [] })),
          api('/physics/recommended').catch(() => ({ books: [], notice: '' })),
          api('/research/tools').catch(() => ({ tools: [] })),
        ]).then(([f, b, r, t]) => {
          if (alive) setResources({ formats: f.formats ?? [], books: b.books ?? [], recommended: r.books ?? [], recommendedNotice: r.notice ?? '', tools: t.tools ?? [] });
        });
        return () => { alive = false; };
      }, []);

      const categories = useMemo(() => [...new Set((library.methods ?? []).map((method) => method.category).filter(Boolean))], [library.methods]);
      const methods = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (library.methods ?? []).filter((method) => {
          if (category && method.category !== category) return false;
          if (!q) return true;
          return [method.name, method.principle, method.formula, method.category, ...(method.related ?? [])].filter(Boolean).join(' ').toLowerCase().includes(q);
        });
      }, [library.methods, query, category]);
      const instruments = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (library.instruments ?? []).filter((item) => {
          if (status && item.status !== status) return false;
          if (policy && item.openPolicy !== policy) return false;
          if (!q) return true;
          return [item.name, item.id, item.operator, item.waveband, item.description, item.country].filter(Boolean).join(' ').toLowerCase().includes(q);
        });
      }, [library.instruments, query, status, policy]);
      const statistics = useMemo(() => {
        const q = query.trim().toLowerCase();
        return (library.statistics ?? []).filter((item) => !q || [item.name, item.statement, item.use].filter(Boolean).join(' ').toLowerCase().includes(q));
      }, [library.statistics, query]);

      return h(
        'div',
        { className: 'aw-stack' },
        h('div', { className: 'aw-hint' }, '方法/统计为通用技术知识；已移除书名、作者、出版社、ISBN、章节号等书籍元数据。'),
        h(
          'div',
          { className: 'aw-related' },
          h('span', { className: 'aw-hint' }, '快速打开：'),
          h('button', { type: 'button', onClick: () => { setSection('books'); setQuery(''); } }, '推荐书籍'),
          ...[['3ML', '3ml'], ['AM³', 'am3'], ['SED', 'sed-builder'], ['DS9', 'ds9'], ['Geant4', 'geant4']].map(([label, q]) =>
            h('button', { key: q, type: 'button', onClick: () => { setSection('tools'); setQuery(q); } }, label),
          ),
        ),
        h(
          'div',
          { className: 'aw-segment', role: 'tablist' },
          h('button', { type: 'button', className: section === 'methods' ? 'on' : '', onClick: () => { setSection('methods'); setQuery(''); } }, '数据处理方法'),
          h('button', { type: 'button', className: section === 'statistics' ? 'on' : '', onClick: () => { setSection('statistics'); setQuery(''); } }, '统计原理'),
          h('button', { type: 'button', className: section === 'instruments' ? 'on' : '', onClick: () => { setSection('instruments'); setQuery(''); } }, '观测设备/数据'),
          h('button', { type: 'button', className: section === 'workflows' ? 'on' : '', onClick: () => { setSection('workflows'); setQuery(''); } }, '我的工作流'),
          h('button', { type: 'button', className: section === 'formats' ? 'on' : '', onClick: () => { setSection('formats'); setQuery(''); } }, '文件格式'),
          h('button', { type: 'button', className: section === 'books' ? 'on' : '', onClick: () => { setSection('books'); setQuery(''); } }, '推荐书籍（中文/译著 + 英文）'),
          h('button', { type: 'button', className: section === 'tools' ? 'on' : '', onClick: () => { setSection('tools'); setQuery(''); } }, '分析工具（3ML/AM³/SED）'),
        ),
        section !== 'workflows'
          ? h('input', {
              className: 'aw-input',
              placeholder: section === 'methods' ? '搜索方法/统计/公式（如 最小二乘、MCMC、KS、PCA）' : section === 'statistics' ? '搜索统计原理（正态、泊松、KS、贝叶斯…）' : section === 'formats' ? '搜索文件格式（FITS、PHA、XML、VOTable…）' : section === 'books' ? '搜索推荐书籍（赵永恒、Landau、GRB…）' : section === 'tools' ? '搜索工具（3ML、AM³、DS9…）' : '搜索设备（Chandra、Fermi、IceCube、FAST、LIGO…）',
              value: query,
              onChange: (event) => setQuery(event.target.value),
            })
          : null,
        section === 'methods'
          ? h(
              'div',
              { className: 'aw-stack' },
              h(
                'div',
                { className: 'aw-related' },
                h('button', { type: 'button', onClick: () => setCategory('') }, '全部'),
                ...categories.map((item) => h('button', { key: item, type: 'button', onClick: () => setCategory(category === item ? '' : item) }, item)),
              ),
              ...methods.map((method) =>
                h(
                  'div',
                  { key: method.id, className: 'aw-data-card' },
                  h(
                    'div',
                    { className: 'aw-row', style: { justifyContent: 'space-between', alignItems: 'flex-start' } },
                    h('div', null, h('div', { className: 'aw-saved-zh' }, method.name), h('div', { className: 'aw-hint' }, method.category)),
                    h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => setExpanded(expanded === method.id ? '' : method.id) }, expanded === method.id ? '收起' : '展开'),
                  ),
                  h('p', { className: 'aw-explain' }, method.principle),
                  expanded === method.id
                    ? h(
                        'div',
                        { className: 'aw-stack', style: { gap: 6 } },
                        method.formulaLatex ? h(Formula, { latex: method.formulaLatex }) : method.formula ? h('div', { className: 'aw-formula' }, method.formula) : null,
                        method.assumptions?.length ? h('div', null, h('div', { className: 'aw-section-title' }, '假设'), ...method.assumptions.map((item, index) => h('div', { key: index, className: 'aw-hint' }, `• ${item}`))) : null,
                        method.steps?.length ? h('div', null, h('div', { className: 'aw-section-title' }, '步骤'), ...method.steps.map((item, index) => h('div', { key: index, className: 'aw-hint' }, `${index + 1}. ${item}`))) : null,
                        method.python?.code ? h('div', null, h('div', { className: 'aw-section-title' }, 'Python 示例（独立实现）'), h('pre', { className: 'aw-code' }, method.python.code)) : null,
                        method.pitfalls?.length ? h('div', null, h('div', { className: 'aw-section-title' }, '常见坑'), ...method.pitfalls.map((item, index) => h('div', { key: index, className: 'aw-hint' }, `• ${item}`))) : null,
                                              )
                    : null,
                ),
              ),
              methods.length ? null : h(Empty, { title: '没有匹配的方法' }, '换关键词或选择类别。'),
            )
          : null,
        section === 'statistics'
          ? h(
              'div',
              { className: 'aw-stack' },
              ...statistics.map((item) =>
                h(
                  'div',
                  { key: item.id, className: 'aw-data-card' },
                  h('div', { className: 'aw-saved-zh' }, item.name),
                  item.formulaLatex ? h(Formula, { latex: item.formulaLatex }) : null,
                  h('p', { className: 'aw-explain' }, item.statement),
                  item.use ? h('div', { className: 'aw-hint' }, `用途：${item.use}`) : null,
                  item.python ? h('pre', { className: 'aw-code' }, item.python) : null,
                ),
              ),
              statistics.length ? null : h(Empty, { title: '没有匹配的统计原理' }, '换关键词。'),
            )
          : null,
        section === 'formats'
          ? h(
              'div',
              { className: 'aw-stack' },
              ...resources.formats.filter((item) => !query.trim() || [item.name, item.id, item.kind, ...(item.aliases ?? []), ...(item.tools ?? [])].join(' ').toLowerCase().includes(query.trim().toLowerCase())).map((item) =>
                h(
                  'div',
                  { key: item.id, className: 'aw-data-card' },
                  h('div', { className: 'aw-saved-zh' }, `${item.name} · ${item.kind}`),
                  h('div', { className: 'aw-hint' }, `扩展名：${(item.extensions ?? []).join(' / ') || '无固定扩展名'}`),
                  h('p', { className: 'aw-explain' }, item.what),
                  item.keys?.length ? h('div', { className: 'aw-hint' }, `关键字段：${item.keys.join('、')}`) : null,
                  item.mistakes?.length ? h('div', { className: 'aw-hint' }, `常见错误：${item.mistakes.join('；')}`) : null,
                ),
              ),
              resources.formats.length ? null : h(Empty, { title: '格式索引为空' }, '检查 /api/astro-ph-researcher/file-formats。'),
            )
          : null,
        section === 'books'
          ? h(
              'div',
              { className: 'aw-stack' },
              resources.recommendedNotice ? h('div', { className: 'aw-hint' }, resources.recommendedNotice) : null,
              h('div', { className: 'aw-section-title' }, '中文 / 译著推荐'),
              ...resources.recommended.filter((item) => !query.trim() || [item.title, ...(item.authors ?? []), item.publisher, item.domain, item.origin].join(' ').toLowerCase().includes(query.trim().toLowerCase())).map((item) =>
                h(
                  'div',
                  { key: item.id, className: 'aw-data-card' },
                  h('div', { className: 'aw-saved-zh' }, `${item.title}${item.year ? `（${item.year}）` : ''}`),
                  h('div', { className: 'aw-hint' }, `${(item.authors ?? []).join('、')} · ${item.publisher} · ${item.origin}`),
                  h('p', { className: 'aw-explain' }, item.why),
                  item.verified ? null : h('div', { className: 'aw-hint' }, '元数据待核验：版次/ISBN 以出版社为准。'),
                ),
              ),
              h('div', { className: 'aw-section-title' }, '英文权威书目'),
              ...resources.books.filter((item) => !query.trim() || [item.title, ...(item.authors ?? []), ...(item.domains ?? [])].join(' ').toLowerCase().includes(query.trim().toLowerCase())).map((item) =>
                h(
                  'div',
                  { key: item.id, className: 'aw-data-card' },
                  h('div', { className: 'aw-saved-zh' }, `${item.title}（${item.year}）`),
                  h('div', { className: 'aw-hint' }, `${(item.authors ?? []).join('、')} · tier ${item.tier} · ${(item.domains ?? []).join('/')}`),
                  h('p', { className: 'aw-explain' }, item.use),
                ),
              ),
              resources.books.length || resources.recommended.length ? null : h(Empty, { title: '推荐书目为空' }, '检查 /api/astro-ph-researcher/physics/recommended。'),
            )
          : null,
        section === 'tools'
          ? h(
              'div',
              { className: 'aw-stack' },
              ...resources.tools.filter((item) => !query.trim() || [item.name, item.id, item.kind, ...(item.aliases ?? []), ...(item.use ?? [])].join(' ').toLowerCase().includes(query.trim().toLowerCase())).map((item) =>
                h(
                  'div',
                  { key: item.id, className: 'aw-data-card' },
                  h('div', { className: 'aw-saved-zh' }, `${item.name} · ${item.kind}`),
                  h('p', { className: 'aw-explain' }, (item.use ?? []).join('、')),
                  h('div', { className: 'aw-hint' }, `安装：${item.install}`),
                  h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => openExternal(item.url) }, '打开官方文档'),
                ),
              ),
              resources.tools.length ? null : h(Empty, { title: '分析工具为空' }, '检查 /api/astro-ph-researcher/research/tools。'),
            )
          : null,
        section === 'instruments'
          ? h(
              'div',
              { className: 'aw-stack' },
              h(
                'div',
                { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
                h('select', { className: 'aw-select', style: { width: 130 }, value: status, onChange: (e) => setStatus(e.target.value) },
                  h('option', { value: '' }, '全部状态'),
                  h('option', { value: 'running' }, '运行中'),
                  h('option', { value: 'under_construction' }, '在建'),
                  h('option', { value: 'planned' }, '规划中'),
                  h('option', { value: 'proposed' }, '提案/未立项'),
                  h('option', { value: 'ended' }, '已结束'),
                ),
                h('select', { className: 'aw-select', style: { width: 130 }, value: policy, onChange: (e) => setPolicy(e.target.value) },
                  h('option', { value: '' }, '全部数据政策'),
                  h('option', { value: 'open' }, '开放数据'),
                  h('option', { value: 'restricted' }, '受限/申请'),
                  h('option', { value: 'proprietary' }, '专有期'),
                  h('option', { value: 'closed' }, '闭源/合作'),
                ),
              ),
              ...instruments.map((item) =>
                h(
                  'div',
                  { key: item.id, className: 'aw-data-card' },
                  h(
                    'div',
                    { className: 'aw-row', style: { justifyContent: 'space-between', alignItems: 'flex-start' } },
                    h('div', null, h('div', { className: 'aw-saved-zh' }, item.name), h('div', { className: 'aw-hint' }, `${item.operator ?? ''} · ${item.waveband ?? ''} · ${item.country ?? ''}`)),
                    h('div', { className: 'aw-row', style: { gap: 3 } },
                      h(Chip, { tone: item.status === 'running' ? 'ok' : item.status === 'under_construction' ? 'warn' : 'brand' }, { running: '运行中', under_construction: '在建', planned: '规划中', proposed: '提案', commissioning: '调试', ended: '已结束' }[item.status] ?? item.status),
                      h(Chip, { tone: item.openPolicy === 'open' ? 'ok' : 'warn' }, { open: '开放', restricted: '受限', proprietary: '专有期', closed: '闭源' }[item.openPolicy] ?? item.openPolicy),
                    ),
                  ),
                  item.description ? h('p', { className: 'aw-explain' }, item.description) : null,
                  h(
                    'div',
                    { className: 'aw-paper-links' },
                    ...(item.dataLinks ?? []).slice(0, 3).map((link) => h('a', { key: link.url, href: link.url, target: '_blank', rel: 'noopener noreferrer', onClick: (e) => { e.preventDefault(); openExternal(link.url); } }, link.label)),
                    ...(item.analysisLinks ?? []).slice(0, 3).map((link) => h('a', { key: link.url, href: link.url, target: '_blank', rel: 'noopener noreferrer', onClick: (e) => { e.preventDefault(); openExternal(link.url); } }, link.label)),
                  ),
                  (item.software ?? []).length ? h('div', { className: 'aw-hint' }, `软件：${item.software.map((sw) => `${sw.name}${sw.openSource ? '（开源）' : '（闭源）'}`).join(' / ')}`) : null,
                  item.workflow?.length ? h('div', null, h('div', { className: 'aw-section-title' }, '建议工作流'), ...item.workflow.map((step, index) => h('div', { key: index, className: 'aw-hint' }, `${index + 1}. ${step}`))) : null,
                  item.advice ? h('div', { className: 'aw-hint' }, `建议：${item.advice}`) : null,
                  item.notes ? h('div', { className: 'aw-hint' }, `备注：${item.notes}`) : null,
                  h(
                    'div',
                    { className: 'aw-row', style: { gap: 6 } },
                    h('button', { className: 'aw-btn', type: 'button', onClick: () => saveInstrumentWorkflow(item) }, '保存为我的工作流'),
                    h('button', { className: 'aw-btn primary', type: 'button', onClick: () => handoffInstrument(item) }, '交给 DSH 设计/检查流程'),
                    item.verified === false ? h('span', { className: 'aw-hint' }, '该条目有链接未在线验证') : null,
                  ),
                ),
              ),
              instruments.length ? null : h(Empty, { title: '没有匹配的设备' }, '换关键词或状态/政策过滤。'),
            )
          : null,
        section === 'workflows'
          ? h(
              'div',
              { className: 'aw-stack' },
              (library.workflows ?? []).length
                ? (library.workflows ?? []).map((workflow) =>
                    h(
                      'div',
                      { key: workflow.id, className: 'aw-data-card' },
                      h('div', { className: 'aw-row', style: { justifyContent: 'space-between' } }, h('div', { className: 'aw-saved-zh' }, workflow.name), h('button', { className: 'aw-btn ghost danger', type: 'button', onClick: () => deleteDataWorkflow(workflow.id) }, '删除')),
                      h('div', { className: 'aw-hint' }, `${workflow.instrumentName ?? ''} · ${workflow.updatedAt ?? ''}`),
                      ...(workflow.steps ?? []).map((step, index) => h('div', { key: index, className: 'aw-hint' }, `${index + 1}. ${step}`)),
                      workflow.notes ? h('div', { className: 'aw-hint' }, `笔记：${workflow.notes}`) : null,
                    ),
                  )
                : h(Empty, { title: '还没有保存的工作流' }, '在「观测设备/数据」里选择设施，点「保存为我的工作流」。'),
            )
          : null,
      );
    }



    function DeepTab() {
      const [meta, setMeta] = useState(null);
      const [phase, setPhase] = useState('');
      const [domain, setDomain] = useState('');
      const [scan, setScan] = useState(null);
      const [busy, setBusy] = useState(false);

      useEffect(() => {
        api('/deep/meta').then(setMeta).catch((error) => toast(error.message, 'err'));
      }, []);

      const run = async () => {
        setBusy(true);
        try {
          const result = await api('/deep/scan', { method: 'POST', body: { phase, domain, limit: 14 } });
          setScan(result);
        } catch (error) { toast(error.message, 'err'); } finally { setBusy(false); }
      };

      const addPrompt = async (prompt) => {
        try {
          await savePlanNode({ title: `盲点：${prompt.title}`, note: prompt.prompt, phase: '盲点检查', source: 'deep-scan', tags: [prompt.phase, prompt.level] });
          toast('已加入研究计划', 'ok');
        } catch (error) { toast(error.message, 'err'); }
      };

      if (!meta) return h('div', { className: 'aw-hint' }, '加载盲点库…');

      return h(
        'div',
        { className: 'aw-stack' },
        h('div', { className: 'aw-hint' }, meta.notice),
        h('div', { className: 'aw-section-title' }, '深度 / 交叉学科扫描'),
        h(
          'div',
          { className: 'aw-row', style: { flexWrap: 'wrap' } },
          h('select', { className: 'aw-select', value: phase, onChange: (e) => setPhase(e.target.value) }, h('option', { value: '' }, '全部阶段'), ...(meta.phases ?? []).map((item) => h('option', { key: item, value: item }, item))),
          h('select', { className: 'aw-select', value: domain, onChange: (e) => setDomain(e.target.value) }, h('option', { value: '' }, '全部领域'), ...(meta.domains ?? []).map((item) => h('option', { key: item.id, value: item.id }, `${item.name}（${item.kind}）`))),
          h('button', { className: 'aw-btn primary', type: 'button', disabled: busy, onClick: run }, busy ? '扫描中…' : '扫描盲点'),
        ),
        h('div', { className: 'aw-hint' }, '这些问题用于审查假设、选择效应、系统误差与跨学科联系；不是结论，也不会自动编造答案。'),
        scan
          ? h(
              'div',
              { className: 'aw-stack' },
              h(
                'div',
                { className: 'aw-row' },
                h('button', { className: 'aw-btn', type: 'button', onClick: () => { copyText(scan.prompt ?? ''); toast('深度提示词已复制', 'ok'); } }, '复制完整提示词'),
              ),
              h('pre', { className: 'aw-code', style: { maxHeight: 250 } }, scan.prompt ?? ''),
              ...(scan.domainQuestions ?? []).map((item, index) =>
                h(
                  'div',
                  { key: `${item.domainId}-${index}`, className: 'aw-data-card' },
                  h('div', { className: 'aw-hint' }, item.domain),
                  h('div', { className: 'aw-explain' }, item.question),
                ),
              ),
              ...(scan.prompts ?? []).map((prompt) =>
                h(
                  'div',
                  { key: prompt.id, className: 'aw-data-card' },
                  h('div', { className: 'aw-saved-zh' }, `${prompt.title} · ${prompt.phase}/${prompt.level}`),
                  h('p', { className: 'aw-explain' }, prompt.prompt),
                  h('div', { className: 'aw-hint' }, `为什么：${prompt.why}`),
                  h(
                    'div',
                    { className: 'aw-row' },
                    h('button', { className: 'aw-btn', type: 'button', onClick: () => { copyText(prompt.prompt); toast('已复制', 'ok'); } }, '复制'),
                    h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => addPrompt(prompt) }, '加入计划'),
                  ),
                ),
              ),
            )
          : h('div', { className: 'aw-hint' }, '选阶段/领域后点「扫描盲点」。'),
        h('div', { className: 'aw-section-title' }, '交叉学科领域'),
        ...(meta.domains ?? []).map((item) => h('div', { key: item.id, className: 'aw-data-card' }, h('div', { className: 'aw-saved-zh' }, `${item.name} · ${item.kind}`), h('p', { className: 'aw-explain' }, item.summary), h('div', { className: 'aw-hint' }, `检查问题：${(item.questions ?? []).length} 条 · 盲点：${(item.blindspots ?? []).length} 条`))),
      );
    }

    function PlanBranch({ nodes, parentId, depth = 0, onAdd, onRefresh }) {
      const children = nodes.filter((node) => (node.parentId ?? null) === parentId);
      if (!children.length) return null;
      return h(
        'div',
        { className: 'aw-plan-tree' },
        ...children.map((node) =>
          h(
            'div',
            { key: node.id, className: `aw-plan-node ${node.status}` },
            h(
              'div',
              { className: 'aw-plan-title' },
              h('span', null, node.status === 'done' ? '✓' : node.status === 'doing' ? '◐' : node.status === 'blocked' ? '!' : '○'),
              h('span', null, node.title),
              node.phase ? h('span', { className: 'aw-pill' }, node.phase) : null,
            ),
            node.note ? h('div', { className: 'aw-plan-note' }, node.note) : null,
            h(
              'div',
              { className: 'aw-plan-actions' },
              h('button', { type: 'button', onClick: () => patchPlanNode(node.id, { status: node.status === 'done' ? 'todo' : 'done' }).then(onRefresh) }, node.status === 'done' ? '标记未完成' : '标记完成'),
              h('button', { type: 'button', onClick: () => onAdd(node.id) }, '+ 子节点'),
              h('button', { type: 'button', onClick: () => { if (window.confirm(`删除「${node.title}」及其子节点？`)) removePlanNode(node.id).then(onRefresh); } }, '删除'),
            ),
            h(PlanBranch, { nodes, parentId: node.id, depth: depth + 1, onAdd, onRefresh }),
          ),
        ),
      );
    }

    function PlanTab() {
      const state = useStore();
      const [plan, setPlan] = useState(state.plan ?? null);
      const [summary, setSummary] = useState(state.planSummary ?? '');
      const [title, setTitle] = useState('');
      const [note, setNote] = useState('');
      const [phase, setPhase] = useState('未分组');
      const [parentId, setParentId] = useState('');
      const [busy, setBusy] = useState(false);
      const [goal, setGoal] = useState('');

      const refresh = () => loadPlan().then((data) => { setPlan(data.plan); setSummary(data.summary); setGoal(data.plan?.goal ?? ''); });
      useEffect(() => { refresh().catch(() => {}); }, []);
      useEffect(() => { setPlan(state.plan ?? null); setSummary(state.planSummary ?? ''); }, [state.planVersion]);

      const add = async () => {
        if (!title.trim()) { toast('先写节点标题', 'err'); return; }
        setBusy(true);
        try {
          await savePlanNode({ title: title.trim(), note: note.trim(), phase: phase.trim() || '未分组', parentId: parentId || undefined });
          setTitle(''); setNote(''); setParentId('');
          await refresh();
          toast('已加入研究计划', 'ok');
        } catch (error) { toast(error.message, 'err'); } finally { setBusy(false); }
      };

      const capture = () => {
        let selected = '';
        try { selected = String(window.getSelection?.()?.toString?.() ?? '').trim(); } catch { /* noop */ }
        if (selected) setNote(selected);
        else if (navigator.clipboard?.readText) navigator.clipboard.readText().then((text) => text && setNote(String(text).slice(0, 8000))).catch(() => {});
        toast(selected ? '已带入选中文本' : '可粘贴剪贴板内容', 'ok');
      };

      return h(
        'div',
        { className: 'aw-stack' },
        h('div', { className: 'aw-hint' }, '研究计划树只保存在本地；记录你确认过的正确信息、证据和下一步，不会自动抓取整段对话。'),
        h('input', { className: 'aw-input', placeholder: '计划标题', value: plan?.title ?? '', onChange: (e) => setPlan({ ...(plan ?? {}), title: e.target.value }), onBlur: () => api('/plan', { method: 'POST', body: { title: plan?.title ?? '' } }).then(refresh).catch(() => {}) }),
        h('textarea', { className: 'aw-input', rows: 2, placeholder: '研究目标（可选）', value: goal, onChange: (e) => setGoal(e.target.value), onBlur: () => api('/plan', { method: 'POST', body: { goal } }).then(refresh).catch(() => {}) }),
        h(
          'div',
          { className: 'aw-row', style: { flexWrap: 'wrap' } },
          h('button', { className: 'aw-btn', type: 'button', onClick: capture }, '从选中/剪贴板带入'),
          h('button', { className: 'aw-btn', type: 'button', onClick: () => fetch(`${API}/plan/export?format=md`).then((r) => r.text()).then((text) => { const blob = new Blob([text], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'research-plan.md'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 3000); }) }, '导出 Markdown'),
          h('button', { className: 'aw-btn', type: 'button', onClick: () => api('/plan').then((data) => { copyText(JSON.stringify(data.plan ?? {}, null, 2)); toast('计划 JSON 已复制', 'ok'); }) }, '复制 JSON'),
        ),
        h(
          'div',
          { className: 'aw-field' },
          h('label', null, '新增节点'),
          h('input', { className: 'aw-input', placeholder: '标题（如：确认样本选择函数）', value: title, onChange: (e) => setTitle(e.target.value) }),
          h('textarea', { className: 'aw-input', rows: 3, placeholder: '结论 / 证据 / 待办（只记你确认过的内容）', value: note, onChange: (e) => setNote(e.target.value) }),
          h('div', { className: 'aw-row' }, h('input', { className: 'aw-input', placeholder: '阶段，如 文献/数据/分析/写作', value: phase, onChange: (e) => setPhase(e.target.value) }), h('select', { className: 'aw-select', value: parentId, onChange: (e) => setParentId(e.target.value) }, h('option', { value: '' }, '根节点'), ...(plan?.nodes ?? []).map((node) => h('option', { key: node.id, value: node.id }, `↳ ${node.title}`)))),
          h('button', { className: 'aw-btn primary', type: 'button', disabled: busy, onClick: add }, busy ? '保存中…' : '加入计划树'),
        ),
        summary ? h('pre', { className: 'aw-code', style: { maxHeight: 180 } }, summary) : null,
        plan?.nodes?.length ? h(PlanBranch, { nodes: plan.nodes, parentId: null, onAdd: (id) => setParentId(id), onRefresh: refresh }) : h('div', { className: 'aw-hint' }, '还没有节点。先把已经确认的结论记下来。'),
      );
    }

    function SettingsTab() {
      const state = useStore();
      const config = state.config ?? {};
      const literature = config.literature ?? {};
      const [mailto, setMailto] = useState(literature.mailto ?? '');
      const [halfLife, setHalfLife] = useState(String(literature.halfLifeYears ?? 8));
      const [role, setRole] = useState(config.ui?.role ?? 'grad');
      const [panelWidth, setPanelWidth] = useState(String(config.ui?.panelWidth ?? 460));
      const [fontScale, setFontScale] = useState(String(config.ui?.fontScale ?? 1));
      const [themeId, setThemeId] = useState(config.ui?.theme ?? 'midnight');
      const [contrast, setContrast] = useState(config.ui?.contrast ?? 'normal');
      const [bgColor, setBgColor] = useState(config.ui?.bgColor ?? '');
      const [bgImage, setBgImage] = useState(readBackgroundImage());
      const [defaultSort, setDefaultSort] = useState(literature.defaultSort ?? 'balanced');
      const [strictPriority, setStrictPriority] = useState(Boolean(literature.strictPriority));

      useEffect(() => {
        setMailto(literature.mailto ?? '');
        setHalfLife(String(literature.halfLifeYears ?? 8));
        setRole(config.ui?.role ?? 'grad');
        setPanelWidth(String(config.ui?.panelWidth ?? 460));
        setFontScale(String(config.ui?.fontScale ?? 1));
        setThemeId(config.ui?.theme ?? 'midnight');
        setContrast(config.ui?.contrast ?? 'normal');
        setBgColor(config.ui?.bgColor ?? '');
        setBgImage(readBackgroundImage());
        setDefaultSort(literature.defaultSort ?? 'balanced');
        setStrictPriority(Boolean(literature.strictPriority));
      }, [state.config]);

      return h(
        'div',
        { className: 'aw-stack' },
        h(
          'div',
          { className: 'aw-settings' },
          h(
            'div',
            { className: 'aw-field' },
            h('label', null, '面向人群（影响“交给 DSH 分析”的深度）'),
            h(
              'select',
              { className: 'aw-select', value: role, onChange: (event) => setRole(event.target.value) },
              h('option', { value: 'undergrad' }, '本科生：概念与物理图像优先'),
              h('option', { value: 'grad' }, '研究生：方法、数据与公式'),
              h('option', { value: 'researcher' }, '研究员：新颖性、局限与可复现'),
              h('option', { value: 'professor' }, '教授/教师：综述、教学与选题'),
            ),
          ),
          h(
            'div',
            { className: 'aw-field' },
            h('label', null, '界面宽度'),
            h(
              'select',
              { className: 'aw-select', value: panelWidth, onChange: (event) => setPanelWidth(event.target.value) },
              h('option', { value: '380' }, '紧凑（380 px）'),
              h('option', { value: '460' }, '标准（460 px）'),
              h('option', { value: '560' }, '宽（560 px）'),
              h('option', { value: '680' }, '超宽（680 px）'),
            ),
            h('div', { className: 'aw-hint' }, '窄屏会自动限制到屏幕宽度。'),
          ),
          h(
            'div',
            { className: 'aw-field' },
            h('label', null, '字体/整体缩放'),
            h(
              'select',
              { className: 'aw-select', value: fontScale, onChange: (event) => setFontScale(event.target.value) },
              h('option', { value: '0.9' }, '小（90%）'),
              h('option', { value: '1' }, '标准（100%）'),
              h('option', { value: '1.1' }, '大（110%）'),
              h('option', { value: '1.2' }, '特大（120%）'),
            ),
            h('div', { className: 'aw-hint' }, '保存后立即应用到面板；若布局异常可调回 100%。'),
          ),
          h('div', { className: 'aw-divider' }),
          h('div', { className: 'aw-section-title' }, '外观与可读性'),
          h(
            'div',
            { className: 'aw-field' },
            h('label', null, '主题预设'),
            h(
              'div',
              { className: 'aw-theme-row' },
              ...Object.entries(THEMES).map(([id, theme]) =>
                h('button', {
                  key: id,
                  type: 'button',
                  title: theme.label,
                  'aria-label': theme.label,
                  className: `aw-theme-chip${themeId === id ? ' on' : ''}`,
                  style: { background: `linear-gradient(135deg, ${theme.bg} 55%, ${theme.accent} 55%)` },
                  onClick: () => setThemeId(id),
                }),
              ),
            ),
            h('div', { className: 'aw-hint' }, '深空 / 纸张 / 星云 / 森林 / 高对比 / 高亮；按钮和正文对比度会随主题调整。'),
          ),
          h(
            'div',
            { className: 'aw-field' },
            h('label', null, '背景颜色（覆盖主题底色）'),
            h('div', { className: 'aw-row' },
              h('input', { type: 'color', value: bgColor || (THEMES[themeId]?.bg ?? '#0f1524'), onChange: (e) => setBgColor(e.target.value), style: { width: 46, height: 30, padding: 0, border: 0, background: 'transparent' } }),
              h('input', { className: 'aw-input', value: bgColor, placeholder: '留空使用主题默认', onChange: (e) => setBgColor(e.target.value) }),
              h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => setBgColor('') }, '清除'),
            ),
          ),
          h(
            'div',
            { className: 'aw-field' },
            h('label', null, '本地背景图片'),
            h('div', { className: 'aw-bg-preview', style: bgImage ? { backgroundImage: `url(${JSON.stringify(bgImage)})` } : undefined }),
            h('div', { className: 'aw-row', style: { flexWrap: 'wrap' } },
              h('label', { className: 'aw-btn', style: { cursor: 'pointer' } }, '选择图片', h('input', { className: 'aw-file', type: 'file', accept: 'image/*', onChange: async (e) => { const file = e.target.files?.[0]; if (!file) return; if (file.size > 2.5 * 1024 * 1024) { toast('图片请小于 2.5 MB', 'err'); return; } const reader = new FileReader(); reader.onload = () => { const url = String(reader.result ?? ''); writeBackgroundImage(url); setBgImage(url); store.set({ appearanceVersion: (store.state.appearanceVersion ?? 0) + 1 }); toast('背景图已应用（仅保存在本机浏览器）', 'ok'); }; reader.readAsDataURL(file); } })),
              h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => { writeBackgroundImage(''); setBgImage(''); store.set({ appearanceVersion: (store.state.appearanceVersion ?? 0) + 1 }); } }, '移除图片'),
            ),
            h('div', { className: 'aw-hint' }, '图片只存本机 localStorage，不上传；大图会占浏览器空间。'),
          ),
          h(
            'div',
            { className: 'aw-field' },
            h('label', null, '对比度增强'),
            h('select', { className: 'aw-select', value: contrast, onChange: (e) => setContrast(e.target.value) },
              h('option', { value: 'normal' }, '标准'),
              h('option', { value: 'high' }, '高对比（文字/边框更清晰）'),
            ),
            h('div', { className: 'aw-contrast-preview' }, '预览：', h('b', null, '主按钮'), h('span', null, '正文文字 / 次要文字')),
          ),
          h('div', { className: 'aw-divider' }),
          h(
            'div',
            { className: 'aw-field' },
            h('label', null, '默认文献排序'),
            h(
              'select',
              { className: 'aw-select', value: defaultSort, onChange: (event) => setDefaultSort(event.target.value) },
              h('option', { value: 'balanced' }, '综合：相关性 > 时间 > 引用数'),
              h('option', { value: 'relevance' }, '相关性优先'),
              h('option', { value: 'time' }, '时间优先'),
              h('option', { value: 'citations' }, '引用数优先'),
            ),
          ),
          h(
            'div',
            { className: 'aw-field' },
            h('label', null, '时间衰减半衰期（年）'),
            h('input', { className: 'aw-input', inputMode: 'numeric', value: halfLife, onChange: (event) => setHalfLife(event.target.value) }),
            h('div', { className: 'aw-hint' }, '越大越“念旧”；天文学基础文献可设 8-12 年。'),
          ),
          h(
            'div',
            { className: 'aw-field' },
            h('label', null, '排序语义'),
            h(
              'label',
              { className: 'aw-check' },
              h('input', { type: 'checkbox', checked: strictPriority, onChange: (event) => setStrictPriority(event.target.checked) }),
              '严格优先级：相关性差距 >5% 时，时间和引用不能翻盘',
            ),
            h('div', { className: 'aw-hint' }, '关闭时使用加权分 0.60/0.25/0.15；开启后按 5% 相关性分档，档内先时间后引用。'),
          ),
          h(
            'div',
            { className: 'aw-field' },
            h('label', null, 'OpenAlex / Crossref 联系邮箱（可选）'),
            h('input', {
              className: 'aw-input',
              placeholder: 'you@example.com',
              value: mailto,
              onChange: (event) => setMailto(event.target.value),
            }),
            h('div', { className: 'aw-hint' }, '用于礼貌池，提高 API 稳定性；只写入本地配置。'),
          ),
          h(
            'div',
            { className: 'aw-row', style: { justifyContent: 'space-between' } },
            h('span', { className: 'aw-hint' }, `ADS token：${state.health?.adsConfigured ? '已配置（环境变量）' : '未配置'}`),
            h('span', { className: 'aw-hint' }, `OpenAlex key：${state.health?.openAlexKeyConfigured ? '已配置' : '未配置'}`),
          ),
          h(
            'div',
            { className: 'aw-row', style: { justifyContent: 'space-between' } },
            state.health?.adsConfigured ? h(Chip, { tone: 'ok' }, 'ADS 可用') : h(Chip, { tone: 'warn' }, 'OpenAlex/Crossref'),
            state.health?.openAlexKeyConfigured ? h(Chip, { tone: 'ok' }, 'OpenAlex key') : null,
          ),
          h('div', { className: 'aw-divider' }),
          h('div', { className: 'aw-section-title' }, 'AI 内容声明'),
          h('div', { className: 'aw-hint' }, '作者只负责设计；代码/文案/数据由 AI（DeepSeek/DSH）制作，作者验收。AI 存在幻觉，内容可能错误、过时或链接失效；请独立核验。报错/侵权请联系 1253932197@qq.com 更新或删除。'),
          h('div', { className: 'aw-section-title' }, '隐私与安全'),
          h('div', { className: 'aw-hint' }, '本地优先：术语本、文献库、手稿默认只在本机。外部请求仅向 NADC/OpenAlex/Crossref/ADS/arXiv 等官方 HTTPS 接口发起；不运行下载脚本、不自动执行外部程序。详见 SECURITY.md / PRIVACY.md。'),
          h('div', { className: 'aw-hint' }, '加密：网络走 HTTPS；本地文件未做自研加密，建议开启系统磁盘加密。插件不能替代杀毒/系统更新，安装第三方工具前请核验来源。'),
          h('div', { className: 'aw-section-title' }, '致谢'),
          h('div', { className: 'aw-hint' }, '感谢 DeepSeek 与 DSH 提供模型与宿主能力；感谢 NADC、OpenAlex、Crossref、NASA ADS、arXiv、KaTeX 与所有开源项目；感谢全世界的天文工作者与用户。'),
          h(
            'button',
            {
              className: 'aw-btn primary',
              type: 'button',
              onClick: () => {
                writeBackgroundImage(bgImage);
                saveSettings({
                  literature: { mailto, halfLifeYears: Number(halfLife) || 8, defaultSort, strictPriority },
                  ui: { role, panelWidth: Number(panelWidth) || 460, fontScale: Number(fontScale) || 1, theme: themeId, contrast, bgColor },
                });
              },
            },
            '保存设置',
          ),
        ),
        h('div', { className: 'aw-divider' }),
        h(
          'div',
          { className: 'aw-settings' },
          h('div', { className: 'aw-section-title' }, '官方离线词表（NADC）'),
          h(
            'div',
            { className: 'aw-row', style: { justifyContent: 'space-between' } },
            state.dictionary?.installed
              ? h('span', { className: 'aw-hint' }, `${state.dictionary.version} · ${state.dictionary.count} 条`)
              : h('span', { className: 'aw-hint' }, '未安装（仍可在线查词）'),
            state.dictionary?.installed ? h(Chip, { tone: 'ok' }, '已安装') : h(Chip, { tone: 'warn' }, '未安装'),
          ),
          h(
            'div',
            { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
            h(
              'button',
              {
                className: 'aw-btn primary',
                type: 'button',
                disabled: state.dictionaryDownloading,
                onClick: () => downloadDictionary(),
              },
              state.dictionaryDownloading ? h(Spinner) : null,
              state.dictionaryDownloading ? '下载解析中…' : state.dictionary?.installed ? '更新官方词表' : '下载官方词表',
            ),
            h('button', { className: 'aw-btn', type: 'button', onClick: () => openExternal('https://nadc.china-vo.org/astrodict/article/download') }, '官方下载页'),
          ),
          h(
            'div',
            { className: 'aw-hint' },
            '约 700 KB，3 万条 EN↔ZH；不含 id/定义，因此联网时会再用 NADC 详情页补全。词表不随插件分发，首次使用由你主动下载。',
          ),
          h('div', { className: 'aw-hint' }, '许可：所有权归中国天文学会；允许集成/格式转换，不得修改内容或与其他词库整合后二次发布。'),
        ),
        h('div', { className: 'aw-divider' }),
        h(
          'div',
          { className: 'aw-settings' },
          h('div', { className: 'aw-section-title' }, '数据与隐私'),
          h('div', { className: 'aw-hint' }, `术语本位置：${state.health?.dataDir ?? '$DSH_HOME/astro-ph-researcher'}`),
          h('div', { className: 'aw-hint' }, '查词会请求 NADC 公共网页；文献检索会把检索式发给 OpenAlex/Crossref/ADS（取决于配置）。术语本只保存在本机。'),
          h('div', { className: 'aw-hint' }, '知网没有公开 API；插件只给人工检索链接，不抓取、不绕过登录/付费墙。'),
          h(
            'div',
            { className: 'aw-row', style: { flexWrap: 'wrap', gap: 6 } },
            h('button', { className: 'aw-btn', type: 'button', onClick: () => openExternal('https://nadc.china-vo.org/astrodict/') }, '打开 NADC 名词库'),
            h('button', { className: 'aw-btn', type: 'button', onClick: () => downloadExport('json') }, '导出 JSON 备份'),
          ),
        ),
        h(
          'div',
          { className: 'aw-hint' },
          `astro-ph-researcher v${state.health?.version ?? '3.1.0'} · 术语核验 / 参考文献库 / 写作工作台。`,
        ),
      );
    }

    // ---------------------------------------------------------------------
    // panel shell
    // ---------------------------------------------------------------------

    function HandoffDialog() {
      const state = useStore();
      const handoff = state.handoff;
      const [target, setTarget] = useState('current');
      const [query, setQuery] = useState('');
      const [results, setResults] = useState([]);
      const [selectedSession, setSelectedSession] = useState('');
      const [searching, setSearching] = useState(false);
      const [busy, setBusy] = useState(false);
      const [role, setRole] = useState(state.config?.ui?.role ?? 'grad');
      const [skill, setSkill] = useState(state.config?.ui?.activeSkill ?? 'astro-research-workflow');
      const [mode, setMode] = useState(state.config?.ui?.activeMode ?? '研究');
      const abortRef = useRef(null);

      useEffect(() => {
        setRole(state.config?.ui?.role ?? 'grad');
        setSkill(state.config?.ui?.activeSkill ?? 'astro-research-workflow');
        setMode(state.config?.ui?.activeMode ?? '研究');
      }, [state.config]);

      if (!handoff) return null;
      const label = handoff.kind === 'analyze' ? '分析/问答' : handoff.kind === 'writing' ? '写作工作台' : '观测/数据工作流';

      const search = async () => {
        if (!query.trim() || !runtimeRef.current?.sessions?.search) { toast('先输入关键词；需要 DSH 会话搜索服务', 'err'); return; }
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setSearching(true);
        try {
          const result = await runtimeRef.current.sessions.search(query.trim(), controller.signal);
          const items = result?.items ?? result?.value?.items ?? [];
          setResults(items);
          if (!items.length) toast('没有匹配的对话', 'err');
        } catch (error) {
          if (error?.name !== 'AbortError') toast(error?.message ?? '搜索对话失败', 'err');
        } finally { setSearching(false); }
      };

      const confirm = async () => {
        setBusy(true);
        try {
          const sessionId = target === 'existing' ? selectedSession : store.state.sessionId;
          if (target === 'existing' && !sessionId) { toast('先选择一个已有对话', 'err'); return; }
          await saveSettings({ ui: { role, activeSkill: skill, activeMode: mode } }).catch(() => {});
          await executeHandoff(handoff, target, sessionId);
          store.set({ handoff: null });
        } catch (error) {
          const prompt = error?.data?.prompt;
          if (prompt) { copyText(prompt); toast('当前没有可用对话；提示词已复制，可粘贴到新对话。', 'err'); }
          else toast(error?.message ?? '交接失败', 'err');
        } finally { setBusy(false); }
      };

      return h(
        'div',
        { className: 'aw-modal-mask', onMouseDown: (event) => { if (event.target === event.currentTarget) store.set({ handoff: null }); } },
        h(
          'div',
          { className: 'aw-modal', role: 'dialog', 'aria-label': '交给 DSH' },
          h('h3', null, `交给 DSH · ${label}`),
          h('div', { className: 'aw-hint' }, '选择送到当前对话、已有对话，或新建对话；设置只在本次交接生效。'),
          h(
            'div',
            { className: 'aw-stack' },
            ...[
              ['current', '当前对话', '直接发送到插件当前绑定的会话'],
              ['existing', '已有对话', '搜索并选择一个历史会话'],
              ['new', '新建对话', '打开新会话；提示词会复制到剪贴板'],
            ].map(([id, title, desc]) =>
              h(
                'label',
                { key: id, className: `aw-handoff-option${target === id ? ' on' : ''}` },
                h('input', { type: 'radio', name: 'handoff-target', checked: target === id, onChange: () => setTarget(id) }),
                h('span', null, h('b', null, title), h('span', { className: 'aw-hint', style: { display: 'block' } }, desc)),
              ),
            ),
          ),
          target === 'existing'
            ? h(
                'div',
                { className: 'aw-field' },
                h('label', null, '搜索已有对话'),
                h('div', { className: 'aw-row' }, h('input', { className: 'aw-input', placeholder: '输入关键词，如 光谱 / 论文 / 样本', value: query, onChange: (e) => setQuery(e.target.value), onKeyDown: (e) => { if (e.key === 'Enter') search(); } }), h('button', { className: 'aw-btn', type: 'button', disabled: searching, onClick: search }, searching ? '搜索中…' : '搜索')),
                ...(results.length ? [h('div', { className: 'aw-stack' }, ...results.map((item) => h('button', { key: item.sessionId, type: 'button', className: 'aw-handoff-result', onClick: () => setSelectedSession(item.sessionId) }, `${selectedSession === item.sessionId ? '● ' : ''}${item.sessionId} — ${item.snippet ?? ''}`)))] : []),
              )
            : null,
          h(
            'div',
            { className: 'aw-row', style: { flexWrap: 'wrap' } },
            h('select', { className: 'aw-select', value: role, onChange: (e) => setRole(e.target.value) }, h('option', { value: 'undergrad' }, '本科生'), h('option', { value: 'grad' }, '研究生'), h('option', { value: 'researcher' }, '研究员'), h('option', { value: 'professor' }, '教师')),
            h('select', { className: 'aw-select', value: mode, onChange: (e) => setMode(e.target.value) }, ...MODES.map((item) => h('option', { key: item, value: item }, `应用：${item}`))),
            h('select', { className: 'aw-select', value: skill, onChange: (e) => setSkill(e.target.value) }, ...SKILLS.map(([id, name]) => h('option', { key: id, value: id }, `Skill：${name}`))),
          ),
          h('div', { className: 'aw-hint' }, '对话设置会写入本地配置；新建对话的模型/权限仍由 DSH 新建页决定。'),
          h(
            'div',
            { className: 'aw-row' },
            h('button', { className: 'aw-btn ghost', type: 'button', onClick: () => store.set({ handoff: null }) }, '取消'),
            h('button', { className: 'aw-btn primary', type: 'button', disabled: busy, onClick: confirm }, busy ? '发送中…' : target === 'new' ? '打开新对话并复制提示词' : '确认交给 DSH'),
          ),
        ),
      );
    }

    function Panel() {
      const state = useStore();
      const bodyRef = useRef(null);

      useEffect(() => {
        if (!state.open || state.booted) return;
        boot();
      }, [state.open, state.booted]);

      useEffect(() => {
        if (!state.open) return undefined;
        const onKey = (event) => {
          if (event.key === 'Escape') store.set({ open: false });
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
      }, [state.open]);

      useEffect(() => {
        if (state.open && bodyRef.current) bodyRef.current.scrollTop = 0;
      }, [state.tab, state.open]);

      if (!state.open) return null;

      const tabs = [
        { id: 'term', label: '查词' },
        { id: 'lit', label: '文献' },
        { id: 'ref', label: '文献库' },
        { id: 'writing', label: '写作' },
        { id: 'plan', label: '计划' },
        { id: 'deep', label: '深度' },
        { id: 'data', label: '数据' },
        { id: 'book', label: '术语本' },
        { id: 'settings', label: '设置' },
      ];

      const ui = state.config?.ui ?? {};
      const bgImage = readBackgroundImage();
      const palette = themeVars(ui, bgImage);
      if (ui.bgColor) palette['--aw-bg'] = ui.bgColor;
      return h(
        'div',
        {
          className: `aw-panel${bgImage ? ' aw-has-image' : ''}${ui.contrast === 'high' ? ' aw-contrast-high' : ''}`,
          role: 'dialog',
          'aria-label': '天文术语与文献工作台',
          style: {
            ...palette,
            '--aw-panel-width': `${ui.panelWidth ?? 460}px`,
            '--aw-font-scale': String(ui.fontScale ?? 1),
          },
        },
        h(
          'div',
          { className: 'aw-head' },
          h('div', { className: 'aw-logo' }, h(OrbitIcon, { size: 19 })),
          h(
            'div',
            { style: { minWidth: 0 } },
            h('div', { className: 'aw-title' }, 'astro-ph-researcher · 天文研究工作台'),
            h('div', { className: 'aw-sub' }, 'NADC 审定译名 · 文献检索与文献库 · 引用/写作交接'),
          ),
          h('div', { className: 'aw-spacer' }),
          h(
            'button',
            {
              className: 'aw-iconbtn',
              type: 'button',
              title: '关闭（Esc）',
              'aria-label': '关闭',
              onClick: () => store.set({ open: false }),
            },
            h(CloseIcon, { size: 16 }),
          ),
        ),
        h(
          'div',
          { className: 'aw-tabs', role: 'tablist' },
          ...tabs.map((tab) =>
            h(
              'button',
              {
                key: tab.id,
                type: 'button',
                role: 'tab',
                'aria-selected': state.tab === tab.id,
                className: `aw-tab${state.tab === tab.id ? ' on' : ''}`,
                onClick: () => store.set({ tab: tab.id }),
              },
              tab.label,
            ),
          ),
        ),
        h(
          'div',
          { className: 'aw-body', ref: bodyRef },
          state.tab === 'term' ? h(TermTab) : null,
          state.tab === 'lit' ? h(LiteratureTab) : null,
          state.tab === 'ref' ? h(ReferenceTab) : null,
          state.tab === 'writing' ? h(WritingTab) : null,
          state.tab === 'plan' ? h(PlanTab) : null,
          state.tab === 'deep' ? h(DeepTab) : null,
          state.tab === 'data' ? h(DataTab) : null,
          state.tab === 'book' ? h(TermBookTab) : null,
          state.tab === 'settings' ? h(SettingsTab) : null,
        ),
        state.handoff ? h(HandoffDialog) : null,
        state.toast
          ? h(
              'div',
              { className: `aw-toast${state.toast.kind ? ` ${state.toast.kind}` : ''}`, role: 'status' },
              state.toast.message,
            )
          : null,
      );
    }


    function ComposerBar({ compact = false, sessionId } = {}) {
      const state = useStore();
      const ui = state.config?.ui ?? {};
      const [mode, setMode] = useState(ui.activeMode ?? '研究');
      const [skill, setSkill] = useState(ui.activeSkill ?? 'astro-research-workflow');
      useEffect(() => { setMode(ui.activeMode ?? '研究'); setSkill(ui.activeSkill ?? 'astro-research-workflow'); }, [ui.activeMode, ui.activeSkill]);

      const persist = (patch) => saveSettings({ ui: { activeMode: mode, activeSkill: skill, ...patch } }).catch(() => {});
      const recordSelection = async () => {
        let selected = '';
        try { selected = String(window.getSelection?.()?.toString?.() ?? '').trim(); } catch { /* noop */ }
        if (!selected) { toast('先在对话里选中一段文字，或打开「计划」手动记录。', 'err'); return; }
        try {
          await savePlanNode({ title: `问答摘录 · ${new Date().toLocaleString()}`, note: selected, phase: '问答记录', source: sessionId ? `session:${sessionId}` : 'chat', tags: ['问答摘录'] });
          toast('已记录到研究计划树', 'ok');
        } catch (error) { toast(error.message, 'err'); }
      };

      return h(
        'div',
        { className: 'aw-composer-bar', title: 'astro-ph-researcher' },
        h('button', { type: 'button', onClick: () => store.set({ open: true, tab: 'plan' }) }, '🌱 计划'),
        h('button', { type: 'button', onClick: () => store.set({ open: true, tab: 'deep' }) }, '🔎 盲点'),
        h('button', { type: 'button', onClick: recordSelection }, '＋ 记录选中'),
        h('button', { type: 'button', onClick: () => store.set({ open: true, tab: 'settings' }) }, '🎨 外观'),
        h('span', { className: 'aw-composer-dot' }, '应用'),
        h('select', { value: mode, onChange: (e) => { setMode(e.target.value); persist({ activeMode: e.target.value }); } }, ...MODES.map((item) => h('option', { key: item, value: item }, item))),
        h('span', { className: 'aw-composer-dot' }, 'Skill'),
        h('select', { value: skill, onChange: (e) => { setSkill(e.target.value); persist({ activeSkill: e.target.value }); } }, ...SKILLS.map(([id, name]) => h('option', { key: id, value: id }, name))),
        compact ? null : h('button', { type: 'button', onClick: () => store.set({ open: true, tab: 'term' }) }, '工作台'),
      );
    }

    function ComposerMiniButton() {
      const state = useStore();
      return h('button', {
        type: 'button',
        title: '打开天文研究工作台',
        onClick: () => store.set({ open: true, tab: state.tab === 'plan' ? 'term' : 'plan' }),
        style: { border: 0, background: 'transparent', color: 'var(--dsw-alias-label-secondary,#71717a)', fontSize: 11, cursor: 'pointer', padding: '0 4px' },
      }, '🌱 计划');
    }

    function registerComposerSlots(ctx) {
      const slots = ctx.slots;
      if (!slots) return;
      const registrations = [];
      try {
        registrations.push(slots.inject('conversation.input.left', () => slots.register(
          { name: 'conversation.input.left', id: 'astro-ph-researcher-plan', order: 74, label: '研究计划' },
          () => h(ComposerMiniButton),
        )));
      } catch (error) { console.warn('[astro-ph-researcher] composer left slot failed', error); }
      try {
        registrations.push(slots.inject('conversation.composer.dock', () => slots.register(
          { name: 'conversation.composer.dock', id: 'astro-ph-researcher-bar', order: 72, label: '天文研究工作台' },
          (props) => h(ComposerBar, { sessionId: props?.sessionId }),
        )));
      } catch (error) { console.warn('[astro-ph-researcher] composer dock slot failed', error); }
      return () => { for (const dispose of registrations) { try { dispose?.(); } catch { /* noop */ } } };
    }

    // ---------------------------------------------------------------------
    // plugin apply
    // ---------------------------------------------------------------------
    function ensureStyle() {
      if (document.getElementById(CSS_ID)) return;
      const style = document.createElement('style');
      style.id = CSS_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }

    function removeStyle() {
      document.getElementById(CSS_ID)?.remove();
    }

    function apply(ctx) {
      runtimeRef.current = ctx;
      ctx.effect(() => {
        ensureStyle();
        return () => removeStyle();
      }, 'astro-ph-researcher: styles');

      const slots = ctx.slots;
      if (!slots) {
        console.warn('[astro-ph-researcher] slots service unavailable; sidebar disabled');
        return;
      }

      ctx.effect(
        () =>
          slots.inject('sidebar.footer.action', () =>
            slots.register(
              {
                name: 'sidebar.footer.action',
                id: PLUGIN_ID,
                order: 5,
                label: '天文术语',
              },
              (props) => h(FooterButton, { wide: props?.wide }),
            ),
          ),
        'astro-ph-researcher: sidebar entry',
      );

      ctx.effect(
        () =>
          slots.inject('shell.overlay', () =>
            slots.register(
              {
                name: 'shell.overlay',
                id: PLUGIN_ID,
                order: 9,
              },
              () => h(Panel),
            ),
          ),
        'astro-ph-researcher: overlay panel',
      );

      ctx.effect(() => registerComposerSlots(ctx), 'astro-ph-researcher: composer slots');

      console.log('[astro-ph-researcher] client ready');
    }

    const module = { exports: {} };
    module.exports = { inject: ['slots'], apply };
    return module.exports;
  },
});
