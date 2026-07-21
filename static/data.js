// ============================================================
// DATA.JS - EXHAUSTIVE REFERENCE DATA EXTRACTED FROM EXCEL
// Blade_Repair_Materials_Estimate
// ============================================================

// ---- FIBER OVERLAP RULE (norm 0149-9754 §12 + 945550 §9) ----
// The overlap is a PERCENTAGE OF THE FABRIC AREAL WEIGHT (gsm), in mm — not a
// fixed table. This is the engineering norm and supersedes the fixed REV05
// LAYUP!H4:J16 values (which had UD chord at 2% and BIAX936 rounded to 50).
//   Biax:      span 5%   chord 5%
//   UD:        span 10%  chord 2%  (see note below)
//   Triax:     span = Biax(5%) + UD(10%) of its sub-plies ; chord 2.5% of total
//   Carbon UD: span 12%  chord 2%
// NOTE (UD chord): the norm lists UD chord at 5%, but that overlap was too
// large in practice — the field team keeps UD chord at 2% (the REV05 value:
// 12/18/23/24 for 600/900/1140/1200). We follow the field team here.
// computeFiberOverlap() is the single source for any gsm (incl. HM / pending
// REV06 fabrics). Triax needs the biax/UD sub-ply split, which is only known
// for the two catalogued triax — those stay explicit in STANDARD_OVERLAPS.
function computeFiberOverlap(materialType, gsm) {
    const g = parseFloat(gsm) || 0;
    if (g <= 0) return null;
    const mm = pct => Math.round(g * pct);
    switch ((materialType || '').toUpperCase()) {
        case 'BIAX':   return { span: mm(0.05), chord: mm(0.05) };
        case 'UD':     return { span: mm(0.10), chord: mm(0.02) };  // chord 2% (field team), not the norm's 5%
        case 'CARBON': return { span: mm(0.12), chord: mm(0.02) };
        // Triax span depends on the biax/UD split (unknown from gsm alone);
        // the two real triax live in STANDARD_OVERLAPS. Chord is 2.5% of total.
        case 'TRIAX':  return { span: null, chord: mm(0.025) };
        default:       return null; // SPL / CFM50 / CORE / BALSA are special
    }
}

// ---- STANDARD OVERLAPS (derived from the norm 0149-9754 §12) ----
// Glass fabrics: values below are computeFiberOverlap() applied to each gsm.
// Kept as an explicit table (a) for the two triax whose span needs the sub-ply
// split, (b) for the special fabrics (SPL/CFM50/CORE/BALSA) outside the fiber
// rule, and (c) so display/reference tables have a stable list.
const STANDARD_OVERLAPS = {
    'BIAX200':   { span: 10,  chord: 10 },   // 5% × 200  = 10   (V136, ex-pending)
    'BIAX450':   { span: 23,  chord: 23 },   // 5% × 450  = 22.5 → 23 (V136, ex-pending)
    'BIAX600':   { span: 30,  chord: 30 },   // 5% × 600  = 30
    'BIAX936':   { span: 47,  chord: 47 },   // 5% × 936  = 46.8 → 47  (REV05 had 50)
    'BIAX1000':  { span: 50,  chord: 50 },   // 5% × 1000 = 50
    'BIAX1200':  { span: 60,  chord: 60 },   // 5% × 1200 = 60
    'UD600':     { span: 60,  chord: 12 },   // span 10%×600=60 ; chord 2%×600=12  (field team keeps 2%, not norm's 5%)
    'UD900':     { span: 90,  chord: 18 },   // span 10%×900=90 ; chord 2%×900=18
    'UD1140':    { span: 114, chord: 23 },   // span 10%×1140=114 ; chord 2%×1140=22.8→23
    'UD1200':    { span: 120, chord: 24 },   // span 10%×1200=120 ; chord 2%×1200=24
    'TRIAX1200': { span: 90,  chord: 30 },   // span 600 biax(30)+600 UD(60)=90 ; chord 2.5%×1200=30
    'TRIAX1500': { span: 125, chord: 38 },   // span ~658 biax(33)+936 UD(94)=~125 ; chord 2.5%×1500=37.5 → 38 (REV05 had 35)
    'SPL':       { span: 75,  chord: 75 },   // special (patch), fixed
    'CFM50':     { span: 30,  chord: 30 },   // special (surface veil), fixed
    'CORE':      { span: 0,   chord: 0 },
    'BALSA':     { span: 0,   chord: 0 }
};

