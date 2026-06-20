# Excel Analysis Report: Blade_Repair_Materials_Estimate - REV04.xlsx
# Complete Extraction for Web App Gap Analysis

---

## 1. WORKBOOK OVERVIEW

**File:** `Blade_Repair_Materials_Estimate - REV04.xlsx`
**Sheets (10 total, in order):**

| # | Sheet Name | Purpose |
|---|---|---|
| 1 | Menu | Introduction / instructions |
| 2 | Damage Data Input | User input: blade model, spanwise position, chordwise position |
| 3 | Layer Data Input | User input: layer stack (material type + GSM per layer) |
| 4 | LAYUP | Core calculation: layer geometry (areas, lengths, widths per layer) |
| 5 | Repair Steps Input | User input: which repair steps are active + quantities |
| 6 | Fabrics_aux | Intermediate: fabric kg totals per fabric type, CFM/SPL/CORE calculation |
| 7 | Materials | OUTPUT: full material list with quantities (consumables + chemicals + fabrics) |
| 8 | Fabrics | Reference/lookup: fabric catalogue (IN numbers, kg per roll/piece) |
| 9 | Tools | OUTPUT: tool list with quantities driven by repair steps |
| 10 | Lists | Dropdown data: chordwise refs, material types, GSM values, blade regions, blade models |

---

## 2. USER INPUTS

### Sheet: Damage Data Input

| Cell | Field | Sample Value | Notes |
|---|---|---|---|
| C1 | **Blade model** | V150 | Dropdown from Lists!K2:K8 |
| B5 | **Rstart (spanwise)** | 48500 mm | Spanwise start of BOD |
| C5 | **Rend (spanwise)** | 48750 mm | Spanwise end of BOD |
| D5 | **Length** (formula) | 250 mm | =ABS(C5-B5) |
| D7 | **Chordwise Reference** | LE | Dropdown: LE, TE, M.Web, TE.Web |
| B9 | **X1** | 50 mm | Lesser chordwise distance from reference |
| C9 | **X2** | 10 mm | Larger chordwise distance from reference |
| D9 | **Width** (formula) | 40 mm | =ABS(C9-B9) |

**NOTE on chordwise convention:**
- X1 is the LESSER distance to the reference
- X2 is the BIGGER distance to the reference
- Width = ABS(X2 - X1)

### Sheet: Layer Data Input

User-defined layer stack (up to ~30 layers, rows 4-35+). Each row:
| Column | Field |
|---|---|
| B | Layer name/ID |
| C | Material type (BIAX, UD, TRIAX, CORE, SPL, CFM50) |
| D | GSM (aerial weight in g/m²) |
| E | Scarfing/Lamination Order |
| F | Notes |

**Current example stack (V150 blade):**
| Row | Layer ID | Material | GSM |
|---|---|---|---|
| 4 | 270A | TRIAX | 1500 |
| 5 | 150B | CORE | (no GSM) |
| 6 | 40C | BIAX | 936 |
| 7 | 40B | BIAX | 936 |
| 8 | 40A | TRIAX | 1500 |
| 9 | Reinf. | BIAX | 600 |
| 10 | 30 | SPL | (no GSM) |
| 11 | CFM | CFM50 | (no GSM) |

### Sheet: Repair Steps Input

| Cell | Step | Sample Value | Notes |
|---|---|---|---|
| C3 | Cleaning | 0 | 0=skip, >0=active |
| C4 | Grinding | 1 | Number of grinding steps |
| C5 | Bonding | 1 | |
| C6 | Lamination | 0 | |
| C7 | HLU (Hand Lay-Up) | 1 | |
| C8 | Infusion | 1 | |
| C9 | Weighing | 0 | |
| C10 | **Vacuum** | =C7+C8 = 2 | Auto-derived |
| C11 | Painting | 1 | |
| C12 | LEP | 0 | |
| C14 | **Blade Region** | Tip | Dropdown: Root, Middle, Tip |
| C16 | **Days of repair** | 5 | Drives PPE quantities |

---

## 3. LAYUP CALCULATION SHEET (Core Logic)

### Standard Overlaps Lookup Table (H4:J16 on LAYUP sheet)

This is the key lookup that drives how much each layer expands beyond the previous one.

| Fabric Key | Span Overlap (mm) | Chord Overlap (mm) |
|---|---|---|
| BIAX600 | 30 | 30 |
| BIAX936 | 50 | 50 |
| BIAX1000 | 50 | 50 |
| BIAX1200 | 60 | 60 |
| UD600 | 60 | 12 |
| UD900 | 90 | 18 |
| UD1140 | 114 | 23 |
| UD1200 | 120 | 24 |
| TRIAX1200 | 90 | 30 |
| TRIAX1500 | 125 | 35 |
| SPL | 75 | 75 |
| CFM50 | 30 | 30 |
| CORE | 0 | 0 |

**IMPORTANT:** The fabric key in column A (A21:A70) is built by concatenating the material TYPE and GSM:
`=CONCAT(C_n, D_n)` e.g. CONCAT("TRIAX", 1500) = "TRIAX1500"

