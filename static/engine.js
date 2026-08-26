// ============================================================
// ENGINE.JS - Core calculation engine
// Mirrors 100% the logic from Blade_Repair_Materials_Estimate REV05.xlsx
//
// REV04 -> REV05 changes implemented here:
//   1. Blades_Fabrics filter: SPL, CFM50, CORE and BALSA are emitted into
//      the BOM only when the selected blade model lists the material in
//      BLADE_MATERIAL_MAP AND the user actually placed it as a layer.
//      Pre-REV05, SPL/CFM were emitted whenever splAreaM2 > 0, which
//      polluted the BOM of V82/V90/V100/V112 (none support SPL or CFM).
//   2. CORE quantity formula switched to area-based:
//        qty = ceil(coreAreaM2 / kitAreaM2)
//      where Grade B kit = 2.4 m^2 (REV05 Materials!J90) and Grade F
//      (Root) kit = 1.0 m^2. coreWeightKg is still computed because the
//      AMPREG 30 chemical row consumes weight, not area.
// ============================================================

/**
 * Compute the LAYUP table from damage data + layer data.
 * This mirrors the LAYUP sheet formulas exactly.
 * 
 * @param {Object} damageData - { rstart, rend, x1, x2, chordRef }
 * @param {Array} layers - [{ layerName, materialType, gsm, order }]
 * @returns {Object} { layupRows, maxLength, maxWidth, maxAreaM2, totalFabricWeightKg, coreWeightKg, splAreaM2, perimeter }
 */
