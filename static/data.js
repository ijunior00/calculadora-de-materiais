// ============================================================
// DATA.JS - EXHAUSTIVE REFERENCE DATA EXTRACTED FROM EXCEL
// Blade_Repair_Materials_Estimate
// ============================================================

// ---- STANDARD OVERLAPS (LAYUP!H4:J16 in REV05) ----
// Source: cells H4:J16 of the LAYUP sheet — exactly 14 fabrics. Do not add
// entries that are not in that table. Quadrax / Biax ±45 / Biax ±80 variants
// listed in Blades_Fabrics are NOT wired to overlap values in REV05; see
// PENDING_REV06.md.
const STANDARD_OVERLAPS = {
    'BIAX600':   { span: 30,  chord: 30 },
    'BIAX936':   { span: 50,  chord: 50 },
    'BIAX1000':  { span: 50,  chord: 50 },
    'BIAX1200':  { span: 60,  chord: 60 },
    'UD600':     { span: 60,  chord: 12 },
    'UD900':     { span: 90,  chord: 18 },
    'UD1140':    { span: 114, chord: 23 },
    'UD1200':    { span: 120, chord: 24 },
    'TRIAX1200': { span: 90,  chord: 30 },
    'TRIAX1500': { span: 125, chord: 35 },
    'SPL':       { span: 75,  chord: 75 },
    'CFM50':     { span: 30,  chord: 30 },
    'CORE':      { span: 0,   chord: 0 },
    'BALSA':     { span: 0,   chord: 0 }
};

// ---- GLOBAL MATERIAL TYPE OPTIONS ----
// Source: REV05 Lists!E2:E7 (BIAX/UD/TRIAX/CORE/SPL/CFM50) and Lists!G2:G8 (GSM).
// BALSA is intentionally tracked separately as a special fabric (no GSM, no overlap).
const MATERIAL_TYPES = ['BIAX', 'UD', 'TRIAX', 'CORE', 'BALSA', 'SPL', 'CFM50'];
const GSM_OPTIONS = [600, 900, 936, 1000, 1140, 1200, 1500];

// ============================================================
// BLADE-SPECIFIC MATERIAL CONFIGURATION
// ============================================================
const BLADE_MATERIAL_MAP = {
    'V82': [
        { materialType: 'BIAX',    gsm: '936',  label: 'BIAX 936' },
        { materialType: 'UD',      gsm: '600',  label: 'UD 600' },
        { materialType: 'UD',      gsm: '1140', label: 'UD 1140' },
        { materialType: 'BALSA',   gsm: '',     label: 'BALSA' },
        { materialType: 'CORE',    gsm: '',     label: 'CORE' },
        // NOTE: REV05 Blades_Fabrics also lists "Quadrax 850gsm" and "Quadrax 566gsm"
        // for V82 (cells A7, A8) but the rest of REV05 (Layer Data Input, LAYUP overlap
        // table, Fabrics_aux, Fabrics catalog, Materials sheet) does not yet wire these
        // into the calculation pipeline. Pending REV06 — see PENDING_REV06.md.
    ],
    'V90': [
        { materialType: 'TRIAX', gsm: '1200', label: 'TRIAX 1200' },
        { materialType: 'BIAX',  gsm: '600',  label: 'BIAX 600' },
        { materialType: 'UD',    gsm: '1200', label: 'UD 1200' },
        { materialType: 'CORE',  gsm: '',     label: 'CORE' },
    ],
    'V100': [
        { materialType: 'TRIAX', gsm: '1200', label: 'TRIAX 1200' },
        { materialType: 'BIAX',  gsm: '600',  label: 'BIAX 600' },
        { materialType: 'UD',    gsm: '1200', label: 'UD 1200' },
        { materialType: 'CORE',  gsm: '',     label: 'CORE' },
    ],
    'V112': [
        { materialType: 'TRIAX', gsm: '1200', label: 'TRIAX 1200' },
        { materialType: 'BIAX',  gsm: '600',  label: 'BIAX 600' },
        { materialType: 'UD',    gsm: '1200', label: 'UD 1200' },
        { materialType: 'CORE',  gsm: '',     label: 'CORE' },
    ],
    'V110': [
        { materialType: 'TRIAX', gsm: '1500', label: 'TRIAX 1500' },
        { materialType: 'BIAX',  gsm: '600',  label: 'BIAX 600' },
        { materialType: 'BIAX',  gsm: '936',  label: 'BIAX 936' },
        { materialType: 'UD',    gsm: '1140', label: 'UD 1140' },
        { materialType: 'UD',    gsm: '600',  label: 'UD 600' },
        { materialType: 'UD',    gsm: '900',  label: 'UD 900' },
        { materialType: 'CORE',  gsm: '',     label: 'CORE' },
        { materialType: 'BALSA', gsm: '',     label: 'BALSA' },
        { materialType: 'SPL',   gsm: '',     label: 'SPL' },
        { materialType: 'CFM50', gsm: '',     label: 'CFM' },
    ],
    'V136': [
        { materialType: 'TRIAX', gsm: '1200', label: 'TRIAX 1200' },
        { materialType: 'BIAX',  gsm: '1000', label: 'BIAX 1000' },
        { materialType: 'BIAX',  gsm: '600',  label: 'BIAX 600' },
        { materialType: 'UD',    gsm: '1200', label: 'UD 1200' },
        { materialType: 'UD',    gsm: '600',  label: 'UD 600' },
        { materialType: 'CORE',  gsm: '',     label: 'CORE' },
        { materialType: 'BALSA', gsm: '',     label: 'BALSA' },
        { materialType: 'SPL',   gsm: '',     label: 'SPL' },
        { materialType: 'CFM50', gsm: '',     label: 'CFM' },
        // NOTE: REV05 Blades_Fabrics also lists "Biax ±45 450gsm", "Biax ±45 200gsm"
        // and "Biax ±80 1200gsm" for V136 (cells F11, F12, F13) but the rest of REV05
        // does not yet wire these into the calculation pipeline. Pending REV06 — see
        // PENDING_REV06.md.
    ],
    'V150': [
        { materialType: 'BIAX',  gsm: '600',  label: 'BIAX 600' },
        { materialType: 'BIAX',  gsm: '1000', label: 'BIAX 1000' },
        { materialType: 'BIAX',  gsm: '1200', label: 'BIAX 1200' },
        { materialType: 'UD',    gsm: '1200', label: 'UD 1200' },
        { materialType: 'TRIAX', gsm: '1200', label: 'TRIAX 1200' },
        { materialType: 'CORE',  gsm: '',     label: 'CORE' },
        { materialType: 'BALSA', gsm: '',     label: 'BALSA' },
        { materialType: 'SPL',   gsm: '',     label: 'SPL' },
        { materialType: 'CFM50', gsm: '',     label: 'CFM' },
    ],
};

