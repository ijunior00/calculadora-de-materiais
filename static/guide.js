// ============================================================
// GUIDE.JS — Repair Guide modal (shared by desktop and mobile)
// Read-only decision support built from the reference data in data.js
// (DAMAGE_DECISION_TREE, FIBER_SUBSTITUTIONS, CORE_SUBSTITUTIONS,
// FIELD_RULES). Self-contained: creates its own overlay + inline styles so
// it works on both front-ends without touching either stylesheet.
// ============================================================

const GUIDE_LEVEL_COLORS = {
    'C':  '#16a34a',   // cosmetic
    'B':  '#0ea5e9',   // intermediate
    'A':  '#f59e0b',   // advanced
    'A+': '#dc2626',   // advanced + supervision
    '⛔': '#7f1d1d',   // not repairable
};

let _guideTab = 'tree';
let _guideDamageFilter = '';

function openRepairGuide() {
    let host = document.getElementById('repair-guide-modal');
    if (!host) {
        host = document.createElement('div');
        host.id = 'repair-guide-modal';
        host.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,0.55);display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:16px;';
        host.onclick = (e) => { if (e.target === host) closeRepairGuide(); };
        document.body.appendChild(host);
    }
    renderRepairGuide();
}

function closeRepairGuide() {
    const host = document.getElementById('repair-guide-modal');
    if (host) host.remove();
}

function guideTab(t) { _guideTab = t; renderRepairGuide(); }
function guideSetDamage(v) { _guideDamageFilter = v; renderRepairGuide(); }

function _guideBadge(level) {
    const c = GUIDE_LEVEL_COLORS[level] || '#64748b';
    return `<span style="display:inline-block;min-width:26px;text-align:center;background:${c};color:#fff;font-weight:800;font-size:0.72rem;border-radius:6px;padding:2px 7px">${level}</span>`;
}

function _guideTreeBody() {
    const damages = [...new Set(DAMAGE_DECISION_TREE.map(d => d.damage))];
    const options = ['<option value="">Todos os tipos de dano</option>']
        .concat(damages.map(d => `<option value="${d}"${_guideDamageFilter === d ? ' selected' : ''}>${d}</option>`))
        .join('');
    const rows = DAMAGE_DECISION_TREE.filter(d => !_guideDamageFilter || d.damage === _guideDamageFilter);
    const cards = rows.map(d => `
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:10px;background:#fff">
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
                <div style="font-weight:700;color:#0f172a">${d.damage}</div>
                <div style="white-space:nowrap">Nível ${_guideBadge(d.level)}</div>
            </div>
            <div style="font-size:0.8rem;color:#475569;margin:4px 0 8px">Zona: <b>${d.zone}</b> · Severidade: <b>${d.severity}</b></div>
            <div style="font-size:0.86rem;color:#0f172a;margin-bottom:6px"><b>Método:</b> ${d.method}</div>
            <div style="display:grid;grid-template-columns:1fr;gap:3px;font-size:0.8rem;color:#475569">
                <div><b>Kit/Materiais:</b> ${d.kit}</div>
                <div><b>Critério de aceite:</b> ${d.accept}</div>
                <div><b>Doc. referência:</b> ${d.ref}</div>
                ${d.notes ? `<div style="color:#b45309"><b>Nota:</b> ${d.notes}</div>` : ''}
            </div>
        </div>`).join('');
    return `
        <div style="margin-bottom:12px">
            <select onchange="guideSetDamage(this.value)" style="width:100%;padding:9px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.9rem">${options}</select>
        </div>
        ${cards}
        <div style="font-size:0.72rem;color:#94a3b8;margin-top:8px">Níveis: C cosmético · B intermediário · A avançado · A+ avançado c/ supervisão · ⛔ não reparável (reportar). Ref: 945550 V14 + CIM4271.</div>`;
}

