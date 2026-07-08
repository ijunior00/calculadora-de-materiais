// ============================================================
// SCARF.JS — Escalonamento (layer staggering / scarfing) module
// Generates the per-layer staggering geometry and the staircase
// drawing from the SAME layer stack the user already entered in the
// calculator (M.layers + damage). Overlaps default to the standard
// per-fabric table (STANDARD_OVERLAPS, the same one the BOM engine
// uses) and are editable per layer. engine.js is NOT modified.
//
// Mirrors the manual "Padrão de escalonamento" workbook:
//   DANO 1  -> the staggering table (auto-filled here)
//   GRÁFICO -> the nested-rectangle drawing (SVG here)
//   CAD 1   -> the AutoCAD pline/text script (.scr export here)
// ============================================================

const SCARF = {
    z0: 0,            // absolute Z start (radius) of the damage, mm (0 = relative)
    chordRef: 'LE',
    custom: {},       // layerIndex -> { span, chord } overlap overrides
    rows: [],         // last computed rows
    // Drawing mode: 'normal' = standard top-view escalonamento (overlaps);
    // 'ramp' = angle-based scarf ramp side-view (inspired by CIM4271).
    mode: 'normal',
    angle: 10,        // scarf angle in degrees (ramp mode)
    plyThk: 1.0,      // ply thickness in mm (ramp mode)
    staggerByType: false, // ramp mode: use per-fabric-family stagger instead of angle
};

// Per-fabric-family stagger (mm) for the ramp mode. Biax/Triax from CIM4271
// (biax 30, triax 20); other families fall back to the fabric's norm span
// overlap so nothing is invented.
const SCARF_STAGGER_BY_TYPE = { BIAX: 30, TRIAX: 20 };
function scarfStaggerFor(layer) {
    if (SCARF_STAGGER_BY_TYPE[layer.materialType] != null) return SCARF_STAGGER_BY_TYPE[layer.materialType];
    return scarfDefaultOverlap(layer).span;
}
// Angle-based step per ply: horizontal run = thickness / tan(angle).
function scarfAngleStep() {
    const a = Math.max(0.5, Number(SCARF.angle) || 10) * Math.PI / 180;
    const t = Math.max(0.05, Number(SCARF.plyThk) || 1);
    return Math.max(1, Math.round(t / Math.tan(a)));
}

function scarfDefaultOverlap(layer) {
    const key = ['CORE', 'SPL', 'CFM50', 'BALSA'].includes(layer.materialType)
        ? layer.materialType
        : layer.materialType + (layer.gsm || '');
    let ov = STANDARD_OVERLAPS[key];
    if (!ov && typeof computeFiberOverlap === 'function') {
        const f = computeFiberOverlap(layer.materialType, layer.gsm);
        if (f && f.span !== null) ov = f;
    }
    return ov || { span: 0, chord: 0 };
}

// Compute the staggering table. Mirrors computeLayup's outward expansion
// (min - overlap / max + overlap) but reads the overlap per layer so it
// can be overridden, and keeps absolute Z coordinates for blade marking.
function computeScarf() {
    const z0 = Number(SCARF.z0) || 0;
    const len = Number(M.length) || 0;
    const wid = Number(M.width) || 0;
    const layers = M.layers.filter(l => l.materialType);

    const bod = {
        name: 'BOD', type: '-', isBod: true,
        z1: z0, z2: z0 + len, len: len,
        x1: 0, x2: wid, wid: wid,
        ovSpan: '-', ovChord: '-', order: '-',
    };
    const rows = [bod];
    const allZ1 = [bod.z1], allZ2 = [bod.z2], allX1 = [bod.x1], allX2 = [bod.x2];

    layers.forEach((l, i) => {
        const def = scarfDefaultOverlap(l);
        const ov = SCARF.custom[i] || { span: def.span, chord: def.chord };
        const z1 = Math.min(...allZ1) - ov.span;
        const z2 = Math.max(...allZ2) + ov.span;
        const x1 = Math.min(...allX1) - ov.chord;
        const x2 = Math.max(...allX2) + ov.chord;
        rows.push({
            name: l.layerName || ('Layer ' + (i + 1)),
            type: (typeof labelFor === 'function') ? labelFor(l) : (l.materialType + (l.gsm || '')),
            isBod: false, idx: i,
            z1, z2, len: z2 - z1,
            x1, x2, wid: x2 - x1,
            ovSpan: ov.span, ovChord: ov.chord,
            order: i + 1,
        });
        allZ1.push(z1); allZ2.push(z2); allX1.push(x1); allX2.push(x2);
    });
    SCARF.rows = rows;
    return rows;
}

