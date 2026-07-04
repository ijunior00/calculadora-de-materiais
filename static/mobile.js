// ============================================================
// MOBILE.JS — Simplified mobile controller for BRMP
// Reuses engine.js + data.js (the single source of truth that
// mirrors the REV05 Excel). This file ONLY collects inputs in a
// mobile-friendly way and renders results — it never re-implements
// any calculation formula.
// ============================================================

const M = {
    step: 1,
    maxStepReached: 1,
    blade: '',
    region: 'Middle',
    length: null,     // mm  (spanwise, = |rend - rstart|)
    width: null,      // mm  (chordwise, = |x2 - x1|)
    days: 5,
    isExternal: false, // internal repair by default; external adds a painting day
    estimatedDays: null,
    so: '',
    cir: '',
    title: '',
    docRef: null,     // selected BLADE_DOCUMENT_REFERENCES entry (optional)
    layers: [],       // [{ layerName, materialType, gsm }]
    steps: {          // sensible defaults mirroring desktop
        Cleaning: 0, Grinding: 1, Bonding: 1, Lamination: 0,
        HLU: 1, Infusion: 1, Weighing: 0, Painting: 1, LEP: 0,
    },
    lastBOM: null,
    editedBOM: null,
    editMode: false,
};

// Steps that commonly need a quantity > 1 (show a stepper when ON).
const QTY_STEPS = ['Lamination', 'HLU', 'Infusion', 'Weighing', 'Bonding', 'Painting', 'LEP', 'Cleaning', 'Grinding'];
const STEP_LABELS = {
    Cleaning: 'Cleaning', Grinding: 'Grinding', Bonding: 'Bonding',
    Lamination: 'Lamination', HLU: 'HLU', Infusion: 'Infusion',
    Weighing: 'Weighing', Painting: 'Painting', LEP: 'LEP',
};
const STEP_ORDER = ['Cleaning', 'Grinding', 'Bonding', 'Lamination', 'HLU', 'Infusion', 'Weighing', 'Painting', 'LEP'];
const STEP_LABEL_NAMES = ['Damage', 'Layers', 'Repair steps', 'Bill of materials'];

// ============================================================
// NAVIGATION
// ============================================================
function startApp() {
    document.getElementById('m-landing').classList.add('hidden');
    document.getElementById('m-app').classList.remove('hidden');
    goStep(1);
}

function goHome() {
    if (confirm('Return to start? All entered data will be cleared.')) {
        location.reload();
    }
}

function goStep(n) {
    // Forward-validation gates
    if (n >= 2 && !validateStep1(true)) return;
    if (n >= 3 && M.layers.length === 0) { toast('Add at least one layer first.', 'err'); return; }
    if (n >= 4) { if (!doCalculate()) return; }

    M.step = n;
    M.maxStepReached = Math.max(M.maxStepReached, n);

    ['s1', 's2', 's3', 's4'].forEach((id, i) => {
        document.getElementById(id).classList.toggle('hidden', (i + 1) !== n);
    });
    renderProgress();
    renderActionBar();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (n === 2) renderLayers();
    if (n === 3) renderSteps();
    if (n === 4) { renderResults(); updateEditButtons(); }
}

function renderProgress() {
    const bars = document.querySelectorAll('.m-progress-bars .pbar');
    bars.forEach((b, i) => {
        b.classList.remove('done', 'active');
        if (i + 1 < M.step) b.classList.add('done');
        else if (i + 1 === M.step) b.classList.add('active');
    });
    document.getElementById('m-step-name').textContent = STEP_LABEL_NAMES[M.step - 1];
    document.getElementById('m-step-count').textContent = `Step ${M.step} of 4`;
}

