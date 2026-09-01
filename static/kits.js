// ============================================================
// KITS.JS — Reparos especiais (kit fixo por pá)
// Compartilhado por desktop (/) e mobile (/m), como guide.js.
// Lê SPECIAL_REPAIRS (data.js), mostra a lista com multiplicador
// de pás e exporta Excel/PDF pelo backend genérico já existente.
// Sem dependência dos controllers das páginas.
// ============================================================

const KITS_CAT_TO_PHASE = {
    'Kit': 'Fabrics',
    'Chemicals': 'Chemicals',
    'Consumable tools': 'Consumable Tools',
    'Consumables': 'Consumables',
    'Tools': 'Tools',
    'PPE': 'Consumable Protection Equipment',
};
const KITS_CAT_ORDER = ['Kit', 'Chemicals', 'Consumable tools', 'Consumables', 'Tools', 'PPE'];

const KITS = { repair: null, variant: null, blades: 1, radius: '' };

function openSpecialKits() {
    if (typeof SPECIAL_REPAIRS === 'undefined' || !SPECIAL_REPAIRS.length) return;
    KITS.repair = KITS.repair || SPECIAL_REPAIRS[0].id;
    let ov = document.getElementById('kits-overlay');
    if (!ov) {
        ov = document.createElement('div');
        ov.id = 'kits-overlay';
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:9000;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:18px 10px';
        ov.onclick = (e) => { if (e.target === ov) closeSpecialKits(); };
        document.body.appendChild(ov);
    }
    renderKitsPanel();
    ov.style.display = 'flex';
}
function closeSpecialKits() {
    const ov = document.getElementById('kits-overlay');
    if (ov) ov.style.display = 'none';
}
function kitsCurrent() {
    const rep = SPECIAL_REPAIRS.find(r => r.id === KITS.repair) || SPECIAL_REPAIRS[0];
    const variant = rep.variants.find(v => v.id === KITS.variant) || rep.variants[0];
    return { rep, variant };
}
// Kit + itens, com o multiplicador aplicado (ferramentas não multiplicam).
// Com raio(s) informado(s) numa variante que tem tabela de posições, as peças
// encontradas SUBSTITUEM a linha do kit inteiro (pedido por posição); campo
// vazio mantém o comportamento original (kit completo).
function kitsRows() {
    const { rep, variant } = kitsCurrent();
    const n = Math.max(1, KITS.blades | 0);
    const rows = [];
    const sel = kitsSelectedParts(variant);
    if (sel) {
        for (const p of sel.parts) {
            rows.push({ cat: 'Kit', sap: p.part.sap, desc: `${p.part.desc} (Pos ${p.part.pos})`, unit: 'EA', qty: p.count * n });
        }
        // sel.parts vazio (todos os raios fora do span) → nenhuma linha de kit;
        // o aviso vermelho no box de raio explica, nada entra em silêncio.
    } else {
        rows.push({ cat: 'Kit', sap: variant.kit.sap, desc: variant.kit.desc, unit: variant.kit.unit, qty: variant.kit.qty * n });
    }
    for (const it of rep.items) {
        rows.push({ cat: it.cat, sap: it.sap, desc: it.desc, unit: it.unit, qty: it.perBlade === false ? it.qty : it.qty * n });
    }
    return rows;
}
function renderKitsPanel() {
    const ov = document.getElementById('kits-overlay');
    const { rep, variant } = kitsCurrent();
    const esc = (t) => String(t).replace(/</g, '&lt;');
    const repOpts = SPECIAL_REPAIRS.map(r => `<option value="${r.id}"${r.id === rep.id ? ' selected' : ''}>${esc(r.label)}</option>`).join('');
    const varOpts = rep.variants.map(v => `<option value="${v.id}"${v.id === variant.id ? ' selected' : ''}>${esc(v.label)}</option>`).join('');
    const rows = kitsRows();
    let lastCat = null;
    const body = rows.map(r => {
        const catRow = r.cat !== lastCat ? `<tr><td colspan="4" style="background:#eef2f7;font-weight:700;padding:6px 8px">${esc(r.cat)}</td></tr>` : '';
        lastCat = r.cat;
        return catRow + `<tr>
            <td style="padding:5px 8px;white-space:nowrap">${esc(r.sap)}</td>
            <td style="padding:5px 8px">${esc(r.desc)}</td>
            <td style="padding:5px 8px;text-align:center">${r.qty}</td>
            <td style="padding:5px 8px;text-align:center">${esc(r.unit)}</td>
        </tr>`;
    }).join('');
    ov.innerHTML = `
    <div style="background:#fff;border-radius:14px;max-width:760px;width:100%;box-shadow:0 18px 50px rgba(0,0,0,0.3);overflow:hidden" onclick="event.stopPropagation()">
        <div style="background:#143A5F;color:#fff;padding:14px 18px;display:flex;justify-content:space-between;align-items:center">
            <div>
                <div style="font-weight:800;font-size:1rem">Special repairs — fixed kit per blade</div>
                <div style="font-size:0.74rem;opacity:0.8">Source: work instruction ${esc(variant.doc || rep.doc)}</div>
            </div>
            <button onclick="closeSpecialKits()" style="background:none;border:none;color:#fff;font-size:1.4rem;cursor:pointer">×</button>
        </div>
        <div style="padding:14px 18px;display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
            <label style="font-size:0.78rem;font-weight:600">Repair<br>
                <select onchange="kitsSetRepair(this.value)" style="padding:7px;border:1px solid #cbd5e1;border-radius:8px;min-width:210px">${repOpts}</select></label>
            <label style="font-size:0.78rem;font-weight:600">Variant / kit<br>
                <select onchange="kitsSetVariant(this.value)" style="padding:7px;border:1px solid #cbd5e1;border-radius:8px;min-width:150px">${varOpts}</select></label>
            <label style="font-size:0.78rem;font-weight:600">No. of blades<br>
                <input type="number" min="1" max="999" value="${Math.max(1, KITS.blades | 0)}" onchange="kitsSetBlades(this.value)"
                    style="padding:7px;border:1px solid #cbd5e1;border-radius:8px;width:80px;text-align:center"></label>
            <div style="flex:1"></div>
            <button onclick="exportSpecialKit('excel')" style="padding:9px 14px;border:none;border-radius:8px;background:#16a34a;color:#fff;font-weight:700;cursor:pointer">Excel</button>
            <button onclick="exportSpecialKit('pdf')" style="padding:9px 14px;border:none;border-radius:8px;background:#143A5F;color:#fff;font-weight:700;cursor:pointer">PDF</button>
        </div>
        ${rep.note ? `<div style="font-size:0.72rem;color:#92400e;background:#fef3c7;margin:0 18px 8px;padding:7px 10px;border-radius:8px">${esc(rep.note)}</div>` : ''}
        ${kitsRadiusBox(variant)}
        <div style="font-size:0.72rem;color:#64748b;padding:0 18px 8px">Consumables and PPE multiply by the number of blades; tools are reusable and stay fixed.</div>
        <div style="max-height:52vh;overflow:auto;border-top:1px solid #e2e8f0">
            <table style="border-collapse:collapse;width:100%;font-size:0.78rem">
                <thead><tr style="background:#f8fafc;text-align:left">
                    <th style="padding:6px 8px">SAP</th><th style="padding:6px 8px">Description</th>
                    <th style="padding:6px 8px;text-align:center">Qty</th><th style="padding:6px 8px;text-align:center">Unit</th>
                </tr></thead>
                <tbody>${body}</tbody>
            </table>
        </div>
    </div>`;
}
// Trocar reparo/variante limpa o raio: cada modelo tem tabela própria e um raio
// herdado poderia casar peça errada em silêncio.
function kitsSetRepair(id) { KITS.repair = id; KITS.variant = null; KITS.radius = ''; renderKitsPanel(); }
function kitsSetVariant(id) { KITS.variant = id; KITS.radius = ''; renderKitsPanel(); }
function kitsSetBlades(v) { KITS.blades = Math.max(1, Math.min(999, parseInt(v) || 1)); renderKitsPanel(); }