// ---- GLOBAL MATERIAL TYPE OPTIONS ----
// Source: REV05 Lists!E2:E7 (BIAX/UD/TRIAX/CORE/SPL/CFM50) and Lists!G2:G8 (GSM).
// BALSA is intentionally tracked separately as a special fabric (no GSM, no overlap).
const MATERIAL_TYPES = ['BIAX', 'UD', 'TRIAX', 'CORE', 'BALSA', 'SPL', 'CFM50'];
const GSM_OPTIONS = [200, 450, 600, 900, 936, 1000, 1140, 1200, 1500];

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
        // Biax variants from REV05 Blades_Fabrics (F11/F12/F13). Now calculable:
        // overlap comes from the norm rule (biax = 5% of gsm) via computeFiberOverlap,
        // so no overlap value is invented. SAP is still 'TBD' (pending REV06) — the
        // fabric computes weight/area/qty; only the order number is outstanding.
        { materialType: 'BIAX',  gsm: '450',  label: 'BIAX ±45° 450 (rolo)' },
        { materialType: 'BIAX',  gsm: '200',  label: 'BIAX ±45° 200 (rolo)' },
        { materialType: 'BIAX',  gsm: '1200', label: 'BIAX ±80° 1200 / T80' },
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
    // V162 (Vidar F3) — offshore HM-glass blade. Uses the same HM fabric
    // catalog as V150 (confirmed against real V162 estimates, which the field
    // used with the HM fabrics). Refine here if the V162 drawings specify
    // different HM fabrics. Drawing refs live in BLADE_DOCUMENT_REFERENCES.
    'V162': [
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
    // V136 biax variants (F11/F12/F13) were MIGRATED into the calculation
    // pipeline: overlap now comes from the norm's biax 5% rule, so no value is
    // invented. SAP is still 'TBD' (pending REV06) but weight/area/qty compute.
    // Only Quadrax stays reference-only \u2014 the norm gives no quadrax overlap rule.
};

const CHORD_REFERENCES = ['LE', 'TE', 'M.Web', 'TE.Web'];
const BLADE_REGIONS = ['Root', 'Middle', 'Tip'];
const BLADE_MODELS = ['V82', 'V90', 'V100', 'V110', 'V112', 'V136', 'V150', 'V162'];

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
        // V136 ex-pending biax (REV05 Blades_Fabrics F11/F12/F13). Overlap comes
        // from the norm formula (5% of gsm); SAP is TBD until REV06 provides it.
        // Sold as ROLLS (EA), not by the kg. kgPerUnit = roll weight, so the
        // divide formula qty = ceil(weightKg / kgPerUnit) yields whole rolls.
        // Source: List of tools and materials Feb/2026 rev 23.
        'BIAX200':   { sap: '29238494',  desc: 'FABRIC BIAX 220 +45/-45 ST (roll 19m/5kg)',   unit: 'EA', kgPerUnit: 5 },
        'BIAX450':   { sap: '29219676',  desc: 'FGE806-A GE 450 +45/-45 HD (roll 35m/20kg)',  unit: 'EA', kgPerUnit: 20 },
        'BIAX600':   { sap: 'S096476',   desc: 'BIAX 600G/M2 GLASS FABRIC',          unit: 'KG', kgPerUnit: 1 },
        'BIAX936':   { sap: '29009736',  desc: 'BIAX 936GSM 127CM STABILIZED',       unit: 'KG', kgPerUnit: 1 },
        'BIAX1000':  { sap: '29281859',  desc: 'FABRIC,E-GLASS,BIAX +/-45,1000 g/m2',unit: 'KG', kgPerUnit: 1 },
        // BIAX1200 E-glass (V136, Biax ±80° / T80). Distinct from the V150 HM
        // BIAX1200 (SAP 29110146). SAP TBD until REV06.
        'BIAX1200':  { sap: '29022487',  desc: 'BIAX +/-80 1200 g/m2 E-GLASS / T80', unit: 'KG', kgPerUnit: 1 },
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

// ============================================================
// REPAIR GUIDE — reference data (read-only decision support)
// Source: "REFERÊNCIAS DOS DOCUMENTOS DAS BLADES.xlsx" → sheet
// "ÁRVORE DE DECISÃO" (Ref: 945550 V14 + CIM4271 / 0100-6810). Engineering
// reference material, shown read-only in the Repair Guide.
// ============================================================