// ============================================================
// STEP 1 — DAMAGE
// ============================================================
function renderStep1() {
    // blade select
    const sel = document.getElementById('m-blade');
    sel.innerHTML = '<option value="">Select blade model…</option>' +
        BLADE_MODELS.map(m => `<option value="${m}"${M.blade === m ? ' selected' : ''}>${m}</option>`).join('');
    // region segmented
    renderRegionSeg();
    // numeric fields
    document.getElementById('m-length').value = M.length ?? '';
    document.getElementById('m-width').value = M.width ?? '';
    document.getElementById('m-days-val').textContent = M.days;
    document.getElementById('m-so').value = M.so;
    document.getElementById('m-cir').value = M.cir;
    const t = document.getElementById('m-title'); if (t) t.value = M.title;
    renderDocRefSelect();
}

function renderDocRefSelect() {
    const sel = document.getElementById('m-docref');
    if (!sel || typeof BLADE_DOCUMENT_REFERENCES === 'undefined') return;
    const cur = M.docRef ? M.docRef.version : '';
    sel.innerHTML = '<option value="">None</option>' +
        BLADE_DOCUMENT_REFERENCES.map(d => `<option value="${d.version}"${cur === d.version ? ' selected' : ''}>${d.version}</option>`).join('');
    renderDocRefDetail();
}
function onDocRefChange(version) {
    M.docRef = version ? BLADE_DOCUMENT_REFERENCES.find(d => d.version === version) || null : null;
    renderDocRefDetail();
}
function renderDocRefDetail() {
    const wrap = document.getElementById('m-docref-detail');
    if (!wrap) return;
    if (!M.docRef) { wrap.innerHTML = ''; return; }
    const d = M.docRef;
    const rowsDef = [
        ['Blade Final', d.final], ['Blade Finish', d.finish], ['Blade Bonding', d.bonding],
        ['Blade Assembled', d.assembled], ['Shell Layup WW', d.shellWW], ['Shell Layup LW', d.shellLW], ['Web', d.web],
    ];
    wrap.innerHTML = `<div class="doc-ref-grid">` +
        rowsDef.map(([k, v]) => `<div class="dr"><span class="k">${k}</span><span class="v">${v || '—'}</span></div>`).join('') +
        `</div>`;
}

function renderRegionSeg() {
    const wrap = document.getElementById('m-region');
    wrap.innerHTML = BLADE_REGIONS.map(r =>
        `<div class="seg${M.region === r ? ' active' : ''}" onclick="setRegion('${r}')">${r}</div>`
    ).join('');
}
function setRegion(r) { M.region = r; renderRegionSeg(); }

function onBladeChange(v) {
    if (M.blade && v !== M.blade && M.layers.length) {
        // Blade changed after layers were defined → clear (materials differ per blade)
        M.layers = [];
        toast('Blade changed — layers reset.', 'err');
    }
    M.blade = v;
}

function changeDays(delta) {
    M.days = Math.max(1, Math.min(60, M.days + delta));
    document.getElementById('m-days-val').textContent = M.days;
}

function captureStep1() {
    M.length = parseFloat(document.getElementById('m-length').value);
    M.width = parseFloat(document.getElementById('m-width').value);
    M.so = document.getElementById('m-so').value.trim();
    M.cir = document.getElementById('m-cir').value.trim();
    const t = document.getElementById('m-title'); if (t) M.title = t.value.trim();
}

function validateStep1(showMsg) {
    captureStep1();
    if (!M.blade) { if (showMsg) toast('Select a blade model.', 'err'); return false; }
    if (!(M.length > 0)) { if (showMsg) toast('Enter a valid damage length (> 0).', 'err'); return false; }
    if (!(M.width > 0)) { if (showMsg) toast('Enter a valid damage width (> 0).', 'err'); return false; }
    return true;
}