function computeLayup(damageData, layers) {
    const { rstart, rend, x1, x2 } = damageData;
    const bodLength = Math.abs(rend - rstart);
    const bodWidth = Math.abs(x2 - x1);

    // BOD row (row 20 in LAYUP sheet)
    // Excel: E20=Rstart, F20=Rend, H20=X1, I20=X2, J20=Width(=ABS(X2-X1))
    // IMPORTANT: X1 and X2 must NOT be swapped. Column H stores X1 as-entered
    // (decreases via MIN), column I stores X2 as-entered (increases via MAX).
    const bod = {
        layer: 'BOD',
        materialType: '-',
        gsm: '-',
        r1: Math.min(rstart, rend),
        r2: Math.max(rstart, rend),
        length: bodLength,
        h1: x1,
        h2: x2,
        width: bodWidth,
        area: bodLength * bodWidth,
        weight: null,
        isBod: true
    };

    const layupRows = [bod];

    // Excel formulas for each layer row:
    //   E(n) = MIN($E$20:E(n-1)) - VLOOKUP(fabricKey, overlaps, 2)  [span overlap]
    //   F(n) = MAX($F$20:F(n-1)) + VLOOKUP(fabricKey, overlaps, 2)  [span overlap]
    //   H(n) = MIN($H$20:H(n-1)) - VLOOKUP(fabricKey, overlaps, 3)  [chord overlap]
    //   I(n) = MAX($I$20:I(n-1)) + VLOOKUP(fabricKey, overlaps, 3)  [chord overlap]
    //   G(n) = F(n) - E(n)                                          [length]
    //   J(n) = I(n) - H(n)                                          [width]
    //   M(n) = ABS(G(n) * J(n))                                     [area mm²]
    //   N(n) = (GSM/1000) * M(n) * 10^-6                            [weight kg]

    let allE = [bod.r1];
    let allF = [bod.r2];
    let allH = [bod.h1];
    let allI = [bod.h2];

    for (const layer of layers) {
        if (!layer.materialType || layer.materialType === '') continue;

        // Build the fabric key: CONCAT(materialType, gsm) e.g. "TRIAX1500"
        let fabricKey;
        if (layer.materialType === 'CORE' || layer.materialType === 'SPL' || layer.materialType === 'CFM50') {
            fabricKey = layer.materialType;
        } else {
            fabricKey = layer.materialType + (layer.gsm || '');
        }

        // Lookup standard overlaps (norm 0149-9754 §12). Fall back to the
        // percentage-of-gsm formula for any fabric not in the fixed table
        // (e.g. HM or pending REV06 fabrics) so overlaps stay correct.
        let overlap = STANDARD_OVERLAPS[fabricKey];
        if (!overlap && typeof computeFiberOverlap === 'function') {
            const f = computeFiberOverlap(layer.materialType, layer.gsm);
            if (f && f.span !== null) overlap = f;
        }
        overlap = overlap || { span: 0, chord: 0 };

        // E = MIN(all previous E values) - spanOverlap
        const minE = Math.min(...allE);
        let r1 = minE - overlap.span;

        // F = MAX(all previous F values) + spanOverlap
        const maxF = Math.max(...allF);
        let r2 = maxF + overlap.span;

        // H = MIN(all previous H values) - chordOverlap
        const minH = Math.min(...allH);
        let h1 = minH - overlap.chord;

        // I = MAX(all previous I values) + chordOverlap
        const maxI = Math.max(...allI);
        let h2 = maxI + overlap.chord;

        // Manual per-layer overrides (drawing-specific geometry). The automation
        // expands the chord symmetrically, but real repairs referenced on an edge
        // (TE/LE) apply drawing-specific X1/X2 offsets that automation can't infer
        // — the Lamination Plan Sketch instructs "set X1 accordingly". When an
        // override is provided it replaces the computed value AND feeds the
        // accumulators, so later layers build on the corrected geometry.
        const _num = v => (v !== undefined && v !== null && v !== '' && !isNaN(v)) ? Number(v) : null;
        const ovR1 = _num(layer.ovR1), ovR2 = _num(layer.ovR2);
        const ovX1 = _num(layer.ovX1), ovX2 = _num(layer.ovX2);
        if (ovR1 !== null) r1 = ovR1;
        if (ovR2 !== null) r2 = ovR2;
        if (ovX1 !== null) h1 = ovX1;
        if (ovX2 !== null) h2 = ovX2;

        const length = r2 - r1;
        const width = h2 - h1;
        const area = Math.abs(length * width);
        const gsmNum = parseFloat(layer.gsm) || 0;
        // Weight = (GSM/1000) * area * 10^-6  (area in mm², weight in kg)
        const weight = gsmNum > 0 ? (gsmNum / 1000) * area * 1e-6 : null;

        layupRows.push({
            layer: layer.layerName || '',
            materialType: layer.materialType,
            gsm: layer.gsm || '',
            fabricKey,
            r1, r2, length,
            h1, h2, width,
            area,
            weight,
            isBod: false,
            overridden: {
                r1: ovR1 !== null, r2: ovR2 !== null,
                x1: ovX1 !== null, x2: ovX2 !== null,
            }
        });

        allE.push(r1);
        allF.push(r2);
        allH.push(h1);
        allI.push(h2);
    }

    // Aggregate statistics needed for BOM calculations
    // Excel uses MAX(LAYUP!$G$18:$G$70) which includes BOD row
    const maxLength = Math.max(...layupRows.map(r => r.length));
    const maxWidth = Math.max(...layupRows.map(r => r.width));
    const maxAreaM2 = maxLength * maxWidth * 1e-6;

    const dataRows = layupRows.filter(r => !r.isBod);

    // Total fabric weight: sum of LAYUP N column for rows with valid GSM
    // Excludes CORE (has no GSM weight) and SPL (has no GSM weight)
    let totalFabricWeightKg = 0;
    let coreWeightKg = 0;
    let coreAreaM2 = 0;

    for (const row of dataRows) {
        if (row.weight !== null && row.materialType !== 'CORE' && row.materialType !== 'SPL') {
            totalFabricWeightKg += row.weight;
        }
        if (row.materialType === 'CORE') {
            const rowAreaM2 = row.area * 1e-6;
            coreAreaM2 += rowAreaM2;
            // Weight retained for AMPREG 30 calc (mirrors Fabrics_aux pre-REV05).
            // thickness = 40mm = 0.04m; density Grade B = 115 kg/m³.
            coreWeightKg += rowAreaM2 * 0.04 * 115;
        }
    }

    // SPL area: Fabrics_aux R28 = (MAX_Length+200)*(MAX_Width+200)*1e-6
    const splAreaM2 = (maxLength + 200) * (maxWidth + 200) * 1e-6;

    // Perimeter (Q77): (2*(MAX_Length + MAX_Width) + 4*P77) / 1000
    // P77 = 100mm (sealant margin)
    const sealantMargin = 100;
    const perimeter = (2 * (maxLength + maxWidth) + 4 * sealantMargin) / 1000;

    // Area with margin for SikaForce 7800, TopCoat formulas:
    // (200+MAX_Length) * (200+MAX_Width) * 1e-6
    const areaWithMarginM2 = (200 + maxLength) * (200 + maxWidth) * 1e-6;

    // Cleaning area for Cloth harpix, Paper tork, Rubbish bag:
    // Excel H60/H61/H63: (200 + MAX_Length * (200 + MAX_Width)) * 1e-6
    // Note: different parenthesization from areaWithMarginM2!
    const cleaningAreaM2 = (200 + maxLength * (200 + maxWidth)) * 1e-6;

    return {
        layupRows,
        maxLength,
        maxWidth,
        maxAreaM2,
        totalFabricWeightKg,
        coreWeightKg,
        coreAreaM2,
        splAreaM2,
        perimeter,
        areaWithMarginM2,
        cleaningAreaM2
    };
}