async function exportSpecialKit(kind) {
    const { rep, variant } = kitsCurrent();
    const n = Math.max(1, KITS.blades | 0);
    const sel = kitsSelectedParts(variant);
    const radiiTxt = sel ? ` — radius ${sel.parts.flatMap(p => p.radii).map(mm => (mm/1000).toFixed(2)).join(' / ')} m (parts by position, not full kit)` : '';
    const items = kitsRows().map(r => ({
        sap: r.sap, desc: r.desc, qty: r.qty, unit: r.unit,
        phase: KITS_CAT_TO_PHASE[r.cat] || 'Other', material: null, cost_brl: 0,
    }));
    // Reparo de kit fixo: sem geometria de dano — os campos numéricos vão 0.
    const payload = {
        turbine_model: variant.label, blade_type: '', damage_cat: rep.label, blade_zone: '-',
        rstart: 0, rend: 0, length: 0, width: 0, days: 1,
        report_title: `${rep.label} — ${variant.label} — ${n} blade(s) — WI ${rep.doc}`,
        include_field_rules: false, total_brl: 0, total_eur: 0,
        blade_sn: '', service_order: '', cir_number: '',
        damage_description: `Fixed kit (work instruction ${rep.doc}) × ${n} blade(s)${radiiTxt}`,
        chord_ref: 'LE', x1: 0, items,
    };
    const endpoint = kind === 'pdf' ? '/api/generate-pdf' : '/api/generate-excel';
    try {
        const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${rep.id.toUpperCase()}_${variant.id}_x${n}.${kind === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a); a.click(); a.remove();
    } catch (e) {
        alert('Export failed: ' + e.message);
    }
}