// ============================================================
// STEP 2 — LAYERS
// ============================================================
function renderLayers() {
    const wrap = document.getElementById('m-layers-list');
    if (M.layers.length === 0) {
        wrap.innerHTML = `<div style="text-align:center;color:var(--text-faint);padding:24px 0;font-size:0.85rem">No layers yet. Tap “Add layer” to build the lamination stack.</div>`;
    } else {
        wrap.innerHTML = M.layers.map((l, i) => {
            const ov = overlapFor(l);
            const ovTxt = ov ? `overlap ${ov.span}/${ov.chord} mm` : 'no overlap data';
            const gsm = l.gsm ? `${l.gsm} g/m²` : 'panel';
            return `
            <div class="m-layer">
                <div class="l-num">${i + 1}</div>
                <div class="l-info">
                    <div class="l-name">${labelFor(l)}</div>
                    <div class="l-sub">${gsm} · ${ovTxt}</div>
                </div>
                <div class="l-actions">
                    <button class="l-act" onclick="moveLayer(${i},-1)" ${i === 0 ? 'disabled' : ''} aria-label="Move up"><i class="bi bi-chevron-up"></i></button>
                    <button class="l-act" onclick="moveLayer(${i},1)" ${i === M.layers.length - 1 ? 'disabled' : ''} aria-label="Move down"><i class="bi bi-chevron-down"></i></button>
                    <button class="l-act del" onclick="removeLayer(${i})" aria-label="Remove"><i class="bi bi-trash3"></i></button>
                </div>
            </div>`;
        }).join('');
    }
    renderRefFabrics();
}

function labelFor(l) {
    const allowed = BLADE_MATERIAL_MAP[M.blade] || [];
    const found = allowed.find(m => m.materialType === l.materialType && String(m.gsm) === String(l.gsm));
    const base = found ? found.label : (l.materialType + (l.gsm ? ' ' + l.gsm : ''));
    const alias = (typeof fabricAlias === 'function') ? fabricAlias(l.materialType, l.gsm) : '';
    return alias ? `${base} · ${alias}` : base;
}

function overlapFor(l) {
    let key;
    if (['CORE', 'SPL', 'CFM50', 'BALSA'].includes(l.materialType)) key = l.materialType;
    else key = l.materialType + (l.gsm || '');
    return STANDARD_OVERLAPS[key] || null;
}

function renderRefFabrics() {
    const wrap = document.getElementById('m-ref-fabrics');
    const refs = (typeof BLADE_REFERENCE_FABRICS !== 'undefined') && BLADE_REFERENCE_FABRICS[M.blade];
    if (!refs || refs.length === 0) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = `
        <div class="m-ref-note">
            <div class="rn-title"><i class="bi bi-bookmark-check"></i> Reference only (not yet calculable — REV06)</div>
            <ul>${refs.map(f => `<li>${f.label} <span style="opacity:0.7">— SAP not assigned</span></li>`).join('')}</ul>
        </div>`;
}

function openLayerSheet() {
    if (!M.blade) { toast('Select a blade model first.', 'err'); return; }
    const allowed = BLADE_MATERIAL_MAP[M.blade] || [];
    const opts = allowed.map((m, i) => {
        const alias = (typeof fabricAlias === 'function') ? fabricAlias(m.materialType, m.gsm) : '';
        return `
        <div class="mat-opt" onclick="addLayer(${i})">
            <div>
                <div class="mo-name">${m.label}${alias ? ` <span class="mo-alias">${alias}</span>` : ''}</div>
                <div class="mo-gsm">${m.gsm ? m.gsm + ' g/m²' : 'core / panel'}</div>
            </div>
            <i class="bi bi-plus-circle" style="color:var(--vestas-blue);font-size:1.2rem"></i>
        </div>`;
    }).join('');
    const sheet = document.createElement('div');
    sheet.className = 'm-sheet-backdrop';
    sheet.id = 'm-layer-sheet';
    sheet.onclick = (e) => { if (e.target === sheet) closeLayerSheet(); };
    sheet.innerHTML = `
        <div class="m-sheet">
            <h3>Add layer — ${M.blade}</h3>
            <div class="sheet-sub">Materials filtered for this blade model (REV05).</div>
            ${opts}
            <button class="sheet-cancel" onclick="closeLayerSheet()">Cancel</button>
        </div>`;
    document.body.appendChild(sheet);
}
function closeLayerSheet() {
    const s = document.getElementById('m-layer-sheet');
    if (s) s.remove();
}
function addLayer(allowedIdx) {
    const allowed = BLADE_MATERIAL_MAP[M.blade] || [];
    const m = allowed[allowedIdx];
    if (!m) return;
    M.layers.push({ layerName: `Layer ${M.layers.length + 1}`, materialType: m.materialType, gsm: m.gsm });
    closeLayerSheet();
    renderLayers();
}
function removeLayer(i) {
    M.layers.splice(i, 1);
    M.layers.forEach((l, idx) => { l.layerName = `Layer ${idx + 1}`; });
    renderLayers();
}
function moveLayer(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= M.layers.length) return;
    [M.layers[i], M.layers[j]] = [M.layers[j], M.layers[i]];
    M.layers.forEach((l, idx) => { l.layerName = `Layer ${idx + 1}`; });
    renderLayers();
}