// ── BLADE_REFERENCE_FABRICS ───────────────────────────────────────────────────
// Fabrics declared in REV05 `Blades_Fabrics` sheet as labels only — no SAP (IN),
// no overlap data, never used in field repairs yet (confirmed by tech lead).
// They do NOT enter the calculation pipeline and have NO entries in STANDARD_OVERLAPS,
// FABRICS_DB, MATERIAL_TYPES, or GSM_OPTIONS.  They are stored here purely for
// informational display in the Step 2 Layer Data Input panel so the app represents
// exactly what REV05 contains without omission or mock data.
// Source: Blade_Repair_Materials_Estimate - REV05.xlsx → sheet Blades_Fabrics.
// Upgrade path: when REV06 delivers real SAP + overlap values, move each entry from
// here to BLADE_MATERIAL_MAP / STANDARD_OVERLAPS / FABRICS_DB and delete the entry.
const BLADE_REFERENCE_FABRICS = {
    'V82': [
        { label: 'Quadrax 850 g/m²', source: 'Blades_Fabrics!A7' },
        { label: 'Quadrax 566 g/m²', source: 'Blades_Fabrics!A8' },
    ],
    'V136': [
        { label: 'Biax \u00b145\u00b0 450 g/m\u00b2', source: 'Blades_Fabrics!F11' },
        { label: 'Biax \u00b145\u00b0 200 g/m\u00b2', source: 'Blades_Fabrics!F12' },
        { label: 'Biax \u00b180\u00b0 1200 g/m\u00b2', source: 'Blades_Fabrics!F13' },
    ],
};

const CHORD_REFERENCES = ['LE', 'TE', 'M.Web', 'TE.Web'];
const BLADE_REGIONS = ['Root', 'Middle', 'Tip'];
const BLADE_MODELS = ['V82', 'V90', 'V100', 'V110', 'V112', 'V136', 'V150'];

// ============================================================
// FABRIC ALIASES — shop-floor nicknames (Vestas "T" nomenclature)
// ============================================================
// Maps a shop-floor nickname to a fabric key used in the engine. Only confirmed
// aliases are listed (zero mock data — same policy as PENDING_REV06.md). The
// technician recognises "T80" on the floor; the engine knows it as BIAX1200.
// Add more entries here as the field team confirms each T-code ↔ fabric mapping.
const FABRIC_ALIASES = {
    'BIAX1200': 'T80',   // Biax ±80° 1200 g/m² — confirmed by field team
    // 'BIAX...': 'T45', // Biax ±45° — nickname pending confirmation
};

// Returns the shop-floor alias for a fabric key, or '' when none is confirmed.
function fabricAlias(materialType, gsm) {
    if (!materialType) return '';
    const key = (materialType === 'CORE' || materialType === 'SPL' || materialType === 'CFM50' || materialType === 'BALSA')
        ? materialType : materialType + (gsm || '');
    return FABRIC_ALIASES[key] || '';
}

