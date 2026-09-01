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
        // NOTE: the MX consumption log labels 29238494 as "TELAS BX600" — likely a
        // field typo (official Feb-2026 list: 29238494 = BIAX 220). Flagged for
        // warehouse verification; keeping the official identity.
        'BIAX200':   { sap: '29238494',  desc: 'FABRIC BIAX 220 +45/-45 ST (roll 19m/5kg)',   unit: 'EA', kgPerUnit: 5 },
        'BIAX450':   { sap: '29219676',  desc: 'FGE806-A GE 450 +45/-45 HD (roll 35m/20kg)',  unit: 'EA', kgPerUnit: 20 },
        'BIAX600':   { sap: 'S096476',   desc: 'BIAX 600G/M2 GLASS FABRIC',          unit: 'KG', kgPerUnit: 1 },
        // MX catalog (Formato_consumos_palas): sold as EA roll 18m/20kg (Feb-2026 list).
        // BR number was 29009736 (KG).
        'BIAX936':   { sap: '29238490',  desc: 'FABRIC,E-GLASS,BIAX 45,936 G/M2,1270 MM (roll 20kg)', unit: 'EA', kgPerUnit: 20 },
        'BIAX1000':  { sap: '29281859',  desc: 'FABRIC,E-GLASS,BIAX +/-45,1000 g/m2',unit: 'KG', kgPerUnit: 1 },
        // BIAX1200 E-glass (V136, Biax ±80° / T80). Distinct from the V150 HM
        // BIAX1200 (SAP 29110146). SAP TBD until REV06.
        'BIAX1200':  { sap: '29022487',  desc: 'BIAX +/-80 1200 g/m2 E-GLASS / T80', unit: 'KG', kgPerUnit: 1 },
        'UD600':     { sap: '29007004',  desc: 'FABRIC,E,UD 0 DEG,576 g/m2,1265 mm', unit: 'KG', kgPerUnit: 1 },
        'UD900':     { sap: '29017516',  desc: 'UD 0 900g S',                        unit: 'KG', kgPerUnit: 1 },
        // MX catalog: UD1140 consumed as S096486 (300mm winding, per KG). BR was 29017705.
        'UD1140':    { sap: 'S096486',   desc: 'UD 1140GSM 300MM',                   unit: 'KG', kgPerUnit: 1 },
        // REV05: UD1200 standard uses MULTIPLY (qty_M2 = ceil(weightKg * 1.225))
        // because unit is M² but ordering intent changed from divide-to-convert to multiply-as-factor
        'UD1200':    { sap: '29302515',  desc: 'FABRIC,E,UD 0,1200 g/m2,1270 mm',    unit: 'M2', kgPerUnit: 1.225, multiplyQty: true },
        // MX catalog: EA roll 14m/1265mm/20kg (Feb-2026 list; user chose the wide roll).
        // BR number was 29017700 (KG). MX narrow alternative: 29250987 (7m/635mm, 5kg).
        'TRIAX1200': { sap: '29250986',  desc: 'FABRIC,E,TRIAX,1200 G/M2,1265 MM (roll 20kg)', unit: 'EA', kgPerUnit: 20 },
        'TRIAX1500': { sap: '29017701',  desc: 'TRIAX 1500g',                        unit: 'KG', kgPerUnit: 1 },
        // BIAX1200 is intentionally HM-only in REV05 (Layer Data Input!E14 = "HM").
        // The Quadrax / Biax ±45 / Biax ±80 variants in REV05 Blades_Fabrics are NOT
        // mapped to SAPs anywhere in the workbook; they cannot be added here without
        // inventing data. See PENDING_REV06.md.
    },
    V150: {
        // REV05: all HM fabrics now sold by KG (not EA rolls)
        'BIAX600':   { sap: '29116888',  desc: 'FABRIC HM BI45 600G 1260',           unit: 'KG', kgPerUnit: 1 },
        // MX: EA roll 16m×1260mm ≈ 20 kg (16×1.26×1.014 = 20.4 — computed from roll
        // dimensions × gsm, noted in the MX consumption log). BR was 29464588 (KG).
        'BIAX1000':  { sap: '29234525',  desc: 'FABRIC HM BI45 1000 16Mx1260MM (roll ~20kg)', unit: 'EA', kgPerUnit: 20 },
        'BIAX1200':  { sap: '29110146',  desc: 'FABRIC HM BI80 1200G 1260',          unit: 'KG', kgPerUnit: 1 },
        // MX: EA rolls 13m×1260mm ≈ 20 kg each (13×1.26×1.2 = 19.7). BR numbers were
        // 29110162 / 29210017 (KG). MX alt for UD: 29305383.
        'UD1200':    { sap: '29234519',  desc: 'FABRIC HM UD0 1200G 13Mx1260MM (roll ~20kg)', unit: 'EA', kgPerUnit: 20 },
        'TRIAX1200': { sap: '29234528',  desc: 'FABRIC HM TRIAX 1200 13Mx1260MM (roll ~20kg)', unit: 'EA', kgPerUnit: 20 },
    }
};