// ── Layup geometry override (manual per-layer R1/R2/X1/X2) ──────────────────
// Automation expands the chord symmetrically; edge-referenced (TE/LE) repairs
// need drawing-specific X1/X2. Overrides feed back into the engine so later
// layers rebuild on the corrected geometry.
function openLayupAdjustSheet() {
    const stack = M.layers.filter(l => l.materialType);
    if (stack.length === 0) { toast('Add at least one layer first.', 'err'); return; }
    if (!(M.length > 0) || !(M.width > 0)) { toast('Enter valid damage size (Step 1) first.', 'err'); return; }

    const damageData = { rstart: 0, rend: M.length, x1: 0, x2: M.width, chordRef: 'LE' };
    const rows = computeLayup(damageData, stack).layupRows.filter(r => !r.isBod);

    const rowHtml = rows.map((row, i) => {
        const ov = row.overridden || {};
        const cell = (field, val, isOv) =>
            `<input type="number" step="any" class="adj-input${isOv ? ' ov' : ''}" value="${Math.round(val)}"
                onchange="setLayupOverride(${i},'${field}',this.value)">`;
        return `
        <div class="adj-row">
            <div class="adj-name">${labelFor(stack[i])}</div>
            <div class="adj-grid">
                <label>R1${cell('ovR1', row.r1, ov.r1)}</label>
                <label>R2${cell('ovR2', row.r2, ov.r2)}</label>
                <label>X1${cell('ovX1', row.h1, ov.x1)}</label>
                <label>X2${cell('ovX2', row.h2, ov.x2)}</label>
                <div class="adj-derived">L ${Math.round(row.length)} · W ${Math.round(row.width)} mm</div>
            </div>
        </div>`;
    }).join('');

    const sheet = document.createElement('div');
    sheet.className = 'm-sheet-backdrop';
    sheet.id = 'm-adjust-sheet';
    sheet.onclick = (e) => { if (e.target === sheet) closeLayupAdjustSheet(); };
    sheet.innerHTML = `
        <div class="m-sheet" style="max-height:88vh;overflow:auto">
            <h3>Adjust layup geometry</h3>
            <div class="sheet-sub">Spanwise (R1/R2) is automatic. For edge-referenced damages, set X1/X2 from the drawing. Overrides feed the accumulation.</div>
            ${rowHtml}
            <button class="btn btn-ghost" style="margin-top:8px" onclick="resetLayupOverridesMobile()"><i class="bi bi-arrow-counterclockwise"></i> Reset overrides</button>
            <button class="sheet-cancel" onclick="closeLayupAdjustSheet()">Done</button>
        </div>`;
    document.body.appendChild(sheet);
}
function closeLayupAdjustSheet() {
    const s = document.getElementById('m-adjust-sheet');
    if (s) s.remove();
}
function setLayupOverride(stackIdx, field, value) {
    const stack = M.layers.filter(l => l.materialType);
    const layer = stack[stackIdx];
    if (!layer) return;
    layer[field] = (value === '' || value === null || isNaN(value)) ? undefined : Number(value);
    // Re-render the sheet so derived L/W and downstream rows update.
    closeLayupAdjustSheet();
    openLayupAdjustSheet();
}
function resetLayupOverridesMobile() {
    M.layers.forEach(l => { delete l.ovR1; delete l.ovR2; delete l.ovX1; delete l.ovX2; });
    closeLayupAdjustSheet();
    openLayupAdjustSheet();
    toast('Overrides reset.', 'ok');
}