// ============================================================
// BLADE DOCUMENT REFERENCES — drawing numbers per blade version
// ============================================================
// Source: "REFERÊNCIAS DOS DOCUMENTOS DAS BLADES" spreadsheet supplied by the
// field team. Independent reference lookup — the version names here (V116, V120,
// V163 Mk4A, …) are NOT the same taxonomy as BLADE_MODELS (V82…V150) used for the
// BOM, so this is a standalone reference table, not a BOM auto-fill. "—" in the
// source means the value is not applicable / not published for that version.
const BLADE_DOCUMENT_REFERENCES = [
    { version: 'V110 MK10C',            final: 'A006-7162', finish: 'A006-7471', bonding: '0067-0379', assembled: 'A006-7193', shellWW: 'A006-7745', shellLW: 'A006-7742', web: 'A006-7457' },
    { version: 'V110 MK10C (alt)',      final: '0063-9573', finish: '0063-9574', bonding: '0064-6931', assembled: '0063-9575', shellWW: '0063-9577', shellLW: '0063-9576', web: '29090227' },
    { version: 'V116 MK11B',            final: '0065-9125', finish: '0065-1416', bonding: '0065-9127', assembled: '0065-1417', shellWW: '0067-6115', shellLW: '0067-6114', web: '29104681' },
    { version: 'V120 (Infused) MK11C',  final: '0065-9125', finish: '0073-9711', bonding: '0074-8517', assembled: '0073-9710', shellWW: '0073-2163', shellLW: '0073-2162', web: '29089819' },
    { version: 'V120 (Hybrid) MK11D',   final: '0065-9125', finish: '0073-9711', bonding: '0074-8517', assembled: '0073-9710', shellWW: '0073-6980', shellLW: '0073-6978', web: '29115759' },
    { version: 'V120 (Infused) MK11D',  final: '0065-9125', finish: '0073-9711', bonding: '0074-8517', assembled: '0073-9710', shellWW: '—', shellLW: '—', web: '—' },
    { version: 'V120 (OLPS-INF) MK11D', final: 'A006-4129', finish: 'A006-4128', bonding: '0074-8517', assembled: 'A006-4127', shellWW: 'A006-4126', shellLW: 'A006-4125', web: '29115759' },
    { version: 'V126 LPS MK1',          final: 'A007-0637', finish: 'A007-0610', bonding: '0064-8239', assembled: 'A007-0638', shellWW: 'A007-0465', shellLW: 'A007-0464', web: 'A007-0608' },
    { version: 'V136 HYB',              final: '0055-0068', finish: '0060-1773', bonding: '0059-0510', assembled: '0060-4422', shellWW: '0055-3280', shellLW: '0055-3282', web: '29054123' },
    { version: 'V136 (alt)',            final: '0055-0068', finish: '0060-1773', bonding: '0059-0510', assembled: '0060-4422', shellWW: '0060-4482', shellLW: '0060-4481', web: '29084313' },
    { version: 'V136 (Infused)',        final: '0055-0068', finish: '0060-1773', bonding: '0059-0510', assembled: '0060-4422', shellWW: '0073-0992', shellLW: '0073-0991', web: '29123730' },
    { version: 'V136 MK3E (CC)',        final: '0055-0068', finish: '0072-6345', bonding: '0059-0510', assembled: '0073-7478', shellWW: 'CC: 0072-2854', shellLW: 'CC: 0072-2853', web: '29123730' },
    { version: 'V136 OLPS-AS (VAS)',    final: '—', finish: '—', bonding: '—', assembled: '—', shellWW: 'VAS: 0074-2910', shellLW: 'VAS: 0074-2909', web: '—' },
    { version: 'V150 (Hybrid)',         final: '0069-0345', finish: '0069-2203', bonding: '0069-0347', assembled: '0069-2202', shellWW: '0069-2201', shellLW: '0069-2200', web: '29108869' },
    { version: 'V150 (Infused)',        final: '0069-0345', finish: '0069-2203', bonding: '0069-0347', assembled: '0069-2202', shellWW: '0073-5336', shellLW: '0073-5335', web: '29116893' },
    { version: 'V150 (INF-OLPS)',       final: '0069-0345', finish: '0069-2203', bonding: '0069-0347', assembled: '0069-2202', shellWW: '0080-6479', shellLW: '0080-6478', web: '29018869' },
    { version: 'V150 EV (Mini Vidar)',  final: '0078-5376', finish: '0079-1103', bonding: '0079-1104', assembled: '0079-1102', shellWW: '0079-1101', shellLW: '0079-1100', web: '29125367' },
    { version: 'V162 (Vidar F3)',       final: 'A005-7881', finish: 'A005-7883', bonding: 'A005-7884', assembled: 'A005-7882', shellWW: 'A005-9351', shellLW: 'A005-9350', web: 'A006-0348' },
    { version: 'V155',                  final: 'A013-1320', finish: 'A013-1319', bonding: 'A012-1879', assembled: 'A012-2019', shellWW: 'A012-5720', shellLW: 'A012-5719', web: 'A012-4142' },
    { version: 'V163',                  final: 'A019-5680', finish: 'A019-5683', bonding: 'A019-5688', assembled: 'A019-5684', shellWW: 'CATIA', shellLW: 'CATIA', web: 'A022-9797 / A019-5690' },
    { version: 'V163 Mk4A (Plybooks)',  final: 'A019-5680', finish: 'A019-5683', bonding: 'A019-5688', assembled: 'A019-5684', shellWW: 'A022-9969 (over LW) / A022-1736 (under LW)', shellLW: 'A022-9915 (over WW) / A022-1756 (under WW)', web: 'A021-4220 (main web) / A022-1174 (TE web)' },
    { version: 'V163 Mk4A (Root/RF)',   final: '—', finish: '—', bonding: '—', assembled: '—', shellWW: 'A022-0277 (RF LW root) / A022-0278 (RF LW tip)', shellLW: 'A022-0279 (RF WW root) / A022-0280 (RF WW tip)', web: 'A022-5395 (TE insert)' },
];

// ============================================================
// REPAIR DAY RULES — schedule estimation (pre-determined days)
// ============================================================
// Rationale (confirmed by the field team): every lamination includes a CURE
// process of several hours, so only ONE lamination is done per day and the
// maximum is 6 plies per lamination. Therefore each batch of up to 6 plies
// costs one full day (even a partial batch), and the plies before/after the
// core are always laminated on separate days.
//
// Day model:
//   1  sanding + measurements            (always)
//   +ceil(pliesBeforeCore / 6)           lamination before the core
//   1  core + sand to adjust             (only if a CORE ply exists)
//   +ceil(pliesAfterCore / 6)            lamination after the core
//   1  painting                          (only if the repair is EXTERNAL)
//   1  contingency (problems)            (always)
const REPAIR_DAY_RULES = {
    LAYERS_PER_LAM_DAY: 6, // max plies per lamination (1 lamination/day due to cure)
    SANDING_MEASURE_DAYS: 1,
    CORE_DAY: 1,           // core lamination + sanding to fit
    PAINTING_DAY: 1,       // external repairs only
    CONTINGENCY_DAYS: 1,   // buffer for problems
};