// ── Busca de peça por raio (serration) ──────────────────────────────────────
// Aceita metros ou mm: valor < 100 é tratado como metros (ex.: 50.5 → 50500).
function kitsParseRadius(v) {
    const n = parseFloat(String(v).replace(',', '.'));
    if (!(n > 0)) return null;
    return n < 100 ? Math.round(n * 1000) : Math.round(n);
}
// Vários raios separados por vírgula/ponto-e-vírgula/espaço → { mms, bad }.
// Cuidado: "50,5" sozinho é decimal com vírgula (kitsParseRadius troca , por .),
// mas numa lista "50.5, 57.2" a vírgula é separador — dividimos primeiro e cada
// token ainda aceita vírgula decimal ("50,5 57,2" também funciona via espaço).
function kitsParseRadiiList(v) {
    const s = String(v || '').trim();
    const out = { mms: [], bad: [] };
    if (!s) return out;
    // "50,5" (uma vírgula, sem outro separador) → decimal, não lista
    const toks = /^\d+,\d+$/.test(s) ? [s] : s.split(/[;,\s]+/).filter(t => t !== '');
    for (const t of toks) {
        const mm = kitsParseRadius(t);
        if (mm) out.mms.push(mm); else out.bad.push(t);
    }
    return out;
}
// Peças que substituem o kit na lista. null = sem tabela ou campo vazio/ilegível
// (mantém o kit inteiro); objeto = modo por posição (mesmo com parts vazio).
function kitsSelectedParts(variant) {
    if (typeof SERRATION_POSITIONS === 'undefined' || !SERRATION_POSITIONS[variant.id]) return null;
    const parsed = kitsParseRadiiList(KITS.radius);
    if (!parsed.mms.length) return null;
    const agg = serrationPartsForRadii(variant.id, parsed.mms);
    agg.bad = parsed.bad;
    return agg;
}
function kitsRadiusBox(variant) {
    if (typeof SERRATION_POSITIONS === 'undefined' || !SERRATION_POSITIONS[variant.id]) return '';
    const t = SERRATION_POSITIONS[variant.id];
    const sel = kitsSelectedParts(variant);
    let result = '';
    if (sel) {
        result = sel.parts.map(p => {
            const h = p.part;
            return `
                <div style="margin-top:6px;padding:8px 10px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;font-size:0.8rem">
                    <b>Pos ${h.pos} — ${h.desc}</b> — <b>qty ${p.count}</b> (R ${p.radii.map(mm => (mm/1000).toFixed(2)).join(' / ')} m)<br>
                    Item no: <b>${h.sap}</b> · ${h.kg} kg/pc · ${h.pcs} pcs/blade total<br>
                    <span style="color:#64748b">range${h.ranges.length>1?'s':''}: ${h.ranges.map(([a,b])=>`${a}–${b}`).join(' and ')} mm · ${t.tipR - Math.max(...p.radii)}–${t.tipR - Math.min(...p.radii)} mm from TIP</span>
                </div>`;
        }).join('');
        if (sel.unmatched.length) {
            const span = t.parts.flatMap(p => p.ranges.flat());
            result += `<div style="margin-top:6px;color:#b91c1c;font-size:0.78rem">R ${sel.unmatched.map(mm=>(mm/1000).toFixed(2)).join(', ')} m outside the serration span (${(Math.min(...span)/1000).toFixed(0)}–${(Math.max(...span)/1000).toFixed(1)} m) — not added to the list.</div>`;
        }
        if (sel.ambiguous.length) {
            result += `<div style="margin-top:4px;font-size:0.72rem;color:#92400e">R ${sel.ambiguous.map(mm=>(mm/1000).toFixed(2)).join(', ')} m ${sel.ambiguous.length>1?'are':'is'} exactly on a range boundary — both adjacent parts were added; remove the one that does not apply.</div>`;
        }
        if (sel.bad.length) {
            result += `<div style="margin-top:4px;font-size:0.72rem;color:#b91c1c">Could not read: ${sel.bad.map(b=>String(b).replace(/</g,'&lt;')).join(', ')}</div>`;
        }
        if (sel.parts.length) {
            result += `<div style="margin-top:6px;font-size:0.72rem;color:#166534;font-weight:600">These parts REPLACE the full kit in the list below. Clear the field to order the full kit.</div>`;
        }
    }
    return `
        <div style="margin:0 18px 8px;padding:10px;background:#f1f5f9;border-radius:10px">
            <label style="font-size:0.78rem;font-weight:600">Find serration part by radius
                <input type="text" inputmode="decimal" value="${String(KITS.radius).replace(/"/g,'')}" placeholder="e.g. 50.5, 57.2 — empty = full kit"
                    oninput="kitsSetRadius(this.value)"
                    style="margin-left:8px;padding:7px 9px;border:1px solid #cbd5e1;border-radius:8px;width:190px">
            </label>
            <span style="font-size:0.7rem;color:#94a3b8;margin-left:6px">Source: ${t.source}</span>
            <div style="font-size:0.7rem;color:#64748b;margin-top:4px">Enter one or more radii (comma-separated) to order individual parts instead of the full kit; leave empty for the full kit.</div>
            ${result}
        </div>`;
}
function kitsSetRadius(v) {
    KITS.radius = v;
    // atualiza só o bloco de resultado re-renderizando o painel, preservando o foco
    const inp = document.activeElement;
    const pos = inp && inp.selectionStart;
    renderKitsPanel();
    const again = document.querySelector('#kits-overlay input[inputmode="decimal"]');
    if (again) { again.focus(); if (pos != null) try { again.setSelectionRange(pos, pos); } catch (e) {} }
}
