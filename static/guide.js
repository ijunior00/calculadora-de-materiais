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
let _guideRepairQuery = '';
let _guideRepairOpen = '';
let _guideRepairCat = 'all';
let _repairsLoading = false;
let _guideProfileKey = '';

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

// ── Repairs (SST manual) — lazy-loaded, searchable ──────────────────────────
function _ensureRepairsLoaded() {
    if (typeof window.REPAIRS_DB !== 'undefined' || _repairsLoading) return;
    _repairsLoading = true;
    const s = document.createElement('script');
    s.src = 'static/repairs_data.js';
    s.onload = () => { _repairsLoading = false; if (_guideTab === 'repairs') renderRepairGuide(); };
    s.onerror = () => { _repairsLoading = false; };
    document.body.appendChild(s);
}

function _repairBadge(cl) {
    const c = /adv/i.test(cl) ? '#f59e0b' : /basic/i.test(cl) ? '#16a34a' : '#64748b';
    return cl ? `<span style="background:${c};color:#fff;font-weight:700;font-size:0.68rem;border-radius:6px;padding:2px 7px">${cl}</span>` : '';
}

function _guideRepairsBody() {
    if (typeof window.REPAIRS_DB === 'undefined') {
        _ensureRepairsLoaded();
        return `<div style="padding:24px;text-align:center;color:#64748b">Carregando manual de reparos…</div>`;
    }
    const chip = (key, label) => `<button onclick="guideRepairCat('${key}')" style="padding:5px 12px;border-radius:16px;border:1px solid ${_guideRepairCat===key?'#143a5f':'#cbd5e1'};background:${_guideRepairCat===key?'#143a5f':'#fff'};color:${_guideRepairCat===key?'#fff':'#475569'};font-size:0.76rem;font-weight:700;cursor:pointer">${label}</button>`;
    return `
        <input id="guide-repair-input" type="text" value="${_guideRepairQuery.replace(/"/g,'&quot;')}"
            placeholder="Search: code, name or keyword (e.g. upstand, void, TE, 6.4.3)…"
            oninput="guideRepairSearch(this.value)"
            style="width:100%;padding:10px 12px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.9rem;margin-bottom:10px">
        <div style="display:flex;gap:6px;margin-bottom:12px">${chip('all','Todos')}${chip('Reparo','Reparos')}${chip('Guideline','Guidelines')}</div>
        <div id="guide-repair-results"></div>`;
}

function _renderRepairResults() {
    const box = document.getElementById('guide-repair-results');
    if (!box || typeof window.REPAIRS_DB === 'undefined') return;
    const q = _guideRepairQuery.trim().toLowerCase();
    let list = window.REPAIRS_DB;
    if (_guideRepairCat !== 'all') list = list.filter(r => r.category === _guideRepairCat);
    if (q) {
        const terms = q.split(/\s+/);
        list = list.filter(r => {
            const hay = (r.code + ' ' + r.title + ' ' + r.body).toLowerCase();
            return terms.every(t => hay.includes(t));
        });
    }
    const total = window.REPAIRS_DB.length;
    const shown = list.slice(0, 60);
    if (list.length === 0) {
        box.innerHTML = `<div style="padding:18px;text-align:center;color:#94a3b8">Nenhum reparo encontrado para “${_guideRepairQuery}”.</div>`;
        return;
    }
    const head = `<div style="font-size:0.75rem;color:#94a3b8;margin-bottom:8px">${list.length} of ${total} repairs${list.length > 60 ? ' (showing 60 — refine the search)' : ''}</div>`;
    box.innerHTML = head + shown.map(r => {
        const open = _guideRepairOpen === r.code;
        const bodyHtml = open
            ? `<pre style="white-space:pre-wrap;font-family:inherit;font-size:0.82rem;color:#334155;margin:8px 0 0;padding:10px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0">${r.body.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))}</pre>`
            : `<div style="font-size:0.8rem;color:#64748b;margin-top:3px">${r.summary.replace(/[<>]/g,'')}</div>`;
        return `
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:11px 13px;margin-bottom:8px;background:#fff">
            <div onclick="guideRepairToggle('${r.code}')" style="cursor:pointer;display:flex;justify-content:space-between;gap:10px;align-items:flex-start">
                <div><span style="font-weight:800;color:#143a5f">${r.code}</span> <span style="font-weight:600">${r.title}</span>${r.category === 'Guideline' ? ' <span style="font-size:0.64rem;font-weight:700;color:#7c3aed;background:#ede9fe;border-radius:5px;padding:1px 6px;vertical-align:middle">GUIDELINE</span>' : ''}</div>
                <div style="display:flex;gap:6px;align-items:center;white-space:nowrap">${_repairBadge(r.classification)}<i class="bi bi-chevron-${open ? 'up' : 'down'}" style="color:#94a3b8"></i></div>
            </div>
            ${bodyHtml}
        </div>`;
    }).join('');
}