// ============================================================
// FABRICS DATABASE (Fabrics & Aux Sheets)
// ============================================================
const FABRICS_DB = {
    standard: {
        'BIAX600':   { sap: 'S096476',   desc: 'BIAX 600G/M2 GLASS FABRIC',          unit: 'KG', kgPerUnit: 1 },
        'BIAX936':   { sap: '29009736',  desc: 'BIAX 936GSM 127CM STABILIZED',       unit: 'KG', kgPerUnit: 1 },
        'BIAX1000':  { sap: '29281859',  desc: 'FABRIC,E-GLASS,BIAX +/-45,1000 g/m2',unit: 'KG', kgPerUnit: 1 },
        // BIAX1200 does not exist in standard (Vidro E) catalog — HM only
        'UD600':     { sap: '29007004',  desc: 'FABRIC,E,UD 0 DEG,576 g/m2,1265 mm', unit: 'KG', kgPerUnit: 1 },
        'UD900':     { sap: '29017516',  desc: 'UD 0 900g S',                        unit: 'KG', kgPerUnit: 1 },
        'UD1140':    { sap: '29017705',  desc: 'UD 0 1140g 1075mm C',                unit: 'KG', kgPerUnit: 1 },
        // REV05: UD1200 standard uses MULTIPLY (qty_M2 = ceil(weightKg * 1.225))
        // because unit is M² but ordering intent changed from divide-to-convert to multiply-as-factor
        'UD1200':    { sap: '29302515',  desc: 'FABRIC,E,UD 0,1200 g/m2,1270 mm',    unit: 'M2', kgPerUnit: 1.225, multiplyQty: true },
        'TRIAX1200': { sap: '29017700',  desc: 'TRIAX 1200g',                        unit: 'KG', kgPerUnit: 1 },
        'TRIAX1500': { sap: '29017701',  desc: 'TRIAX 1500g',                        unit: 'KG', kgPerUnit: 1 },
        // BIAX1200 is intentionally HM-only in REV05 (Layer Data Input!E14 = "HM").
        // The Quadrax / Biax ±45 / Biax ±80 variants in REV05 Blades_Fabrics are NOT
        // mapped to SAPs anywhere in the workbook; they cannot be added here without
        // inventing data. See PENDING_REV06.md.
    },
    V150: {
        // REV05: all HM fabrics now sold by KG (not EA rolls)
        'BIAX600':   { sap: '29116888',  desc: 'FABRIC HM BI45 600G 1260',           unit: 'KG', kgPerUnit: 1 },
        'BIAX1000':  { sap: '29464588',  desc: 'FABRIC,HM,BIAX +/-45,1014 g/m2,1270 mm', unit: 'KG', kgPerUnit: 1 },
        'BIAX1200':  { sap: '29110146',  desc: 'FABRIC HM BI80 1200G 1260',          unit: 'KG', kgPerUnit: 1 },
        'UD1200':    { sap: '29110162',  desc: 'FABRIC HM UD0 1200G 1260',           unit: 'KG', kgPerUnit: 1 },
        'TRIAX1200': { sap: '29210017',  desc: 'FABRIC HM TR45 1200G 2540',          unit: 'KG', kgPerUnit: 1 },
    }
};

const FABRICS_SPECIAL = {
    'CFM50':     { sap: '29023582', desc: 'SURFACE VEIL GLASSTISSUE 50GSM',    unit: 'KG', kgPerUnit: 0.05 },
    'SPL':       { sap: '29180313', desc: 'SPL Repair Patch - 5M x 1150mm',    unit: 'EA', rollArea: 5.75 },
    // CORE Grade B (115 kg/m³). REV05 Materials!J90 = 2.4 m²/kit (11 kg ÷ 115 ÷ 0.04 m thickness).
    // kitKg retained for AMPREG 30 calc (Fabrics_aux pre-REV05 still uses weight basis).
    'CORE':      { sap: '29114395', desc: 'CORE REPAIR PANEL 40mm BLA 54m',    unit: 'EA', kitKg: 11, kitAreaM2: 2.4 },
    // CORE_ROOT: Grade F (250 kg/m³), 1.0 m²/kit (10 kg ÷ 250 ÷ 0.04 m). Used for Root region repairs.
    'CORE_ROOT': { sap: '29217723', desc: 'CORE REPAIR PANEL GR250 40mm',      unit: 'EA', kitKg: 10, kitAreaM2: 1.0 },
    'BALSA':     { sap: 'TBD',      desc: 'BALSA WOOD PANEL (SAP TBD)',         unit: 'EA', kitKg: 5 },
};

// ============================================================
// PPE (Consumable Protection Equipment) — Excel Materials rows 12-16
// Exactly 5 items as defined in the spreadsheet
// ============================================================
const PPE_ITEMS = [
    { sap: '237100', desc: 'Dust loops (3M mask paper)',      unit: 'EA',  calcQty: (s, d) => d > 0 ? Math.ceil(d * 0.8) : 0 },
    { sap: '218455', desc: 'Gloves, ansel, size XL, black',  unit: 'PAA', calcQty: (s, d) => d > 0 ? 3 : 0 },
    { sap: '218173', desc: 'Gloves blue nitrile L',           unit: 'PAA', calcQty: (s, d) => d > 0 ? 1 : 0 },
    { sap: '214445', desc: 'Suit F/Protec, Tyvec, size XL',  unit: 'EA',  calcQty: (s, d) => d > 0 ? Math.ceil(d * 1.5) : 0 },
    { sap: '210177', desc: 'creme plutect',                   unit: 'EA',  calcQty: (s, d) => d > 0 ? 3 : 0 },
];