// 10 general field rules (945550 §9).
const FIELD_RULES = [
    { n: 1,  rule: 'Superfície limpa antes de laminar',          detail: 'Após remover peel-ply ou abrasão: máx 3h exposta ao ambiente', consequence: 'Contaminação → falha de adesão' },
    { n: 2,  rule: 'Fibra alinhada conforme desenho',            detail: 'Duplicar a orientação do material removido, sem bumps',        consequence: 'Perda de resistência estrutural' },
    { n: 3,  rule: 'Overlap mínimo',                              detail: '5% do peso da fibra (g/m²) em mm. Ex: 600gsm = 30mm',          consequence: 'Junta fraca' },
    { n: 4,  rule: 'Primeira camada = a menor (multi-camada)',   detail: 'Em reparo multi-camada, começar pela menor',                  consequence: 'Perfil incorreto' },
    { n: 5,  rule: 'Vácuo mín. 0.8 bar',                          detail: 'Vacuum consolidation sempre que possível',                    consequence: 'Porosidade, delaminação' },
    { n: 6,  rule: 'Cura com manta térmica',                     detail: 'Seguir 0042-5383. Sensor térmico sob a manta recomendado',    consequence: 'Cura incompleta (<95%)' },
    { n: 7,  rule: 'Molhar superfície com resina antes da fibra',detail: 'Wet-out do substrato obrigatório',                            consequence: 'Dry spots, delaminação' },
    { n: 8,  rule: 'Cantos arredondados nos laminados',          detail: 'Cortar a fibra com round corners',                            consequence: 'Concentração de tensão' },
    { n: 9,  rule: 'Diferença temp. material-superfície ≤5°C',   detail: 'Material e blade devem estar próximos em temperatura',        consequence: 'Cura irregular' },
    { n: 10, rule: 'Grinding só após cura completa (95%)',       detail: 'Segurança: exposição a químicos não curados',                 consequence: 'Risco à saúde + dano ao reparo' },
];

// Fiber substitution (945550 §9 Table 9.1).
const FIBER_SUBSTITUTIONS = [
    { original: 'Biax 936 g/m²',   alternative: 'Biax 600 + Biax 300 g/m²',    notes: 'Soma = 900 g/m² (equivalente)' },
    { original: 'UD 1140 g/m²',    alternative: '2 × UD 600 g/m²',             notes: 'Soma = 1200 g/m² (ligeiramente acima)' },
    { original: 'Triax 1500 g/m²', alternative: 'Biax 936 + UD 600 g/m²',      notes: 'Alternativa 1' },
    { original: 'Triax 1500 g/m²', alternative: 'Triax 1200 + Biax 300 g/m²',  notes: 'Alternativa 2' },
];

// Core substitution (945556 V12).
const CORE_SUBSTITUTIONS = [
    { original: 'PET core', alternative: 'PVC core', notes: 'Equivalente aprovado para substituição' },
];