// ============================================================
// STEP 3 — REPAIR STEPS
// ============================================================
function renderRepairType() {
    const wrap = document.getElementById('m-repair-type');
    if (!wrap) return;
    const types = [
        { key: false, label: 'Internal' },
        { key: true, label: 'External' },
    ];
    wrap.innerHTML = types.map(t =>
        `<div class="seg${M.isExternal === t.key ? ' active' : ''}" onclick="setRepairType(${t.key})">${t.label}</div>`
    ).join('');
}
function setRepairType(isExternal) {
    M.isExternal = isExternal;
    renderRepairType();
    updateDaysEstimate();
}

// Compute + display the estimated repair schedule (total days only).
function updateDaysEstimate() {
    const el = document.getElementById('m-days-estimate');
    if (!el) return;
    const est = computeRepairDays(M.layers.filter(l => l.materialType), M.isExternal);
    M.estimatedDays = est.totalDays;
    el.textContent = `${est.totalDays} day${est.totalDays > 1 ? 's' : ''}`;
}
// Copy the estimate into the PPE-driving "days of repair" field.
function applyEstimatedDays() {
    if (!M.estimatedDays) updateDaysEstimate();
    M.days = Math.max(1, Math.min(60, M.estimatedDays || M.days));
    const dv = document.getElementById('m-days-val');
    if (dv) dv.textContent = M.days;
    toast(`Days of repair set to ${M.days}.`, 'ok');
}

function renderSteps() {
    renderRepairType();
    updateDaysEstimate();
    const wrap = document.getElementById('m-steps-list');
    wrap.innerHTML = STEP_ORDER.map(key => {
        const qty = M.steps[key];
        const on = qty > 0;
        const stepper = on ? `
            <div class="si-stepper">
                <button class="s-btn" onclick="changeStepQty('${key}',-1)" aria-label="decrease">−</button>
                <span class="s-val">${qty}</span>
                <button class="s-btn" onclick="changeStepQty('${key}',1)" aria-label="increase">+</button>
            </div>` : '';
        return `
        <div class="m-step-item${on ? ' on' : ''}" id="step-${key}">
            <div class="si-left" onclick="toggleStep('${key}')">
                <div class="si-check">${on ? '<i class="bi bi-check-lg"></i>' : ''}</div>
                <span class="si-name">${STEP_LABELS[key]}</span>
            </div>
            ${stepper}
        </div>`;
    }).join('');
    updateVacuumInfo();
}

function toggleStep(key) {
    M.steps[key] = M.steps[key] > 0 ? 0 : 1;
    renderSteps();
}
function changeStepQty(key, delta) {
    M.steps[key] = Math.max(0, Math.min(99, (M.steps[key] || 0) + delta));
    renderSteps();
}
function updateVacuumInfo() {
    const vac = (M.steps.HLU || 0) + (M.steps.Infusion || 0);
    document.getElementById('m-vacuum-info').textContent =
        `Vacuum is calculated automatically: HLU + Infusion = ${vac}`;
}

// ============================================================
// STEP 4 — CALCULATE + RESULTS
// ============================================================
function doCalculate() {
    if (!validateStep1(true)) { goStep(1); return false; }
    if (M.layers.filter(l => l.materialType).length === 0) { toast('Add at least one layer.', 'err'); goStep(2); return false; }

    // Map simplified inputs → engine's damageData shape.
    // length = |rend - rstart| ; width = |x2 - x1|. Using 0-based origins.
    const damageData = { rstart: 0, rend: M.length, x1: 0, x2: M.width, chordRef: 'LE' };
    try {
        M.lastBOM = computeFullBOM(
            damageData,
            M.layers.filter(l => l.materialType),
            M.steps,
            M.blade,
            M.region,
            M.days
        );
    } catch (e) {
        console.error(e);
        toast('Calculation error: ' + e.message, 'err');
        return false;
    }
    M.editedBOM = null;
    M.editMode = false;
    return true;
}

