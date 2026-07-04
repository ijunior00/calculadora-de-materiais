// ============================================================
// APP_NEW.JS - UI controller
// ============================================================

let currentStep = 1;
let layerRows = [];
let lastBOM = null;
let currentResultTab = 'consumable_protection';
let lastEstimatedDays = null;

// Edit Mode state
let editModeActive = false;
let editModeLocked = false;
let editedBOM = null;

// Lock states
let bladeModelLocked = false;
let layerDataLocked = false;

function getUserInputs() {
    return {
        bladeModel:         document.getElementById('bladeModel').value || '',
        bladeSN:            document.getElementById('bladeSN').value || '',
        serviceOrder:       document.getElementById('serviceOrder').value || '',
        cirNumber:          document.getElementById('cirNumber').value || '',
        damageDescription:  document.getElementById('damageDescription').value || '',
    };
}

let lastDocRef = null;

function showApp() {
    document.getElementById('landing-page').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    renderOverlapRefTable();
    populateDocRefSelect();
}

// ── Drawing reference lookup (independent of the BOM blade model) ────────────
function populateDocRefSelect() {
    const sel = document.getElementById('docRefVersion');
    if (!sel || typeof BLADE_DOCUMENT_REFERENCES === 'undefined') return;
    sel.innerHTML = '<option value="">None</option>' +
        BLADE_DOCUMENT_REFERENCES.map(d => `<option value="${d.version}">${d.version}</option>`).join('');
}
function onDocRefChange(version) {
    lastDocRef = version ? BLADE_DOCUMENT_REFERENCES.find(d => d.version === version) || null : null;
    const panel = document.getElementById('docRefPanel');
    if (!panel) return;
    if (!lastDocRef) { panel.innerHTML = ''; return; }
    const d = lastDocRef;
    const rows = [
        ['Blade Final', d.final], ['Blade Finish', d.finish], ['Blade Bonding', d.bonding],
        ['Blade Assembled', d.assembled], ['Shell Layup WW', d.shellWW], ['Shell Layup LW', d.shellLW], ['Web', d.web],
    ];
    panel.innerHTML =
        `<div class="doc-ref-panel"><div class="doc-ref-title"><i class="bi bi-file-earmark-text"></i> Drawing references — <strong>${d.version}</strong></div>` +
        `<div class="doc-ref-rows">` +
        rows.map(([k, v]) => `<div class="drr"><span class="drk">${k}</span><span class="drv">${v || '—'}</span></div>`).join('') +
        `</div></div>`;
}

function resetApp() {
    if (confirm('Reset all data? This will clear all inputs.')) {
        location.reload();
    }
}

function goToStep(step) {
    // Validate locks before proceeding
    if (step > 1 && !bladeModelLocked) {
        alert('Please confirm the Blade Model selection before proceeding.');
        return;
    }
    if (step > 2 && !layerDataLocked) {
        alert('Please confirm the Layer Data before proceeding.');
        return;
    }
    // Navigation guard: warn user if they have unsaved edit-mode changes
    if (step < 4 && (editModeActive || editedBOM)) {
        if (!confirm('You have edited BOM values that will be lost if you go back. Continue?')) return;
        resetEditMode(true);
    }

    for (let i = 1; i <= 4; i++) {
        const sec = document.getElementById(`step-${i}`);
        if (sec) sec.classList.add('hidden');
    }
    const target = document.getElementById(`step-${step}`);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-step').forEach(el => {
        const s = parseInt(el.getAttribute('data-step'));
        el.classList.remove('active');
        if (s < step) el.classList.add('completed');
        if (s === step) el.classList.add('active');
    });

    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (step === 2) {
        recalculateLayup();
        updateLayupHeaders();
    }
}

// ============================================================
// BLADE MODEL CONFIRM / LOCK
// ============================================================
function confirmBladeModel() {
    const model = document.getElementById('bladeModel').value;
    if (!model) {
        alert('Please select a Blade Model first.');
        return;
    }
    bladeModelLocked = true;
    document.getElementById('bladeModel').disabled = true;
    updateBladeConfirmBanner();
    // Initialize layer table with blade-specific options
    initLayerTable();
    // Enable Next button
    updateStep1NextBtn();
}

function editBladeModel() {
    bladeModelLocked = false;
    layerDataLocked = false;
    document.getElementById('bladeModel').disabled = false;
    updateBladeConfirmBanner();
    updateLayerConfirmBanner();
    // Clear layers since model may change
    layerRows = [];
    const tbody = document.getElementById('layerTableBody');
    if (tbody) tbody.innerHTML = '';
    updateStep1NextBtn();
}