function _guideSubsBody() {
    const fib = FIBER_SUBSTITUTIONS.map(s => `
        <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #eef2f7;font-weight:600">${s.original}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #eef2f7;color:#0369a1">${s.alternative}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #eef2f7;font-size:0.8rem;color:#64748b">${s.notes}</td>
        </tr>`).join('');
    const core = CORE_SUBSTITUTIONS.map(s => `
        <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #eef2f7;font-weight:600">${s.original}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #eef2f7;color:#0369a1">${s.alternative}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #eef2f7;font-size:0.8rem;color:#64748b">${s.notes}</td>
        </tr>`).join('');
    const table = (title, sub, body) => `
        <div style="font-weight:700;color:#0f172a;margin:6px 0 4px">${title}</div>
        <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:8px">${sub}</div>
        <div style="overflow-x:auto;border:1px solid #e2e8f0;border-radius:10px;background:#fff;margin-bottom:18px">
            <table style="width:100%;border-collapse:collapse;font-size:0.86rem">
                <thead><tr style="background:#f1f5f9">
                    <th style="padding:8px 10px;text-align:left">Original</th>
                    <th style="padding:8px 10px;text-align:left">Alternativa aprovada</th>
                    <th style="padding:8px 10px;text-align:left">Observações</th>
                </tr></thead>
                <tbody>${body}</tbody>
            </table>
        </div>`;
    return table('Substituição de fibras', '945550 §9 Table 9.1', fib) +
           table('Substituição de core', '945556 V12', core);
}

function _guideRulesBody() {
    return `<div style="border:1px solid #e2e8f0;border-radius:10px;background:#fff;overflow:hidden">` +
        FIELD_RULES.map((r, i) => `
        <div style="display:flex;gap:10px;padding:10px 12px;${i ? 'border-top:1px solid #eef2f7' : ''}">
            <div style="flex:0 0 26px;height:26px;border-radius:50%;background:#143a5f;color:#fff;font-weight:700;font-size:0.78rem;display:flex;align-items:center;justify-content:center">${r.n}</div>
            <div style="flex:1">
                <div style="font-weight:700;color:#0f172a;font-size:0.88rem">${r.rule}</div>
                <div style="font-size:0.82rem;color:#475569;margin-top:2px">${r.detail}</div>
                <div style="font-size:0.76rem;color:#b91c1c;margin-top:2px">Se não cumprir: ${r.consequence}</div>
            </div>
        </div>`).join('') + `</div>`;
}

function renderRepairGuide() {
    const host = document.getElementById('repair-guide-modal');
    if (!host) return;
    const tabs = [
        { key: 'tree',  label: 'Árvore de decisão' },
        { key: 'subs',  label: 'Substituições' },
        { key: 'rules', label: 'Regras de campo' },
    ];
    const tabBtns = tabs.map(t => `
        <button onclick="guideTab('${t.key}')" style="flex:1;padding:9px 6px;border:none;cursor:pointer;font-size:0.82rem;font-weight:700;
            background:${_guideTab === t.key ? '#143a5f' : '#e2e8f0'};color:${_guideTab === t.key ? '#fff' : '#475569'};
            border-radius:8px">${t.label}</button>`).join('');
    const body = _guideTab === 'tree' ? _guideTreeBody()
               : _guideTab === 'subs' ? _guideSubsBody()
               : _guideRulesBody();
    host.innerHTML = `
        <div style="background:#f8fafc;max-width:720px;width:100%;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.3);margin:auto 0">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#143a5f;color:#fff;border-radius:14px 14px 0 0;position:sticky;top:0">
                <div style="font-weight:800;font-size:1rem"><i class="bi bi-clipboard2-pulse"></i> Guia de Reparo</div>
                <button onclick="closeRepairGuide()" aria-label="Fechar" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:1rem">✕</button>
            </div>
            <div style="padding:14px 16px">
                <div style="display:flex;gap:8px;margin-bottom:14px">${tabBtns}</div>
                ${body}
            </div>
        </div>`;
}