This means the lookup for overlap is `CONCAT(MaterialType, GSM)`. If GSM is blank (CORE, SPL, CFM50), the key is just the type name.

### LAYUP Row Structure (rows 21 onward, one row per layer from Layer Data Input)

Columns for each layer row n:

| Col | Content | Formula Pattern |
|---|---|---|
| A | Fabric key (lookup ID) | =CONCAT(C_n, D_n) |
| B | Layer label | (from Layer Data Input col B) |
| C | Material type | =IF('Layer Data Input'!C[k]="","", 'Layer Data Input'!C[k]) |
| D | GSM | =IF('Layer Data Input'!D[k]="","", 'Layer Data Input'!D[k]) |
| E | R1 (span start, mm) | =IF(C_n="","", MIN($E$20:E[n-1]) - VLOOKUP($A_n, $H$4:$J$16, 2, FALSE)) |
| F | R2 (span end, mm) | =IF(C_n="","", MAX($F$20:F[n-1]) + VLOOKUP($A_n, $H$4:$J$16, 2, FALSE)) |
| G | Span length (mm) | =IFERROR(F_n - E_n, "") |
| H | X1 chord (mm) | =IF(F_n="","", MIN($H$20:H[n-1]) - VLOOKUP($A_n, $H$4:$J$16, 3, FALSE)) |
| I | X2 chord (mm) | =IF(F_n="","", MAX($I$20:I[n-1]) + VLOOKUP($A_n, $H$4:$J$16, 3, FALSE)) |
| J | Chord width (mm) | =IFERROR(I_n - H_n, "") |
| M | Area (mm²) | =ABS(G_n * J_n) |
| N | Weight (kg) | =(D_n/1000) * M_n * 10^-6 |

**Row 20 (BOD reference — base damage outline):**
- E20 = Rstart (from Damage Data Input B5)
- F20 = Rend (from Damage Data Input C5)
- G20 = Length = F20-E20
- H20 = X1 (from Damage Data Input B9)
- I20 = X2 (from Damage Data Input C9)
- J20 = Width = E9 (ABS(X2-X1))

**Calculated example output for sample input (Rstart=48500, Rend=48750, X1=50, X2=10, Width=40):**

| Layer | Material | Span Length (mm) | Chord Width (mm) | Area (mm²) | Weight (kg) |
|---|---|---|---|---|---|
| BOD | — | 250 | 40 | — | — |
| 270A | TRIAX1500 | 500 | 30 | 15,000 | 0.0225 |
| 150B | CORE | 500 | 30 | 15,000 | N/A |
| 40C | BIAX936 | 600 | 130 | 78,000 | 0.0730 |
| 40B | BIAX936 | 700 | 230 | 161,000 | 0.1507 |
| 40A | TRIAX1500 | 950 | 300 | 285,000 | 0.4275 |
| Reinf. | BIAX600 | 1,010 | 360 | 363,600 | 0.2182 |
| 30 | SPL | 1,160 | 510 | 591,600 | N/A |
| CFM | CFM50 | 1,220 | 570 | 695,400 | N/A |

---

## 4. FABRICS_AUX INTERMEDIATE CALCULATIONS

This sheet aggregates fabric weights from LAYUP and computes intermediate quantities used by Materials.

### Fabric weight summation (uses LAYUP columns A and N):
```
H[row] = SUMIF(LAYUP!$A$18:$A$70, [fabric_key], LAYUP!$N$18:$N$70) * Factor
```
Factor = 1.2 for all standard fabrics (20% waste factor).

**Current computed values (kg, with 1.2 factor):**
| Fabric | kg (raw) | Factor | kg (after factor) |
|---|---|---|---|
| BIAX600 | 0.2182 | 1.2 | 0.2618 |
| BIAX1200 | 0 | 1.2 | 0 |
| BIAX936 | 0.2237 | 1.2 | 0.2684 |
| BIAX1000 | 0 | 1.2 | 0 |
| UD1200 | 0 | 1.2 | 0 |
| UD1140 | 0 | 1.2 | 0 |
| UD900 | 0 | 1.2 | 0 |
| UD600 | 0 | 1.2 | 0 |
| TRIAX1200 | 0 | 1.2 | 0 |
| TRIAX1500 | 0.45 | 1.2 | 0.54 |

### CFM50 quantity (H27):
```
=IF(R28 * Factor * 0.05 < 0.1, 0.1, 0.5)
```
Where R28 = SPL area (see below). Minimum 0.1 kg.
- Factor = 1.5
- 0.05 = kg/m² (surface veil density from Fabrics sheet: 1kg/20m²)

### SPL quantity (H28):
```
=ROUNDUP(R28 * Factor / 5.75, 0)  [EA, rolls of 5.75m²]
R28 = (MAX(LAYUP!G18:G70)+200) * (MAX(LAYUP!J18:J70)+200) * 10^-6
```
= SPL area = largest span length + 200mm each side × largest chord width + 200mm each side (in m²)