/**
 * REV05 Blades_Fabrics filter: returns true when the given materialKey
 * is listed in BLADE_MATERIAL_MAP for the supplied bladeModel.
 * Used to keep SPL / CFM50 / CORE / BALSA out of BOMs of blades that
 * don't support them (regression fix from REV04).
 */
function bladeSupports(bladeModel, materialKey) {
    const allowed = BLADE_MATERIAL_MAP[bladeModel];
    if (!allowed) return false;
    return allowed.some(m => {
        if (materialKey === 'CFM50') return m.materialType === 'CFM50';
        if (materialKey === 'SPL')   return m.materialType === 'SPL';
        if (materialKey === 'CORE')  return m.materialType === 'CORE';
        if (materialKey === 'BALSA') return m.materialType === 'BALSA';
        return false;
    });
}

/** True when the user actually placed a layer of materialType in the layup. */
function layupContainsMaterial(layupRows, materialType) {
    return layupRows.some(r => !r.isBod && r.materialType === materialType);
}

/**
 * Group layup fabric weights by fabricKey for the Fabrics_aux SUMIF calculations.
 * Mirrors Fabrics_aux H17:H26 formulas: SUMIF(LAYUP!A:A, fabricName, LAYUP!N:N) * factor
 */
function computeFabricWeights(layupRows) {
    const weights = {};
    for (const row of layupRows) {
        if (row.isBod || !row.fabricKey) continue;
        if (!weights[row.fabricKey]) weights[row.fabricKey] = 0;
        if (row.weight !== null) {
            weights[row.fabricKey] += row.weight;
        }
    }
    return weights;
}

/**
 * Compute fabric BOM items.
 * This mirrors Fabrics_aux sheet (H17:H29) and Materials sheet (rows 78-90).
 * @param {Object} layupResult - from computeLayup
 * @param {string} bladeModel - e.g. 'V150'
 * @param {Object} repairSteps - { Infusion, ... } needed for SPL factor
 * @param {string} bladeRegion - e.g. 'Root', 'Middle', 'Tip'
 */