const BOM_GROUPS = [
    { key: 'ppeItems', title: 'Protection Equipment (PPE)', icon: 'bi-shield-check', phase: 'Consumable Protection Equipment' },
    { key: 'chemItems', title: 'Chemicals', icon: 'bi-droplet', phase: 'Chemicals' },
    { key: 'fabricItems', title: 'Fabrics', icon: 'bi-layers', phase: 'Fabrics' },
    { key: 'consumItems', title: 'Consumables', icon: 'bi-box-seam', phase: 'Consumables' },
    { key: 'consumToolItems', title: 'Consumable Tools', icon: 'bi-wrench', phase: 'Consumable Tools' },
    { key: 'toolItems', title: 'Tools', icon: 'bi-tools', phase: 'Tools' },
];

function renderResults() {
    const bom = M.editedBOM || M.lastBOM;
    if (!bom) return;
    const s = bom.summary;

    // chips
    const est = computeRepairDays(M.layers.filter(l => l.materialType), M.isExternal);
    M.estimatedDays = est.totalDays;
    document.getElementById('m-result-chips').innerHTML = `
        <span class="m-chip primary">${M.blade}</span>
        <span class="m-chip">${M.region}</span>
        <span class="m-chip">${fmt(M.length)}×${fmt(M.width)} mm</span>
        <span class="m-chip">${M.isExternal ? 'External' : 'Internal'}</span>
        <span class="m-chip accent"><i class="bi bi-calendar-week"></i> ${est.totalDays} day${est.totalDays > 1 ? 's' : ''} estimated</span>`;

    // stats
    document.getElementById('m-result-stats').innerHTML = `
        <div class="m-stat"><div class="st-label">Total items</div><div class="st-value">${s.totalItems}</div></div>
        <div class="m-stat"><div class="st-label">Fabric weight</div><div class="st-value">${s.totalFabricWeight.toFixed(2)}<span class="st-unit"> kg</span></div></div>
        <div class="m-stat"><div class="st-label">Max layup</div><div class="st-value">${fmt(s.maxLayupLength)}<span class="st-unit"> ×${fmt(s.maxLayupWidth)} mm</span></div></div>
        <div class="m-stat"><div class="st-label">Max area</div><div class="st-value">${s.maxAreaM2.toFixed(2)}<span class="st-unit"> m²</span></div></div>`;

    // groups
    const wrap = document.getElementById('m-bom-groups');
    wrap.innerHTML = BOM_GROUPS.map(g => {
        const items = bom[g.key] || [];
        const rows = items.length ? items.map((it, idx) => {
            const mismatch = it.sap === 'CATALOG MISMATCH';
            const qtyCell = M.editMode
                ? `<input type="number" class="br-qty-edit" min="0" step="any" value="${it.qty}" data-group="${g.key}" data-idx="${idx}" onchange="onEditQty(this)">`
                : `<div class="br-qty">${fmtQty(it.qty)}<span class="q-unit">${it.unit || ''}</span></div>`;
            const matAlias = (it.material && typeof FABRIC_ALIASES !== 'undefined' && FABRIC_ALIASES[it.material]) ? ` (${FABRIC_ALIASES[it.material]})` : '';
            return `
            <div class="m-bom-row${mismatch ? ' mismatch' : ''}">
                <div class="br-info">
                    <div class="br-desc">${it.material ? '<strong>' + it.material + matAlias + '</strong> · ' : ''}${it.desc}</div>
                    <div class="br-sap">SAP ${it.sap || '—'}</div>
                </div>
                ${qtyCell}
            </div>`;
        }).join('') : `<div style="padding:14px;text-align:center;color:var(--text-faint);font-size:0.8rem">No items for this category.</div>`;
        return `
        <div class="m-bom-group${items.length === 0 ? ' collapsed' : ''}">
            <div class="m-bom-head" onclick="this.parentElement.classList.toggle('collapsed')">
                <div class="bh-title"><i class="bi ${g.icon}"></i> ${g.title}</div>
                <div style="display:flex;align-items:center;gap:8px">
                    <span class="bh-count">${items.length}</span>
                    <i class="bi bi-chevron-down bh-chevron"></i>
                </div>
            </div>
            <div class="m-bom-body">${rows}</div>
        </div>`;
    }).join('');
}