### CORE quantity (H29):
```
=ROUNDUP(R29 / 11, 0)  [EA, kits of 11 kg]
R29 = SUMIF(LAYUP A, "CORE", LAYUP M) * 10^-6 * 0.4 * Factor
```
= total CORE area × 0.4 (density factor for 40mm thickness, 115 kg/m³) × Factor (115)

---

## 5. MATERIALS SHEET (Full Output List)

### Structure:
- Column F: Part number (IN)
- Column G: Material name
- Column H: Quantity (formula-driven)
- Column I: Unit
- Column J: Factor (step multiplier)
- Column K: Repair step category
- Column M: Notes / auxiliary values
- Column O-S: Auxiliary parameters

### 5a. PPE (Personal Protective Equipment)

| IN | Material | Qty Formula | Unit | Factor | Step |
|---|---|---|---|---|---|
| 237100 | Dust loops (3M mask paper) | Factor * 2 | EA | Days (C16=5) | PPE |
| 218455 | Gloves ansel XL black | Factor * 3 | PAA | IF(days>0,1,0)=1 | PPE |
| 218173 | Gloves blue nitrile L | Factor | PAA | IF(days>0,1,0)=1 | PPE |
| 214445 | Suit F/Protec Tyvec XL | ROUNDUP(3*Factor/2,0) | EA | Days (5) | PPE |
| 210177 | Creme plutect | Factor * 3 | EA | IF(days>0,1,0)=1 | PPE |

### 5b. Consumable Tools (grinding/misc)

| IN | Material | Qty Formula | Unit | Factor | Step |
|---|---|---|---|---|---|
| 229600 | SCISSOR | IF(Factor=0,0,2) | EA | B9=Lamination qty | Lamination |
| 234630 | BLUE PLASTIC SPATTLE | ROUNDUP(B10*Factor+B14,0) | EA | IF(B10=0,0,1.1) | HLU |
| 234615 | PLASTIC PUTTY KNIFE BLACK | ROUNDUP(H20/3,0) | EA | IF(B10=0,0,1.1) | HLU |
| 233875 | Rear disc rubber 125mm | ROUNDUP(MaxArea_m2,0)*Factor | EA | IF(B7=0,0,2) | Grinding |
| 232923 | Round grinding plate G120 125mm | ROUNDUP(MaxArea_m2,0)*Factor | EA | IF(B7=0,0,15) | Grinding |
| 232906 | Round grinding plate G60 125mm | ROUNDUP(MaxArea_m2,0)*Factor | EA | IF(B7=0,0,15) | Grinding |
| 233010 | Round grinding plate G120 150mm | ROUNDUP(MaxArea_m2,0)*Factor | EA | IF(B7=0,0,15) | Grinding |
| 233005 | Round grinding plate G60 150mm | ROUNDUP(MaxArea_m2,0)*Factor | EA | IF(B7=0,0,15) | Grinding |
| 233015 | Round grinding plate K220 150mm | ROUNDUP(MaxArea_m2,0)*Factor | EA | IF(B7=0,0,15) | Grinding |
| 233843 | SCOTCH BRITE 3M BLK 158x224mm | Factor | EA | 3*B15 (LEP) | LEP |
| 224010 | Paddle stirrers (wood stick) | ROUNDUP(B12*Factor,0) | EA | 1.1 | Weighing |
| 221120 | Household scale | IF(Paddles<>0, Factor, 0) | EA | 1 | Weighing |
| 29196730 | Plast roll 13X75 | IF(B10=1,2,ROUNDUP(B10*Factor,0)) | EA | 1 | HLU |
| 222720 | BRUSH PAINT MODDLARE 70MM | ROUNDUP(B10*Factor,0) | EA | 1.2 | HLU |
| 60059473 | PAINT ROLLER SUPER SMOOTH 11 | ROUNDUP(B10*Factor,0) | EA | 1.2 | HLU |
| 293610 | 4 INCH FOAM ROLLER | ROUNDUP(Factor+3*B15,0) | EA | 1.2*B14 (Painting) | Painting |
| 60059474 | HANDLE PAINT RLR 11CM | ROUNDDOWN(H33/2+H34/2,0) | EA | 1 | Misc |
| 233861 | DIAMOND CUTTING-OFF WHEEL 125 | Factor | EA | IF(B7=0,0,1) | Grinding |
| 233228 | Grinding wheel 125mm | Factor | EA | IF(B7=0,0,1) | Grinding |
| 215860 | Disposable syringe 60ml | Factor*3 | EA | IF(B6<>0,1,0) | Misc |

**Where MaxArea_m2 = ROUNDUP(MAX(LAYUP G18:G70) * MAX(LAYUP J18:J70) * 10^-6, 0)**

### 5c. Chemicals