// ============================================================
// FULL CONSUMABLE TOOLS
// ============================================================
const CONSUMABLE_TOOLS = [
    { sap: '229600',   desc: 'SCISSOR FOR GLASS FIBER',               unit: 'EA', calcQty: (s) => s.Lamination > 0 ? 2 : 0 },
    { sap: '234630',   desc: 'BLUE PLASTIC SPATTLE (FLEXIBLE)',       unit: 'EA', calcQty: (s) => Math.ceil((s.HLU * 1.1) + s.Painting) },
    { sap: '234615',   desc: 'PLASTIC PUTTY KNIFE BLACK (STIFF)',     unit: 'EA', calcQty: (s) => Math.ceil(((s.HLU * 1.1) + s.Painting) / 3) },
    { sap: '233875',   desc: 'Rear disc rubber 125mm (Backing pad)',  unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 2 : 0 },
    { sap: '232923',   desc: 'Round grinding plate G120 125mm',       unit: 'EA', calcQty: (s, d, lay) => s.Grinding > 0 ? Math.ceil(lay.maxAreaM2) * 15 : 0 },
    { sap: '232906',   desc: 'Round grinding plate G60 125mm',        unit: 'EA', calcQty: (s, d, lay) => s.Grinding > 0 ? Math.ceil(lay.maxAreaM2) * 15 : 0 },
    { sap: '233010',   desc: 'Round grinding plate G120 150mm',       unit: 'EA', calcQty: (s, d, lay) => s.Grinding > 0 ? Math.ceil(lay.maxAreaM2) * 15 : 0 },
    { sap: '233005',   desc: 'Round grinding plate G60 150mm',        unit: 'EA', calcQty: (s, d, lay) => s.Grinding > 0 ? Math.ceil(lay.maxAreaM2) * 15 : 0 },
    { sap: '233015',   desc: 'Round grinding plate K220 150mm',       unit: 'EA', calcQty: (s, d, lay) => s.Grinding > 0 ? Math.ceil(lay.maxAreaM2) * 15 : 0 },
    { sap: '233843',   desc: 'SCOTCH BRITE 3M BLK 158x224mm',         unit: 'EA', calcQty: (s) => s.LEP > 0 ? 3 * s.LEP : 0 },
    { sap: '224010',   desc: 'Paddle stirrers (wood stick)',          unit: 'EA', calcQty: (s) => Math.ceil(s.Weighing * 1.1) },
    { sap: '221120',   desc: 'Household scale (weight scale) 5kg',    unit: 'EA', calcQty: (s) => s.Weighing > 0 ? 1 : 0 },
    { sap: '29196730', desc: 'Plast roll (Consolidation Roller) 13x75',unit: 'EA', calcQty: (s) => s.HLU > 0 ? Math.max(2, Math.ceil(s.HLU)) : 0 },
    { sap: '222720',   desc: 'BRUSH, PAINT, MODDLARE 70MM',           unit: 'EA', calcQty: (s) => Math.ceil(s.HLU * 1.2) },
    { sap: '60059473', desc: 'PAINT ROLLER, SUPER SMOOTH, 11in',      unit: 'EA', calcQty: (s) => Math.ceil(s.HLU * 1.2) },
    { sap: '293610',   desc: '4 INCH FOAM ROLLER',                    unit: 'EA', calcQty: (s) => Math.ceil(1.2 * s.Painting + 3 * s.LEP) },
    // Handle roller: Excel H35 = ROUNDDOWN(H33/2 + H34/2, 0)
    // H33 = ceil(HLU * 1.2) = paint roller qty; H34 = ceil(1.2*Painting + 3*LEP) = foam roller qty
    { sap: '60059474', desc: 'HANDLE, PAINT RLR 11CM / 4 INCH',       unit: 'EA', calcQty: (s) => {
          const h33 = Math.ceil(s.HLU * 1.2);
          const h34 = Math.ceil(1.2 * s.Painting + 3 * s.LEP);
          return Math.floor(h33 / 2 + h34 / 2);
      } },
    { sap: '233861',   desc: 'DIAMOND CUTTING-OFF WHEEL 125',         unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 1 : 0 },
    { sap: '233228',   desc: 'GRINDING WHEEL 125MM',                  unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 1 : 0 },
    { sap: '215860',   desc: 'Disposable syringe 60ml',               unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 3 : 0 },
];