function guideRepairSearch(v) { _guideRepairQuery = v; _guideRepairOpen = ''; _renderRepairResults(); }
function guideRepairToggle(code) { _guideRepairOpen = (_guideRepairOpen === code ? '' : code); _renderRepairResults(); }
function guideRepairCat(c) { _guideRepairCat = c; _guideRepairOpen = ''; renderRepairGuide(); }

// ── Layup profile by radius (CIM4271) ───────────────────────────────────────
const PROFILE_COLORS = ['#2563eb', '#f59e0b', '#16a34a', '#dc2626', '#7c3aed'];

function _guideProfileBody() {
    if (typeof window.CIM_PROFILES === 'undefined') {
        return `<div style="padding:20px;text-align:center;color:#94a3b8">Profile data unavailable.</div>`;
    }
    const keys = Object.keys(window.CIM_PROFILES);
    if (!_guideProfileKey || !window.CIM_PROFILES[_guideProfileKey]) _guideProfileKey = keys[0];
    const sel = `<select onchange="guideProfileSelect(this.value)" style="width:100%;padding:9px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.9rem;margin-bottom:12px">` +
        keys.map(k => `<option value="${k}"${k === _guideProfileKey ? ' selected' : ''}>${k.trim()}</option>`).join('') + `</select>`;
    return sel + `<div>${_profileChartSVG(window.CIM_PROFILES[_guideProfileKey])}</div>
        <div style="font-size:0.72rem;color:#94a3b8;margin-top:8px">Ply count × blade radius. Source: CIM4271 Preform Repair calculator v2.0.</div>`;
}
function guideProfileSelect(k) { _guideProfileKey = k; renderRepairGuide(); }

function _profileChartSVG(profile) {
    const W = 640, H = 300, L = 40, B = 34, T = 12, R = 12;
    const pts = profile.points, series = profile.series;
    const rs = pts.map(p => p.r);
    const xMin = Math.min(...rs), xMax = Math.max(...rs);
    let yMax = 0;
    pts.forEach(p => series.forEach(s => { if (typeof p[s] === 'number') yMax = Math.max(yMax, p[s]); }));
    yMax = Math.ceil((yMax || 1) / 5) * 5;
    const xSpan = (xMax - xMin) || 1;
    const px = r => L + (r - xMin) / xSpan * (W - L - R);
    const py = v => H - B - (v / yMax) * (H - B - T);
    let svg = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;background:#fff;border:1px solid #e2e8f0;border-radius:8px" xmlns="http://www.w3.org/2000/svg">`;
    // y gridlines + labels
    for (let g = 0; g <= 5; g++) {
        const v = yMax * g / 5, y = py(v);
        svg += `<line x1="${L}" y1="${y.toFixed(1)}" x2="${W - R}" y2="${y.toFixed(1)}" stroke="#eef2f7"/>`;
        svg += `<text x="${L - 5}" y="${(y + 3).toFixed(1)}" font-size="9" fill="#94a3b8" text-anchor="end" font-family="Inter">${v}</text>`;
    }
    // x ticks — ~6 evenly spaced, radius in metres (1 decimal)
    const nTicks = 6;
    for (let i = 0; i <= nTicks; i++) {
        const r = xMin + (xMax - xMin) * i / nTicks, x = px(r);
        svg += `<line x1="${x.toFixed(1)}" y1="${H - B}" x2="${x.toFixed(1)}" y2="${H - B + 3}" stroke="#cbd5e1"/>`;
        svg += `<text x="${x.toFixed(1)}" y="${H - B + 14}" font-size="8.5" fill="#94a3b8" text-anchor="middle" font-family="Inter">${(r / 1000).toFixed(1)}</text>`;
    }
    svg += `<text x="${(L + W - R) / 2}" y="${H - 4}" font-size="9.5" fill="#64748b" text-anchor="middle" font-family="Inter">Raio (m) →</text>`;
    svg += `<text x="12" y="${(H) / 2}" font-size="9.5" fill="#64748b" text-anchor="middle" font-family="Inter" transform="rotate(-90 12 ${H / 2})">Ply count ↑</text>`;
    // series lines
    series.forEach((s, si) => {
        const color = PROFILE_COLORS[si % PROFILE_COLORS.length];
        const line = pts.filter(p => typeof p[s] === 'number').map(p => `${px(p.r).toFixed(1)},${py(p[s]).toFixed(1)}`).join(' ');
        svg += `<polyline points="${line}" fill="none" stroke="${color}" stroke-width="2"/>`;
        pts.forEach(p => { if (typeof p[s] === 'number') svg += `<circle cx="${px(p.r).toFixed(1)}" cy="${py(p[s]).toFixed(1)}" r="2.4" fill="${color}"/>`; });
    });
    svg += `</svg>`;
    // legend
    const legend = `<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:8px">` +
        series.map((s, si) => `<span style="display:inline-flex;align-items:center;gap:5px;font-size:0.76rem;color:#334155"><span style="width:11px;height:11px;border-radius:3px;background:${PROFILE_COLORS[si % PROFILE_COLORS.length]}"></span>${s}</span>`).join('') + `</div>`;
    return svg + legend;
}
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
                <div style="white-space:nowrap">Level ${_guideBadge(d.level)}</div>
            </div>
            <div style="font-size:0.8rem;color:#475569;margin:4px 0 8px">Zona: <b>${d.zone}</b> · Severidade: <b>${d.severity}</b></div>
            <div style="font-size:0.86rem;color:#0f172a;margin-bottom:6px"><b>Method:</b> ${d.method}</div>
            <div style="display:grid;grid-template-columns:1fr;gap:3px;font-size:0.8rem;color:#475569">
                <div><b>Kit/Materiais:</b> ${d.kit}</div>
                <div><b>Acceptance criteria:</b> ${d.accept}</div>
                <div><b>Reference doc:</b> ${d.ref}</div>
                ${d.notes ? `<div style="color:#b45309"><b>Nota:</b> ${d.notes}</div>` : ''}
            </div>
        </div>`).join('');
    return `
        <div style="margin-bottom:12px">
            <select onchange="guideSetDamage(this.value)" style="width:100%;padding:9px 10px;border:1px solid #cbd5e1;border-radius:8px;font-size:0.9rem">${options}</select>
        </div>
        ${cards}
        <div style="font-size:0.72rem;color:#94a3b8;margin-top:8px">Levels: C cosmetic · B intermediate · A advanced · A+ advanced w/ supervision · ⛔ not repairable (report). Ref: 945550 V14 + CIM4271.</div>`;
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
                    <th style="padding:8px 10px;text-align:left">Notes</th>
                </tr></thead>
                <tbody>${body}</tbody>
            </table>
        </div>`;
    return table('Fibre substitution', '945550 §9 Table 9.1', fib) +
           table('Core substitution', '945556 V12', core);
}