| IN | Material | Qty Formula | Unit | Factor | Step | Notes |
|---|---|---|---|---|---|---|
| 234900 | ALCOHOL DENATURED 93% 0.5L | ROUNDUP(B6/Factor,0) | EA | 1.5 | Cleaning | 0.5L/3m² per step |
| 291574 | CLOTH CLEANING RAYON (Satwipes) | IF(B6=0,0,Factor) | EA | 1 | Cleaning | 100 wipes/repair |
| 29157769 | AMPREG 30 1.26KG PACK | ROUNDUP(SUM(fabric_kgs+CORE_kg)*Factor/1.26,0) | EA | 1 | HLU | Resin 1:1 ratio |
| 29276912 | PRIME 37 4KG STD (infusion resin) | ROUNDUP(R28*Factor,0) | EA | B11*1.3 | Infusion | 4kg/m² SPL area |
| 29078542 | ADHESIVE SIKAPOWER 1200 450mL | ROUNDUP(MaxSpan*120*(10^-6)*23.33*Factor,0) | EA | (Q46/20)*B8 | Bonding | 23.33 cartridges/m² at H=20mm |
| 29035907 | SikaForce 7818 L7 195mL | ROUNDUP(IF(CORE_qty>0,1*Factor,0),0) | EA | 1.5 | Bonding | Core gap filler |
| 29035908 | SIKAFORCE 7800 RED | ROUNDUP((200+MaxSpan)*(200+MaxChord)*(10^-6)*Factor,0) | EA | 4*B14 | Painting | 3 cartridges/m² |
| 29034878 | KIT TOP COAT 12 RAL7035 1kg | ROUNDUP((200+MaxSpan)*(200+MaxChord)*(10^-6)*Factor,0) | EA | 0.4*B14*2 | Painting | 0.4kg/m² per coat |
| 29035851 | KIT TOP COAT 12 RAL3020 1kg | Same as above | EA | 0.4*B14*2 | Painting | |
| 29035856 | THINNER 1kg FOR TOP COAT 12 | IF(TopCoatTotal>10, Total/10, Factor) | EA | 1 | Painting | 1 kit/10 kg paint |
| 29035851 | LEP ALEXIT 9 RED 200g | ROUNDUP(IF(MaxSpan/1000<Factor,1,MaxSpan/(1000*Factor)),0) | EA | IF(Region="Middle",2,3)*B15 | LEP | 3m linear (Tip), 2m (Middle) |
| 29035858 | LEP ALEXIT 9 WHITE 200g | Same | EA | Same | LEP | |
| 29035859 | LEP ALEXIT 9 GREY 200g | Same | EA | Same | LEP | |
| 29035904 | HARDENER 135g FOR ALEXIT LEP 9 | H51+H52+H53 | EA | 1 | LEP | 1 per 200g LEP |

**Sikapower 1200 formula detail:**
- Q45 = 23.33 cartridges/m² at H=20mm bondline
- Q46 = H_bond = 20mm
- Q47 = 120mm (average bondline width TE-V150)
- Qty = ROUNDUP(MaxSpan*120*(10^-6) * 23.33 * Factor, 0)
- Factor = (Q46/20) * B8 = (20/20)*1 = 1

### 5d. Vacuum/Infusion Consumables

All formulas use key derived values:
- **Q70** (max laminado area m²) = MAX(LAYUP G) * MAX(LAYUP J) * 10^-6 = 0.6954 m²
- **Q77** (perimeter m) = (2*(MaxSpan + MaxChord) + 4*100) / 1000 = 3.98 m
  - 100mm = P77, offset on each corner

| IN | Material | Qty Formula | Unit | Factor | Step |
|---|---|---|---|---|---|
| 238710 | MASKING TAPE 50mm×50m | IF(Q77*Factor/50 < 2, 2, ROUNDUP(Q77*Factor/50,0)) | ROL | 1.2 | Misc |
| S094586 | Flash tape 50mm blue | IF(Q77*Factor/66 < 2, 2, ROUNDUP(Q77*Factor/66,0)) | ROL | B13*1.2 | Vacuum |
| 29006984 | TAPE SCRIM 50mm DB SIDED | Factor | EA | IF(B11>0,1,0) | Infusion |
| 220320 | Cloth harpix (cleaning before paint) | ROUNDUP((200+MaxSpan*(200+MaxChord))*10^-6,0)*Factor | EA | IF(B6=0,0,1) | Cleaning |
| 198004 | Paper tork | Same | EA | IF(B6=0,0,1) | Cleaning |
| 60032042 | CLOTH CLEANING COTTON 500mm | Factor | KG | IF(B6>0,1,0) | Cleaning |
| 60059753 | RUBBISH BAG BLUE 120l | ROUNDUP((200+MaxSpan*(200+MaxChord))*10^-6,0)*Factor | ROL | 1 | Cleaning |
| 235000 | Baker's bag | Factor*3 | EA | IF(B6<>0,1,0) | Misc |
| 213560 | PLASTIC CUP 1.0 LITER | ROUNDUP(B12*Factor,0) | EA | 2.2 | Weighing |
| 213550 | PLASTIC CUP 0.5 LITRE | ROUNDUP(B12*Factor,0) | EA | 2.2 | Weighing |
| 29232804 | Release film 360mm 100m | ROUNDUP((MaxSpan+100)*(MaxChord+100)*10^-6*Factor/36,0) | EA | B13*1.2 | Vacuum |
| 29227350 | BREATEX 150 GSM 400mm/100m | ROUNDUP(MaxSpan*MaxChord*10^-6*Factor/40,0) | EA | B13*1.2 | Vacuum |
| 29232945 | Bagging film 465B 100m×1350mm | ROUNDUP((MaxSpan+200)*(MaxChord+200)*10^-6*Factor/135,0) | ROL | B13*1.2 | Vacuum |
| 29232963 | PEEL PLY A100 50m×1500mm | ROUNDUP(Q70*Factor,0) | M² | B13*1.2 | Vacuum |
| 29225928 | TRANSPORT MESH 100m×1.55m | ROUNDUP(Q70*Factor/15.5,0) | EA | 1.2 | Infusion |
| 29017050 | VACUUM CHANNEL 50MM INFUSION | ROUNDUP(Q77*Factor,0) | M | 1.4 | Infusion |
| 29083917 | GLASSFIBER OMEGA R8.5 | IF(B11>0,Factor,0) | EA | 1 | Infusion |
| (none) | Conexao TEE 1/4" | IF(B11>0, B11+Factor, 0) | EA | 2 | Infusion |
| 29023572 | SPIROL BAND 12mm | ROUNDUP(Q77*Factor,0) | M | B13*1.2 | Vacuum |
| 223449 | NYLON PIPE 8x6mm | ROUNDUP(40+MaxSpan/1000*Factor,0) | M | B13 | Vacuum |
| 108402 | Yellow sealant | IF(Q77*Factor/7.5<2, 2, ROUNDUP(Q77*Factor/7.5,0)) | ROL | B13*1.2 | Vacuum |