// ============================================================
// FULL CHEMICALS 
// ============================================================
const CHEMICALS = [
    { sap: '234900',   desc: 'ALCOHOL DENATURED 93% 1/2 LITRE',       unit: 'BTL', calcQty: (s) => s.Cleaning > 0 ? Math.ceil(s.Cleaning / 1.5) : 0 },
    { sap: '291574',   desc: 'CLOTH,CLEANING (Satwipes w/ ethanol)',  unit: 'TUB', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: '29157769', desc: 'AMPREG 30 1.26KG PACK STANDARD',        unit: 'EA',  calcQty: (s, d, lay, reg) => {
          // Excel H43: ROUNDUP(SUM(Fabrics_aux!H17:H26, H29) / 1.26, 0) — no HLU condition
          const w = lay.totalFabricWeightKg * 1.2; // Fabrics_aux H17:H26 already have 1.2 factor
          const coreKitKg = reg === 'Root' ? 10 : 11; // Root uses CORE_ROOT (Grade F, 10 kg/kit)
          const c = lay.coreWeightKg > 0 ? Math.ceil(lay.coreWeightKg / coreKitKg) : 0; // H29 = CORE kits
          return Math.ceil((w + c) / 1.26);
      } },
    { sap: '29276912', desc: 'PRIME 37, 4KG STD (Infusion Resin)',    unit: 'EA',  calcQty: (s, d, lay) => {
          if (s.Infusion === 0) return 0;
          // REV05 formula: ROUNDUP(cfm50_mass_kg * infusion * 1.3 / 4, 0)
          // cfm50_mass_kg = splAreaM2 * 1.5 (area+50%) * 0.05 kg/m² (50g/m² CFM density)
          // Each PRIME 37 kit = 4 kg. Factor 1.3 = 30% waste.
          const cfm50MassKg = lay.splAreaM2 * 1.5 * 0.05;
          return Math.max(1, Math.ceil(cfm50MassKg * s.Infusion * 1.3 / 4));
      } },
    { sap: '29078542', desc: 'ADHESIVE SIKAPOWER 1200 450 mL',        unit: 'EA',  calcQty: (s, d, lay) => s.Bonding > 0 ? Math.ceil(lay.maxLength * 120e-6 * 23.33 * s.Bonding) : 0 },
    { sap: '29035907', desc: 'SikaForce 7818 L7 195mL',               unit: 'EA',  calcQty: (s, d, lay) => lay.coreWeightKg > 0 ? Math.ceil(1 * 1.5) : 0 },
    { sap: '29035908', desc: 'SIKAFORCE 7800 RED (Filler)',           unit: 'EA',  calcQty: (s, d, lay) => s.Painting > 0 ? Math.ceil(lay.areaWithMarginM2 * 4 * s.Painting) : 0 },
    { sap: '29034878', desc: 'KIT,TOP COAT 12 RAL7035 1kg',           unit: 'KIT', calcQty: (s, d, lay) => s.Painting > 0 ? Math.ceil(lay.areaWithMarginM2 * 0.4 * s.Painting * 2) : 0 },
    { sap: '29035851', desc: 'KIT,TOP COAT 12 RAL3020 1kg (Red)',     unit: 'KIT', calcQty: (s, d, lay) => s.Painting > 0 ? Math.ceil(lay.areaWithMarginM2 * 0.4 * s.Painting * 2) : 0 },
    { sap: '29035856', desc: 'THINNER 1kg FOR TOP COAT 12',           unit: 'EA',  calcQty: (s, d, lay) => {
          if (s.Painting === 0) return 0;
          const tc7035 = Math.ceil(lay.areaWithMarginM2 * 0.4 * s.Painting * 2);
          const tc3020 = Math.ceil(lay.areaWithMarginM2 * 0.4 * s.Painting * 2);
          return (tc7035 > 10 || tc3020 > 10) ? Math.ceil((tc7035 + tc3020) / 10) : 1;
      } },
    { sap: '29035857', desc: 'LEP ALEXIT 9 RED 200g',                 unit: 'EA',  calcQty: (s, d, lay, reg) => {
          if (s.LEP === 0) return 0;
          const mFactor = (reg === 'Middle' ? 2 : 3) * s.LEP;
          return Math.max(1, Math.ceil((lay.maxLength / 1000) / mFactor));
      } },
    { sap: '29035858', desc: 'LEP ALEXIT 9 WHITE 200g',               unit: 'EA',  calcQty: (s, d, lay, reg) => {
          if (s.LEP === 0) return 0;
          const mFactor = (reg === 'Middle' ? 2 : 3) * s.LEP;
          return Math.max(1, Math.ceil((lay.maxLength / 1000) / mFactor));
      } },
    { sap: '29035859', desc: 'LEP ALEXIT 9 GREY 200g',                unit: 'EA',  calcQty: (s, d, lay, reg) => {
          if (s.LEP === 0) return 0;
          const mFactor = (reg === 'Middle' ? 2 : 3) * s.LEP;
          return Math.max(1, Math.ceil((lay.maxLength / 1000) / mFactor));
      } },
    { sap: '29035904', desc: 'HARDENER 135g FOR ALEXIT LEP 9',        unit: 'EA',  calcQty: (s, d, lay, reg) => {
          if (s.LEP === 0) return 0;
          const mFactor = (reg === 'Middle' ? 2 : 3) * s.LEP;
          return Math.max(1, Math.ceil((lay.maxLength / 1000) / mFactor)) * 3;
      } },
];