const FABRICS_SPECIAL = {
    'CFM50':     { sap: '29023582', desc: 'SURFACE VEIL GLASSTISSUE 50GSM',    unit: 'KG', kgPerUnit: 0.05 },
    // MX catalog: 10m patch (29180312) replaces the 5m one (BR 29180313).
    // rollArea = 10 × 1.15 = 11.5 m².
    'SPL':       { sap: '29180312', desc: 'SPL REPAIR PATCH 10000 x 1150 MM',  unit: 'EA', rollArea: 11.5 },
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
    // MX catalog (Formato_consumos_palas): 29196703 replaces BR 233875.
    { sap: '29196703', desc: 'REAR DISK RUBBER 125mm (Backing pad)',  unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 2 : 0 },
    { sap: '232923',   desc: 'Round grinding plate G120 125mm',       unit: 'EA', calcQty: (s, d, lay) => s.Grinding > 0 ? Math.ceil(lay.maxAreaM2) * 15 : 0 },
    // MX: 29196704 (W/O holes, 26 uses) replaces BR 232906 (2 uses in MX log).
    { sap: '29196704', desc: 'ROUND GRINDING PLATE G60 125mm W/O HOLES', unit: 'EA', calcQty: (s, d, lay) => s.Grinding > 0 ? Math.ceil(lay.maxAreaM2) * 15 : 0 },
    // Único grão de acabamento do catálogo (não existe K220 em 125mm), roda na
    // excêntrica de 150mm. SAP conferido na lista oficial: 29196720 substitui o
    // 233015 — mesma família 291967xx dos demais abrasivos adotados do México
    // (29196703 prato 125, 29196704 G60 125) e classificado como consumível.
    // ATENÇÃO: é prato de 9 FUROS — o suporte precisa ter o mesmo padrão.
    { sap: '29196720', desc: 'GRIND PLATE ø150 K220, 9 HOLE (finishing)', unit: 'EA', calcQty: (s, d, lay) => s.Grinding > 0 ? Math.ceil(lay.maxAreaM2) * 15 : 0 },
    { sap: '233843',   desc: 'SCOTCH BRITE 3M BLK 158x224mm',         unit: 'EA', calcQty: (s) => s.LEP > 0 ? 3 * s.LEP : 0 },
    // MX: 29196727 (54 uses) replaces BR 224010 (4 uses in MX log).
    { sap: '29196727', desc: 'PADDLE STIRRERS (wood stick)',          unit: 'EA', calcQty: (s) => Math.ceil(s.Weighing * 1.1) },
    { sap: '221120',   desc: 'Household scale (weight scale) 5kg',    unit: 'EA', calcQty: (s) => s.Weighing > 0 ? 1 : 0 },
    { sap: '29196730', desc: 'Plast roll (Consolidation Roller) 13x75',unit: 'EA', calcQty: (s) => s.HLU > 0 ? Math.max(2, Math.ceil(s.HLU)) : 0 },
    // MX: 29196729 (36 uses) replaces BR 222720 (6 uses in MX log). 50mm alt: 222710.
    { sap: '29196729', desc: 'BRUSH, PAINT, MODDLARE 70MM',           unit: 'EA', calcQty: (s) => Math.ceil(s.HLU * 1.2) },
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
// ── Esquema de pintura (top coat) ────────────────────────────────────────────
// Fonte: tabela PINTURA (TOPCOAT) da lista de material. Cada cor tem duas
// embalagens; usamos o kit de 1kg (sap) e registramos a alternativa (altSap),
// cujo tamanho ainda não foi confirmado — por isso não entra no cálculo.
//
// A pá é sempre de cor única (base) ou cor única com faixas coloridas (stripe).
const TOPCOAT_COLORS = {
    'RAL7035': { sap: '29034878', altSap: '29035852', role: 'base',   label: 'Grey (RAL7035)',   desc: 'KIT,TOP COAT 12 RAL7035 1kg (Grey)' },
    'RAL9010': { sap: '29034879', altSap: '29035853', role: 'base',   label: 'White (RAL9010)',  desc: 'KIT,TOP COAT 12 RAL9010 1kg (White)' },
    'RAL3020': { sap: '29035851', altSap: '29035855', role: 'stripe', label: 'Red (RAL3020)', desc: 'KIT,TOP COAT 12 RAL3020 1kg (Red)' },
    'RAL2009': { sap: '29035720', altSap: '29035854', role: 'stripe', label: 'Orange (RAL2009)',  desc: 'KIT,TOP COAT 12 RAL2009 1kg (Orange)' },
};

// Padrão = comportamento histórico do app (cinza + faixa vermelha).
const DEFAULT_PAINT_SCHEME = { base: 'RAL7035', stripe: 'RAL3020' };

function topcoatColor(ral) {
    return TOPCOAT_COLORS[ral] || TOPCOAT_COLORS[DEFAULT_PAINT_SCHEME.base];
}

// Consumo por cor: REV05 Materials — area com margem x 0,4 kg/m2 x demaos.
function topcoatQty(lay, s) {
    return Math.ceil(lay.areaWithMarginM2 * 0.4 * s.Painting * 2);
}

// ── Reparos especiais (kit fixo por pá) ─────────────────────────────────────
// Listas de material de procedimentos que NÃO dependem da geometria do dano:
// o material é um kit + consumíveis fixos por pá. Fontes:
//   serration → work instruction 00618905 + lista de campo REYNOSA (planilha
//               V136_REYNOSA_SERRATION_REPAIR_MATERIALS, aba SERRATION INSTALL)
//   collar    → work instruction 0015-0803 V05 (Replacement of blade collar,
//               plataforma 2 MW; kit pesa 15 kg)
// SAPs migrados para o catálogo México onde a troca já foi feita no BOM
// (233015→29196720, 233875→29196703, 224010→29196727). Itens do documento sem
// número de item entram com sap '-' — política de zero-mock, nada inventado.
// perBlade:false = ferramenta reutilizável, não multiplica pelo nº de pás.
// ── Serration: peça por raio ────────────────────────────────────────────────
// Tabela de posições dos componentes de serration por faixa de raio, extraída
// da tabela do desenho de montagem (V136 serration V2.1). Chaveada pelo id da
// variante em SPECIAL_REPAIRS.serration — para adicionar outro modelo, basta
// criar a entrada com as faixas do desenho dele. tipR = raio da ponta (mm),
// usado para mostrar a distância a partir do TIP (dist = tipR − r).
// Faixas em mm, normalizadas [min, max]; posições 5 e 7 têm duas faixas.
const SERRATION_POSITIONS = {
    'V136': {
        tipR: 68000,
        source: 'V136 serration V2.1 assembly drawing table',
        parts: [
            { pos: 1, sap: '29063743', desc: 'SERRATED TRAILING EDGE 1 V2.1', pcs: 4,  kg: 0.093, ranges: [[66500, 67500]] },
            { pos: 2, sap: '29063744', desc: 'SERRATED TRAILING EDGE 2 V2.1', pcs: 2,  kg: 0.225, ranges: [[65500, 66500]] },
            { pos: 3, sap: '29063745', desc: 'SERRATED TRAILING EDGE 3 V2.1', pcs: 3,  kg: 0.243, ranges: [[64000, 65500]] },
            { pos: 4, sap: '29063746', desc: 'SERRATED TRAILING EDGE 4 V2.1', pcs: 8,  kg: 0.273, ranges: [[60000, 64000]] },
            { pos: 5, sap: '29063747', desc: 'SERRATED TRAILING EDGE 5 V2.1', pcs: 12, kg: 0.307, ranges: [[56000, 60000], [49000, 51000]] },
            { pos: 6, sap: '29063748', desc: 'SERRATED TRAILING EDGE 6 V2.1', pcs: 8,  kg: 0.336, ranges: [[52000, 56000]] },
            { pos: 7, sap: '29080870', desc: 'SERRATED TRAILING EDGE 7 V2.1', pcs: 4,  kg: 0.368, ranges: [[51000, 52000], [48000, 49000]] },
        ],
    },
};

// Peças cuja faixa contém o raio (mm). Limite exato de faixa pertence às duas
// peças vizinhas — devolve as duas em vez de escolher em silêncio.
function findSerrationByRadius(variantId, radiusMm) {
    const t = SERRATION_POSITIONS[variantId];
    if (!t || !(radiusMm > 0)) return [];
    return t.parts.filter(p => p.ranges.some(([a, b]) => radiusMm >= a && radiusMm <= b));
}

const SPECIAL_REPAIRS = [
    {
        id: 'serration',
        label: 'Serration install (TE)',
        doc: '00618905',
        // Kits por modelo/versão. Fontes: WI 0052-7690 V03 (versão 1, tabela 8-1)
        // e WI 0061-8905 V06 (versões 2/2.1, tabela 8-1); V162 da lista de campo.
        // Os kits VERSÃO 1 de V112/V117/V126 constam como "TBC" no próprio doc —
        // sem número, não entram (zero-mock; ver PENDING_REV06.md).
        note: 'Versions 2 and 2.1 are NOT interchangeable. Full blade retrofit → use 2.1; individual component replacement → keep the existing version (WI 0061-8905 §8).',
        variants: [
            { id: 'V90v1',    label: 'V90 — version 1',        doc: '0052-7690 V03', kit: { sap: '29058631', desc: 'V90 SERRATION KIT VER 1',          unit: 'EA', qty: 1 } },
            { id: 'V100v1',   label: 'V100 — version 1',       doc: '0052-7690 V03', kit: { sap: '29057488', desc: 'V100 SERRATION KIT VER 1',         unit: 'EA', qty: 1 } },
            { id: 'V90v2',    label: 'V90 — version 2',        doc: '0061-8905 V06', kit: { sap: '29085790', desc: 'SERRATED TE KIT V90 (ver. 2)',     unit: 'EA', qty: 1 } },
            { id: 'V100v2',   label: 'V100 — version 2',       doc: '0061-8905 V06', kit: { sap: '29085789', desc: 'SERRATED TE KIT V100 (ver. 2)',    unit: 'EA', qty: 1 } },
            { id: 'V105v2',   label: 'V105 — version 2',       doc: '0061-8905 V06', kit: { sap: '29080160', desc: 'SERRATED TE KIT V105 (ver. 2)',    unit: 'EA', qty: 1 } },
            { id: 'V112_117v2',  label: 'V112/V117 — version 2',   doc: '0061-8905 V06', kit: { sap: '29079918', desc: 'SERRATED TE KIT V112/V117 (ver. 2)', unit: 'EA', qty: 1 } },
            { id: 'V112_117v21', label: 'V112/V117 — version 2.1', doc: '0061-8905 V06', kit: { sap: '29197722', desc: 'SERRATED TE KIT V117 (ver. 2.1)',    unit: 'EA', qty: 1 } },
            { id: 'V116',     label: 'V116',                  doc: '0061-8905 V06', kit: { sap: '29104664', desc: 'SERRATED TE KIT V116',            unit: 'EA', qty: 1 } },
            { id: 'V120',     label: 'V120',                  doc: '0061-8905 V06', kit: { sap: '29104665', desc: 'SERRATED TE KIT V120',            unit: 'EA', qty: 1 } },
            { id: 'V126v2',   label: 'V126 — version 2',       doc: '0061-8905 V06', kit: { sap: '29079919', desc: 'SERRATED TE KIT V126 (ver. 2)',    unit: 'EA', qty: 1 } },
            { id: 'V126v21',  label: 'V126 — version 2.1',     doc: '0061-8905 V06', kit: { sap: '29186328', desc: 'V126 TE SERRATION REV2.1 KIT',    unit: 'EA', qty: 1 } },
            { id: 'V136',     label: 'V136 — version 2.1',     doc: '0061-8905 V06', kit: { sap: '29082248', desc: 'SERRATED TE KIT V136 (ver. 2.1)',  unit: 'EA', qty: 1 } },
            { id: 'V162',     label: 'V162',                  doc: 'REYNOSA field list', kit: { sap: '29183278', desc: 'SERRATED TE KIT V162', unit: 'EA', qty: 1 } },
        ],
        items: [
            // Químicos
            { cat: 'Chemicals', sap: '234900',   desc: 'ALCOHOL DENATURED 93% 1/2 LITRE',            unit: 'BTL', qty: 2 },
            { cat: 'Chemicals', sap: '889017',   desc: 'EPOXY REP.SET, BLADES, R7035',               unit: 'EA',  qty: 1 },
            // Sikaflex 521 UV (300 ml); alternativa de cor/embalagem: 149752
            { cat: 'Chemicals', sap: '149751',   desc: 'SEALING 521UV NCS S 2502-B 300 (Sikaflex 521 UV)', unit: 'TUB', qty: 10 },
            { cat: 'Chemicals', sap: '291574',   desc: 'CLOTH,CLEANING (Satwipes w/ ethanol)',       unit: 'TUB', qty: 1 },
            // A lista de campo dizia 29035854 para RAL7035, mas na lista oficial
            // PINTURA 29035854 é a embalagem alternativa do RAL2009 (Orange).
            // RAL7035 oficial (29034878) CONFIRMADO pelo usuário (ago/2026).
            { cat: 'Chemicals', sap: '29034878', desc: 'KIT,TOP COAT 12 RAL7035 1kg (Grey)',         unit: 'KIT', qty: 1 },
            { cat: 'Chemicals', sap: '60120794', desc: 'CLEANER NO. 205 (Sika cleaner-205)',         unit: 'EA',  qty: 2 },
            { cat: 'Chemicals', sap: '29035856', desc: 'THINNER 1kg FOR TOP COAT 12',                unit: 'EA',  qty: 1 },
            // Ferramentas consumíveis
            { cat: 'Consumable tools', sap: '29057162', desc: 'DISTANCE CLIPS FOR SERRATIONS', unit: 'EA', qty: 1 },
            { cat: 'Consumable tools', sap: '234630',   desc: 'BLUE PLASTIC SPATTLE (FLEXIBLE)', unit: 'EA', qty: 4 },
            { cat: 'Consumable tools', sap: '60059473', desc: 'PAINT ROLLER, SUPER SMOOTH, 11in', unit: 'EA', qty: 4 },
            { cat: 'Consumable tools', sap: '234615',   desc: 'PLASTIC PUTTY KNIFE BLACK (STIFF)', unit: 'EA', qty: 2 },
            { cat: 'Consumable tools', sap: '29196727', desc: 'PADDLE STIRRERS (wood stick)',  unit: 'EA', qty: 4 },
            { cat: 'Consumable tools', sap: '29196720', desc: 'GRIND PLATE ø150 K220, 9 HOLE (finishing)', unit: 'EA', qty: 15 },
            { cat: 'Consumable tools', sap: '229600',   desc: 'SCISSOR FOR GLASS FIBER',       unit: 'EA', qty: 1 },
            // Consumíveis
            { cat: 'Consumables', sap: '220320',  desc: 'Cloth harpix (cleaning before paint)',      unit: 'EA',  qty: 2 },
            { cat: 'Consumables', sap: 'S094586', desc: 'Flash tape 1/50mm poly/silic (blue)',       unit: 'ROL', qty: 4 },
            { cat: 'Consumables', sap: '238710',  desc: 'MASKING TAPE, RUBBER 50mmX50m',             unit: 'ROL', qty: 4 },
            { cat: 'Consumables', sap: '198004',  desc: 'Paper tork (Cleaning paper roll)',          unit: 'ROL', qty: 2 },
            // Ferramentas (reutilizáveis — não multiplicam por pá)
            { cat: 'Tools', sap: '29097941',   desc: 'BLOWER, 1000 m3/h, 1 kW, 400 V',         unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: '291960',     desc: 'CABLE REEL, ELEC W/CEE PLUGS 25M',       unit: 'EA', qty: 4, perBlade: false },
            { cat: 'Tools', sap: '230551',     desc: 'CHISEL, GEN-PURPOSE BEVELED 4MM',        unit: 'EA', qty: 2, perBlade: false },
            { cat: 'Tools', sap: 'VT70002387', desc: 'CUTTER WITH SPRING (Safety Knife)',      unit: 'EA', qty: 2, perBlade: false },
            { cat: 'Tools', sap: '232936',     desc: 'Excentric grind machine 150mm (K220 finishing)', unit: 'EA', qty: 2, perBlade: false },
            { cat: 'Tools', sap: 'VT180199',   desc: 'MANUAL ROLLER MR1',                      unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: 'VT181616',   desc: 'MEASURING TAPE, 5.5M',                   unit: 'EA', qty: 2, perBlade: false },
            { cat: 'Tools', sap: 'VT181171',   desc: 'METAL RULER 0-1000mm',                   unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: '222402',     desc: 'PAINT MARKER BLUE EDDING',               unit: 'EA', qty: 4, perBlade: false },
            { cat: 'Tools', sap: 'VT181161',   desc: 'RULER, METAL, 0-300mm',                  unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: 'VT181637',   desc: 'TAPEMEASURE 50m C1',                     unit: 'EA', qty: 1, perBlade: false },
            // EPI (prática de campo da lista REYNOSA)
            { cat: 'PPE', sap: '237100', desc: 'Dust loops (3M mask paper)',      unit: 'EA',  qty: 3 },
            { cat: 'PPE', sap: '218173', desc: 'Gloves blue nitrile L',           unit: 'PAA', qty: 1 },
            { cat: 'PPE', sap: '214445', desc: 'Suit F/Protec, Tyvec, size XL',   unit: 'EA',  qty: 3 },
        ],
    },
    {
        id: 'collar',
        label: 'Blade collar replacement (2 MW)',
        doc: '0015-0803 V05',
        variants: [
            { id: 'mk1_10', label: 'Mk 1–10 (R7035)', kit: { sap: '10207233', desc: '2 MW Blade collar kit Mk 1-10 (SITE PART BLADE R. COVER R7035)', unit: 'EA', qty: 1 } },
            { id: 'mk11',   label: 'Mk 11',           kit: { sap: '29110316', desc: '2 MW Blade collar kit Mk 11 (SITE PART BLADE R. COVER)',        unit: 'EA', qty: 1 } },
        ],
        items: [
            // Consumíveis (tabela 9.1 do doc)
            { cat: 'Consumables', sap: '115517', desc: 'CABLE TIE 292x4.8mm PLT3S-C0 (as necessary)', unit: 'EA',  qty: 1 },
            { cat: 'Consumables', sap: '149751', desc: 'SEALING 521UV NCS S 2502-B 300 (Sikaflex 521 UV)', unit: 'TUB', qty: 1 },
            { cat: 'Consumables', sap: '198006', desc: 'CLEANING PAPER WYPALL X60',                  unit: 'EA',  qty: 1 },
            { cat: 'Consumables', sap: '291574', desc: 'SATWIPES ETHANOL (as necessary)',            unit: 'TUB', qty: 1 },
            // "Cleaning agent 0.5 l" do doc não tem número; mapeado para o álcool
            // 93% 1/2 litre — mapeamento CONFIRMADO pelo usuário (ago/2026).
            { cat: 'Consumables', sap: '234900', desc: 'ALCOHOL DENATURED 93% 1/2 LITRE (cleaning agent 0.5 l)', unit: 'BTL', qty: 1 },
            // Ferramentas (tabela 7.1 do doc; reutilizáveis)
            { cat: 'Tools', sap: '213473',   desc: 'BATTERY DRILL MACHINE ELU',                unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: '213476',   desc: 'DRILL BOX WITH 1-13MM PERFOR',             unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: '213616',   desc: 'CAULKING GUN H14',                         unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: '238353',   desc: 'SOCKET WRENCH 1/4" TECOS T063M',           unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: '250069',   desc: 'CUTTING PLIERS BAHCO 2101G-125MM',         unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: '294335',   desc: 'SCREWDRIVER 3,5X75MM',                     unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: 'VT730302', desc: 'SLING RNEN 1m 1t',                         unit: 'EA', qty: 2, perBlade: false },
            { cat: 'Tools', sap: '-',        desc: 'Rope to keep the collar from falling down', unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: '-',        desc: 'Allen key 5 mm',                           unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: '-',        desc: 'Permanent marker',                         unit: 'EA', qty: 1, perBlade: false },
            { cat: 'Tools', sap: '-',        desc: 'Plastic red/white tape (as necessary)',    unit: 'ROL', qty: 1, perBlade: false },
            // EPI (prática de campo — mesma base da serration; ajustar se preciso)
            { cat: 'PPE', sap: '237100', desc: 'Dust loops (3M mask paper)',      unit: 'EA',  qty: 3 },
            { cat: 'PPE', sap: '218173', desc: 'Gloves blue nitrile L',           unit: 'PAA', qty: 1 },
            { cat: 'PPE', sap: '214445', desc: 'Suit F/Protec, Tyvec, size XL',   unit: 'EA',  qty: 3 },
        ],
    },
];

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
    // MX catalog: 29237987 replaces BR 29276912 (same Prime 37 4kg std kit).
    { sap: '29237987', desc: 'PRIME 37 RESIN 4KG STD (Infusion)',     unit: 'EA',  calcQty: (s, d, lay) => {
          if (s.Infusion === 0) return 0;
          // REV05 formula: ROUNDUP(cfm50_mass_kg * infusion * 1.3 / 4, 0)
          // cfm50_mass_kg = splAreaM2 * 1.5 (area+50%) * 0.05 kg/m² (50g/m² CFM density)
          // Each PRIME 37 kit = 4 kg. Factor 1.3 = 30% waste.
          const cfm50MassKg = lay.splAreaM2 * 1.5 * 0.05;
          return Math.max(1, Math.ceil(cfm50MassKg * s.Infusion * 1.3 / 4));
      } },
    // MX catalog: 29237701 (400 mL cartridge, 23 uses) replaces BR 29078542 (450 mL).
    { sap: '29237701', desc: 'ADHESIVE SIKAPOWER 1200 400 mL',        unit: 'EA',  calcQty: (s, d, lay) => s.Bonding > 0 ? Math.ceil(lay.maxLength * 120e-6 * 23.33 * s.Bonding) : 0 },
    { sap: '29035907', desc: 'SikaForce 7818 L7 195mL',               unit: 'EA',  calcQty: (s, d, lay) => lay.coreWeightKg > 0 ? Math.ceil(1 * 1.5) : 0 },
    { sap: '29035908', desc: 'SIKAFORCE 7800 RED (Filler)',           unit: 'EA',  calcQty: (s, d, lay) => s.Painting > 0 ? Math.ceil(lay.areaWithMarginM2 * 4 * s.Painting) : 0 },
    // Top coat: a cor sai do esquema de pintura escolhido (TOPCOAT_COLORS), não
    // mais fixa em cinza + vermelho. sap/desc são funções resolvidas pelo engine.
    { sap:  (p) => topcoatColor(p.base).sap,
      desc: (p) => topcoatColor(p.base).desc,
      unit: 'KIT', calcQty: (s, d, lay) => s.Painting > 0 ? topcoatQty(lay, s) : 0 },
    { sap:  (p) => p.stripe ? topcoatColor(p.stripe).sap : '',
      desc: (p) => p.stripe ? topcoatColor(p.stripe).desc : '',
      unit: 'KIT', calcQty: (s, d, lay, reg, p) => (s.Painting > 0 && p && p.stripe) ? topcoatQty(lay, s) : 0 },
    { sap: '29035856', desc: 'THINNER 1kg FOR TOP COAT 12',           unit: 'EA',  calcQty: (s, d, lay, reg, p) => {
          if (s.Painting === 0) return 0;
          // Uma dose por cor efetivamente usada (antes eram sempre duas).
          const base = topcoatQty(lay, s);
          const stripe = (p && p.stripe) ? topcoatQty(lay, s) : 0;
          return (base > 10 || stripe > 10) ? Math.ceil((base + stripe) / 10) : 1;
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
    // MX: 29196707 (29 uses) replaces BR 213560 (12 uses in MX log).
    { sap: '29196707', desc: 'PLASTIC CUP 1.0 LITER',                 unit: 'EA',  calcQty: (s) => Math.ceil(s.Weighing * 2.2) },
    { sap: '213550',   desc: 'PLASTIC CUP 0.5 LITRE',                 unit: 'EA',  calcQty: (s) => Math.ceil(s.Weighing * 2.2) },
    // Release film: REV05 unit=M², ROUNDUP((maxLen+100)*(maxW+100)*1e-6 * Vacuum*1.4, 0)
    // MX: S096521 (360mm-wide film, sold per LINEAR METRE; most used in MX log, 20×)
    // replaces BR 300023948 (1500mm, M2). Metres = m² needed ÷ 0.36 m width.
    { sap: 'S096521',   desc: 'RELEASE FILM 360MM WIDTH P3',           unit: 'M',   calcQty: (s, d, lay) => s.Vacuum > 0 ? Math.ceil((lay.maxLength + 100) * (lay.maxWidth + 100) * 1e-6 * s.Vacuum * 1.4 / 0.36) : 0 },
    // Breathing cloth: REV05 unit=M², ROUNDUP(maxAreaM2 * Vacuum*1.4, 0)
    // MX: 29227309 (roll 400mm×50m = 20 m², 32 uses) replaces BR S096512 (M2).
    { sap: '29227309',  desc: 'BREATEX 150 GSM 400MM/50M (roll 20m2)', unit: 'EA',  calcQty: (s, d, lay) => s.Vacuum > 0 ? Math.max(1, Math.ceil(lay.maxAreaM2 * s.Vacuum * 1.4 / 20)) : 0 },
    // Bagging film: REV05 unit=M², ROUNDUP(splAreaM2 * Vacuum*1.4, 0)
    // MX: 29232949 (465B 1350mm wide, sold per LINEAR METRE; 24 uses) replaces
    // BR 29017040 (3000mm, M2). Metres = m² ÷ 1.35 m width. Wide alt: S096507.
    { sap: '29232949',  desc: 'BAGGING FILM 465B 50Mx1350MM',          unit: 'M',   calcQty: (s, d, lay) => s.Vacuum > 0 ? Math.ceil(lay.splAreaM2 * s.Vacuum * 1.4 / 1.35) : 0 },
    // Peel ply: maxAreaM2 × Vacuum × 1.4
    // MX: 29232947 (450mm repair-width roll, 50m ≈ 22.5 m²; 11 uses) replaces
    // BR 29232963 (1500mm, M2). Alts in MX: 29232948, S096044.
    { sap: '29232947',  desc: 'PEEL PLY A100/A100PS 50Mx450MM (roll 22.5m2)', unit: 'EA', calcQty: (s, d, lay) => s.Vacuum > 0 ? Math.max(1, Math.ceil(lay.maxAreaM2 * s.Vacuum * 1.4 / 22.5)) : 0 },
    // Transport mesh: REV05 unit=M², ROUNDUP(maxAreaM2 * Infusion*1.2, 0)
    // MX: 29225928 (roll 100m×1.55m = 155 m²) replaces BR 260710 (M2).
    { sap: '29225928',  desc: 'TRANSPORT MESH 100Mx1,55M (roll 155m2)', unit: 'EA', calcQty: (s, d, lay) => s.Infusion > 0 ? Math.max(1, Math.ceil(lay.maxAreaM2 * s.Infusion * 1.2 / 155)) : 0 },
    { sap: '29017050', desc: 'VACUUM CHANNEL 50MM INFUSION',          unit: 'M',   calcQty: (s, d, lay) => s.Infusion > 0 ? Math.ceil(lay.perimeter * 1.4) : 0 },
    { sap: '29083917', desc: 'GLASSFIBER OMEGA R8.5,SENS',            unit: 'EA',  calcQty: (s) => s.Infusion > 0 ? 1 : 0 },
    { sap: null,        desc: 'TEE connection 1/4" (T-piece) — SAP N/A', unit: 'EA',  calcQty: (s) => s.Infusion > 0 ? s.Infusion + 2 : 0 },
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
// Removidos na revisão de redundância (ago/2026), com justificativa:
//   S096072  Araldite Gun 2021 50mL — não existe adesivo Araldite no catálogo,
//            a pistola nunca teria o que aplicar.
//   20034926 Albion 450mL — duplicava o COX 400mL (20032802); o Sikapower 1200
//            é cartucho de 400 mL, então o COX é o que casa com o consumível.
//   10102199 Grease Filler Gun — sem consumível correspondente no BOM.
//   VT181160 Régua inox 150mm — coberta pela régua 0-300mm e pelo paquímetro.
//   233005 / 233010  Discos G60 e G120 de 150mm — o desbaste passou a ser todo
//            nas excêntricas de 125mm, que têm os mesmos grãos e o prato
//            suporte. O diâmetro 150 fica só para o K220 de acabamento.
// PENDENTE: falta o prato suporte (backing pad) de 150mm COM 9 FUROS — o
//            catálogo só tem o de 125mm sem furos (29196703).
//            Ver PENDING_REV06.md.
const TOOLS = [
    // Heating blankets — HLU or Infusion
    { sap: 'VT730406',    desc: 'Heating blanket 1300*1300 mm 230v',           unit: 'EA', calcQty: (s) => (s.HLU > 0 || s.Infusion > 0) ? 3 : 0 },
    { sap: 'VT730630',    desc: 'HEATING BLANKET 350x3800 230V',               unit: 'EA', calcQty: (s) => (s.HLU > 0 || s.Infusion > 0) ? 1 : 0 },
    // Grinders / Drill / Heat Gun — Grinding condition unless noted
    // 150mm fica SÓ para o acabamento (é o único diâmetro com grão K220).
    // Todo o desbaste (G60/G120) roda nas excêntricas de 125.
    { sap: '232936',      desc: 'Excentric grind machine 150mm (K220 finishing)', unit: 'EA', calcQty: (s) => s.Grinding > 0 ? 1 : 0 },
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
    { sap: '20032802',    desc: 'BATTERY POWERED 400ML COX DISPENSER',         unit: 'EA', calcQty: (s) => s.Bonding > 0 ? 1 : 0 },
    // Measuring / marking
    { sap: 'VT181637',    desc: 'TAPEMEASURE 50m C1',                          unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: 'VT181616',    desc: 'MEASURING TAPE, 5.5M',                        unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
    { sap: '217942',      desc: 'HAMMER, NYLON WOOD HNDL 50X340MM',            unit: 'EA', calcQty: (s) => s.Cleaning > 0 ? 1 : 0 },
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
    { n: 1,  rule: 'Clean surface before laminating',           detail: 'After peel-ply removal or abrasion: max 3h exposed to ambient', consequence: 'Contamination → adhesion failure' },
    { n: 2,  rule: 'Fibre aligned per drawing',                 detail: 'Duplicate the orientation of the removed material, no bumps',   consequence: 'Loss of structural strength' },
    { n: 3,  rule: 'Minimum overlap',                           detail: '5% of fibre weight (g/m²) in mm. E.g. 600gsm = 30mm',           consequence: 'Weak joint' },
    { n: 4,  rule: 'First ply = the smallest (multi-layer)',    detail: 'In multi-layer repairs, start with the smallest ply',           consequence: 'Incorrect profile' },
    { n: 5,  rule: 'Vacuum min. 0.8 bar',                       detail: 'Vacuum consolidation whenever possible',                        consequence: 'Porosity, delamination' },
    { n: 6,  rule: 'Cure with heating blanket',                 detail: 'Follow 0042-5383. Thermal sensor under the blanket recommended',consequence: 'Incomplete cure (<95%)' },
    { n: 7,  rule: 'Wet surface with resin before fibre',       detail: 'Substrate wet-out is mandatory',                                consequence: 'Dry spots, delamination' },
    { n: 8,  rule: 'Rounded corners on laminates',              detail: 'Cut the fibre with round corners',                              consequence: 'Stress concentration' },
    { n: 9,  rule: 'Material-surface temp. difference ≤5°C',    detail: 'Material and blade must be close in temperature',               consequence: 'Irregular cure' },
    { n: 10, rule: 'Grinding only after full cure (95%)',       detail: 'Safety: exposure to uncured chemicals',                         consequence: 'Health risk + damage to the repair' },
];

// Fiber substitution (945550 §9 Table 9.1).
const FIBER_SUBSTITUTIONS = [
    { original: 'Biax 936 g/m²',   alternative: 'Biax 600 + Biax 300 g/m²',    notes: 'Sum = 900 g/m² (equivalent)' },
    { original: 'UD 1140 g/m²',    alternative: '2 × UD 600 g/m²',             notes: 'Sum = 1200 g/m² (slightly above)' },
    { original: 'Triax 1500 g/m²', alternative: 'Biax 936 + UD 600 g/m²',      notes: 'Alternative 1' },
    { original: 'Triax 1500 g/m²', alternative: 'Triax 1200 + Biax 300 g/m²',  notes: 'Alternative 2' },
];

// Core substitution (945556 V12).
const CORE_SUBSTITUTIONS = [
    { original: 'PET core', alternative: 'PVC core', notes: 'Approved equivalent for substitution' },
];

// Decision tree by damage type (Ref: 945550 V14 + CIM4271).
const DAMAGE_DECISION_TREE = [
    { damage: 'Coating/gelcoat damage',  zone: 'Shell (any)',      severity: 'Cosmetic',              level: 'C',  method: 'Cosmetic repair: sand + filler + paint',              ref: '945550',             kit: 'SikaForce 7800 + Topcoat 12',            accept: 'Smooth surface, no steps',                   notes: 'Does not affect the structure' },
    { damage: 'Coating/gelcoat damage',  zone: 'LE',               severity: 'Cosmetic',              level: 'B',  method: 'Sand + filler + LEP coating',                         ref: '945550 + LEP doc',   kit: 'SikaForce 7800 + ALEXIT LEP 9',          accept: 'LEP 3 coats 100-125µm each',                 notes: 'LE always gets LEP, never Topcoat' },
    { damage: 'Shell crack/delamination',zone: 'Shell SS/PS',      severity: 'Surface (<1m²)',        level: 'B',  method: 'Remove damage + layup + cure + finishing',            ref: '945550 / 0116-3896', kit: '899019(PPT) or 29035992(SST) + Ampreg 30',accept: 'No porosity, correct overlap, Barcol>25',   notes: 'Vacuum 0.8bar, cure @70°C' },
    { damage: 'Shell crack/delamination',zone: 'Shell SS/PS',      severity: 'Deep (>1m²)',           level: 'A',  method: 'Remove damage + multi-layer layup + vacuum + cure',   ref: '945550 / 0116-3896', kit: 'Fabric per drawing + Ampreg 30',         accept: 'Per drawing, Barcol>25',                     notes: 'Follow the specific layup drawing' },
    { damage: 'LE erosion/damage',       zone: 'LE',               severity: 'Structural (≤150cm)',   level: 'B',  method: 'Remove damage + layup + LEP',                         ref: '945550',             kit: 'Fabric + Ampreg 30 + LEP 9',             accept: 'Profile restored + full LEP',                notes: 'Check the bond line' },
    { damage: 'LE erosion/damage',       zone: 'LE',               severity: 'Structural (>150cm)',   level: 'A',  method: 'Remove damage + extended layup + LEP',                ref: '945550',             kit: 'Fabric + Ampreg 30 + LEP 9',             accept: 'Profile restored + full LEP',                notes: 'Contact technical support' },
    { damage: 'TE crack/debonding',      zone: 'TE',               severity: 'Up to 150cm',           level: 'B',  method: 'Open bond + clean + re-bond + reinforcement',         ref: '945550',             kit: 'SikaForce 7818 + biax fabric',           accept: 'Bond without gaps, reinforcement as specified', notes: 'Check the full extent first' },
    { damage: 'TE crack/debonding',      zone: 'TE',               severity: 'Above 150cm',           level: 'A',  method: 'Open bond + clean + re-bond + extended reinforcement',ref: '945550 / TE SST doc',kit: 'SikaForce 7818 + biax fabric',           accept: 'Bond without gaps, reinforcement per drawing', notes: 'May require a specific CIM' },
    { damage: 'Lightning strike',        zone: 'Tip/Receptors',    severity: 'Damaged receptor',      level: 'B',  method: 'Measure continuity + replace receptor',               ref: '945550',             kit: 'New receptor + LPS tools',               accept: 'Electrical continuity OK',                   notes: 'Measure before and after' },
    { damage: 'Lightning strike',        zone: 'Shell (surface)',  severity: 'Shell damage from lightning', level: 'A', method: 'Remove damage + layup + restore LPS',           ref: '945550',             kit: 'Fabric + resin + LPS components',        accept: 'Structure + LPS restored',                   notes: 'Check the full extent' },
    { damage: 'Lightning strike',        zone: 'Carbon spar (PPT)',severity: 'Spar damage',           level: 'A+', method: 'Specialised carbon spar repair',                      ref: 'Lightning PPT doc',  kit: 'Carbon prepreg 250g',                    accept: 'Per the specific procedure',                 notes: 'ADVANCED REPAIR — supervision required' },
    { damage: 'Bond line opening',       zone: 'LE/TE/Tip',        severity: '<5mm opening',          level: 'A',  method: 'Adhesive injection + clamp',                          ref: '945550',             kit: 'SikaForce 7818',                         accept: 'Bond filled without gaps',                   notes: 'Delimit the full extent' },
    { damage: 'Bond line opening',       zone: 'LE/TE/Tip',        severity: '>5mm opening',          level: 'A',  method: 'Open + clean + re-bond + fibre reinforcement',        ref: '945550',             kit: 'SikaForce 7818 + reinforcement fabric',  accept: 'Bond + reinforcement as specified',          notes: 'May require a CIM' },
    { damage: 'Shell-spar bond damage',  zone: 'Shell-Spar',       severity: 'Any',                   level: '⛔', method: 'NOT REPAIRABLE — REPORT IMMEDIATELY',                 ref: '945550 §13',         kit: '—',                                      accept: '—',                                          notes: 'MAJOR STRUCTURAL RISK — contact engineering' },
    { damage: 'Root laminate crack',     zone: 'Root',             severity: 'Through-thickness',     level: 'A',  method: 'Remove damage + UD layup + cure',                     ref: '945550',             kit: 'UD fabric + Ampreg 30',                  accept: 'Per drawing, Barcol>25',                     notes: 'Critical repair — document everything' },
    { damage: 'Tip damage / tip debonding', zone: 'Tip',           severity: 'Variable',              level: 'A',  method: 'Repair or replace the tip shell',                     ref: '945550',             kit: 'Adhesive + fabric or new tip shell',     accept: 'Profile restored, LPS OK',                   notes: 'Check LPS after the repair' },
    { damage: 'SMT / Implant damage',    zone: 'Root (SMT)',       severity: 'Variable',              level: 'A',  method: 'Per the specific procedure',                          ref: '0073-8810',          kit: 'Per the procedure',                      accept: 'Per the procedure',                          notes: 'V110/V126/V136 only' },
    { damage: 'Core damage (sandwich)',  zone: 'Shell',            severity: '<25×25cm',              level: 'B',  method: 'Remove damaged core + replace + laminate',            ref: '945550',             kit: 'Core material + fabric + resin',         accept: 'Core replaced, laminate as specified',       notes: 'Keep the original thickness' },
    { damage: 'Core damage (sandwich)',  zone: 'Shell',            severity: '>25×25cm',              level: 'A',  method: 'Remove core + replace + layup per drawing',           ref: '945550 / 0116-3896', kit: 'Core + fabric per drawing + resin',      accept: 'Per the original drawing',                   notes: 'Follow the layup drawing' },
];