function computeFabricsBOM(layupResult, bladeModel, repairSteps, bladeRegion) {
    const fabricWeights = computeFabricWeights(layupResult.layupRows);
    // HM-glass blades use the HM fabric catalog (FABRICS_DB.V150).
    // V150 and V162 (Vidar F3) are both HM blades.
    const isV150 = bladeModel === 'V150' || bladeModel === 'V162';
    const factor = 1.2; // All standard fabrics have factor 1.2
    const infusionSteps = (repairSteps && repairSteps.Infusion) || 1;

    const items = [];

    // Fabric types iterated in BOM emission. Source: REV05 Fabrics_aux!G17:G29
    // (10 fabric SUMIF rows) — exactly the fabrics REV05 has formulas for.
    // Order is for repeatable BOM output; presence is what matters.
    const fabricTypes = [
        'BIAX200', 'BIAX450', 'BIAX600', 'BIAX1200', 'BIAX936', 'BIAX1000',
        'UD1200', 'UD1140', 'UD900', 'UD600',
        'TRIAX1200', 'TRIAX1500'
    ];

    for (const fKey of fabricTypes) {
        const weightKg = (fabricWeights[fKey] || 0) * factor;
        if (weightKg <= 0) continue;

        // Look up fabric in the appropriate catalog for this blade model
        let fabricInfo;
        if (isV150) {
            fabricInfo = FABRICS_DB.V150[fKey];
        } else {
            fabricInfo = FABRICS_DB.standard[fKey];
        }

        if (!fabricInfo) {
            // Fabric exists in layup but is not in this blade's catalog.
            // Emit a visible warning item instead of silently dropping it.
            items.push({
                sap: 'CATALOG MISMATCH',
                desc: `${fKey} - not in ${bladeModel} catalog. Verify blade design doc.`,
                material: fKey,
                qty: Math.ceil(weightKg),
                unit: 'KG',
                materialUse: 'Lamination',
                note: `Weight: ${weightKg.toFixed(3)} kg`
            });
            continue;
        }

        // REV05 formula:
        //   Standard UD1200 (M²): qty = ROUNDUP(weightKg * kgPerUnit, 0)  ← multiply
        //   All other fabrics:     qty = ROUNDUP(weightKg / kgPerUnit, 0)  ← divide
        const qty = fabricInfo.multiplyQty
            ? Math.ceil(weightKg * fabricInfo.kgPerUnit)
            : Math.ceil(weightKg / fabricInfo.kgPerUnit);

        items.push({
            sap: fabricInfo.sap,
            desc: fabricInfo.desc,
            material: fKey,
            qty: qty,
            unit: fabricInfo.unit,
            materialUse: 'Lamination',
            note: `Weight: ${weightKg.toFixed(3)} kg`
        });
    }

    // CFM50 — REV05 fix: only emit if the blade supports it AND the user added
    // CFM50 as a layer. Pre-REV05, CFM was emitted whenever splAreaM2 > 0,
    // which polluted the BOM of V82/V90/V100/V112 (no CFM50 in their catalog).
    // H27 = IF(SPL_area * 1.5 * 0.05 < 0.1, 0.1, 0.5)
    if (bladeSupports(bladeModel, 'CFM50') &&
        layupContainsMaterial(layupResult.layupRows, 'CFM50')) {
        const cfmWeight = layupResult.splAreaM2 * 1.5 * 0.05;
        const cfmQty = cfmWeight < 0.1 ? 0.1 : 0.5;
        items.push({
            sap: FABRICS_SPECIAL.CFM50.sap,
            desc: FABRICS_SPECIAL.CFM50.desc,
            material: 'CFM50',
            qty: cfmQty,
            unit: 'KG',
            materialUse: 'Infusion',
            note: 'Surface veil'
        });
    }

    // SPL — REV05 fix: only emit if the blade supports it AND the user added
    // SPL as a layer. splAreaM2 itself is still computed for use by other
    // formulas (bagging film, release film), but the SPL line is filtered.
    // Fabrics_aux J28 = B11*1.5 where B11 = Infusion steps
    if (bladeSupports(bladeModel, 'SPL') &&
        layupContainsMaterial(layupResult.layupRows, 'SPL')) {
        const splInfusionFactor = infusionSteps * 1.5;
        const splQty = Math.ceil(layupResult.splAreaM2 * splInfusionFactor / FABRICS_SPECIAL.SPL.rollArea);
        if (splQty > 0) {
            items.push({
                sap: FABRICS_SPECIAL.SPL.sap,
                desc: FABRICS_SPECIAL.SPL.desc,
                material: 'SPL',
                qty: Math.max(1, splQty),
                unit: 'EA',
                materialUse: 'Infusion',
                note: `SPL area: ${layupResult.splAreaM2.toFixed(3)} m²`
            });
        }
    }

    // BALSA — REV05 fix: must be supported by the blade AND present in layup.
    // BALSA has no GSM weight so it never appears in fabricWeights.
    if (bladeSupports(bladeModel, 'BALSA') &&
        layupContainsMaterial(layupResult.layupRows, 'BALSA')) {
        items.push({
            sap: FABRICS_SPECIAL.BALSA.sap,
            desc: FABRICS_SPECIAL.BALSA.desc,
            material: 'BALSA',
            qty: 1,
            unit: 'EA',
            materialUse: 'HLU',
            note: 'Manual order — no SAP assigned (TBD)'
        });
    }

    // CORE — REV05 formula: qty = ROUNDUP(core_area_m² / kit_area_m², 0).
    // Grade B kit = 2.4 m² (11 kg ÷ 115 kg/m³ ÷ 0.04 m thickness).
    // Grade F kit (Root) = 1.0 m² (10 kg ÷ 250 kg/m³ ÷ 0.04 m).
    // Pre-REV05 used weight/kitKg — mathematically equivalent but the area-
    // based form is what Materials!H90 reads (J90 = 2.4 in REV05).
    if (bladeSupports(bladeModel, 'CORE') && layupResult.coreAreaM2 > 0) {
        const isRoot = bladeRegion === 'Root';
        const coreSpec = isRoot ? FABRICS_SPECIAL.CORE_ROOT : FABRICS_SPECIAL.CORE;
        const coreQty = Math.ceil(layupResult.coreAreaM2 / coreSpec.kitAreaM2);
        items.push({
            sap: coreSpec.sap,
            desc: coreSpec.desc,
            material: 'CORE',
            qty: Math.max(1, coreQty),
            unit: 'EA',
            materialUse: 'HLU',
            note: `Core area: ${layupResult.coreAreaM2.toFixed(3)} m² (${layupResult.coreWeightKg.toFixed(3)} kg)`
        });
    }

    return items;
}