function updateBladeConfirmBanner() {
    const banner = document.getElementById('bladeConfirmBanner');
    if (!banner) return;
    const model = document.getElementById('bladeModel').value;
    if (bladeModelLocked) {
        banner.className = 'confirm-banner locked';
        banner.innerHTML = `
            <i class="bi bi-check-circle-fill"></i>
            <span class="banner-text">Blade model <strong>${model}</strong> confirmed. Material types locked to this blade.</span>
            <button class="btn-confirm edit" onclick="editBladeModel()"><i class="bi bi-pencil"></i> Edit</button>
        `;
    } else {
        banner.className = 'confirm-banner unlocked';
        banner.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span class="banner-text">Select and confirm blade model to proceed.</span>
            <button class="btn-confirm confirm" onclick="confirmBladeModel()"><i class="bi bi-check-lg"></i> Confirm</button>
        `;
    }
}

function updateStep1NextBtn() {
    const btn = document.getElementById('step1NextBtn');
    if (btn) btn.disabled = !bladeModelLocked;
}

// ============================================================
// LAYER DATA CONFIRM / LOCK
// ============================================================
function confirmLayerData() {
    if (layerRows.length === 0) {
        alert('Please add at least one layer.');
        return;
    }
    layerDataLocked = true;
    updateLayerConfirmBanner();
    renderLayerTable();
}

function editLayerData() {
    layerDataLocked = false;
    updateLayerConfirmBanner();
    renderLayerTable();
}

function updateLayerConfirmBanner() {
    const banner = document.getElementById('layerConfirmBanner');
    if (!banner) return;
    if (layerDataLocked) {
        banner.className = 'confirm-banner locked';
        banner.innerHTML = `
            <i class="bi bi-lock-fill"></i>
            <span class="banner-text">Layer data locked — <strong>${layerRows.length} layers</strong> configured. Reorder disabled.</span>
            <button class="btn-confirm edit" onclick="editLayerData()"><i class="bi bi-unlock"></i> Unlock</button>
        `;
    } else {
        banner.className = 'confirm-banner unlocked';
        banner.innerHTML = `
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span class="banner-text">Add and reorder layers, then confirm to lock before proceeding.</span>
            <button class="btn-confirm confirm" onclick="confirmLayerData()"><i class="bi bi-check-lg"></i> Confirm Layers</button>
        `;
    }
}

// ── STEP 1 ────────────────────────────────────────────────────────────
function onBladeModelChange() {
    const model = document.getElementById('bladeModel').value;
    if (!model) return;
    const rotor = parseInt(model.replace('V', ''));
    const bladeLengthMm = ((rotor - 2) / 2) * 1000;
    document.getElementById('bladeLengthLabel').textContent = (bladeLengthMm / 1000).toFixed(1) + ' m';
    onDamageDataChange();
    updateBladeConfirmBanner();
}

function getDamageData() {
    return {
        rstart:   parseFloat(document.getElementById('rstart').value)   || 0,
        rend:     parseFloat(document.getElementById('rend').value)     || 0,
        x1:       parseFloat(document.getElementById('x1').value)       || 0,
        x2:       parseFloat(document.getElementById('x2').value)       || 0,
        chordRef: document.getElementById('chordRef').value,
    };
}

function getBladeLengthMm() {
    const model = document.getElementById('bladeModel').value;
    if (!model) return 0;
    return ((parseInt(model.replace('V', '')) - 2) / 2) * 1000;
}

function onDamageDataChange() {
    const d = getDamageData();
    const length = Math.abs(d.rend - d.rstart);
    const width  = Math.abs(d.x1 - d.x2);
    document.getElementById('spanLength').textContent = length > 0 ? length.toLocaleString() : '--';
    document.getElementById('chordWidth').textContent = width  > 0 ? width.toLocaleString()  : '--';
    drawBladeSpanwise(d);
}

function drawBladeSpanwise(d) {
    const bladeLenMm = getBladeLengthMm();
    if (bladeLenMm <= 0) return;

    const g = document.getElementById('damageZoneSpan');
    g.innerHTML = '';

    // CONDIÇÃO: Só desenha se TODOS os 4 campos estiverem preenchidos na tela
    const rstartStr = document.getElementById('rstart').value;
    const rendStr = document.getElementById('rend').value;
    const x1Str = document.getElementById('x1').value;
    const x2Str = document.getElementById('x2').value;

    if (rstartStr === '' || rendStr === '' || x1Str === '' || x2Str === '') {
        return; 
    }

    if (d.rstart <= 0 || d.rend <= 0) return;

    const svgWidth = 820, svgOffset = 50;
    const bTR = 45, bBR = 115, bTT = 62, bBT = 98;

    const rMin = Math.min(d.rstart, d.rend);
    const rMax = Math.max(d.rstart, d.rend);

    const xStart = Math.max(svgOffset, Math.min(svgOffset + svgWidth, svgOffset + (rMin / bladeLenMm) * svgWidth));
    const xEnd   = Math.max(svgOffset, Math.min(svgOffset + svgWidth, svgOffset + (rMax / bladeLenMm) * svgWidth));
    const cx = (xStart + xEnd) / 2;

    const tFrac = ((rMin + rMax) / 2) / bladeLenMm;
    const topM  = bTR + (bTT - bTR) * tFrac;
    const botM  = bBR + (bBT - bBR) * tFrac;
    const bladeH = botM - topM;
    const chordMm = 4000 + (300 - 4000) * tFrac;

    let yFS = 0, yFE = 0;
    const xMin = Math.min(d.x1, d.x2);
    const xMax = Math.max(d.x1, d.x2);
    
    if (d.chordRef === 'TE') {
        yFS = 1 - xMax / chordMm; yFE = 1 - xMin / chordMm;
    } else if (d.chordRef === 'M.Web') {
        yFS = 0.4 - xMax / chordMm; yFE = 0.4 + xMin / chordMm;
    } else if (d.chordRef === 'TE.Web') {
        yFS = 0.75 - xMax / chordMm; yFE = 0.75 + xMin / chordMm;
    } else {
        yFS = xMin / chordMm; yFE = xMax / chordMm;
    }
    yFS = Math.max(0, Math.min(1, yFS)); yFE = Math.max(0, Math.min(1, yFE));

    const yTop = topM + yFS * bladeH;
    const yBot = topM + yFE * bladeH;
    const cy = (yTop + yBot) / 2;

    const mk = (tag, attrs) => {
        const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
        return el;
    };

    // 1. Desenha a área de dano (Retângulo)
    const spanPx = Math.max(2, xEnd - xStart);
    const rH = Math.max(2, yBot - yTop);
    g.appendChild(mk('rect', {
        x: xStart, y: yTop, width: spanPx, height: rH,
        fill: 'rgba(239, 68, 68, 0.4)', stroke: '#b91c1c', 'stroke-width': '1', rx: 1
    }));

    // 2. INDICADOR ESFÉRICO VERMELHO NO CENTRO DO DANO
    const glow = mk('circle', {
        cx: cx, cy: cy, r: 6, fill: 'rgba(239, 68, 68, 0.3)'
    });
    const anim = mk('animate', {
        attributeName: 'r', values: '6;14;6', dur: '1.5s', repeatCount: 'indefinite'
    });
    glow.appendChild(anim);
    g.appendChild(glow);

    g.appendChild(mk('circle', {
        cx: cx, cy: cy, r: 4.5, fill: '#ef4444', stroke: '#7f1d1d', 'stroke-width': '1'
    }));
    g.appendChild(mk('circle', {
        cx: cx - 1.5, cy: cy - 1.5, r: 1.5, fill: '#fca5a5'
    }));

    // 3. LEGENDA FIXA (Fora do desenho da pá, canto inferior direito)
    const boxW = 150;
    const boxH = 36;
    const boxX = 900 - boxW; // Canto inferior direito do SVG
    const boxY = 122; // Logo acima da margem inferior (em cima de onde o HTML escreve o tamanho da pá)

    const lblG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Fundo da legenda
    lblG.appendChild(mk('rect', {
        x: boxX, y: boxY, width: boxW, height: boxH, rx: 4,
        fill: 'rgba(255,255,255,0.95)', stroke: '#cbd5e1', 'stroke-width': '1.5'
    }));

    const lengthMm = Math.abs(d.rend - d.rstart).toLocaleString();
    const widthMm = Math.abs(d.x2 - d.x1).toLocaleString();
    const radiusPos = ((rMin + rMax) / 2000).toFixed(2);

    // Ícone de bolinha vermelha na legenda para associar visualmente ao dano
    lblG.appendChild(mk('circle', { cx: boxX + 14, cy: boxY + 18, r: 4, fill: '#ef4444' }));

    // Texto de Localização
    const t1 = mk('text', { x: boxX + 26, y: boxY + 16, fill: '#1e293b', 'font-size': '10', 'font-weight': '700', 'font-family': 'Inter' });
    t1.textContent = `Location: R = ${radiusPos} m`;
    
    // Texto de Tamanho
    const t2 = mk('text', { x: boxX + 26, y: boxY + 29, fill: '#64748b', 'font-size': '9', 'font-weight': '600', 'font-family': 'Inter' });
    t2.textContent = `Size: ${lengthMm} x ${widthMm} mm`;

    lblG.appendChild(t1);
    lblG.appendChild(t2);
    g.appendChild(lblG);
}

// ── STEP 2 ────────────────────────────────────────────────────────────

/** Get allowed materials for current blade model */
function getAllowedMaterials() {
    const model = document.getElementById('bladeModel').value;
    if (!model || !BLADE_MATERIAL_MAP[model]) return [];
    return BLADE_MATERIAL_MAP[model];
}

function initLayerTable() {
    const model = document.getElementById('bladeModel').value;
    if (!model) return;

    // Build a sensible default layer set based on the blade model
    const allowed = getAllowedMaterials();
    layerRows = [];

    // Add a few common defaults if available
    const defaults = allowed.slice(0, Math.min(3, allowed.length));
    defaults.forEach((m, i) => {
        layerRows.push({
            layerName: `Layer ${i+1}`,
            materialType: m.materialType,
            gsm: m.gsm,
            order: ''
        });
    });

    renderLayerTable();
}

function renderLayerTable() {
    const tbody = document.getElementById('layerTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const allowed = getAllowedMaterials();
    const isLocked = layerDataLocked;

    layerRows.forEach((row, idx) => {
        const tr = document.createElement('tr');

        // Build material options from blade-specific allowed list
        let matOpts = '<option value="">--</option>';
        // Get unique materialType+gsm combos
        for (const m of allowed) {
            const val = m.materialType + '|' + m.gsm;
            const currentVal = row.materialType + '|' + row.gsm;
            const sel = val === currentVal ? ' selected' : '';
            matOpts += `<option value="${val}"${sel}>${m.label}</option>`;
        }

        tr.innerHTML = `
            <td class="row-num" style="text-align:center;font-weight:600;color:#64748b">${idx+1}</td>
            <td><input type="text" value="${row.layerName}" ${isLocked ? 'disabled' : ''} onchange="updateLayer(${idx},'layerName',this.value);recalculateLayup()"></td>
            <td>
                <select ${isLocked ? 'disabled' : ''} onchange="updateLayerMaterial(${idx},this.value);recalculateLayup()">
                    ${matOpts}
                </select>
            </td>
            <td style="text-align:center;font-weight:500;color:#334155">${row.gsm || '—'}</td>
            <td><input type="text" value="${row.order}" ${isLocked ? 'disabled' : ''} onchange="updateLayer(${idx},'order',this.value)"></td>
            <td>
                <div class="move-btns">
                    <button class="btn-move" title="Move up" onclick="moveLayerUp(${idx})" ${idx===0 || isLocked ? 'disabled' : ''}><i class="bi bi-chevron-up"></i></button>
                    <button class="btn-move" title="Move down" onclick="moveLayerDown(${idx})" ${idx===layerRows.length-1 || isLocked ? 'disabled' : ''}><i class="bi bi-chevron-down"></i></button>
                </div>
            </td>
            <td><button class="btn-remove-row" onclick="removeLayerRow(${idx})" ${isLocked ? 'disabled' : ''}><i class="bi bi-x-circle"></i></button></td>
        `;
        tbody.appendChild(tr);
    });

    // Update add button state
    const addBtn = document.getElementById('addLayerBtn');
    if (addBtn) addBtn.disabled = isLocked;

    // Reference-only fabrics panel (labels from REV05 Blades_Fabrics,
    // not wired into calculation pipeline — see PENDING_REV06.md)
    renderReferenceFabricsPanel(document.getElementById('bladeModel').value);

    // Keep the computed LAYUP preview in sync with the current layers.
    recalculateLayup();
}

/**
 * Render the read-only reference fabrics panel in Step 2.
 * Shows fabrics that appear in REV05 Blades_Fabrics but have no SAP / overlap data yet.
 * Hidden when the current blade model has no reference fabrics.
 */
function renderReferenceFabricsPanel(model) {
    const panel = document.getElementById('referenceFabricsPanel');
    if (!panel) return;
    const refs = (typeof BLADE_REFERENCE_FABRICS !== 'undefined') && BLADE_REFERENCE_FABRICS[model];
    if (!refs || refs.length === 0) { panel.innerHTML = ''; return; }
    const items = refs.map(f =>
        `<li><span class="ref-fabric-label">${f.label}</span>` +
        `<span class="ref-sap-badge">SAP: not assigned</span>` +
        `<span class="ref-source">${f.source}</span></li>`
    ).join('');
    panel.innerHTML =
        `<div class="ref-fabrics-panel">` +
        `<div class="ref-fabrics-header">` +
        `<i class="bi bi-bookmark-check"></i>` +
        `<span>Mapped for <strong>${model}</strong> in REV05 <em>Blades_Fabrics</em> ` +
        `— reference only, not available for repair input until REV06</span>` +
        `</div><ul class="ref-fabrics-list">${items}</ul></div>`;
}

function updateLayerMaterial(idx, combinedVal) {
    if (!combinedVal) {
        layerRows[idx].materialType = '';
        layerRows[idx].gsm = '';
        return;
    }
    const [matType, gsm] = combinedVal.split('|');
    layerRows[idx].materialType = matType;
    layerRows[idx].gsm = gsm;
    renderLayerTable();
}

function addLayerRow() {
    if (layerDataLocked) return;
    layerRows.push({layerName: `Layer ${layerRows.length+1}`, materialType:'', gsm:'', order:''});
    renderLayerTable();
    recalculateLayup();
}

function removeLayerRow(idx) {
    if (layerDataLocked) return;
    layerRows.splice(idx, 1);
    renderLayerTable();
    recalculateLayup();
}

function updateLayer(i, f, v) { layerRows[i][f] = v; }

function moveLayerUp(idx) {
    if (layerDataLocked || idx <= 0) return;
    [layerRows[idx-1], layerRows[idx]] = [layerRows[idx], layerRows[idx-1]];
    renderLayerTable();
    recalculateLayup();
}

function moveLayerDown(idx) {
    if (layerDataLocked || idx >= layerRows.length - 1) return;
    [layerRows[idx], layerRows[idx+1]] = [layerRows[idx+1], layerRows[idx]];
    renderLayerTable();
    recalculateLayup();
}

function updateLayupHeaders() {
    const ref = document.getElementById('chordRef').value || 'LE';
    const h1  = document.getElementById('layupX1Header');
    const h2  = document.getElementById('layupX2Header');
    if (h1) h1.textContent = `X1 ${ref}`;
    if (h2) h2.textContent = `X2 ${ref}`;
}

function recalculateLayup() {
    const tbody = document.getElementById('layupTableBody');
    if (!tbody) return;
    const d = getDamageData();
    updateLayupHeaders();
    const filtered = layerRows.filter(l => l.materialType);
    if (d.rstart <= 0 || d.rend <= 0) {
        tbody.innerHTML = `<tr><td colspan="11" style="text-align:center;color:#94a3b8;padding:14px">Enter valid damage data (Step 1) to preview the layup.</td></tr>`;
        return;
    }
    renderLayupTable(computeLayup(d, filtered).layupRows, filtered);
}

// Editable override cell for a data layer (BOD is read-only).
function _ovCell(filteredIdx, field, value, isOverridden) {
    const cls = isOverridden ? 'ov-cell overridden' : 'ov-cell';
    return `<td class="${cls}"><input type="number" step="any" class="ov-input" value="${value}"
        data-idx="${filteredIdx}" data-field="${field}"
        onchange="setLayerOverride(${filteredIdx},'${field}',this.value)"
        title="Override ${field.toUpperCase()} — leave to use automatic value"></td>`;
}

function renderLayupTable(rows, filtered) {
    const tbody = document.getElementById('layupTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    rows.forEach((row, rowIdx) => {
        const tr = document.createElement('tr');
        const ov = row.overridden || {};
        if (row.isBod) {
            tr.classList.add('bod-row');
            tr.innerHTML = `
                <td>${row.layer}</td><td>${row.materialType}</td><td>${row.gsm}</td>
                <td>${row.r1.toLocaleString()}</td><td>${row.r2.toLocaleString()}</td><td>${row.length.toLocaleString()}</td>
                <td>${row.h1.toLocaleString()}</td><td>${row.h2.toLocaleString()}</td><td>${row.width.toLocaleString()}</td>
                <td>${row.area.toLocaleString()}</td><td>--</td>`;
        } else {
            const fi = rowIdx - 1; // data rows follow BOD (index 0) in order
            tr.innerHTML = `
                <td>${row.layer}</td><td>${row.materialType}</td><td>${row.gsm}</td>
                ${_ovCell(fi,'ovR1',row.r1,ov.r1)}${_ovCell(fi,'ovR2',row.r2,ov.r2)}
                <td>${row.length.toLocaleString()}</td>
                ${_ovCell(fi,'ovX1',row.h1,ov.x1)}${_ovCell(fi,'ovX2',row.h2,ov.x2)}
                <td>${row.width.toLocaleString()}</td>
                <td>${row.area.toLocaleString()}</td>
                <td>${(row.weight!==null&&row.weight!==undefined)?row.weight.toFixed(6):'--'}</td>`;
        }
        tbody.appendChild(tr);
    });
}

function setLayerOverride(filteredIdx, field, value) {
    const filtered = layerRows.filter(l => l.materialType);
    const layer = filtered[filteredIdx];
    if (!layer) return;
    layer[field] = (value === '' || value === null || isNaN(value)) ? undefined : Number(value);
    recalculateLayup();
}

function resetLayupOverrides() {
    layerRows.forEach(l => { delete l.ovR1; delete l.ovR2; delete l.ovX1; delete l.ovX2; });
    recalculateLayup();
}

function renderOverlapRefTable() {
    const tbody = document.getElementById('overlapRefBody');
    if (!tbody) return;
    tbody.innerHTML = '';
    for (const [key,val] of Object.entries(STANDARD_OVERLAPS)) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td style="font-weight:600">${key}</td><td>${val.span}</td><td>${val.chord}</td>`;
        tbody.appendChild(tr);
    }
}