// Edit mode — adjust quantities before export
function onEditQty(input) {
    if (!M.editedBOM) M.editedBOM = deepCloneBOM(M.lastBOM);
    const g = input.getAttribute('data-group');
    const idx = parseInt(input.getAttribute('data-idx'));
    const val = parseFloat(input.value);
    if (M.editedBOM[g] && M.editedBOM[g][idx]) {
        M.editedBOM[g][idx].qty = isNaN(val) ? 0 : val;
    }
}
function toggleEdit() {
    if (M.editMode) {
        // turning off = keep edits (already synced via onchange)
        M.editMode = false;
    } else {
        M.editMode = true;
        if (!M.editedBOM) M.editedBOM = deepCloneBOM(M.lastBOM);
    }
    renderResults();
    updateEditButtons();
}
function resetEdits() {
    M.editedBOM = null;
    M.editMode = false;
    renderResults();
    updateEditButtons();
    toast('Quantities reset to calculated values.', 'ok');
}
function updateEditButtons() {
    const editBtn = document.getElementById('m-edit-btn');
    const resetBtn = document.getElementById('m-reset-btn');
    if (!editBtn || !resetBtn) return;
    editBtn.innerHTML = M.editMode
        ? '<i class="bi bi-check-lg"></i> Done'
        : '<i class="bi bi-pencil"></i> Edit';
    resetBtn.style.display = (M.editMode || M.editedBOM) ? 'flex' : 'none';
}
function deepCloneBOM(bom) {
    const clone = {};
    BOM_GROUPS.forEach(g => { clone[g.key] = (bom[g.key] || []).map(i => ({ ...i })); });
    clone.summary = { ...bom.summary };
    clone.layupResult = bom.layupResult ? { ...bom.layupResult } : null;
    return clone;
}

// ============================================================
// EXPORT — PDF + EXCEL
// ============================================================
function buildPayload() {
    const bom = M.editedBOM || M.lastBOM;
    const allItems = BOM_GROUPS.flatMap(g =>
        (bom[g.key] || []).map(i => ({
            sap: i.sap || '-', desc: i.desc, qty: i.qty, unit: i.unit,
            phase: g.phase, material: i.material || null, cost_brl: 0,
        }))
    );
    const lr = M.lastBOM.layupResult || {};
    return {
        turbine_model: M.blade,
        blade_type: '',
        damage_cat: 'General Shell Laminate',
        blade_zone: M.region,
        rstart: 0,
        rend: M.length,
        length: M.length,
        width: M.width,
        days: M.days,
        estimated_days: (typeof M.estimatedDays === 'number') ? M.estimatedDays : null,
        is_external: M.isExternal,
        report_title: M.title || '',
        doc_refs: M.docRef || null,
        total_brl: 0, total_eur: 0,
        blade_sn: '',
        service_order: M.so,
        cir_number: M.cir,
        damage_description: '',
        chord_ref: 'LE',
        x1: 0,
        items: allItems,
        audit_inputs: {
            repair_steps: M.steps,
            layers: M.layers.filter(l => l.materialType).map((l, idx) => ({
                order: idx + 1, layerName: l.layerName || '',
                materialType: l.materialType, gsm: l.gsm || '',
            })),
        },
        audit_outputs: {
            layup_summary: {
                maxLength: lr.maxLength, maxWidth: lr.maxWidth, maxAreaM2: lr.maxAreaM2,
                totalFabricWeightKg: lr.totalFabricWeightKg, coreAreaM2: lr.coreAreaM2,
                coreWeightKg: lr.coreWeightKg, splAreaM2: lr.splAreaM2, perimeter: lr.perimeter,
            },
            totals: M.lastBOM.summary || {},
        },
    };
}