// Decision tree by damage type (Ref: 945550 V14 + CIM4271).
const DAMAGE_DECISION_TREE = [
    { damage: 'Dano em coating/gelcoat', zone: 'Shell (qualquer)', severity: 'Cosmético',            level: 'C',  method: 'Reparo cosmético: lixar + filler + pintura',           ref: '945550',             kit: 'SikaForce 7800 + Topcoat 12',            accept: 'Superfície lisa, sem degraus',              notes: 'Não afeta estrutura' },
    { damage: 'Dano em coating/gelcoat', zone: 'LE',               severity: 'Cosmético',            level: 'B',  method: 'Lixar + filler + LEP coating',                        ref: '945550 + LEP doc',   kit: 'SikaForce 7800 + ALEXIT LEP 9',          accept: 'LEP 3 camadas 100-125µm cada',              notes: 'LE sempre com LEP, nunca Topcoat' },
    { damage: 'Crack/delaminação shell', zone: 'Shell SS/PS',      severity: 'Superficial (<1m²)',   level: 'B',  method: 'Remover dano + layup + cura + acabamento',            ref: '945550 / 0116-3896', kit: '899019(PPT) ou 29035992(SST) + Ampreg 30',accept: 'Sem porosidade, overlap correto, Barcol>25',notes: 'Vacuum 0.8bar, cura @70°C' },
    { damage: 'Crack/delaminação shell', zone: 'Shell SS/PS',      severity: 'Profunda (>1m²)',      level: 'A',  method: 'Remover dano + layup multi-camada + vacuum + cura',   ref: '945550 / 0116-3896', kit: 'Fibra conforme drawing + Ampreg 30',     accept: 'Conforme drawing, Barcol>25',               notes: 'Seguir layup drawing específico' },
    { damage: 'Erosão/dano LE',          zone: 'LE',               severity: 'Estrutural (≤150cm)',  level: 'B',  method: 'Remover dano + layup + LEP',                          ref: '945550',             kit: 'Fibra + Ampreg 30 + LEP 9',              accept: 'Perfil restaurado + LEP completo',          notes: 'Verificar bond line' },
    { damage: 'Erosão/dano LE',          zone: 'LE',               severity: 'Estrutural (>150cm)',  level: 'A',  method: 'Remover dano + layup extenso + LEP',                  ref: '945550',             kit: 'Fibra + Ampreg 30 + LEP 9',              accept: 'Perfil restaurado + LEP completo',          notes: 'Contactar suporte técnico' },
    { damage: 'Crack/debonding TE',      zone: 'TE',               severity: 'Até 150cm',            level: 'B',  method: 'Abrir bond + limpar + re-bond + reforço',             ref: '945550',             kit: 'SikaForce 7818 + fibra biax',            accept: 'Bond sem gaps, reforço conforme',           notes: 'Verificar extensão total antes' },
    { damage: 'Crack/debonding TE',      zone: 'TE',               severity: 'Acima 150cm',          level: 'A',  method: 'Abrir bond + limpar + re-bond + reforço extenso',     ref: '945550 / TE SST doc',kit: 'SikaForce 7818 + fibra biax',            accept: 'Bond sem gaps, reforço conforme drawing',   notes: 'Pode requerer CIM específico' },
    { damage: 'Lightning strike',        zone: 'Tip/Receptores',   severity: 'Receptor danificado',  level: 'B',  method: 'Medir continuidade + trocar receptor',               ref: '945550',             kit: 'Receptor novo + ferramentas LPS',        accept: 'Continuidade elétrica OK',                  notes: 'Medir antes e depois' },
    { damage: 'Lightning strike',        zone: 'Shell (superficial)',severity: 'Dano shell por lightning',level: 'A',method: 'Remover dano + layup + restaurar LPS',              ref: '945550',             kit: 'Fibra + resina + componentes LPS',       accept: 'Estrutura + LPS restaurados',               notes: 'Verificar toda a extensão' },
    { damage: 'Lightning strike',        zone: 'Carbon spar (PPT)', severity: 'Dano em spar',        level: 'A+', method: 'Reparo carbon spar especializado',                   ref: 'Lightning PPT doc',  kit: 'Carbon prepreg 250g',                    accept: 'Conforme procedimento específico',          notes: 'REPARO AVANÇADO — supervisão' },
    { damage: 'Abertura bond line',      zone: 'LE/TE/Tip',        severity: '<5mm abertura',        level: 'A',  method: 'Injeção de adesivo + clamp',                          ref: '945550',             kit: 'SikaForce 7818',                         accept: 'Bond preenchido sem gaps',                  notes: 'Delimitar extensão total' },
    { damage: 'Abertura bond line',      zone: 'LE/TE/Tip',        severity: '>5mm abertura',        level: 'A',  method: 'Abrir + limpar + re-bond + reforço fibra',            ref: '945550',             kit: 'SikaForce 7818 + fibra reforço',         accept: 'Bond + reforço conforme',                   notes: 'Pode requerer CIM' },
    { damage: 'Dano bond shell-spar',    zone: 'Shell-Spar',       severity: 'Qualquer',             level: '⛔', method: 'NÃO REPARÁVEL — REPORTAR IMEDIATAMENTE',              ref: '945550 §13',         kit: '—',                                      accept: '—',                                         notes: 'RISCO ESTRUTURAL MAIOR — contactar engenharia' },
    { damage: 'Crack root laminate',     zone: 'Root',             severity: 'Passante',             level: 'A',  method: 'Remover dano + layup UD + cura',                      ref: '945550',             kit: 'Fibra UD + Ampreg 30',                   accept: 'Conforme drawing, Barcol>25',               notes: 'Reparo crítico — documentar tudo' },
    { damage: 'Dano tip / debonding tip',zone: 'Tip',              severity: 'Variável',             level: 'A',  method: 'Reparo ou troca de tip shell',                        ref: '945550',             kit: 'Adesivo + fibra ou tip shell novo',      accept: 'Perfil restaurado, LPS OK',                 notes: 'Verificar LPS após reparo' },
    { damage: 'Dano SMT / Implant',      zone: 'Root (SMT)',       severity: 'Variável',             level: 'A',  method: 'Conforme procedimento específico',                    ref: '0073-8810',          kit: 'Conforme procedimento',                  accept: 'Conforme procedimento',                     notes: 'V110/V126/V136 apenas' },
    { damage: 'Dano em core (sandwich)', zone: 'Shell',            severity: '<25×25cm',             level: 'B',  method: 'Remover core danificado + substituir + laminar',      ref: '945550',             kit: 'Core material + fibra + resina',         accept: 'Core substituído, laminado conforme',       notes: 'Manter espessura original' },
    { damage: 'Dano em core (sandwich)', zone: 'Shell',            severity: '>25×25cm',             level: 'A',  method: 'Remover core + substituir + layup conforme drawing',  ref: '945550 / 0116-3896', kit: 'Core + fibra conforme drawing + resina', accept: 'Conforme drawing original',                 notes: 'Seguir layup drawing' },
];