function _guideRulesBody() {
    return `<div style="border:1px solid #e2e8f0;border-radius:10px;background:#fff;overflow:hidden">` +
        FIELD_RULES.map((r, i) => `
        <div style="display:flex;gap:10px;padding:10px 12px;${i ? 'border-top:1px solid #eef2f7' : ''}">
            <div style="flex:0 0 26px;height:26px;border-radius:50%;background:#143a5f;color:#fff;font-weight:700;font-size:0.78rem;display:flex;align-items:center;justify-content:center">${r.n}</div>
            <div style="flex:1">
                <div style="font-weight:700;color:#0f172a;font-size:0.88rem">${r.rule}</div>
                <div style="font-size:0.82rem;color:#475569;margin-top:2px">${r.detail}</div>
                <div style="font-size:0.76rem;color:#b91c1c;margin-top:2px">If not followed: ${r.consequence}</div>
            </div>
        </div>`).join('') + `</div>`;
}

function renderRepairGuide() {
    const host = document.getElementById('repair-guide-modal');
    if (!host) return;
    const tabs = [
        { key: 'tree',    label: 'Decision tree' },
        { key: 'repairs', label: 'Reparos (SST)' },
        { key: 'profile', label: 'Perfil por raio' },
        { key: 'subs',    label: 'Substitutions' },
        { key: 'rules',   label: 'Field rules' },
    ];
    const tabBtns = tabs.map(t => `
        <button onclick="guideTab('${t.key}')" style="flex:1;padding:9px 6px;border:none;cursor:pointer;font-size:0.82rem;font-weight:700;
            background:${_guideTab === t.key ? '#143a5f' : '#e2e8f0'};color:${_guideTab === t.key ? '#fff' : '#475569'};
            border-radius:8px">${t.label}</button>`).join('');
    const body = _guideTab === 'tree'    ? _guideTreeBody()
               : _guideTab === 'repairs' ? _guideRepairsBody()
               : _guideTab === 'profile' ? _guideProfileBody()
               : _guideTab === 'subs'    ? _guideSubsBody()
               : _guideRulesBody();
    host.innerHTML = `
        <div style="background:#f8fafc;max-width:720px;width:100%;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,0.3);margin:auto 0">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#143a5f;color:#fff;border-radius:14px 14px 0 0;position:sticky;top:0">
                <div style="font-weight:800;font-size:1rem"><i class="bi bi-clipboard2-pulse"></i> Repair Guide</div>
                <button onclick="closeRepairGuide()" aria-label="Fechar" style="background:rgba(255,255,255,0.15);border:none;color:#fff;width:32px;height:32px;border-radius:8px;cursor:pointer;font-size:1rem">✕</button>
            </div>
            <div style="padding:14px 16px">
                <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap">${tabBtns}</div>
                ${body}
            </div>
        </div>`;
    // Populate the repairs results once the DB is available.
    if (_guideTab === 'repairs' && typeof window.REPAIRS_DB !== 'undefined') _renderRepairResults();
}