// ── STEP 3 ────────────────────────────────────────────────────────────
function getRepairSteps() {
    return {
        Cleaning:   parseInt(document.getElementById('stepCleaning').value)   ||0,
        Grinding:   parseInt(document.getElementById('stepGrinding').value)   ||0,
        Bonding:    parseInt(document.getElementById('stepBonding').value)    ||0,
        Lamination: parseInt(document.getElementById('stepLamination').value) ||0,
        HLU:        parseInt(document.getElementById('stepHLU').value)        ||0,
        Infusion:   parseInt(document.getElementById('stepInfusion').value)   ||0,
        Weighing:   parseInt(document.getElementById('stepWeighing').value)   ||0,
        Painting:   parseInt(document.getElementById('stepPainting').value)   ||0,
        LEP:        parseInt(document.getElementById('stepLEP').value)        ||0,
    };
}

function onRepairStepsChange() {
    const s = getRepairSteps();
    document.getElementById('stepVacuum').textContent = s.HLU + s.Infusion;
    updateEstimatedDays();
}

// Repair type: external repairs add a painting day to the schedule estimate.
function isExternalRepair() {
    const el = document.getElementById('repairType');
    return el ? el.value === 'external' : false;
}

// Compute + display the estimated repair schedule (total days only).
function updateEstimatedDays() {
    const el = document.getElementById('estimatedDays');
    if (!el) return;
    const est = computeRepairDays(layerRows.filter(l => l.materialType), isExternalRepair());
    lastEstimatedDays = est.totalDays;
    el.textContent = `${est.totalDays} d`;
}