// Ramp mode (CIM4271-inspired): a scarf ramp as a stacked side-section.
// Each ply extends beyond the previous by a "step" — either the angle-based
// run (thickness/tan(angle)) or the per-fabric-family stagger. Height stacks
// by ply thickness so the drawing shows the staircase ramp.
function computeScarfRamp() {
    const z0 = Number(SCARF.z0) || 0;
    const len = Number(M.length) || 0;
    const t = Math.max(0.05, Number(SCARF.plyThk) || 1);
    const layers = M.layers.filter(l => l.materialType);
    const angleStep = scarfAngleStep();

    const rows = [{ name: 'BOD', type: '-', isBod: true, z1: z0, z2: z0 + len, len,
                    step: '-', y0: 0, y1: t }];
    let curZ1 = z0, curZ2 = z0 + len, y = t;
    layers.forEach((l, i) => {
        const step = SCARF.staggerByType ? scarfStaggerFor(l) : angleStep;
        curZ1 -= step; curZ2 += step;
        rows.push({
            name: l.layerName || ('Layer ' + (i + 1)),
            type: (typeof labelFor === 'function') ? labelFor(l) : (l.materialType + (l.gsm || '')),
            isBod: false, idx: i, order: i + 1,
            z1: curZ1, z2: curZ2, len: curZ2 - curZ1,
            step, y0: y, y1: y + t,
        });
        y += t;
    });
    SCARF.rampRows = rows;
    return rows;
}