/**
 * Estimate the repair duration in whole days from the lamination stack.
 *
 * Uses REPAIR_DAY_RULES. Plies are laminated one lamination per day (max 6
 * plies each) because every lamination needs a cure of several hours. Plies
 * before and after the core are always separate lamination days.
 *
 * @param {Array} layers - [{ materialType, gsm, ... }] in lamination order
 * @param {boolean} isExternal - external repairs add a painting day
 * @returns {Object} { totalDays, breakdown } — breakdown is informational only
 */
function computeRepairDays(layers, isExternal) {
    const R = (typeof REPAIR_DAY_RULES !== 'undefined') ? REPAIR_DAY_RULES : {
        LAYERS_PER_LAM_DAY: 6, SANDING_MEASURE_DAYS: 1, CORE_DAY: 1,
        PAINTING_DAY: 1, CONTINGENCY_DAYS: 1,
    };
    const per = R.LAYERS_PER_LAM_DAY;

    const stack = (layers || []).filter(l => l && l.materialType);
    const coreIdxFirst = stack.findIndex(l => l.materialType === 'CORE');
    let coreIdxLast = -1;
    for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].materialType === 'CORE') { coreIdxLast = i; break; }
    }
    const hasCore = coreIdxFirst !== -1;

    // Fabric plies (exclude the CORE ply itself) before / after the core block.
    const isPly = l => l.materialType !== 'CORE';
    let pliesBeforeCore, pliesAfterCore;
    if (hasCore) {
        pliesBeforeCore = stack.slice(0, coreIdxFirst).filter(isPly).length;
        pliesAfterCore = stack.slice(coreIdxLast + 1).filter(isPly).length;
    } else {
        pliesBeforeCore = stack.filter(isPly).length;
        pliesAfterCore = 0;
    }

    const lamDaysBefore = Math.ceil(pliesBeforeCore / per);
    const lamDaysAfter = Math.ceil(pliesAfterCore / per);
    const coreDays = hasCore ? R.CORE_DAY : 0;
    const paintingDays = isExternal ? R.PAINTING_DAY : 0;

    const breakdown = {
        sandingMeasure: R.SANDING_MEASURE_DAYS,
        laminationBeforeCore: lamDaysBefore,
        core: coreDays,
        laminationAfterCore: lamDaysAfter,
        painting: paintingDays,
        contingency: R.CONTINGENCY_DAYS,
        pliesBeforeCore, pliesAfterCore, hasCore,
    };

    const totalDays =
        R.SANDING_MEASURE_DAYS +
        lamDaysBefore +
        coreDays +
        lamDaysAfter +
        paintingDays +
        R.CONTINGENCY_DAYS;

    return { totalDays, breakdown };
}

/**
 * Compute full BOM given all inputs.
 */