// Copy the estimate into the PPE-driving "Days of Repair" field.
function applyEstimatedDays() {
    updateEstimatedDays();
    const input = document.getElementById('daysRepair');
    if (input && lastEstimatedDays) {
        input.value = Math.max(1, lastEstimatedDays);
        onRepairStepsChange();
    }
}

// ── STEP 4 ────────────────────────────────────────────────────────────
function calculateAndShow() {
    const bladeModel   = document.getElementById('bladeModel').value;
    const damageData   = getDamageData();
    const repairSteps  = getRepairSteps();
    const bladeRegion  = document.getElementById('bladeRegion').value;
    const daysOfRepair = parseInt(document.getElementById('daysRepair').value) || 5;

    if (!bladeModel)                                         { alert('Please select a Blade Model in Step 1.'); goToStep(1); return; }
    if (damageData.rstart<=0 || damageData.rend<=0)          { alert('Please enter valid Rstart and Rend in Step 1.'); goToStep(1); return; }

    lastBOM = computeFullBOM(damageData, layerRows.filter(l=>l.materialType), repairSteps, bladeModel, bladeRegion, daysOfRepair);
    goToStep(4);
    renderSummary();
    showResultTab('consumable_protection');
}

function renderSummary() {
    if (!lastBOM) return;
    const s = lastBOM.summary;
    const est = computeRepairDays(layerRows.filter(l => l.materialType), isExternalRepair());
    lastEstimatedDays = est.totalDays;
    document.getElementById('summaryCards').innerHTML = `
        <div class="summary-card highlight" style="min-width:120px;max-width:160px;padding:12px 14px;flex:1">
            <div class="sc-label" style="font-size:0.68rem">Total BOM Items</div>
            <div class="sc-value" style="font-size:1.3rem">${s.totalItems}</div>
        </div>
        <div class="summary-card highlight" style="min-width:130px;max-width:180px;padding:12px 14px;flex:1;background:linear-gradient(160deg,#0ea5e9,#0369a1);color:#fff">
            <div class="sc-label" style="font-size:0.68rem;color:#e0f2fe">Estimated Duration (${est.breakdown.hasCore ? 'core' : 'no core'}, ${isExternalRepair() ? 'external' : 'internal'})</div>
            <div class="sc-value" style="font-size:1.3rem">${est.totalDays} day${est.totalDays > 1 ? 's' : ''}</div>
        </div>
        <div class="summary-card" style="min-width:110px;max-width:150px;padding:12px 14px;flex:1">
            <div class="sc-label" style="font-size:0.68rem">Fabric Items</div>
            <div class="sc-value" style="font-size:1.3rem">${s.totalFabricItems}</div>
        </div>
        <div class="summary-card" style="min-width:120px;max-width:160px;padding:12px 14px;flex:1">
            <div class="sc-label" style="font-size:0.68rem">Max Layup Length</div>
            <div class="sc-value" style="font-size:1.3rem">${s.maxLayupLength.toLocaleString()} mm</div>
        </div>
        <div class="summary-card" style="min-width:120px;max-width:160px;padding:12px 14px;flex:1">
            <div class="sc-label" style="font-size:0.68rem">Max Layup Width</div>
            <div class="sc-value" style="font-size:1.3rem">${s.maxLayupWidth.toLocaleString()} mm</div>
        </div>
        <div class="summary-card" style="min-width:110px;max-width:150px;padding:12px 14px;flex:1">
            <div class="sc-label" style="font-size:0.68rem">Max Area</div>
            <div class="sc-value" style="font-size:1.3rem">${s.maxAreaM2.toFixed(3)} m&sup2;</div>
        </div>
        <div class="summary-card" style="min-width:130px;max-width:170px;padding:12px 14px;flex:1">
            <div class="sc-label" style="font-size:0.68rem">Total Fabric Weight</div>
            <div class="sc-value" style="font-size:1.3rem">${s.totalFabricWeight.toFixed(3)} kg</div>
        </div>
    `;
}

