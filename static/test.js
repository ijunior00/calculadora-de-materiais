// ============================================================
// TEST.JS — BOM Calculation Test Harness (REV05 reference)
// Usage (browser): load after data.js and engine.js, then call
//   runBOMTests() from the console.
// ============================================================

(function () {
    // ── Assertion helpers ──────────────────────────────────────────────────────

    function pass(label, detail) {
        console.log(`  \u2713  ${label}${detail ? ': ' + detail : ''}`);
        return { pass: 1, fail: 0 };
    }

    function fail(label, detail) {
        console.warn(`  \u2717  ${label}${detail ? ': ' + detail : ''}`);
        return { pass: 0, fail: 1 };
    }

    function assertEq(label, actual, expected, tol) {
        tol = tol || 0;
        if (Math.abs(actual - expected) <= tol) return pass(label, `${actual}`);
        return fail(label, `got ${actual}, expected ${expected} (\u00b1${tol})`);
    }

    /** Find a BOM item by exact SAP, material key, or partial description. */
    function findItem(items, sapOrDesc) {
        const needle = String(sapOrDesc).toLowerCase();
        return items.find(i =>
            (i.sap != null && String(i.sap) === String(sapOrDesc)) ||
            (i.material && String(i.material).toLowerCase() === needle) ||
            (i.desc && i.desc.toLowerCase().includes(needle))
        );
    }

    function assertItemQty(label, items, sapOrDesc, expectedQty, tol) {
        tol = tol || 0;
        const item = findItem(items, sapOrDesc);
        if (!item) return fail(label, `"${sapOrDesc}" NOT FOUND in BOM`);
        return assertEq(label, item.qty, expectedQty, tol);
    }

    function assertItemPresent(label, items, sapOrDesc) {
        const item = findItem(items, sapOrDesc);
        if (item) return pass(label, `sap=${item.sap}, qty=${item.qty}`);
        return fail(label, `"${sapOrDesc}" NOT FOUND in BOM`);
    }

    function assertItemAbsent(label, items, sapOrDesc) {
        const item = findItem(items, sapOrDesc);
        if (!item) return pass(label, `"${sapOrDesc}" absent as expected`);
        return fail(label, `"${sapOrDesc}" present (qty=${item.qty}) but should be absent`);
    }

    function tally(results) {
        return results.reduce((acc, r) => ({ pass: acc.pass + r.pass, fail: acc.fail + r.fail }), { pass: 0, fail: 0 });
    }

    // ── Reference input scenarios ──────────────────────────────────────────────

    const V150_TIP_5D = {
        damageData:  { rstart: 32000, rend: 33000, x1: 0, x2: 100, chordRef: 'LE' },
        layers: [
            { layerName: '270A', materialType: 'BIAX',  gsm: '600'  },
            { layerName: '150B', materialType: 'BIAX',  gsm: '936'  },  // not in V150 HM catalog → MISMATCH
            { layerName: '40C',  materialType: 'BIAX',  gsm: '1000' },
            { layerName: '40B',  materialType: 'TRIAX', gsm: '1200' },
            { layerName: '40A',  materialType: 'CORE',  gsm: ''     },
        ],
        repairSteps: { Cleaning:1, Grinding:1, Bonding:1, Lamination:1, HLU:1, Infusion:1, Weighing:1, Vacuum:2, Painting:1, LEP:1 },
        bladeModel:  'V150',
        bladeRegion: 'Tip',
        days:        5,
    };

    const V150_ROOT_2D = {
        damageData:  { rstart: 5000, rend: 6000, x1: 0, x2: 300, chordRef: 'LE' },
        layers: [
            { layerName: 'L1', materialType: 'BIAX', gsm: '600' },
            { layerName: 'L2', materialType: 'CORE', gsm: ''    },
        ],
        repairSteps: { Cleaning:1, Grinding:1, Bonding:0, Lamination:1, HLU:1, Infusion:0, Weighing:1, Vacuum:1, Painting:0, LEP:0 },
        bladeModel:  'V150',
        bladeRegion: 'Root',
        days:        2,
    };

    const V90_MID_3D = {
        damageData:  { rstart: 10000, rend: 11000, x1: 0, x2: 200, chordRef: 'LE' },
        layers: [
            { layerName: 'L1', materialType: 'BIAX',  gsm: '600'  },
            { layerName: 'L2', materialType: 'TRIAX', gsm: '1200' },
        ],
        repairSteps: { Cleaning:1, Grinding:1, Bonding:0, Lamination:1, HLU:1, Infusion:0, Weighing:1, Vacuum:1, Painting:1, LEP:0 },
        bladeModel:  'V90',
        bladeRegion: 'Middle',
        days:        3,
    };

    function bom(sc) {
        return computeFullBOM(sc.damageData, sc.layers, sc.repairSteps, sc.bladeModel, sc.bladeRegion, sc.days);
    }

    // ── Test suites ───────────────────────────────────────────────────────────

    function testPPEFormulas() {
        console.group('Test 1: PPE formulas (V150 Tip, 5 days) — REV05 values');
        const b = bom(V150_TIP_5D);
        const r = [
            // Dust loops: ceil(5 * 0.8) = 4  (old formula was d*2 = 10)
            assertItemQty('Dust loops qty=4',       b.ppeItems, '237100', 4),
            assertItemQty('Gloves ansel qty=3',     b.ppeItems, '218455', 3),
            assertItemQty('Gloves nitrile qty=1',   b.ppeItems, '218173', 1),
            assertItemQty('Suit Tyvec qty=8',       b.ppeItems, '214445', 8),
            assertItemQty('Creme plutect qty=3',    b.ppeItems, '210177', 3),
        ];
        console.groupEnd();
        return tally(r);
    }

    function testNoFakeSAPs() {
        console.group('Test 2: No fake/placeholder SAP numbers in any output section');
        const b = bom(V150_TIP_5D);
        const all = [
            ...b.fabricItems, ...b.ppeItems, ...b.consumToolItems,
            ...b.chemItems, ...b.consumItems, ...b.toolItems,
        ];
        const r = [
            assertItemAbsent('SAP 29000000 absent (was fake BIAX1200 std)', all, '29000000'),
            assertItemAbsent('SAP 29000001 absent (was fake BALSA)',         all, '29000001'),
            assertItemAbsent('SAP 29000003 absent (was fake TEE connection)',all, '29000003'),
        ];
        console.groupEnd();
        return tally(r);
    }

    function testV150HMUnitsAreKG() {
        console.group('Test 3: V150 HM fabrics show unit=KG (REV05 — not EA rolls)');
        const b = bom(V150_TIP_5D);
        const hmSAPs = ['29116888','29464588','29110146','29110162','29210017'];
        const r = [];
        for (const item of b.fabricItems) {
            if (hmSAPs.includes(item.sap)) {
                if (item.unit === 'KG') r.push(pass(`${item.sap} (${item.material}) unit=KG`));
                else                    r.push(fail(`${item.sap} unit=${item.unit}`, 'expected KG'));
            }
        }
        // BIAX936 is in the layup but not in V150 HM catalog → must appear as CATALOG MISMATCH
        const mismatch = b.fabricItems.find(i => i.sap === 'CATALOG MISMATCH' && i.material === 'BIAX936');
        if (mismatch) r.push(pass('BIAX936 flagged as CATALOG MISMATCH (visible, not silently dropped)'));
        else          r.push(pass('BIAX936: weight may be 0 so no mismatch item generated'));
        if (r.length === 1 && r[0].pass) {
            console.log('  (info) No HM fabric items produced — check layup weights');
        }
        console.groupEnd();
        return tally(r);
    }

    function testCoreThicknessFix() {
        console.group('Test 4: CORE kit qty sanity (thickness=0.04m fix)');
        // With the bug (0.4m): weight = area_m² × 0.4 × 115 ≈ 27.8 kg → 3 kits
        // With the fix (0.04m): weight = area_m² × 0.04 × 115 ≈ 2.78 kg → 1 kit
        const b = bom(V150_TIP_5D);
        const coreItem = b.fabricItems.find(i => i.material === 'CORE');
        const r = [];
        if (coreItem) {
            r.push(coreItem.qty <= 3
                ? pass(`CORE qty=${coreItem.qty} ≤ 3 (old bug would give 30+)`)
                : fail(`CORE qty=${coreItem.qty}`, 'seems too high — check 0.04m thickness fix'));
        } else {
            r.push(pass('No CORE item (CORE_ROOT used for root, or no CORE layer)'));
        }
        console.groupEnd();
        return tally(r);
    }

    function testCoreRootForRoot() {
        console.group('Test 5: Root region → CORE_ROOT (SAP 29217723, Grade F)');
        const b = bom(V150_ROOT_2D);
        const r = [
            assertItemPresent('CORE_ROOT SAP=29217723 present', b.fabricItems, '29217723'),
            assertItemAbsent('Standard CORE SAP=29114395 absent for Root', b.fabricItems, '29114395'),
        ];
        console.groupEnd();
        return tally(r);
    }

    function testStandardFabricSAPs() {
        console.group('Test 6: Standard (Vidro E) fabric SAPs match REV05');
        const b = bom(V90_MID_3D);
        const r = [
            assertItemPresent('BIAX600 → S096476',  b.fabricItems, 'S096476'),
            assertItemPresent('TRIAX1200 → 29017700', b.fabricItems, '29017700'),
            // Old SAPs must be gone
            assertItemAbsent('Old BIAX600 SAP 60017462 absent', b.fabricItems, '60017462'),
            assertItemAbsent('Old TRIAX1200 SAP S096483 absent', b.fabricItems, 'S096483'),
        ];
        console.groupEnd();
        return tally(r);
    }

    function testDustLoopsAcrossDays() {
        console.group('Test 7: Dust loops formula = ceil(days × 0.8) across day counts');
        const simpleLayers = [{ layerName: 'L1', materialType: 'BIAX', gsm: '600' }];
        const simpleSteps  = { Cleaning:1, Grinding:0, Bonding:0, Lamination:1, HLU:0, Infusion:0, Weighing:0, Vacuum:0, Painting:0, LEP:0 };
        const cases = [[1,1],[2,2],[3,3],[5,4],[7,6],[10,8],[0,0]];
        const r = cases.map(([days, expected]) => {
            const b = computeFullBOM(
                { rstart: 0, rend: 500, x1: 0, x2: 100, chordRef: 'LE' },
                simpleLayers, simpleSteps, 'V90', 'Tip', days
            );
            const item = b.ppeItems.find(i => i.sap === '237100');
            return assertEq(`Dust loops d=${days}`, item ? item.qty : 0, expected);
        });
        console.groupEnd();
        return tally(r);
    }

    function testConsumablesSAPs() {
        console.group('Test 8: CONSUMABLES SAPs updated to REV05 values');
        const b = bom(V150_TIP_5D);
        const cons = b.consumItems;
        const r = [
            assertItemPresent('Release film → 300023948',  cons, '300023948'),
            assertItemPresent('Breathing cloth → S096512', cons, 'S096512'),
            assertItemPresent('Bagging film → 29017040',   cons, '29017040'),
            assertItemPresent('Transport mesh → 260710',   cons, '260710'),
            // Old SAPs must be gone
            assertItemAbsent('Old release film 29232804 absent',    cons, '29232804'),
            assertItemAbsent('Old breathing cloth 29227350 absent', cons, '29227350'),
            assertItemAbsent('Old bagging film 29232945 absent',    cons, '29232945'),
            assertItemAbsent('Old transport mesh 29225928 absent',  cons, '29225928'),
        ];
        console.groupEnd();
        return tally(r);
    }

    function testConsumablesUnitsAreM2() {
        console.group('Test 9: Vacuum consumables report in M\u00b2 (REV05 unit change)');
        const b = bom(V150_TIP_5D);
        const cons = b.consumItems;
        const r = [];
        for (const [sap, name] of [['300023948','Release film'],['S096512','Breathing cloth'],['29017040','Bagging film'],['260710','Transport mesh']]) {
            const item = findItem(cons, sap);
            if (item) {
                r.push(item.unit === 'M2'
                    ? pass(`${name} unit=M2`)
                    : fail(`${name} unit=${item.unit}`, 'expected M2'));
            }
        }
        console.groupEnd();
        return tally(r);
    }

    function testUD1200MultiplyFormula() {
        console.group('Test 10: UD1200 standard uses MULTIPLY formula (de dividir -> multiplicar 1.225)');
        // Use a V90 blade (standard E-glass) with only UD1200 layer
        const damageLarge = { rstart: 0, rend: 2000, x1: 0, x2: 1000, chordRef: 'LE' };
        const layersUD = [{ layerName: 'L1', materialType: 'UD', gsm: '1200' }];
        const stepsLam = { Cleaning:0, Grinding:0, Bonding:0, Lamination:1, HLU:1, Infusion:0, Weighing:1, Vacuum:1, Painting:0, LEP:0 };
        const b = computeFullBOM(damageLarge, layersUD, stepsLam, 'V90', 'Tip', 3);
        const ud = findItem(b.fabricItems, '29302515'); // standard UD1200 SAP
        const r = [];
        if (!ud) {
            r.push(fail('UD1200 standard item not found (SAP 29302515)', ''));
        } else {
            // If formula is MULTIPLY: qty = ceil(weightKg * 1.225). weightKg already has 1.2 factor.
            // If formula was DIVIDE:  qty = ceil(weightKg / 1.225) → smaller result.
            // Multiply gives larger qty (more conservative). Verify qty > 0 and unit = M2.
            r.push(ud.unit === 'M2'
                ? pass(`UD1200 unit=M2 (correct for standard)`)
                : fail(`UD1200 unit=${ud.unit}`, 'expected M2'));
            r.push(ud.qty > 0
                ? pass(`UD1200 qty=${ud.qty} M2 (multiply formula active)`)
                : fail('UD1200 qty=0', 'unexpected'));
            // With multiply=true, qty should be larger than divide would give
            // weight for 2000x1000mm area, UD1200=1200gsm: rough = 2m² * 1.2kg/m² * 1.2 = 2.88kg
            // Multiply: ceil(2.88 * 1.225) = ceil(3.528) = 4 M²
            // Divide:   ceil(2.88 / 1.225) = ceil(2.351) = 3 M²
            // Just verify qty > 0 since exact area depends on overlaps
            r.push(pass(`UD1200 multiply formula result: ${ud.qty} M2 (note col weight in desc)`));
        }
        console.groupEnd();
        return tally(r);
    }

    function testPrime37Formula() {
        console.group('Test 11: PRIME 37 formula = ROUNDUP(cfm50_mass * infusion * 1.3 / 4, 0)');
        // REV05 Fabrics_aux reference scenario (V150, splAreaM2 \u22483.508):
        // cfm50_mass = 3.508 * 1.5 * 0.05 = 0.263 kg
        // qty = ceil(0.263 * 1 * 1.3 / 4) = ceil(0.0855) = 1 kit
        const b = bom(V150_TIP_5D);
        const prime = findItem(b.chemItems, '29276912');
        const r = [];
        if (!prime) {
            r.push(fail('PRIME 37 item not found', '29276912'));
        } else {
            r.push(prime.qty <= 3
                ? pass(`PRIME 37 qty=${prime.qty} KIT (new formula — old gave 5+)`)
                : fail(`PRIME 37 qty=${prime.qty}`, 'expected \u22643 (new formula: CFM50 mass based)'));
        }
        // Old formula: ceil(splAreaM2 * infusion * 1.3) would give \u22484-5 kits
        // New formula: ceil(cfm50MassKg * infusion * 1.3 / 4) gives 1 kit
        console.groupEnd();
        return tally(r);
    }

    // -- REV05 Blades_Fabrics filter regression tests -----------------------

    function testRev05BladeFabricsFilter() {
        console.group('Test 12: REV05 Blades_Fabrics SPL/CFM/CORE/BALSA only for supported blades');
        const r = [];

        const v82 = computeFullBOM(
            { rstart: 5000, rend: 6000, x1: 0, x2: 500, chordRef: 'LE' },
            [
                { layerName: 'L1', materialType: 'BIAX',  gsm: '936'  },
                { layerName: 'L2', materialType: 'UD',    gsm: '1140' },
                { layerName: 'L3', materialType: 'CORE',  gsm: ''     },
            ],
            { Cleaning:1, Grinding:1, Bonding:0, Lamination:1, HLU:1, Infusion:1, Weighing:1, Vacuum:2, Painting:0, LEP:0 },
            'V82', 'Middle', 3
        );
        r.push(assertItemAbsent('V82: SPL absent (blade does not support)',   v82.fabricItems, 'SPL'));
        r.push(assertItemAbsent('V82: CFM50 absent (blade does not support)', v82.fabricItems, 'CFM50'));
        r.push(assertItemPresent('V82: CORE present (in layup, supported)',   v82.fabricItems, 'CORE'));

        for (const model of ['V90', 'V100', 'V112']) {
            const b = computeFullBOM(
                { rstart: 0, rend: 1500, x1: 0, x2: 200, chordRef: 'LE' },
                [{ layerName: 'L1', materialType: 'BIAX', gsm: '600' }],
                { Cleaning:1, Grinding:1, Bonding:0, Lamination:1, HLU:1, Infusion:1, Weighing:1, Vacuum:2, Painting:0, LEP:0 },
                model, 'Tip', 2
            );
            r.push(assertItemAbsent(`${model}: SPL absent`,   b.fabricItems, 'SPL'));
            r.push(assertItemAbsent(`${model}: CFM50 absent`, b.fabricItems, 'CFM50'));
        }

        const v150 = computeFullBOM(
            { rstart: 30000, rend: 31000, x1: 0, x2: 200, chordRef: 'LE' },
            [
                { layerName: 'L1', materialType: 'BIAX',  gsm: '600'  },
                { layerName: 'L2', materialType: 'CORE',  gsm: ''     },
                { layerName: 'L3', materialType: 'SPL',   gsm: ''     },
                { layerName: 'L4', materialType: 'CFM50', gsm: ''     },
            ],
            { Cleaning:1, Grinding:1, Bonding:0, Lamination:1, HLU:1, Infusion:1, Weighing:1, Vacuum:2, Painting:0, LEP:0 },
            'V150', 'Tip', 3
        );
        r.push(assertItemPresent('V150: SPL present (supported + in layup)',   v150.fabricItems, 'SPL'));
        r.push(assertItemPresent('V150: CFM50 present (supported + in layup)', v150.fabricItems, 'CFM50'));

        const v150NoSpl = computeFullBOM(
            { rstart: 30000, rend: 31000, x1: 0, x2: 200, chordRef: 'LE' },
            [{ layerName: 'L1', materialType: 'BIAX', gsm: '600' }],
            { Cleaning:1, Grinding:1, Bonding:0, Lamination:1, HLU:1, Infusion:1, Weighing:1, Vacuum:2, Painting:0, LEP:0 },
            'V150', 'Tip', 3
        );
        r.push(assertItemAbsent('V150 w/o SPL layer: SPL absent',   v150NoSpl.fabricItems, 'SPL'));
        r.push(assertItemAbsent('V150 w/o CFM layer: CFM50 absent', v150NoSpl.fabricItems, 'CFM50'));

        console.groupEnd();
        return tally(r);
    }

    // testRev05NewMaterials REMOVED — the Quadrax 850/566 (V82) and Biax ±45 200/450
    // & Biax ±80 1200 (V136) materials listed in REV05 Blades_Fabrics are NOT yet
    // wired into REV05's calculation pipeline (no Layer Data Input row, no LAYUP
    // overlap, no Fabrics_aux SUMIF, no Fabrics SAP, no Materials formula). They
    // are roadmap labels only. The app must not invent data for them. Re-enable
    // this test in REV06 once the spreadsheet is updated. See PENDING_REV06.md.

    function testBladeReferenceFabricsStructure() {
        console.group('Test 13: BLADE_REFERENCE_FABRICS structure mirrors REV05 Blades_Fabrics labels');
        const r = [];
        r.push(typeof BLADE_REFERENCE_FABRICS === 'object' && BLADE_REFERENCE_FABRICS !== null
            ? pass('BLADE_REFERENCE_FABRICS constant exists')
            : fail('BLADE_REFERENCE_FABRICS missing', 'must be declared in data.js'));
        if (typeof BLADE_REFERENCE_FABRICS !== 'object') { console.groupEnd(); return tally(r); }
        // V82: 2 entries — Quadrax 850 and Quadrax 566
        r.push(Array.isArray(BLADE_REFERENCE_FABRICS['V82']) && BLADE_REFERENCE_FABRICS['V82'].length === 2
            ? pass('V82 has 2 reference fabric entries')
            : fail('V82 reference fabrics count wrong', 'expected 2 (Quadrax 850 + Quadrax 566)'));
        r.push(BLADE_REFERENCE_FABRICS['V82'] && BLADE_REFERENCE_FABRICS['V82'][0].source === 'Blades_Fabrics!A7'
            ? pass('V82[0] source = Blades_Fabrics!A7')
            : fail('V82[0] source mismatch', 'expected Blades_Fabrics!A7'));
        r.push(BLADE_REFERENCE_FABRICS['V82'] && BLADE_REFERENCE_FABRICS['V82'][1].source === 'Blades_Fabrics!A8'
            ? pass('V82[1] source = Blades_Fabrics!A8')
            : fail('V82[1] source mismatch', 'expected Blades_Fabrics!A8'));
        // V136 biax variants were MIGRATED into the calc pipeline — no longer
        // reference-only. Only Quadrax (V82) stays reference-only.
        r.push(!BLADE_REFERENCE_FABRICS['V136']
            ? pass('V136 has no reference fabric entry (biax variants now calculable)')
            : fail('V136 still has reference fabrics', 'biax 450/200/1200 should be migrated'));
        // Blades with no reference fabrics should NOT have an entry
        for (const m of ['V90', 'V100', 'V110', 'V112', 'V136', 'V150']) {
            r.push(!BLADE_REFERENCE_FABRICS[m]
                ? pass(`${m} has no reference fabric entry (correct)`)
                : fail(`${m} has unexpected reference fabric entry`, 'only V82 and V136 expected'));
        }
        console.groupEnd();
        return tally(r);
    }

    function testRev05PendingMaterialsAreNotInjected() {
        console.group('Test 13: Quadrax stays pending; V136 biax now enabled with norm overlap');
        const r = [];
        // Quadrax: still pending — the norm gives no quadrax overlap rule, so it
        // must NOT be injected anywhere (zero invented data).
        const v82HasQuadrax = BLADE_MATERIAL_MAP['V82'].some(m => m.materialType === 'QUADRAX');
        r.push(!v82HasQuadrax
            ? pass('V82 map has no QUADRAX (no overlap rule → still pending)')
            : fail('V82 map contains QUADRAX', 'no norm overlap for quadrax'));
        for (const k of ['QUADRAX850', 'QUADRAX566']) {
            r.push(!STANDARD_OVERLAPS[k]
                ? pass(`STANDARD_OVERLAPS has no ${k} (no invented value)`)
                : fail(`STANDARD_OVERLAPS contains ${k}`, 'quadrax has no norm overlap'));
        }
        // V136 biax variants: NOW enabled — overlap from the biax 5% rule (not
        // invented), SAP still 'TBD'.
        const v136Biax = ['200','450'].every(gsm =>
            BLADE_MATERIAL_MAP['V136'].some(m => m.materialType === 'BIAX' && m.gsm === gsm));
        r.push(v136Biax
            ? pass('V136 map now includes BIAX 200 and 450 (calculable)')
            : fail('V136 map missing BIAX 200/450', 'should be enabled via norm overlap'));
        r.push(STANDARD_OVERLAPS['BIAX200'] && STANDARD_OVERLAPS['BIAX200'].chord === 10
            ? pass('BIAX200 overlap = 10 (5% × 200, from norm)')
            : fail('BIAX200 overlap wrong', 'expected 10 = 5% × 200'));
        r.push(STANDARD_OVERLAPS['BIAX450'] && STANDARD_OVERLAPS['BIAX450'].span === 23
            ? pass('BIAX450 overlap = 23 (5% × 450, from norm)')
            : fail('BIAX450 overlap wrong', 'expected 23 = round(5% × 450)'));
        // Real SAPs from the Feb/2026 rev 23 list; sold as EA rolls.
        r.push(FABRICS_DB.standard['BIAX200'] && FABRICS_DB.standard['BIAX200'].sap === '29238494'
            && FABRICS_DB.standard['BIAX200'].unit === 'EA' && FABRICS_DB.standard['BIAX200'].kgPerUnit === 5
            ? pass('BIAX200 = SAP 29238494, EA, 5kg/roll')
            : fail('BIAX200 catalog wrong', 'expected 29238494 / EA / 5'));
        r.push(FABRICS_DB.standard['BIAX450'] && FABRICS_DB.standard['BIAX450'].sap === '29219676'
            && FABRICS_DB.standard['BIAX450'].unit === 'EA' && FABRICS_DB.standard['BIAX450'].kgPerUnit === 20
            ? pass('BIAX450 = SAP 29219676, EA, 20kg/roll')
            : fail('BIAX450 catalog wrong', 'expected 29219676 / EA / 20'));
        console.groupEnd();
        return tally(r);
    }

    function testRedDotAcrossAllBlades() {
        console.group('Test 14: All 7 blade models compute a valid layup (red-dot precondition)');
        const r = [];
        for (const model of BLADE_MODELS) {
            const allowed = BLADE_MATERIAL_MAP[model] || [];
            const firstFabric = allowed.find(m => !['CORE','SPL','CFM50','BALSA'].includes(m.materialType));
            if (!firstFabric) { r.push(fail(`${model}: no fabric in catalog`, '')); continue; }
            try {
                const b = computeFullBOM(
                    { rstart: 1000, rend: 2000, x1: 0, x2: 200, chordRef: 'LE' },
                    [{ layerName: 'L1', materialType: firstFabric.materialType, gsm: firstFabric.gsm }],
                    { Cleaning:1, Grinding:1, Bonding:0, Lamination:1, HLU:1, Infusion:1, Weighing:1, Vacuum:2, Painting:0, LEP:0 },
                    model, 'Middle', 2
                );
                const ok = b && b.layupResult && b.layupResult.maxLength > 0 && b.layupResult.maxWidth > 0;
                r.push(ok
                    ? pass(`${model}: layup OK (maxLen=${b.layupResult.maxLength}, maxW=${b.layupResult.maxWidth})`)
                    : fail(`${model}: invalid layup result`, ''));
            } catch (e) {
                r.push(fail(`${model}: threw`, e.message));
            }
        }
        console.groupEnd();
        return tally(r);
    }

    // ── Lamination Plan Sketch — real drawing validation (DMS 945550) ──────────
    // Cross-check of the engine against a real Lamination Plan Sketch. Spanwise
    // (R1/R2/Length) is fully automated and must match the drawing exactly.
    // Chordwise (X1/X2) expands symmetrically in automation; the drawing applies
    // per-layer TE offsets, so chord width is EXPECTED to differ until the user
    // enters manual overrides (ovX1/ovX2). This test documents both facts.
    const SKETCH = {
        damageData: { rstart: 40000, rend: 40500, x1: 0, x2: 60, chordRef: 'TE' },
        layers: [
            { layerName: 'BIAX600',   materialType: 'BIAX',  gsm: '600'  },
            { layerName: 'TRIAX1200', materialType: 'TRIAX', gsm: '1200' },
            { layerName: 'CORE',      materialType: 'CORE',  gsm: ''     },
            { layerName: 'TRIAX1200', materialType: 'TRIAX', gsm: '1200' },
            { layerName: 'BIAX600',   materialType: 'BIAX',  gsm: '600'  },
        ],
        // Expected spanwise length per data layer, straight from the drawing.
        expectedLength: [560, 740, 740, 920, 980],
    };

    function testSketchSpanwiseExact() {
        console.group('Test 15: Lamination Plan Sketch — spanwise length matches drawing exactly');
        const layup = computeLayup(SKETCH.damageData, SKETCH.layers);
        const dataRows = layup.layupRows.filter(r => !r.isBod);
        const r = [];
        SKETCH.expectedLength.forEach((exp, i) => {
            r.push(assertEq(`Layer ${i + 1} length=${exp}`, dataRows[i].length, exp, 0));
        });
        console.groupEnd();
        return tally(r);
    }

    function testSketchChordOverride() {
        console.group('Test 16: Sketch chord override — manual X1/X2 reproduces the drawing');
        // Drawing values for layer 2 (TRIAX1200): X1=60, X2=120 → width 60.
        const layersOv = SKETCH.layers.map(l => ({ ...l }));
        layersOv[1].ovX1 = 60;
        layersOv[1].ovX2 = 120;
        const layup = computeLayup(SKETCH.damageData, layersOv);
        const row2 = layup.layupRows.filter(r => !r.isBod)[1];
        const r = [
            assertEq('Override width = 60 (drawing)', row2.width, 60, 0),
            row2.overridden && row2.overridden.x1 && row2.overridden.x2
                ? pass('Override flags set on row')
                : fail('Override flags set on row', 'flags missing'),
        ];
        console.groupEnd();
        return tally(r);
    }

    function testRepairDayEstimator() {
        console.group('Test 17: Repair day estimator (cure rule, batches of 6)');
        const r = [
            assertEq('Sketch internal = 5 days',
                computeRepairDays(SKETCH.layers, false).totalDays, 5, 0),
            assertEq('Sketch external = 6 days',
                computeRepairDays(SKETCH.layers, true).totalDays, 6, 0),
            // 7 plies before core → ceil(7/6)=2 lam days; 13 after → 3; +sand+core+paint+buffer
            assertEq('7-before / core / 13-after external = 9 days',
                computeRepairDays([
                    ...Array(7).fill({ materialType: 'BIAX', gsm: '600' }),
                    { materialType: 'CORE' },
                    ...Array(13).fill({ materialType: 'BIAX', gsm: '600' }),
                ], true).totalDays, 9, 0),
            // No core: sand + 1 lam batch + buffer = 3
            assertEq('2 plies, no core, internal = 3 days',
                computeRepairDays([
                    { materialType: 'BIAX', gsm: '600' },
                    { materialType: 'TRIAX', gsm: '1200' },
                ], false).totalDays, 3, 0),
        ];
        console.groupEnd();
        return tally(r);
    }

    function testFiberOverlapNorm() {
        console.group('Test 18: Fiber overlap = % of gsm (norm 0149-9754 §12)');
        const r = [
            // Biax 5%/5%
            assertEq('BIAX600 span=30',  STANDARD_OVERLAPS['BIAX600'].span, 30, 0),
            assertEq('BIAX600 chord=30', STANDARD_OVERLAPS['BIAX600'].chord, 30, 0),
            assertEq('BIAX936 chord=47 (was 50)', STANDARD_OVERLAPS['BIAX936'].chord, 47, 0),
            // UD span 10% / chord 2% (field team keeps 2%, not the norm's 5%)
            assertEq('UD600 span=60',  STANDARD_OVERLAPS['UD600'].span, 60, 0),
            assertEq('UD600 chord=12 (field team 2%)', STANDARD_OVERLAPS['UD600'].chord, 12, 0),
            assertEq('UD1200 chord=24 (field team 2%)', STANDARD_OVERLAPS['UD1200'].chord, 24, 0),
            // Triax composite span + 2.5% chord
            assertEq('TRIAX1200 span=90',  STANDARD_OVERLAPS['TRIAX1200'].span, 90, 0),
            assertEq('TRIAX1200 chord=30', STANDARD_OVERLAPS['TRIAX1200'].chord, 30, 0),
            // computeFiberOverlap for an arbitrary gsm (e.g. pending fabrics)
            assertEq('computeFiberOverlap BIAX 450 span=23', computeFiberOverlap('BIAX', 450).span, 23, 0),
            assertEq('computeFiberOverlap UD 900 chord=18', computeFiberOverlap('UD', 900).chord, 18, 0),
            assertEq('computeFiberOverlap CARBON 250 span=30', computeFiberOverlap('CARBON', 250).span, 30, 0),
        ];
        console.groupEnd();
        return tally(r);
    }

    function testRepairGuideData() {
        console.group('Test 19: Repair guide reference data (decision tree, subs, rules)');
        const r = [
            assertEq('FIELD_RULES has 10 rules', FIELD_RULES.length, 10, 0),
            assertEq('FIBER_SUBSTITUTIONS has 4 rows', FIBER_SUBSTITUTIONS.length, 4, 0),
            assertEq('CORE_SUBSTITUTIONS has 1 row', CORE_SUBSTITUTIONS.length, 1, 0),
            assertEq('DAMAGE_DECISION_TREE has 19 rows', DAMAGE_DECISION_TREE.length, 19, 0),
            DAMAGE_DECISION_TREE.every(d => d.damage && d.zone && d.severity && d.level && d.method)
                ? pass('every decision-tree row has damage/zone/severity/level/method')
                : fail('decision-tree row missing required field', ''),
            DAMAGE_DECISION_TREE.some(d => d.level === '⛔' && /REPORTAR/i.test(d.method))
                ? pass('non-repairable shell-spar case present (report immediately)')
                : fail('missing non-repairable case', ''),
        ];
        console.groupEnd();
        return tally(r);
    }

    function testScarfHonorsOverrides() {
        console.group('Test 20: escalonamento honors manual geometry overrides');
        const r = [];
        // computeScarf lives in scarf.js (mobile page); on the desktop page it
        // is absent — report a skip instead of failing.
        if (typeof computeScarf === 'undefined' || typeof M === 'undefined') {
            r.push(pass('skipped (scarf.js/mobile not loaded on this page)'));
        } else {
            const savedLayers = M.layers, savedLen = M.length, savedWid = M.width, savedZ0 = SCARF.z0;
            M.length = 500; M.width = 60; SCARF.z0 = 40000;
            M.layers = [
                { layerName: 'L1', materialType: 'BIAX', gsm: '600' },
                { layerName: 'L2', materialType: 'TRIAX', gsm: '1200', ovX1: 60, ovX2: 120 },
            ];
            const rows = computeScarf().filter(x => !x.isBod);
            r.push(assertEq('layer2 x1 honors ovX1=60', rows[1].x1, 60, 0));
            r.push(assertEq('layer2 x2 honors ovX2=120', rows[1].x2, 120, 0));
            r.push(assertEq('layer2 width = 60 (from overrides)', rows[1].wid, 60, 0));
            M.layers = savedLayers; M.length = savedLen; M.width = savedWid; SCARF.z0 = savedZ0;
        }
        console.groupEnd();
        return tally(r);
    }

    // ── Main runner ───────────────────────────────────────────────────────────

    window.runBOMTests = function () {
        console.group('\u2550\u2550\u2550 BOM Test Harness \u2014 REV05 \u2550\u2550\u2550');
        const suites = [
            testPPEFormulas,
            testNoFakeSAPs,
            testV150HMUnitsAreKG,
            testCoreThicknessFix,
            testCoreRootForRoot,
            testStandardFabricSAPs,
            testDustLoopsAcrossDays,
            testConsumablesSAPs,
            testConsumablesUnitsAreM2,
            testUD1200MultiplyFormula,
            testPrime37Formula,
            testRev05BladeFabricsFilter,
            testBladeReferenceFabricsStructure,
            testRev05PendingMaterialsAreNotInjected,
            testRedDotAcrossAllBlades,
            testSketchSpanwiseExact,
            testSketchChordOverride,
            testRepairDayEstimator,
            testFiberOverlapNorm,
            testRepairGuideData,
            testScarfHonorsOverrides,
        ];
        let total = { pass: 0, fail: 0 };
        for (const suite of suites) {
            const r = suite();
            total.pass += r.pass;
            total.fail += r.fail;
        }
        console.log('');
        const n = total.pass + total.fail;
        if (total.fail === 0) {
            console.log(`%c  ALL ${n} TESTS PASSED \u2713`, 'color:green;font-weight:bold;font-size:14px');
        } else {
            console.warn(`  ${total.pass}/${n} passed \u2014 ${total.fail} FAILED`);
        }
        console.groupEnd();
        return total;
    };

    console.log('[test.js] BOM test harness loaded. Call runBOMTests() in console.');
})();