async function exportFile(kind) {
    if (!M.lastBOM) { toast('Calculate the BOM first.', 'err'); return; }
    const btn = document.getElementById(kind === 'pdf' ? 'm-btn-pdf' : 'm-btn-excel');
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="m-spin"></span> Generating…';
    try {
        const endpoint = kind === 'pdf' ? '/api/generate-pdf' : '/api/generate-excel';
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(buildPayload()),
        });
        if (!resp.ok) throw new Error('Server returned ' + resp.status);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const so = M.so || 'UNKNOWN';
        const ext = kind === 'pdf' ? 'pdf' : 'xlsx';
        const safeTitle = (M.title || '').trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '_');
        a.download = safeTitle ? `${safeTitle}.${ext}` : `BOM_Report_${M.blade}_${so}_${dateStr}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        toast(`${kind.toUpperCase()} downloaded.`, 'ok');
    } catch (e) {
        console.error(e);
        toast('Export failed: ' + e.message, 'err');
    } finally {
        btn.disabled = false;
        btn.innerHTML = orig;
    }
}

// ============================================================
// ACTION BAR (bottom)
// ============================================================
function renderActionBar() {
    const bar = document.getElementById('m-actionbar');
    if (M.step === 1) {
        bar.innerHTML = `<button class="btn btn-primary" onclick="goStep(2)">Next: Layers <i class="bi bi-arrow-right"></i></button>`;
    } else if (M.step === 2) {
        bar.innerHTML = `
            <button class="btn btn-ghost" onclick="goStep(1)"><i class="bi bi-arrow-left"></i></button>
            <button class="btn btn-primary" onclick="goStep(3)">Next: Steps <i class="bi bi-arrow-right"></i></button>`;
    } else if (M.step === 3) {
        bar.innerHTML = `
            <button class="btn btn-ghost" onclick="goStep(2)"><i class="bi bi-arrow-left"></i></button>
            <button class="btn btn-primary" onclick="goStep(4)"><i class="bi bi-calculator"></i> Calculate BOM</button>`;
    } else if (M.step === 4) {
        bar.innerHTML = `
            <button class="btn btn-ghost" onclick="goStep(3)"><i class="bi bi-arrow-left"></i></button>
            <button class="btn btn-accent btn-half" id="m-btn-excel" onclick="exportFile('excel')"><i class="bi bi-file-earmark-spreadsheet"></i> Excel</button>
            <button class="btn btn-primary btn-half" id="m-btn-pdf" onclick="exportFile('pdf')"><i class="bi bi-file-earmark-pdf"></i> PDF</button>`;
    }
}

// ============================================================
// HELPERS
// ============================================================
function fmt(n) {
    if (n === null || n === undefined || isNaN(n)) return '--';
    return Number(n).toLocaleString();
}
function fmtQty(n) {
    if (n === null || n === undefined || isNaN(n)) return '0';
    // integers without decimals; otherwise up to 2 decimals trimmed
    return Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(2)).toString();
}
let _toastTimer = null;
function toast(msg, kind) {
    const existing = document.getElementById('m-toast');
    if (existing) existing.remove();
    const t = document.createElement('div');
    t.id = 'm-toast';
    t.className = 'm-toast' + (kind ? ' ' + kind : '');
    t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.remove(), 2800);
}

// Initialize landing/step-1 content on load
document.addEventListener('DOMContentLoaded', () => {
    renderStep1();
    renderActionBar();
});