function showResultTab(tabName, btnEl) {
    // If in active edit mode (not locked), sync current inputs before switching tabs
    if (editModeActive && !editModeLocked && editedBOM) {
        _syncInputsToEditedBOM();
    }
    currentResultTab = tabName;
    document.querySelectorAll('.results-tab').forEach(b => b.classList.remove('active'));
    if (btnEl) btnEl.classList.add('active');
    else document.querySelectorAll('.results-tab').forEach(b => { if (b.getAttribute('data-tab') === tabName) b.classList.add('active'); });

    if (!lastBOM) return;

    const head = document.getElementById('resultsHead');
    const body = document.getElementById('resultsBody');
    let items = [], columns = [];
    // Use editedBOM if edits are active/locked, otherwise original
    const source = editedBOM || lastBOM;

    switch (tabName) {
        case 'consumable_protection': items = source.ppeItems;        columns = ['SAP IN','Description','Qty','Unit']; break;
        case 'consumables_tools':     items = source.consumToolItems;  columns = ['SAP IN','Description','Qty','Unit']; break;
        case 'chemicals':             items = source.chemItems;        columns = ['SAP IN','Description','Qty','Unit']; break;
        case 'consumables':           items = source.consumItems;      columns = ['SAP IN','Description','Qty','Unit']; break;
        case 'fabrics':               items = source.fabricItems;      columns = ['SAP IN','Material','Description','Qty','Unit']; break;
        case 'tools':                 items = source.toolItems;        columns = ['SAP IN','Description','Qty','Unit']; break;
    }

    head.innerHTML = '<tr>' + columns.map(c=>`<th>${c}</th>`).join('') + '</tr>';
    body.innerHTML = '';

    const isEditable = editModeActive && !editModeLocked;
    const isLocked   = editModeLocked;

    for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const tr = document.createElement('tr');
        if (item.qty === 0 && !isEditable) tr.classList.add('zero-row');

        const qtyCell = isEditable
            ? `<td class="qty-cell"><input type="number" step="any" min="0" class="edit-input" data-tab="${tabName}" data-idx="${idx}" data-field="qty" value="${item.qty}" style="width:70px;padding:4px 6px;border:1.5px solid #f59e0b;border-radius:4px;text-align:center;font-size:0.85rem"></td>`
            : isLocked
            ? `<td class="qty-cell" style="background:#fef9c3">${item.qty}</td>`
            : `<td class="qty-cell">${item.qty}</td>`;

        const unitCell = `<td>${item.unit}</td>`;

        if (tabName === 'fabrics') {
            tr.innerHTML = `<td>${item.sap||'-'}</td><td style="font-weight:600">${item.material||''}</td><td>${item.desc}</td>${qtyCell}${unitCell}`;
        } else {
            tr.innerHTML = `<td>${item.sap||'-'}</td><td>${item.desc}</td>${qtyCell}${unitCell}`;
        }
        body.appendChild(tr);
    }

    if (items.length === 0) {
        body.innerHTML = `<tr><td colspan="${columns.length}" style="text-align:center;padding:30px;color:#94a3b8">No items for this category with current repair steps.</td></tr>`;
    }
}