// ============================================================
// FULL CONSUMABLES 
// ============================================================
const CONSUMABLES = [
    // Masking tape: always needed; factor 1.2 (not vacuum-dependent per Excel)
    { sap: '238710',   desc: 'MASKING TAPE, RUBBER 50mmX50m',         unit: 'ROL', calcQty: (s, d, lay) => Math.max(2, Math.ceil((lay.perimeter * 1.2) / 50)) },
    // Flash tape: Vacuum × 1.2 factor, min 2
    { sap: 'S094586',  desc: 'Flash tape 1/50mm poly/silic (blue)',   unit: 'ROL', calcQty: (s, d, lay) => s.Vacuum > 0 ? Math.max(2, Math.ceil((lay.perimeter * s.Vacuum * 1.2) / 66)) : 0 },
    // Scrim tape: fixed 1 per infusion step (Excel: IF(Infusion>0, 1, 0))
    { sap: '29006984', desc: 'TAPE SCRIM 50mm DB SIDED (Tacky tape)', unit: 'ROL', calcQty: (s) => s.Infusion > 0 ? 1 : 0 },
    // Cloth harpix: ceil(cleaningAreaM2) when Cleaning active
    { sap: '220320',   desc: 'Cloth harpix (cleaning before paint)',  unit: 'EA',  calcQty: (s, d, lay) => s.Cleaning > 0 ? Math.max(1, Math.ceil(lay.cleaningAreaM2)) : 0 },
    // Paper tork: ceil(cleaningAreaM2) when Cleaning active
    { sap: '198004',   desc: 'Paper tork (Cleaning paper roll)',      unit: 'ROL', calcQty: (s, d, lay) => s.Cleaning > 0 ? Math.max(1, Math.ceil(lay.cleaningAreaM2)) : 0 },
    { sap: '60032042', desc: 'CLOTH,CLEANING,COTTON,500 mm',          unit: 'KG',  calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    // Rubbish bag: ceil(cleaningAreaM2)
    { sap: '60059753', desc: 'RUBBISH BAG BLUE 120l, 60MY 76',        unit: 'ROL', calcQty: (s, d, lay) => Math.max(1, Math.ceil(lay.cleaningAreaM2)) },
    // Baker's bag: 3 ea when Cleaning active (Excel: IF(Cleaning≠0, 1, 0) × 3)
    { sap: '235000',   desc: "Baker's bag (Piping bag for resin)",    unit: 'EA',  calcQty: (s) => s.Cleaning > 0 ? 3 : 0 },
    // Plastic cups: factor 2.2 per Excel
    { sap: '213560',   desc: 'PLASTIC CUP 1.0 LITER',                 unit: 'EA',  calcQty: (s) => Math.ceil(s.Weighing * 2.2) },
    { sap: '213550',   desc: 'PLASTIC CUP 0.5 LITRE',                 unit: 'EA',  calcQty: (s) => Math.ceil(s.Weighing * 2.2) },
    // Release film: REV05 unit=M², ROUNDUP((maxLen+100)*(maxW+100)*1e-6 * Vacuum*1.4, 0)
    { sap: '300023948', desc: 'RELEASE FILM 1500mm',                   unit: 'M2',  calcQty: (s, d, lay) => s.Vacuum > 0 ? Math.ceil((lay.maxLength + 100) * (lay.maxWidth + 100) * 1e-6 * s.Vacuum * 1.4) : 0 },
    // Breathing cloth: REV05 unit=M², ROUNDUP(maxAreaM2 * Vacuum*1.4, 0)
    { sap: 'S096512',   desc: 'BREATHING CLOTH 900MM 150G/M2',         unit: 'M2',  calcQty: (s, d, lay) => s.Vacuum > 0 ? Math.ceil(lay.maxAreaM2 * s.Vacuum * 1.4) : 0 },
    // Bagging film: REV05 unit=M², ROUNDUP(splAreaM2 * Vacuum*1.4, 0)
    { sap: '29017040',  desc: 'BAGGING FILM 3000MM Infusion SST',      unit: 'M2',  calcQty: (s, d, lay) => s.Vacuum > 0 ? Math.ceil(lay.splAreaM2 * s.Vacuum * 1.4) : 0 },
    // Peel ply: maxAreaM2 × Vacuum × 1.4
    { sap: '29232963',  desc: 'PEEL PLY A100/A100PS 50mx1500mm',       unit: 'M2',  calcQty: (s, d, lay) => s.Vacuum > 0 ? Math.ceil(lay.maxAreaM2 * s.Vacuum * 1.4) : 0 },
    // Transport mesh: REV05 unit=M², ROUNDUP(maxAreaM2 * Infusion*1.2, 0)
    { sap: '260710',    desc: 'TRANSPORT MESH 1550MM',                  unit: 'M2',  calcQty: (s, d, lay) => s.Infusion > 0 ? Math.ceil(lay.maxAreaM2 * s.Infusion * 1.2) : 0 },
    { sap: '29017050', desc: 'VACUUM CHANNEL 50MM INFUSION',          unit: 'M',   calcQty: (s, d, lay) => s.Infusion > 0 ? Math.ceil(lay.perimeter * 1.4) : 0 },
    { sap: '29083917', desc: 'GLASSFIBER OMEGA R8.5,SENS',            unit: 'EA',  calcQty: (s) => s.Infusion > 0 ? 1 : 0 },
    { sap: null,        desc: 'Conexao TEE 1/4" (T-piece) — SAP N/A', unit: 'EA',  calcQty: (s) => s.Infusion > 0 ? s.Infusion + 2 : 0 },
    // Spirol band: Vacuum condition, perimeter × Vacuum × 1.2
    { sap: '29023572', desc: 'SPIROL BAND 12mm (Spiral tube)',        unit: 'M',   calcQty: (s, d, lay) => s.Vacuum > 0 ? Math.ceil(lay.perimeter * s.Vacuum * 1.2) : 0 },
    // Nylon pipe: 40m base + maxLength/1000 × Vacuum
    { sap: '223449',   desc: 'NYLON PIPE 8x6mm NO COLOUR (Resin line)',unit: 'M',  calcQty: (s, d, lay) => s.Vacuum > 0 ? Math.ceil(40 + lay.maxLength / 1000 * s.Vacuum) : 0 },
    // Yellow sealant: Vacuum × 1.2 factor, min 2
    { sap: '108402',   desc: 'Yellow sealant tape (Tacky Tape)',      unit: 'ROL', calcQty: (s, d, lay) => s.Vacuum > 0 ? Math.max(2, Math.ceil((lay.perimeter * s.Vacuum * 1.2) / 7.5)) : 0 },
];

// ============================================================
// FULL TOOLS DATABASE — exact match to Excel Tools sheet
// Conditions and quantities mirror column D formulas in the Tools sheet
// ============================================================
const TOOLS = [
    // Heating blankets — HLU or Infusion
    { sap: 'VT730406',    desc: 'Heating blanket 1300*1300 mm 230v',           unit: 'EA', calcQty: (s) => (s.HLU > 0 || s.Infusion > 0) ? 3 : 0 },
    { sap: 'VT730630',    desc: 'HEATING BLANKET 350x3800 230V',               unit: 'EA', calcQty: (s) => (s.HLU > 0 || s.Infusion > 0) ? 1 : 0 },
    // Grinders / Drill / Heat Gun — Grinding condition unless noted
    { sap: '232936',      desc: 'Excentric grind machine 150mm',               unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 1 : 0 },
    { sap: '232935',      desc: 'EXCENTRIC GRIND.MACH. 125 BOSCH',             unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 2 : 0 },
    { sap: '233845',      desc: 'ANGLE GRINDER METABO 5" 125 (RPM adj)',       unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 1 : 0 },
    { sap: '20030258',    desc: 'ANGLE GRINDER BATTERY OPERATED',              unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 1 : 0 },
    { sap: '233855',      desc: 'STRAIGHT GRINDER BOSCH GGS-27C',              unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 1 : 0 },
    { sap: '213570',      desc: 'Heating airblower pistol 1600w',              unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: '213473',      desc: 'BATTERY DRILL MACHINE ELU',                   unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: '213476',      desc: 'DRILL BOX WITH 1-13MM PERFOR',                unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: '291960',      desc: 'CABLE REEL, ELEC W/CEE PLUGS 25M',            unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 2 : 0 },
    { sap: '213523',      desc: 'EXTEN.CORD EU MALE/REG.FEMALE',               unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 2 : 0 },
    { sap: 'VT70002334',  desc: 'BATTERY CHARGER MAKITA',                      unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 2 : 0 },
    { sap: 'VT70002335',  desc: 'BATTERY MAKITA',                              unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 4 : 0 },
    // Vacuum / Compressor
    { sap: 'VT70003289',  desc: 'F SERIES 2F-10 VACUUM PUMP',                  unit: 'EA', calcQty: (s) => s.Vacuum > 0 ? 1 : 0 },
    { sap: 'VT710600',    desc: 'VACUUM CLEANER',                              unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    // Tools requiring annual certification
    { sap: 'VT181002',    desc: 'SLIDE GAUGE 0-150 MM',                        unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT185800',    desc: 'FEELER GAUGE SET 0.05-1mm',                   unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT189025',    desc: 'WET FILM COMB',                               unit: 'EA', calcQty: (s) => s.Painting > 0 ? 2 : 0 },
    { sap: 'VT192395',    desc: 'GAUGE WRINKLE WHITE',                         unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT190913_000',desc: 'YELLOW WRINKLE GAUGE',                        unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT189200',    desc: 'SHORE-D 0-100 HARDNESS TESTER',               unit: 'EA', calcQty: (s) => (s.HLU > 0 || s.Infusion > 0) ? 1 : 0 },
    { sap: 'VT189225',    desc: 'HARDNESS TESTER BARCOL 0-100',                unit: 'EA', calcQty: (s) => (s.HLU > 0 || s.Infusion > 0) ? 1 : 0 },
    { sap: 'VT188978',    desc: 'IR-THERMOMETER FLUKE 62',                     unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT189381',    desc: 'ECOLOG DATALOGGER WITH DISPLAY',               unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT189301',    desc: 'THERMO COUPLE (Cable type K)',                 unit: 'EA', calcQty: (s) => (s.HLU > 0 || s.Infusion > 0) ? 1 : 0 },
    { sap: 'VT70001087',  desc: 'WIND GAUGE WINDMASTER 2',                     unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT189358',    desc: 'THERMOMETER FLUKE 51 DIGITAL',                unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    // Others — dispensing tools (Bonding condition)
    { sap: 'VT20020580',  desc: 'KIT F TWO COMP DISPENSING GUN',               unit: 'EA', calcQty: (s) => s.Bonding > 0 ? 1 : 0 },
    { sap: '29035578',    desc: 'CAULKING GUN 9"',                             unit: 'EA', calcQty: (s) => s.Bonding > 0 ? 1 : 0 },
    { sap: '10102199',    desc: 'GREASE FILLER GUN',                           unit: 'EA', calcQty: (s) => s.Bonding > 0 ? 1 : 0 },
    { sap: '20032802',    desc: 'BATTERY POWERED 400ML COX DISPENSER',         unit: 'EA', calcQty: (s) => s.Bonding > 0 ? 1 : 0 },
    { sap: '20034926',    desc: 'BATTERY POWERED 450ML ALBION DISPENSER',      unit: 'EA', calcQty: (s) => s.Bonding > 0 ? 1 : 0 },
    { sap: 'S096072',     desc: 'ARALDITE GUN 2021 50ML',                      unit: 'EA', calcQty: (s) => s.Bonding > 0 ? 1 : 0 },
    // Measuring / marking
    { sap: 'VT181637',    desc: 'TAPEMEASURE 50m C1',                          unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT181616',    desc: 'MEASURING TAPE, 5.5M',                        unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: '217942',      desc: 'HAMMER, NYLON WOOD HNDL 50X340MM',            unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT181160',    desc: 'RULER, SS, 150mm',                            unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT181161',    desc: 'RULER, METAL, 0-300mm',                       unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT181171',    desc: 'METAL RULER 0-1000mm',                        unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: '222402',      desc: 'PAINT MARKER BLUE EDDING',                    unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 3 : 0 },
    { sap: '230551',      desc: 'CHISEL, GEN-PURPOSE BEVELED 4MM',             unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 1 : 0 },
    { sap: 'VT70002387',  desc: 'CUTTER WITH SPRING (Safety Knife)',           unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT180199',    desc: 'MANUAL ROLLER MR1',                           unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT182687',    desc: 'MULTIGAS DETECTOR T4',                        unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: '213553',      desc: 'Goliath 38W Working light',                   unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 2 : 0 },
    { sap: '213507',      desc: 'HAND LAMP 230V ELECTRONIC',                   unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 2 : 0 },
    { sap: '29097941',    desc: 'BLOWER, 1000 m3/h, 1 kW, 400 V',             unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT730288',    desc: 'GENERATOR SET, DIESEL ENGINE, 6.6 kW, 230 V', unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
];