// paintScheme: { base: 'RAL7035'|'RAL9010', stripe: 'RAL3020'|'RAL2009'|null }
// Opcional — omitido, usa DEFAULT_PAINT_SCHEME (cinza + faixa vermelha), que
// era o comportamento fixo antes de a escolha de pintura existir.
function computeFullBOM(damageData, layers, repairSteps, bladeModel, bladeRegion, daysOfRepair, paintScheme) {
    // 1. Compute LAYUP
    const layupResult = computeLayup(damageData, layers);

    // 2. Build steps object
    const steps = {
        Cleaning: repairSteps.Cleaning || 0,
        Grinding: repairSteps.Grinding || 0,
        Bonding: repairSteps.Bonding || 0,
        Lamination: repairSteps.Lamination || 0,
        HLU: repairSteps.HLU || 0,
        Infusion: repairSteps.Infusion || 0,
        Weighing: repairSteps.Weighing || 0,
        Vacuum: (repairSteps.HLU || 0) + (repairSteps.Infusion || 0),
        Painting: repairSteps.Painting || 0,
        LEP: repairSteps.LEP || 0,
    };

    // 3. Compute Fabrics BOM
    const fabricItems = computeFabricsBOM(layupResult, bladeModel, steps, bladeRegion);

    // 4. Compute PPE
    const ppeItems = PPE_ITEMS.map(item => ({
        sap: item.sap,
        desc: item.desc,
        unit: item.unit,
        qty: item.calcQty(steps, daysOfRepair),
        materialUse: item.materialUse
    })).filter(i => i.qty > 0);

    // 5. Compute Consumable Tools
    const consumToolItems = CONSUMABLE_TOOLS.map(item => ({
        sap: item.sap,
        desc: item.desc,
        unit: item.unit,
        qty: item.calcQty(steps, daysOfRepair, layupResult),
        materialUse: 'Consumable Tool'
    })).filter(i => i.qty > 0);

    // 6. Compute Chemicals
    // O esquema de pintura decide a cor do top coat, então sap/desc podem ser
    // funções dele (ver TOPCOAT_COLORS em data.js).
    const paint = paintScheme || (typeof DEFAULT_PAINT_SCHEME !== 'undefined' ? DEFAULT_PAINT_SCHEME : { base: 'RAL7035', stripe: 'RAL3020' });
    const resolve = (v) => (typeof v === 'function' ? v(paint) : v);
    const chemItems = CHEMICALS.map(item => ({
        sap: resolve(item.sap),
        desc: resolve(item.desc),
        unit: item.unit,
        qty: item.calcQty(steps, daysOfRepair, layupResult, bladeRegion, paint),
        materialUse: item.materialUse || 'Chemical'
    })).filter(i => i.qty > 0);

    // 7. Compute Consumables
    const consumItems = CONSUMABLES.map(item => ({
        sap: item.sap,
        desc: item.desc,
        unit: item.unit,
        qty: item.calcQty(steps, daysOfRepair, layupResult),
        materialUse: 'Consumable'
    })).filter(i => i.qty > 0);

    // 8. Compute Tools
    const toolItems = TOOLS.map(item => ({
        sap: item.sap,
        desc: item.desc,
        unit: item.unit,
        subcat: item.subcat,
        qty: item.calcQty(steps),
        materialUse: 'Tool'
    })).filter(i => i.qty > 0);

    return {
        layupResult,
        fabricItems,
        ppeItems,
        consumToolItems,
        chemItems,
        consumItems,
        toolItems,
        steps,
        summary: {
            totalFabricItems: fabricItems.length,
            totalChemItems: chemItems.length,
            totalConsumToolItems: consumToolItems.length,
            totalConsumItems: consumItems.length,
            totalToolItems: toolItems.length,
            totalPPEItems: ppeItems.length,
            totalItems: fabricItems.length + chemItems.length + consumToolItems.length + consumItems.length + toolItems.length + ppeItems.length,
            maxLayupLength: layupResult.maxLength,
            maxLayupWidth: layupResult.maxWidth,
            maxAreaM2: layupResult.maxAreaM2,
            totalFabricWeight: layupResult.totalFabricWeightKg,
        }
    };
}