// PDF generation
async function downloadPDF() {
    if (!lastBOM) { alert('Please calculate BOM first.'); return; }
    if (editModeActive && !editModeLocked) { alert('Please Lock your edits before generating the PDF.'); return; }

    const bladeModel   = document.getElementById('bladeModel').value;
    const damageData   = getDamageData();
    const daysOfRepair = parseInt(document.getElementById('daysRepair').value) || 5;
    const bladeRegion  = document.getElementById('bladeRegion').value;
    const userInputs   = getUserInputs();

    const source = editedBOM || lastBOM;
    const allItems = [
        ...source.fabricItems.map(i     => ({...i, category:'Fabrics'})),
        ...source.chemItems.map(i       => ({...i, category:'Chemicals'})),
        ...source.consumToolItems.map(i => ({...i, category:'Consumable Tools'})),
        ...source.consumItems.map(i     => ({...i, category:'Consumables'})),
        ...source.toolItems.map(i       => ({...i, category:'Tools'})),
        ...source.ppeItems.map(i        => ({...i, category:'Consumable Protection Equipment'})),
    ];

    // Audit blob — captures the inputs and engine outputs that produced this
    // PDF. Stored server-side as JSON next to the PDF, never exposed via HTTP.
    const layupSummary = lastBOM.layupResult ? {
        maxLength:           lastBOM.layupResult.maxLength,
        maxWidth:            lastBOM.layupResult.maxWidth,
        maxAreaM2:           lastBOM.layupResult.maxAreaM2,
        totalFabricWeightKg: lastBOM.layupResult.totalFabricWeightKg,
        coreAreaM2:          lastBOM.layupResult.coreAreaM2,
        coreWeightKg:        lastBOM.layupResult.coreWeightKg,
        splAreaM2:           lastBOM.layupResult.splAreaM2,
        perimeter:           lastBOM.layupResult.perimeter,
    } : {};

    const payload = {
        turbine_model:      bladeModel,
        blade_type:         '',
        damage_cat:         'General Shell Laminate',
        blade_zone:         bladeRegion,
        rstart:             damageData.rstart,
        rend:               damageData.rend,
        length:             Math.abs(damageData.rend - damageData.rstart),
        width:              Math.abs(damageData.x1   - damageData.x2),
        days:               daysOfRepair,
        estimated_days:     computeRepairDays(layerRows.filter(l => l.materialType), isExternalRepair()).totalDays,
        is_external:        isExternalRepair(),
        report_title:       (document.getElementById('reportTitle')?.value || '').trim(),
        doc_refs:           lastDocRef || null,
        total_brl:          0,
        total_eur:          0,
        blade_sn:           userInputs.bladeSN,
        service_order:      userInputs.serviceOrder,
        cir_number:         userInputs.cirNumber,
        damage_description: userInputs.damageDescription,
        chord_ref:          damageData.chordRef,
        x1:                 damageData.x1,
        items: allItems.map(i => ({
            sap:      i.sap || '-',
            desc:     i.desc,
            qty:      i.qty,
            unit:     i.unit,
            phase:    i.category,
            material: i.material || null,
            cost_brl: 0,
        })),
        audit_inputs: {
            repair_steps: getRepairSteps(),
            layers: layerRows
                .filter(l => l.materialType)
                .map((l, idx) => ({
                    order:        idx + 1,
                    layerName:    l.layerName || '',
                    materialType: l.materialType,
                    gsm:          l.gsm || '',
                })),
        },
        audit_outputs: {
            layup_summary: layupSummary,
            totals: lastBOM.summary || {},
        },
    };

    try {
        const response = await fetch('/api/generate-pdf', {
            method:  'POST',
            headers: {'Content-Type':'application/json'},
            body:    JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Server error');
        const blob = await response.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        const so = userInputs.serviceOrder || 'UNKNOWN';
        const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
        const title = (document.getElementById('reportTitle')?.value || '').trim().replace(/[^\w\- ]+/g,'').replace(/\s+/g,'_');
        a.download = title ? `${title}.pdf` : `BOM_Report_${bladeModel}_${so}_${dateStr}.pdf`;
        a.click();
    } catch (e) {
        alert('Error generating PDF. Make sure the server is running (python run_server.py).');
        console.error(e);
    }
}

// ============================================================
// EDIT MODE — temporary QTY/Unit adjustments before PDF
// ============================================================

function _deepCloneBOM(bom) {
    return {
        ppeItems:       bom.ppeItems.map(i => ({...i})),
        consumToolItems:bom.consumToolItems.map(i => ({...i})),
        chemItems:      bom.chemItems.map(i => ({...i})),
        consumItems:    bom.consumItems.map(i => ({...i})),
        fabricItems:    bom.fabricItems.map(i => ({...i})),
        toolItems:      bom.toolItems.map(i => ({...i})),
        summary:        {...bom.summary},
        layupResult:    bom.layupResult ? {...bom.layupResult} : null,
    };
}

function _getItemsForTab(source, tab) {
    switch (tab) {
        case 'consumable_protection': return source.ppeItems;
        case 'consumables_tools':     return source.consumToolItems;
        case 'chemicals':             return source.chemItems;
        case 'consumables':           return source.consumItems;
        case 'fabrics':               return source.fabricItems;
        case 'tools':                 return source.toolItems;
    }
    return [];
}

function _syncInputsToEditedBOM() {
    document.querySelectorAll('.edit-input').forEach(input => {
        const tab   = input.getAttribute('data-tab');
        const idx   = parseInt(input.getAttribute('data-idx'));
        const field = input.getAttribute('data-field');
        const items = _getItemsForTab(editedBOM, tab);
        if (items && items[idx] !== undefined) {
            items[idx][field] = field === 'qty' ? parseFloat(input.value) || 0 : input.value;
        }
    });
}

function toggleEditMode() {
    if (editModeActive) return; // already in edit mode
    if (!lastBOM) { alert('Please calculate BOM first (Step 3 → Calculate).'); return; }
    editModeActive = true;
    editModeLocked = false;
    editedBOM = _deepCloneBOM(lastBOM);

    // Update button visibility
    document.getElementById('btnEditMode').style.display = 'none';
    document.getElementById('btnLockEdit').style.display = 'inline-flex';
    document.getElementById('btnResetEdit').style.display = 'inline-flex';
    document.getElementById('btnGeneratePDF').disabled = true;
    document.getElementById('btnGeneratePDF').title = 'Lock your edits first';

    // Re-render current tab with editable inputs
    showResultTab(currentResultTab);
}

function lockEditMode() {
    if (!editModeActive || editModeLocked) return;
    // Read all inputs into editedBOM
    _syncInputsToEditedBOM();
    editModeLocked = true;

    // Update buttons
    document.getElementById('btnLockEdit').style.display = 'none';
    document.getElementById('btnGeneratePDF').disabled = false;
    document.getElementById('btnGeneratePDF').title = '';

    // Re-render as locked (highlighted but read-only)
    showResultTab(currentResultTab);
}

function resetEditMode(silent) {
    if (!editModeActive && !editedBOM) return;
    if (!silent && !confirm('Discard all edits and return to default calculated values?')) return;
    editModeActive = false;
    editModeLocked = false;
    editedBOM = null;

    // Restore buttons
    document.getElementById('btnEditMode').style.display = 'inline-flex';
    document.getElementById('btnLockEdit').style.display = 'none';
    document.getElementById('btnResetEdit').style.display = 'none';
    document.getElementById('btnGeneratePDF').disabled = false;
    document.getElementById('btnGeneratePDF').title = '';

    // Re-render with original values
    showResultTab(currentResultTab);
}