// ============================================================
// SCREEN
// ============================================================
function openScarf() {
    if (!M.lastBOM) { toast('Calculate the BOM first.', 'err'); return; }
    if (M.layers.filter(l => l.materialType).length === 0) { toast('Add at least one layer.', 'err'); return; }
    ['s1', 's2', 's3', 's4'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById('s5').classList.remove('hidden');
    document.getElementById('m-step-name').textContent = 'Scarfing drawing';
    document.getElementById('m-step-count').textContent = 'Escalonamento';
    document.getElementById('m-scarf-z0').value = SCARF.z0 || '';
    renderScarfActionBar();
    renderScarf();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeScarf() {
    document.getElementById('s5').classList.add('hidden');
    document.getElementById('s4').classList.remove('hidden');
    renderProgress();
    renderActionBar();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onScarfZ0(v) {
    SCARF.z0 = parseFloat(v) || 0;
    renderScarf();
}

function onScarfOverlap(idx, field, v) {
    const val = Math.max(0, parseFloat(v) || 0);
    const def = scarfDefaultOverlap(M.layers.filter(l => l.materialType)[idx]);
    const cur = SCARF.custom[idx] || { span: def.span, chord: def.chord };
    cur[field] = val;
    SCARF.custom[idx] = cur;
    renderScarf();
}

function resetScarfOverlaps() {
    SCARF.custom = {};
    renderScarf();
    toast('Overlaps reset to standard.', 'ok');
}

function renderScarfMode() {
    const wrap = document.getElementById('m-scarf-mode');
    if (!wrap) return;
    const opts = [
        { key: 'normal', label: 'Normal' },
        { key: 'ramp', label: 'Rampa (ângulo)' },
    ];
    wrap.innerHTML = opts.map(o =>
        `<div class="seg${SCARF.mode === o.key ? ' active' : ''}" onclick="setScarfMode('${o.key}')">${o.label}</div>`
    ).join('');
    const ri = document.getElementById('m-scarf-ramp-inputs');
    if (ri) {
        ri.innerHTML = SCARF.mode !== 'ramp' ? '' : `
            <div class="m-two-col" style="margin-top:10px">
                <div class="m-field" style="margin-bottom:0">
                    <label>Scarf angle <span class="hint">(°)</span></label>
                    <input type="number" id="m-scarf-angle" inputmode="decimal" value="${SCARF.angle}" onchange="onScarfAngle(this.value)" ${SCARF.staggerByType ? 'disabled' : ''}>
                </div>
                <div class="m-field" style="margin-bottom:0">
                    <label>Ply thickness <span class="hint">(mm)</span></label>
                    <input type="number" id="m-scarf-thk" inputmode="decimal" step="0.1" value="${SCARF.plyThk}" onchange="onScarfThk(this.value)">
                </div>
            </div>
            <label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:0.82rem">
                <input type="checkbox" ${SCARF.staggerByType ? 'checked' : ''} onchange="toggleStaggerType()">
                Stagger por tipo de tecido (biax 30 / triax 20 mm)
            </label>`;
    }
}

function setScarfMode(m) { SCARF.mode = m; renderScarf(); }
function onScarfAngle(v) { SCARF.angle = Math.max(0.5, parseFloat(v) || 10); renderScarf(); }
function onScarfThk(v) { SCARF.plyThk = Math.max(0.05, parseFloat(v) || 1); renderScarf(); }
function toggleStaggerType() { SCARF.staggerByType = !SCARF.staggerByType; renderScarf(); }

function renderScarf() {
    renderScarfMode();
    const title = document.getElementById('m-scarf-draw-title');
    if (SCARF.mode === 'ramp') {
        if (title) title.textContent = 'Scarf ramp (side section)';
        const rows = computeScarfRamp();
        renderScarfRampDrawing(rows);
        renderScarfRampTable(rows);
    } else {
        if (title) title.textContent = 'Staggering drawing (top view)';
        const rows = computeScarf();
        renderScarfDrawing(rows);
        renderScarfTable(rows);
    }
}

function renderScarfTable(rows) {
    const wrap = document.getElementById('m-scarf-table');
    const head = `
        <div class="sc-row sc-head">
            <div class="sc-c name">Layer</div>
            <div class="sc-c">Z start</div>
            <div class="sc-c">Z end</div>
            <div class="sc-c">Ov.span</div>
            <div class="sc-c">Ov.chord</div>
            <div class="sc-c">Width</div>
        </div>`;
    const body = rows.map(r => {
        if (r.isBod) {
            return `<div class="sc-row bod">
                <div class="sc-c name">BOD <span class="sc-sub">(damage)</span></div>
                <div class="sc-c">${fmt(r.z1)}</div>
                <div class="sc-c">${fmt(r.z2)}</div>
                <div class="sc-c">—</div>
                <div class="sc-c">—</div>
                <div class="sc-c">${fmt(r.wid)}</div>
            </div>`;
        }
        return `<div class="sc-row">
            <div class="sc-c name"><span class="sc-ord">${r.order}</span> ${r.name}<span class="sc-sub">${r.type}</span></div>
            <div class="sc-c">${fmt(r.z1)}</div>
            <div class="sc-c">${fmt(r.z2)}</div>
            <div class="sc-c"><input type="number" class="sc-ov" min="0" value="${r.ovSpan}" onchange="onScarfOverlap(${r.idx},'span',this.value)"></div>
            <div class="sc-c"><input type="number" class="sc-ov" min="0" value="${r.ovChord}" onchange="onScarfOverlap(${r.idx},'chord',this.value)"></div>
            <div class="sc-c">${fmt(r.wid)}</div>
        </div>`;
    }).join('');
    wrap.innerHTML = head + body;
}

// Nested-rectangle top-view (Z horizontal, X vertical). BOD innermost.
function renderScarfDrawing(rows) {
    const W = 340, H = 240, pad = 28;
    const allZ1 = rows.map(r => r.z1), allZ2 = rows.map(r => r.z2);
    const allX1 = rows.map(r => r.x1), allX2 = rows.map(r => r.x2);
    const zMin = Math.min(...allZ1), zMax = Math.max(...allZ2);
    const xMin = Math.min(...allX1), xMax = Math.max(...allX2);
    const zSpan = (zMax - zMin) || 1, xSpan = (xMax - xMin) || 1;
    const sx = (W - 2 * pad) / zSpan, sy = (H - 2 * pad) / xSpan;
    const px = z => pad + (z - zMin) * sx;
    const py = x => H - pad - (x - xMin) * sy;  // invert so larger X is up

    // color ramp from outer (light) to inner (dark blue)
    const colors = ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#143a5f'];
    let svg = `<svg viewBox="0 0 ${W} ${H}" class="scarf-svg" xmlns="http://www.w3.org/2000/svg">`;
    // draw outermost first so inner ones layer on top
    for (let i = rows.length - 1; i >= 0; i--) {
        const r = rows[i];
        const x = px(r.z1), y = py(r.x2), w = (r.z2 - r.z1) * sx, h = (r.x2 - r.x1) * sy;
        const fill = r.isBod ? '#ef4444' : colors[Math.min(i - 1, colors.length - 1)];
        const op = r.isBod ? '0.85' : '0.55';
        svg += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1, w).toFixed(1)}" height="${Math.max(1, h).toFixed(1)}" fill="${fill}" fill-opacity="${op}" stroke="#1e293b" stroke-width="0.6"/>`;
        // order label at top-left corner of each layer ring
        if (!r.isBod) {
            svg += `<text x="${(x + 2).toFixed(1)}" y="${(y + 9).toFixed(1)}" font-size="8" font-family="Inter" fill="#0f172a" font-weight="700">${r.order}</text>`;
        }
    }
    // axes labels
    svg += `<text x="${W / 2}" y="${H - 6}" font-size="9" font-family="Inter" fill="#64748b" text-anchor="middle">Z (spanwise, mm) →</text>`;
    svg += `<text x="10" y="${H / 2}" font-size="9" font-family="Inter" fill="#64748b" text-anchor="middle" transform="rotate(-90 10 ${H / 2})">X (chordwise, mm) →</text>`;
    svg += `</svg>`;
    document.getElementById('m-scarf-drawing').innerHTML = svg;
}

// Side-section staircase of the scarf ramp (Z horizontal, build height up).
function renderScarfRampDrawing(rows) {
    const W = 340, H = 240, pad = 30;
    const zMin = Math.min(...rows.map(r => r.z1));
    const zMax = Math.max(...rows.map(r => r.z2));
    const zSpan = (zMax - zMin) || 1;
    const sx = (W - 2 * pad) / zSpan;
    const px = z => pad + (z - zMin) * sx;
    const n = rows.length;
    const bandH = (H - 2 * pad) / n;
    const colors = ['#dbeafe', '#bfdbfe', '#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#143a5f'];
    let svg = `<svg viewBox="0 0 ${W} ${H}" class="scarf-svg" xmlns="http://www.w3.org/2000/svg">`;
    rows.forEach((r, i) => {
        const yTop = H - pad - (i + 1) * bandH;
        const x = px(r.z1), w = (r.z2 - r.z1) * sx;
        const fill = r.isBod ? '#ef4444' : colors[Math.min(i - 1, colors.length - 1)];
        svg += `<rect x="${x.toFixed(1)}" y="${yTop.toFixed(1)}" width="${Math.max(1, w).toFixed(1)}" height="${(bandH - 0.8).toFixed(1)}" fill="${fill}" fill-opacity="0.7" stroke="#1e293b" stroke-width="0.5"/>`;
        if (!r.isBod) svg += `<text x="${(x + 2).toFixed(1)}" y="${(yTop + bandH - 2).toFixed(1)}" font-size="7.5" font-family="Inter" fill="#0f172a" font-weight="700">${r.order}</text>`;
    });
    // scarf ramp envelope (connect the outer ends → shows the angle)
    const leftPts = rows.map((r, i) => `${px(r.z1).toFixed(1)},${(H - pad - (i + 0.5) * bandH).toFixed(1)}`).join(' ');
    const rightPts = rows.map((r, i) => `${px(r.z2).toFixed(1)},${(H - pad - (i + 0.5) * bandH).toFixed(1)}`).join(' ');
    svg += `<polyline points="${leftPts}" fill="none" stroke="#dc2626" stroke-width="1" stroke-dasharray="3 2"/>`;
    svg += `<polyline points="${rightPts}" fill="none" stroke="#dc2626" stroke-width="1" stroke-dasharray="3 2"/>`;
    svg += `<text x="${W / 2}" y="${H - 6}" font-size="9" font-family="Inter" fill="#64748b" text-anchor="middle">Z (spanwise, mm) →</text>`;
    svg += `<text x="10" y="${H / 2}" font-size="9" font-family="Inter" fill="#64748b" text-anchor="middle" transform="rotate(-90 10 ${H / 2})">build (plies) ↑</text>`;
    const cap = SCARF.staggerByType ? 'stagger by fabric type' : `angle ${SCARF.angle}° · step ${scarfAngleStep()}mm/ply`;
    svg += `<text x="${W - 6}" y="14" font-size="8" font-family="Inter" fill="#94a3b8" text-anchor="end">${cap}</text>`;
    svg += `</svg>`;
    document.getElementById('m-scarf-drawing').innerHTML = svg;
}

function renderScarfRampTable(rows) {
    const wrap = document.getElementById('m-scarf-table');
    const head = `
        <div class="sc-row sc-head">
            <div class="sc-c name">Layer</div>
            <div class="sc-c">Step</div>
            <div class="sc-c">Z start</div>
            <div class="sc-c">Z end</div>
            <div class="sc-c">Length</div>
        </div>`;
    const body = rows.map(r => {
        if (r.isBod) {
            return `<div class="sc-row bod">
                <div class="sc-c name">BOD <span class="sc-sub">(damage)</span></div>
                <div class="sc-c">—</div>
                <div class="sc-c">${fmt(r.z1)}</div>
                <div class="sc-c">${fmt(r.z2)}</div>
                <div class="sc-c">${fmt(r.len)}</div>
            </div>`;
        }
        return `<div class="sc-row">
            <div class="sc-c name"><span class="sc-ord">${r.order}</span> ${r.name}<span class="sc-sub">${r.type}</span></div>
            <div class="sc-c">${fmt(r.step)}</div>
            <div class="sc-c">${fmt(r.z1)}</div>
            <div class="sc-c">${fmt(r.z2)}</div>
            <div class="sc-c">${fmt(r.len)}</div>
        </div>`;
    }).join('');
    wrap.innerHTML = head + body;
}

// ============================================================
// EXPORTS
// ============================================================

// AutoCAD script (.scr): one closed PLINE per layer + a TEXT label.
// Mirrors the CAD 1 sheet (pline + -Text commands).
function buildCadScript(rows) {
    const lines = [];
    rows.forEach(r => {
        lines.push('PLINE');
        lines.push(`${r.z1},${r.x1}`);
        lines.push(`${r.z2},${r.x1}`);
        lines.push(`${r.z2},${r.x2}`);
        lines.push(`${r.z1},${r.x2}`);
        lines.push('C');                       // close polyline
        // label near the layer's start corner
        const label = (r.isBod ? 'BOD' : `${r.order}-${r.name}`).replace(/\s+/g, '_');
        lines.push('-TEXT');
        lines.push(`${r.z1},${r.x2}`);         // insertion point
        lines.push('30');                      // text height
        lines.push('0');                       // rotation
        lines.push(label);
    });
    lines.push('ZOOM');
    lines.push('E');
    return lines.join('\n') + '\n';
}

// Ramp CAD: rectangles in the (Z, build-height) section plane.
function buildCadScriptRamp(rows) {
    const lines = [];
    rows.forEach(r => {
        lines.push('PLINE');
        lines.push(`${r.z1},${r.y0}`);
        lines.push(`${r.z2},${r.y0}`);
        lines.push(`${r.z2},${r.y1}`);
        lines.push(`${r.z1},${r.y1}`);
        lines.push('C');
        const label = (r.isBod ? 'BOD' : `${r.order}-${r.name}`).replace(/\s+/g, '_');
        lines.push('-TEXT');
        lines.push(`${r.z1},${r.y1}`);
        lines.push('5');
        lines.push('0');
        lines.push(label);
    });
    lines.push('ZOOM'); lines.push('E');
    return lines.join('\n') + '\n';
}

function downloadCadScript() {
    const rows = SCARF.mode === 'ramp' ? computeScarfRamp() : computeScarf();
    const txt = SCARF.mode === 'ramp' ? buildCadScriptRamp(rows) : buildCadScript(rows);
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Escalonamento_${M.blade}_${M.so || 'UNKNOWN'}.scr`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    toast('CAD script (.scr) downloaded.', 'ok');
}

function scarfExportPayload() {
    const meta = {
        blade: M.blade, region: M.region,
        length: M.length, width: M.width,
        z0: SCARF.z0 || 0, chord_ref: SCARF.chordRef,
        service_order: M.so, cir: M.cir,
        mode: SCARF.mode,
    };
    if (SCARF.mode === 'ramp') {
        meta.angle = SCARF.angle; meta.ply_thickness = SCARF.plyThk;
        meta.stagger_by_type = SCARF.staggerByType;
        const rows = computeScarfRamp();
        return {
            meta,
            columns: ['Layer', 'Fabric', 'Step', 'Z start', 'Z end', 'Length', 'Height start', 'Height end', 'Order'],
            rows: rows.map(r => [r.isBod ? 'BOD' : r.name, r.type, r.step, r.z1, r.z2, r.len, r.y0, r.y1, r.order]),
        };
    }
    const rows = computeScarf();
    return {
        meta,
        columns: ['Layer', 'Fabric', 'Z start', 'Z end', 'Length', 'X1', 'X2', 'Width', 'Ov.span', 'Ov.chord', 'Order'],
        rows: rows.map(r => [
            r.isBod ? 'BOD' : r.name, r.type,
            r.z1, r.z2, r.len, r.x1, r.x2, r.wid,
            r.ovSpan, r.ovChord, r.order,
        ]),
    };
}

async function scarfExport(kind) {
    const btn = document.getElementById(kind === 'pdf' ? 'm-scarf-pdf' : 'm-scarf-excel');
    const orig = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<span class="m-spin"></span>';
    try {
        const resp = await fetch(`/api/scarf-export?fmt=${kind === 'pdf' ? 'pdf' : 'xlsx'}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(scarfExportPayload()),
        });
        if (!resp.ok) throw new Error('Server ' + resp.status);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Escalonamento_${M.blade}_${M.so || 'UNKNOWN'}.${kind === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        toast(`${kind.toUpperCase()} downloaded.`, 'ok');
    } catch (e) {
        console.error(e);
        toast('Export failed: ' + e.message, 'err');
    } finally {
        btn.disabled = false; btn.innerHTML = orig;
    }
}

function renderScarfActionBar() {
    document.getElementById('m-actionbar').innerHTML = `
        <button class="btn btn-ghost" onclick="closeScarf()"><i class="bi bi-arrow-left"></i></button>
        <button class="btn btn-ghost btn-half" id="m-scarf-cad" onclick="downloadCadScript()"><i class="bi bi-vector-pen"></i> CAD</button>
        <button class="btn btn-accent btn-half" id="m-scarf-excel" onclick="scarfExport('excel')"><i class="bi bi-file-earmark-spreadsheet"></i> Excel</button>
        <button class="btn btn-primary btn-half" id="m-scarf-pdf" onclick="scarfExport('pdf')"><i class="bi bi-file-earmark-pdf"></i> PDF</button>`;
}