### 5e. Fabrics (rows 78-90, blade-type aware)

Fabric part numbers change by blade type. Formula pattern:
```
F[row] = IF('Damage Data Input'!C1="V150",
             XLOOKUP(Material, Fabrics!H26:H30, Fabrics!A26:A30),  -- V150 HM fabrics
             XLOOKUP(Material, Fabrics!H2:H19, Fabrics!A2:A19))    -- standard fabrics
```

Quantity:
```
H[row] = IF(C1="V150",
             ROUNDUP(Fabrics_aux!H[k] / M[row], 0),   -- weight per roll for V150
             ROUNDUP(Fabrics_aux!H[k] / M[row], 0))    -- same for others
M[row] = XLOOKUP(IN, Fabrics!A2:A30, Fabrics!I2:I30)  -- kg per piece/roll
```

**Fabrics list (rows 78-90):**

| Row | Fabric Key | Standard IN | V150 IN | Unit (std) | Unit (V150) | kg/piece (std) | kg/piece (V150) | Step |
|---|---|---|---|---|---|---|---|---|
| 78 | BIAX600 | 60017462 | 29234524 | EA | EA | 1.14 | 20.6 | Lamination |
| 79 | BIAX1200 | (lookup) | 29234523 | EA | EA | 20.4 | 20.4 | Lamination |
| 80 | BIAX936 | 29009736 | N/A (#N/A for V150) | KG | — | 1 | — | Lamination |
| 81 | BIAX1000 | 29281859 | 29234525 | KG | EA | 1 | 21 | Lamination |
| 82 | UD1200 | 29302515 | 29305384 | M² | EA | 1.225 | 20 | Lamination |
| 83 | UD1140 | 29017705 | N/A | KG | — | 1 | — | Lamination |
| 84 | UD900 | 29017516 | N/A | KG | — | 1 | — | Lamination |
| 85 | UD600 | 29007004 | N/A | KG | — | 1 | — | Lamination |
| 86 | TRIAX1200 | S096483 | 29234528 | KG | EA | 1 | 19.7 | Lamination |
| 87 | TRIAX1500 | 29251385 | N/A | EA | — | 20 | — | Lamination |
| 88 | CFM50 | 29023582 | 29023582 | KG | KG | — | — | Infusion |
| 89 | SPL | 29180313 | 29180313 | EA | EA | 5.75m² | 5.75m² | Infusion |
| 90 | CORE | 29114395 | 29114395 | EA | EA | 11 kg/kit | 11 kg/kit | HLU |

---

## 6. FABRICS CATALOGUE (Fabrics sheet, rows 2-30)

### Standard Fabrics (rows 2-25, non-V150)

| IN (col A) | Description (col B) | Doc ref (col C) | Unit (col D) | Use (col F) | Notes (col G) | Key (col H) | kg/piece (col I) |
|---|---|---|---|---|---|---|---|
| 60017462 | BIAX +-45 E-GLASS 600 g/m² | A024-1236_V00 | EA | BR | 1.14kg 500mm×3m | BIAX600 | 1.14 |
| (29007005) | FABRIC BIAX 600 GSM 45° STAB | A027-6768_R0 | KG | V110 | 1kg piece 1500×250 | — | — |
| 29009736 | BIAX 936GSM 127CM STABILIZED | 900411_V6 | KG | BR/V110 | 1kg | Biax936 | 1 |
| 29281859 | FABRIC E-GLASS BIAX +/-45 1000 g/m² | A013-8139 V01 | KG | — | 1kg | BIAX1000 | 1 |
| S096483 | TRIAXIAL ROVING MESH 1200G | 900413 | KG | BR | 630mm×150m | TRIAX1200 | 1 |
| 29251385 | FABRIC TRIAX 1500G 11m×1250mm | A017-0762_V00 | EA | BR | 20kg | TRIAX1500 | 20 |
| (29017701) | TRIAX 1500g | 0041-2865_01 | KG | V110 | — | — | — |
| 29007004 | UD 600 GSM 0° STAB | 900560_V2 | KG | BR/V110 | 1265mm×70m | UD600 | 1 |
| 29017705 | UD 0° 1140g 1075mm C | 900560_V2 | KG | V110 | — | UD1140 | 1 |
| 29302515 | FABRIC E UD 0 1200 g/m² 1270mm | 900560_V2 | M² | — | 1.225kg | UD1200 | 1.225 |
| 29017516 | UD 0° 900g S | 900560_V2 | KG | V110 | 1kg | UD900 | 1 |
| 29180313 | SPL Repair Patch - 5M×1150mm | BR | EA | SST | 5.75m² | SPL | — |
| 29023582 | SURFACE VEIL GLASSTISSUE 50GSM | BR | KG | SST | 1kg 20m² | CFM | 0.05 (kg/m²) |
| 29114395 | CORE REPAIR PANEL 40mm BLA 54m | BR | EA | — | Grades B(115g/m³), kit 11kg | CORE | — |
| S096983 | BALSA 38mm THICK GRID SCORED | — | M² | — | 4kg h=38mm 148kg/m³ 5.6m² | BALSA | — |

### V150-specific HM Fabrics (rows 26-30)

| IN (col A) | Description (col B) | Unit (col D) | Blade (col F) | Notes (col G) | Key (col H) | kg/piece (col I) |
|---|---|---|---|---|---|---|
| 29234524 | HM BIAX 600GSM +-45 26m×1260mm | EA | V150 | 20.6kg | BIAX600 | 20.6 |
| 29234525 | FABRIC HM BI45 1000G 16m×1260mm | EA | V150 | 21kg | BIAX1000 | 21 |
| 29234523 | FABRIC HM BI80 1200G 13m×1260mm | EA | V150 | 20.4kg | BIAX1200 | 20.4 |
| 29305384 | FABRIC HM UD 0 DEG 1200 g/m² 1260mm 20kg | EA | V150 | 20kg | UD1200 | 20 |
| 29234528 | FABRIC HM TRIAX 1200 13m×1260mm | EA | V150 | 19.7kg | TRIAX1200 | 19.7 |

---

## 7. TOOLS SHEET

Tools are activated/deactivated based on repair step flags from 'Repair Steps Input'.

### Heating Blankets
| IN | Description | Active Condition | Fixed Qty |
|---|---|---|---|
| VT730406 | Heating blanket 1300×1300mm 230V | IF(HLU>0 OR Infusion>0) | 3 |
| VT730630 | HEATING BLANKET 350×3800 230V | IF(HLU>0 OR Infusion>0) | 1 |

### Grinders / Drill / Heat Gun
| IN | Description | Active Condition | Fixed Qty |
|---|---|---|---|
| 232936 | Excentric grind machine 150mm | IF(Grinding>0) | 1 |
| 232935 | EXCENTRIC GRIND MACH 125 BOSCH | IF(Grinding>0) | 2 |
| 233845 | ANGLE GRINDER METABO 5" (RPM adj) | IF(Grinding>0) | 1 |
| 20030258 | ANGLE GRINDER BATTERY | IF(Grinding>0) | 1 |
| 233855 | STRAIGHT GRINDER BOSCH GGS-27C | IF(Grinding>0) | 1 |
| 213570 | Heating airblower pistol 1600W | IF(Cleaning>0) | 1 |
| 213471 | Drill machine 230V | IF(Cleaning>0) | 0 (inactive) |
| 213473 | BATTERY DRILL MACHINE | IF(Cleaning>0) | 1 |
| 291960 | CABLE REEL ELEC 25M | IF(Grinding>0) | 2 |
| 213523 | EXTENSION CORD EU | IF(Grinding>0) | 2 |
| VT70002334 | BATTERY CHARGER MAKITA | IF(Grinding>0) | 2 |
| VT70002335 | BATTERY MAKITA | IF(Grinding>0) | 4 |
| 213476 | DRILL BOX 1-13MM | IF(Drill active) | 1 |

### Vacuum / Compressor
| IN | Description | Active Condition | Fixed Qty |
|---|---|---|---|
| VT70003289 | F SERIES 2F-10 VACUUM PUMP | IF(Vacuum>0) | 1 |
| VT710600 | VACUUM CLEANER | IF(Cleaning>0) | 1 |

### Calibrated Tools (annual cert)
| IN | Description | Active Condition | Fixed Qty |
|---|---|---|---|
| VT181002 | SLIDE GAUGE 0-150MM | IF(Cleaning>0) | 1 |
| VT189200 | SHORE-D 0-100 | IF(HLU>0 OR Infusion>0) | 1 |
| VT189225 | HARDNESS TESTER BARCOL | IF(HLU>0 OR Infusion>0) | 1 |
| VT189381 | ECOLOG DATALOGGER | IF(Cleaning>0) | 1 |
| VT189301 | THERMO COUPLE | IF(HLU>0 OR Infusion>0) | 1 |
| VT189025 | WET FILM COMB | IF(Painting>0) | 2 |

### Adhesive Guns / Other Tools
| IN | Description | Active Condition | Fixed Qty |
|---|---|---|---|
| VT20020580 | KIT F TWO COMP DISPENSING GUN | IF(Bonding>0) | 1 |
| 29035578 | CAULKING GUN 9" | IF(Bonding>0) | 1 |
| 10102199 | GREASE FILLER GUN | IF(Bonding>0) | 1 |
| 20032802 | BATTERY POWERED 400ML COX DISPENSER | IF(Bonding>0) | 1 |
| 20034926 | BATTERY POWERED 450ML ALBION | IF(Bonding>0) | 1 |
| S096072 | ARALDITE GUN 2021 50ML | IF(Bonding>0) | 1 |
| 230551 | CHISEL GEN-PURPOSE BEVELED 4MM | IF(Grinding>0) | 1 |

### Measurement
| IN | Description | Active Condition | Fixed Qty |
|---|---|---|---|
| VT181637 | TAPEMEASURE 50m | IF(Cleaning>0) | 1 |
| VT181616 | MEASURING TAPE 5.5M | IF(Cleaning>0) | 1 |
| VT181160 | RULER SS 150mm | IF(Cleaning>0) | 1 |
| VT181161 | RULER METAL 0-300mm | IF(Cleaning>0) | 1 |
| VT181171 | METAL RULER 0-1000mm | IF(Cleaning>0) | 1 |
| 222402 | PAINT MARKER BLUE EDDING | IF(Cleaning>0) | 3 |

### Lighting / Safety / Other
| IN | Description | Active Condition | Fixed Qty |
|---|---|---|---|
| 213553 | Goliath 38W Working light | IF(Cleaning>0) | 2 |
| 213507 | HAND LAMP 230V | IF(Cleaning>0) | 2 |
| 29097941 | BLOWER 1000m³/h 1kW | IF(Cleaning>0) | 1 |
| VT730288 | GENERATOR DIESEL 6.6kW 230V | IF(Cleaning>0) | 1 |
| VT182687 | MULTIGAS DETECTOR T4 | IF(Cleaning>0) | 1 |
| VT57 | MANUAL ROLLER MR1 | IF(Cleaning>0) | 1 |

---

## 8. LISTS SHEET (Dropdown Data)

### Chordwise Reference options (A2:A5)
- LE
- TE
- M.Web
- TE.Web

### Material Type options (E2:E7)
- BIAX
- UD
- TRIAX
- CORE
- SPL
- CFM50

### GSM options (G2:G8)
- 600, 900, 936, 1000, 1140, 1200, 1500

### Blade Region options (I2:I4)
- Root
- Middle
- Tip

### Blade Model options (K2:K8)
- V82
- V90
- V100
- V110
- V112
- V136
- V150

---

## 9. KEY FORMULAS SUMMARY

### Area Calculation Chain
1. BOD (damage outline): from user input (Rstart, Rend, X1, X2)
2. Each layer: expands the BOD by the standard overlap from the lookup table
3. Pattern: Layer_n spans from `MIN(all_previous_starts) - overlap` to `MAX(all_previous_ends) + overlap`
4. Area (mm²) = abs(span_length × chord_width)
5. Weight (kg) = (GSM/1000) × Area_mm² × 10^-6

### Fabric Quantity (from weight to pieces/rolls)
```
fabric_weight_kg = SUMIF(LAYUP keys, fabric_key, LAYUP weights) * 1.2
pieces = ROUNDUP(fabric_weight_kg / kg_per_piece, 0)
```
kg_per_piece comes from Fabrics sheet column I (XLOOKUP by IN number).

### Blade Type Impact
- Only 2 code paths: V150 (HM fabrics) vs. everything else (standard fabrics)
- Changes: BIAX600, BIAX1000, BIAX1200, UD1200, TRIAX1200 → different IN numbers and kg/piece
- BIAX936, UD600, UD900, UD1140, TRIAX1500 → NOT available in V150 catalogue (return #N/A)

### Perimeter-based Consumables
```
Q77 = (2*(MaxSpanLength + MaxChordWidth) + 4*100) / 1000  [meters]
```
Used for: Yellow sealant, Flash tape, Masking tape, Spirol band, Vacuum channel

### SPL Area
```
SPL_area = (MaxSpanLength + 200) * (MaxChordWidth + 200) * 10^-6  [m²]
```
Used for: SPL rolls, CFM50 weight, Infusion resin (PRIME 37)

### Max Laminado Area (largest layer)
```
Q70 = MAX(LAYUP span lengths) * MAX(LAYUP chord widths) * 10^-6  [m²]
```
Used for: Peel ply, Release film, Breatex, Bagging film, Transport mesh

---

## 10. LOGIC NOTES & SPECIAL BEHAVIORS

1. **BIAX936 / TRIAX1500 for V150:** These fabric types return #N/A for V150 in the Fabrics lookup (not in the V150-specific range H26:H30). So if a V150 blade uses BIAX936 layers, the formula errors — these fabrics aren't listed in the V150 HM catalogue.

2. **CFM50 minimum quantity:** Always at least 0.1 kg regardless of area (minimum order).

3. **SPL:** No GSM in Layer Data Input — overlap is 75mm span/chord. Quantity is number of rolls (5.75m² each), based on SPL_area.

4. **CORE:** No GSM — overlap is 0 (same dimensions as previous layer). Weight computed as: core_area_m² × 0.4 density × Factor, then kits = ROUNDUP(weight/11, 0).

5. **Vacuum count (B13):** Auto-derived as HLU + Infusion count. Drives multiplier for all vacuum/infusion consumables.

6. **Days of repair (C16):** Drives PPE quantities (gloves per day × days, suits per 2 days, etc.)

7. **Blade Region (C14):** Only affects LEP (Leading Edge Protection) factor:
   - Middle: factor = 2 (2m linear per 200g can)
   - Tip (or Root): factor = 3 (3m linear per 200g can)

8. **Sikapower 1200 (bonding adhesive):** Assumes 120mm bondline width and 20mm height as default. Factor adjusts if bond height changes.

9. **Ampreg 30 resin:**  
   ```
   qty = ROUNDUP(SUM(all_fabric_kgs + CORE_kg) / 1.26, 0)
   ```
   Fabrics sum = Fabrics_aux H17:H26 + H29 (CORE contribution). Resin ratio 1:1 with fabric weight.

10. **Nylon pipe 8×6mm minimum:** 40m minimum (for internal blade access), plus span-based addition.

---

## 11. DATA FLOW DIAGRAM

```
[User Inputs]
  Damage Data Input:
    - Blade model (C1)
    - Rstart, Rend (B5, C5)
    - X1, X2, Reference (B9, C9, D7)
  Layer Data Input:
    - Layer stack (C4:D35)
  Repair Steps Input:
    - Active steps (C3:C12)
    - Blade region (C14)
    - Days (C16)
        |
        v
[LAYUP Sheet]
  - Computes span/chord dimensions per layer using overlap table
  - Outputs: area (mm²) and weight (kg) per layer per fabric type
        |
        v
[Fabrics_aux]
  - SUMIF aggregates weight by fabric type
  - Applies 1.2× waste factor
  - Computes SPL area, CORE weight
        |
        v
[Materials Sheet]             [Tools Sheet]
  - PPE (days-based)          - Activated by repair steps
  - Consumable tools          - Fixed quantities per tool
  - Chemicals (area/step)
  - Vacuum consumables (perimeter/area)
  - Fabrics (weight→pieces, blade-type-aware)
```

---

## 12. CURRENT SAMPLE COMPUTED VALUES (with sample inputs)

**Inputs used:** V150, Rstart=48500, Rend=48750, X1=50, X2=10, Ref=LE,
Grinding=1, Bonding=1, HLU=1, Infusion=1, Painting=1, Region=Tip, Days=5

**Key derived values:**
- Max span length = 1220mm (CFM50 layer)
- Max chord width = 570mm (CFM50 layer)  
- Max laminado area Q70 = 1.220 × 0.570 = 0.6954 m²
- SPL area R28 = (1220+200)×(570+200) × 10^-6 = 1.0934 m²
- Perimeter Q77 = (2×(1220+570) + 4×100)/1000 = 3.98 m

**Selected computed quantities:**
| Material | Qty | Unit |
|---|---|---|
| BIAX600 (V150) | 1 | EA (roll 20.6kg) |
| TRIAX1500 (N/A for V150) | #N/A | — |
| CFM50 | 0.1 | KG |
| SPL | 1 | EA (roll 5.75m²) |
| CORE | 1 | EA (kit 11kg) |
| Ampreg 30 | 2 | EA (1.26kg packs) |
| PRIME 37 | 2 | EA (infusion resin) |
| Sikapower 1200 | 4 | EA (450mL cartridges) |
| SikaForce 7818 | 2 | EA (195mL) |
| SikaForce 7800 RED | 5 | EA (painting) |
| Top Coat RAL7035 | 1 | EA (1kg kit) |
| Peel ply | 2 | M² |
| Yellow sealant | 2 | ROL |
| Nylon pipe | 43 | M |
| Grinding plates G120 125mm | 15 | EA |
| Suits Tyvec XL | 8 | EA |
| Dust masks | 10 | EA |
| Heating blanket 1300×1300 | 3 | EA |
| Vacuum pump | 1 | EA |
```
