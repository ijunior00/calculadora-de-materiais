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
};

function scarfDefaultOverlap(layer) {
    const key = ['CORE', 'SPL', 'CFM50', 'BALSA'].includes(layer.materialType)
        ? layer.materialType
        : layer.materialType + (layer.gsm || '');
    return STANDARD_OVERLAPS[key] || { span: 0, chord: 0 };
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

function renderScarf() {
    const rows = computeScarf();
    renderScarfDrawing(rows);
    renderScarfTable(rows);
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

function downloadCadScript() {
    const rows = computeScarf();
    const txt = buildCadScript(rows);
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
    const rows = computeScarf();
    return {
        meta: {
            blade: M.blade, region: M.region,
            length: M.length, width: M.width,
            z0: SCARF.z0 || 0, chord_ref: SCARF.chordRef,
            service_order: M.so, cir: M.cir,
        },
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
