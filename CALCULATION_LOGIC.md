# Blade Repair Materials Planner — Lógica de Cálculo

**Fonte:** `Blade_Repair_Materials_Estimate - REV05.xlsx`  
**Código:** `static/engine.js` (cálculos) · `static/data.js` (itens e fórmulas)

> **Fonte de verdade:** quando este documento divergir do código, **o código (alinhado a REV05) vence**. Alguns fatores de vácuo abaixo foram atualizados de 1,2 (REV04) para 1,4 (REV05) — ver a seção Consumables.

---

## Visão Geral

O sistema recebe três grupos de dados do usuário e gera uma lista completa de materiais (BOM):

```
1. Dados do Dano   →   2. Camadas (LAYUP)   →   3. Etapas de Reparo   →   BOM
```

| Passo | O que o usuário informa |
|-------|------------------------|
| 1 | Modelo da pá, posição do dano (Rstart, Rend, X1, X2) |
| 2 | Camadas de laminação: tipo de material e gramatura (GSM) |
| 3 | Quais etapas serão realizadas e quantos dias de reparo |

---

## Passo 1 — Dados do Dano

| Campo | Descrição |
|-------|-----------|
| **Rstart / Rend** | Posição inicial e final do dano no sentido longitudinal (mm) |
| **X1 / X2** | Limites do dano no sentido da corda (mm) |
| **Length** | `ABS(Rend − Rstart)` — comprimento do dano |
| **Width** | `ABS(X2 − X1)` — largura do dano |

> **Atenção:** X1 e X2 são usados exatamente como informados, sem reordenar.
> X1 sempre diminui via MIN, X2 sempre aumenta via MAX ao longo das camadas.

---

## Passo 2 — Cálculo do LAYUP

### Como funciona

Cada camada de tecido é aplicada sobre as anteriores com uma sobreposição (overlap) que varia conforme o tipo de tecido. O sistema expande as dimensões camada a camada.

**Para cada camada:**
```
R1 = MIN(todos os R1 anteriores) − overlap_span
R2 = MAX(todos os R2 anteriores) + overlap_span
H1 = MIN(todos os H1 anteriores) − overlap_chord
H2 = MAX(todos os H2 anteriores) + overlap_chord

Length = R2 − R1
Width  = H2 − H1
Área   = ABS(Length × Width)            [mm²]
Peso   = (GSM / 1000) × Área × 10⁻⁶    [kg]  ← apenas para tecidos com GSM
```

A primeira linha (BOD) é o próprio dano, sem overlap.

### Overlaps — regra por % do gsm (norma 0149-9754 §12 + 945550 §9)

O overlap **não** é uma tabela fixa: é uma **porcentagem do peso da fibra (gsm), em mm**. Implementado em `computeFiberOverlap()` (data.js) e materializado em `STANDARD_OVERLAPS`.

| Tipo de fibra | Span (long.) | Corda (transv.) |
|---------------|--------------|-----------------|
| **Biax** | 5% do gsm | 5% do gsm |
| **UD** | 10% do gsm | 2% do gsm* |
| **Triax** | Biax(5%) + UD(10%) das sub-camadas | 2,5% do total |
| **Carbon UD** | 12% do gsm | 2% do gsm |

> *A norma lista UD corda = 5%, mas na prática esse overlap ficou grande demais; o time de campo mantém **UD corda = 2%** (12/18/23/24). O app segue o time de campo.

Valores resultantes por tecido:

| Tecido | Span (mm) | Corda (mm) | Cálculo |
|--------|-----------|------------|---------|
| BIAX600 | 30 | 30 | 5%×600 |
| BIAX936 | 47 | 47 | 5%×936=46,8→47 *(REV05 tinha 50)* |
| BIAX1000 | 50 | 50 | 5%×1000 |
| BIAX1200 | 60 | 60 | 5%×1200 |
| UD600 | 60 | 12 | span 10%×600 · corda 2%×600 |
| UD900 | 90 | 18 | span 10% · corda 2% |
| UD1140 | 114 | 23 | span 10% · corda 2% (22,8→23) |
| UD1200 | 120 | 24 | span 10% · corda 2% |
| TRIAX1200 | 90 | 30 | span 600biax(30)+600UD(60) · corda 2,5%×1200 |
| TRIAX1500 | 125 | 38 | span ~33+94 · corda 2,5%×1500=37,5→38 *(REV05 tinha 35)* |
| SPL | 75 | 75 | especial (patch) |
| CFM50 | 30 | 30 | especial (véu de superfície) |
| CORE / BALSA | 0 | 0 | — |

> **Correção 2026:** o REV05 usava tabela fixa com **BIAX936 = 50** (deveria ser 5%×936 = 47) — corrigido. O overlap agora é calculado por % do gsm. **UD corda:** a norma diz 5%, mas o time de campo mantém **2%** (grande demais na prática) — o app segue o time de campo. Tecidos fora do mapa (HM, pendentes REV06) passam a receber overlap automaticamente via `computeFiberOverlap()`.

### Exemplo numérico

**Entrada:** Rstart=48500, Rend=48750, X1=50, X2=10 → BOD: Length=250mm, Width=40mm

| Camada | Tecido | Length (mm) | Width (mm) | Área (mm²) | Peso (kg) |
|--------|--------|-------------|------------|------------|-----------|
| BOD (dano) | — | 250 | 40 | 10.000 | — |
| 270A | TRIAX1500 | 500 | 30 | 15.000 | 0,023 |
| 150B | CORE | 500 | 30 | 15.000 | — |
| 40C | BIAX936 | 600 | 130 | 78.000 | 0,073 |
| 40B | BIAX936 | 700 | 230 | 161.000 | 0,151 |
| 40A | TRIAX1500 | 950 | 300 | 285.000 | 0,428 |
| Reinf. | BIAX600 | 1.010 | 360 | 363.600 | 0,218 |
| 30 | SPL | 1.160 | 510 | 591.600 | — |
| CFM | CFM50 | **1.220** | **570** | 695.400 | — |

---

## Passo 3 — Variáveis Derivadas

Após o LAYUP, o sistema calcula estas variáveis que alimentam todas as fórmulas do BOM:

| Variável | Fórmula | Para que serve |
|----------|---------|----------------|
| **maxLength** | Maior comprimento entre todas as camadas | Base para todas as fórmulas de área |
| **maxWidth** | Maior largura entre todas as camadas | Base para todas as fórmulas de área |
| **maxAreaM2** | `maxLength × maxWidth × 10⁻⁶` (m²) | Discos de lixa, peel ply, breatex |
| **splAreaM2** | `(maxLength + 200) × (maxWidth + 200) × 10⁻⁶` (m²) | SPL, bagging film, PRIME, SikaForce 7800 |
| **areaWithMarginM2** | igual ao splAreaM2 | TopCoat, SikaForce 7800 |
| **cleaningAreaM2** | `(200 + maxLength × (200 + maxWidth)) × 10⁻⁶` (m²) | Cloth harpix, paper tork, rubbish bag |
| **perimeter** | `(2 × (maxLength + maxWidth) + 400) / 1000` (m) | Fitas, sealant, spirol, vacuum channel |
| **totalFabricWeightKg** | Soma dos pesos (kg) de todos os tecidos com GSM | AMPREG 30 |
| **coreWeightKg** | `SUMIF(áreas de CORE) × 10⁻⁶ × 0,4 × 115` (kg) | AMPREG 30, SikaForce 7818 |

> `cleaningAreaM2` usa uma parentização diferente das demais áreas: a multiplicação acontece antes da soma com 200.

*Valores para o exemplo acima: maxLength=1220mm, maxWidth=570mm, maxAreaM2=0,695m², splAreaM2=1,093m², perimeter=3,98m*

---

## Passo 4 — Etapas de Reparo

Cada etapa ativada inclui um conjunto de materiais no BOM. A quantidade é ajustada pelo número de vezes que a etapa ocorre.

| Etapa | O que ativa |
|-------|-------------|
| **Cleaning** | Álcool, satwipes, panos, sacos de lixo, ferramentas de medição |
| **Grinding** | Discos de lixa (125/150mm), lixadeiras, disco de corte |
| **Bonding** | Sikapower 1200, pistolas dispensadoras |
| **Lamination** | Tesoura para fibra |
| **HLU** | AMPREG 30, rolos, espatulas, mantas térmicas |
| **Infusion** | PRIME 37, SPL, CFM50, consumíveis de vácuo |
| **Weighing** | Balança, paddle stirrers, copos plásticos |
| **Vacuum** *(automático = HLU + Infusion)* | Bomba de vácuo, fita flash, sealant amarelo, spirol, nylon pipe |
| **Painting** | TopCoat, SikaForce 7800, rolos de pintura |
| **LEP** | Alexit LEP (3 cores), Scotch Brite, endurecedor |

---

## Fórmulas por Categoria de Material

### PPE (Equipamentos de Proteção)

Baseado nos **dias de reparo**:

| Material | Quantidade |
|----------|-----------|
| Óculos de proteção | 2 |
| Tampões de ouvido | Dias × 3 |
| Máscara respiratória | 1 |
| Filtro de gás (Painting ou HLU) | ROUNDUP(Dias / 2) |
| Filtro de partículas (Grinding) | ROUNDUP(Dias / 2) |
| Pré-filtro (Grinding) | Dias × 2 |
| Dust loops | Dias × 2 |
| Luvas ansel | 3 pares |
| Luvas nitrile | 1 caixa |
| Macacão Tyvek | ROUNDUP(Dias × 1,5) |
| Sapatilhas descartáveis | Dias × 2 |
| Creme Plutect | 3 |
| Lava-olhos | 1 |

### Consumable Tools

| Material | Quantidade | Condição |
|----------|-----------|----------|
| Tesoura para fibra | 2 | Lamination |
| Espatula azul flexível | ROUNDUP(HLU × 1,1 + Painting) | HLU ou Painting |
| Faca putty preta | ROUNDUP(espatulas / 3) | HLU ou Painting |
| Espátula metálica 50mm | 1 | Painting |
| Disco traseiro 125mm | ROUNDUP(maxAreaM2) × 2 | Grinding |
| Disco G120 125mm | ROUNDUP(maxAreaM2) × 15 | Grinding |
| Disco G60 125mm | ROUNDUP(maxAreaM2) × 15 | Grinding |
| Disco G120 150mm | ROUNDUP(maxAreaM2) × 15 | Grinding |
| Disco G60 150mm | ROUNDUP(maxAreaM2) × 15 | Grinding |
| Disco K220 150mm | ROUNDUP(maxAreaM2) × 15 | Grinding |
| Scotch Brite | LEP × 3 | LEP |
| Paddle stirrers | ROUNDUP(Weighing × 1,1) | Weighing |
| Balança | 1 | Weighing |
| Plast roll | MAX(2, HLU) | HLU |
| Pincel 70mm | ROUNDUP(HLU × 1,2) | HLU |
| Rolo 11" | ROUNDUP(HLU × 1,2) | HLU |
| Rolo espuma 4" | ROUNDUP(Painting × 1,2 + LEP × 3) | Painting / LEP |
| Suporte de rolo | ROUNDDOWN(rolo11"/2 + rolo4"/2) | Painting / LEP |
| Disco de corte diamante | 1 | Grinding |
| Rebolo 125mm | 1 | Grinding |
| Seringa 60ml | 3 | Cleaning |
| Seringa 10ml | 5 | Weighing |

### Chemicals

| Material | Fórmula | Condição |
|----------|---------|----------|
| Álcool desnaturado 0,5L | ROUNDUP(Cleaning / 1,5) | Cleaning |
| Satwipes | 1 | Cleaning |
| **AMPREG 30** (resina HLU) | ROUNDUP( (pesoTecidos×1,2 + kitsCore) / 1,26 ) | Sempre* |
| **PRIME 37** (resina infusão) | ROUNDUP( splAreaM2 × Infusion × 1,3 ) | Infusion |
| **Sikapower 1200** | ROUNDUP( maxLength × 0,120m × 23,33 × Bonding ) | Bonding |
| SikaForce 7818 | 2 | Se houver CORE |
| **SikaForce 7800** (filler) | ROUNDUP( splAreaM2 × 4 × Painting ) | Painting |
| **TopCoat RAL7035** | ROUNDUP( splAreaM2 × 0,4 × Painting × 2 ) | Painting |
| **TopCoat RAL3020** | ROUNDUP( splAreaM2 × 0,4 × Painting × 2 ) | Painting |
| Thinner | 1 (ou soma dos TopCoats / 10 se > 10kg) | Painting |
| LEP Alexit Red / White / Grey | MAX(1, ROUNDUP( maxLength/1000 / fatorRegião )) cada | LEP |
| Endurecedor LEP | soma das 3 cores de LEP | LEP |

> *fatorRegião = 3m/lata (Tip) ou 2m/lata (Middle) × número de etapas LEP*
> *AMPREG: sem condição de HLU — calcula mesmo que HLU=0 se houver peso de tecido*

### Consumables

| Material | Fórmula | Condição |
|----------|---------|----------|
| Fita masking 50mm | MAX(2, ROUNDUP(perimeter × 1,2 / 50)) rolos | Sempre |
| Fita flash 50mm (azul) | MAX(2, ROUNDUP(perimeter × Vacuum × 1,2 / 66)) | Vacuum |
| Fita scrim | 1 | Infusion |
| Cloth harpix | ROUNDUP(cleaningAreaM2) | Cleaning |
| Paper tork | ROUNDUP(cleaningAreaM2) | Cleaning |
| Pano de algodão | 1 kg | Cleaning |
| Saco de lixo 120L | ROUNDUP(cleaningAreaM2) | Sempre |
| Baker's bag | 3 | Cleaning |
| Copo plástico 1L | ROUNDUP(Weighing × 2,2) | Weighing |
| Copo plástico 0,5L | ROUNDUP(Weighing × 2,2) | Weighing |
| Release film 1500mm | ROUNDUP((maxL+100)×(maxW+100)×10⁻⁶ × Vacuum×**1,4**) m² | Vacuum |
| Breathing cloth 150gsm | ROUNDUP(maxAreaM2 × Vacuum × **1,4**) m² | Vacuum |
| Bagging film 3000mm | ROUNDUP(splAreaM2 × Vacuum × **1,4**) m² | Vacuum |
| Peel ply A100 | ROUNDUP(maxAreaM2 × Vacuum × **1,4**) m² | Vacuum |
| Transport mesh | ROUNDUP(maxAreaM2 × 1,2 / 15,5) | Infusion |
| Vacuum channel 50mm | ROUNDUP(perimeter × 1,4) metros | Infusion |
| Glassfiber omega R8.5 | 1 | Infusion |
| Conexão TEE 1/4" | Infusion + 2 | Infusion |
| Spirol band 12mm | ROUNDUP(perimeter × Vacuum × 1,2) metros | Vacuum |
| Nylon pipe 8×6mm | ROUNDUP(40 + maxLength/1000 × Vacuum) metros | Vacuum |
| Sealant amarelo | MAX(2, ROUNDUP(perimeter × Vacuum × 1,2 / 7,5)) | Vacuum |

### Fabrics (Tecidos)

O sistema soma o peso (kg) de cada tipo de tecido em todas as camadas, aplica fator 1,2 e divide pelo peso por unidade do rolo:

```
Qtde = ROUNDUP( pesoTotalTecido × 1,2 / kg_por_rolo )
```

**V150 usa catálogo HM (High Modulus)** — tecidos diferentes dos demais modelos:

| Modelo | Catálogo | Tecidos disponíveis |
|--------|---------|---------------------|
| V82, V90, V100, V110, V112, V136 | Padrão (vidro E) | BIAX600/936/1000, UD600/900/1140/1200, TRIAX1200/1500 |
| **V150** | **HM** | **HM BIAX600/1000/1200, HM UD1200, HM TRIAX1200** |

> Tecidos que não existem no catálogo V150 (ex: BIAX936, TRIAX1500) são ignorados — não há fallback.

**Tecidos especiais:**

| Material | Fórmula | Quando entra no BOM (regra REV05) |
|----------|---------|------------------------------------|
| CFM50 | 0,1 kg se (splAreaM2 × 1,5 × 0,05) < 0,1, senão 0,5 kg | Apenas se o modelo de pá listar CFM50 em `Blades_Fabrics` **E** o usuário tiver adicionado CFM50 como camada do layup. |
| SPL | ROUNDUP(splAreaM2 × Infusion × 1,5 / 5,75) rolos | Apenas se o modelo listar SPL em `Blades_Fabrics` **E** o usuário tiver adicionado SPL como camada do layup. |
| CORE | ROUNDUP(coreAreaM2 / kitAreaM2) kits<br/>onde kitAreaM2 = 2,4 (Grade B) ou 1,0 (Grade F / Root) | Apenas se o modelo listar CORE em `Blades_Fabrics` **E** o usuário tiver adicionado CORE como camada. |
| BALSA | 1 unidade (compra manual, SAP TBD) | Apenas se o modelo listar BALSA em `Blades_Fabrics` **E** o usuário tiver adicionado BALSA como camada. |

> **Correção REV05 (regressão de REV04):** anteriormente SPL e CFM50 eram emitidos no BOM sempre que `splAreaM2 > 0`, o que causava inclusão indevida em V82, V90, V100 e V112 (que não suportam esses materiais). REV05 introduziu a sheet `Blades_Fabrics` mapeando, por modelo, quais fabrics são válidos. O engine agora replica esse filtro via `bladeSupports(model, materialKey)` em [`engine.js`](static/engine.js).
>
> **Mudança da fórmula CORE:** REV05 substituiu `qty = ceil(weight_kg / kit_kg)` por `qty = ceil(area_m² / kit_area_m²)`. Matematicamente equivalente (kit_area = kit_kg ÷ density ÷ thickness), mas a forma área-based é o que `Materials!H90` lê com `J90 = 2,4` (REV05). O peso do CORE continua disponível em `coreWeightKg` para o cálculo do AMPREG 30.

### Tools (Ferramentas)

Ferramentas têm quantidade fixa — são incluídas ou não conforme a etapa ativa:

| Grupo | Etapa que ativa |
|-------|----------------|
| Mantas aquecedoras | HLU ou Infusion |
| Lixadeiras excêntricas + esmerilhadeira | Grinding |
| Bomba de vácuo | Vacuum (HLU + Infusion) |
| Aspirador industrial | Cleaning |
| Pistolas dispensadoras | Bonding |
| Pente de filme úmido, gauge wrinkle | Painting |
| Testadores de dureza, data logger, termopares | HLU ou Infusion |
| Réguas, trena, paquímetro, martelo, nível, detectores | Cleaning |
| Soprador de ar quente | Cleaning |

---

## Lógica por Modelo de Pá

Cada modelo de pá tem um conjunto específico de materiais disponíveis no LAYUP. A seleção de camadas na interface é limitada a esses materiais:

| Modelo | Materiais Disponíveis (REV05 — calculados) |
|--------|----------------------------------------------|
| V82 | BIAX936, UD600, UD1140, BALSA, CORE |
| V90 | TRIAX1200, BIAX600, UD1200, CORE |
| V100 | TRIAX1200, BIAX600, UD1200, CORE |
| V112 | TRIAX1200, BIAX600, UD1200, CORE |
| V110 | TRIAX1500, BIAX600, BIAX936, UD600, UD900, UD1140, CORE, BALSA, SPL, CFM |
| V136 | TRIAX1200, BIAX1000, BIAX600, UD1200, UD600, CORE, BALSA, SPL, CFM |
| V150 (HM) | HM BIAX600, HM BIAX1000, HM BIAX1200, HM UD1200, HM TRIAX1200, CORE, BALSA, SPL, CFM |

> ⚠️ **Materiais pendentes em REV05 — aguardando REV06**
>
> A sheet `Blades_Fabrics` de REV05 lista **5 materiais adicionais** como roadmap de disponibilidade, mas o restante do workbook (`Layer Data Input`, `LAYUP` overlap, `Fabrics_aux` SUMIF, catálogo `Fabrics` com SAP, `Materials` com fórmula) **não foi atualizado** para calcular esses materiais. Por isso eles **não constam** na tabela acima.
>
> | Material | Pá afetada | Onde está em REV05 |
> |----------|-----------|---------------------|
> | Quadrax 850 g/m² | V82 | `Blades_Fabrics!A7` (label only) |
> | Quadrax 566 g/m² | V82 | `Blades_Fabrics!A8` (label only) |
> | Biax ±45° 450 g/m² | V136 | `Blades_Fabrics!F11` (label only) |
> | Biax ±45° 200 g/m² | V136 | `Blades_Fabrics!F12` (label only) |
> | Biax ±80° 1200 g/m² (E-glass) | V136 | `Blades_Fabrics!F13` (label only) |
>
> A política do app é zero mock data — não inferimos overlap, SAP ou factor para esses materiais. Detalhes do que falta em REV06 estão em [PENDING_REV06.md](PENDING_REV06.md).

---

## Exemplo de Verificação Rápida

Com os dados do exemplo (Rstart=48500, Rend=48750, X1=50, X2=10, 8 camadas):

| Variável | Valor esperado |
|----------|---------------|
| maxLength | 1.220 mm |
| maxWidth | 570 mm |
| maxAreaM2 | 0,695 m² |
| splAreaM2 | 1,093 m² |
| perimeter | 3,98 m |
| totalFabricWeight | 0,892 kg |
| coreWeightKg | 0,69 kg |

---

## Novidades (revisão 2026)

### Estimador de prazo em dias — `computeRepairDays(layers, isExternal)`
Estima a duração do reparo em dias inteiros a partir da pilha de laminação. Regra da **cura**: cada laminação leva algumas horas de cura, então é **1 laminação por dia**, no **máximo 6 telas** por laminação.

```
dias = 1 (lixamento + medidas)
     + ceil(telasAntesDoCore / 6)     (1 laminação/dia)
     + 1 se houver CORE               (core + lixar pra ajustar)
     + ceil(telasDepoisDoCore / 6)    (1 laminação/dia)
     + 1 se externo                   (pintura)
     + 1 (folga pra problemas)
```
Constantes em `REPAIR_DAY_RULES` (data.js). Interno/externo vem de um toggle explícito na UI. Exemplo do sketch (2 telas antes / core / 2 depois): **interno = 5 dias, externo = 6 dias**.

### Override manual de geometria por camada
`computeLayup` respeita `ovR1/ovR2/ovX1/ovX2` por camada. O spanwise (R1/R2) é 100% automático e validado contra o Lamination Plan Sketch real; a corda (X1/X2) perto do bordo (TE/LE) pode exigir offsets do desenho — o override alimenta a acumulação, então camadas seguintes reconstroem sobre a geometria corrigida.

### Nomenclatura de chão de fábrica (T-codes)
`FABRIC_ALIASES` mapeia apelidos confirmados (**T80 = Biax ±80° 1200 g/m²**). Exibido ao lado do tecido nas duas UIs. Política zero-mock: só apelidos confirmados.

### Referências de desenho por versão de pá
`BLADE_DOCUMENT_REFERENCES` (22 versões) — consulta independente do modelo do BOM. Aparece opcionalmente no relatório PDF/Excel.

### Catálogo México (Formato_consumos_palas.xlsx)

A operação migrou do Brasil para o México; o log de consumo MX (2.223 linhas, 153 itens) foi cruzado com o catálogo e os números abaixo foram substituídos (preferindo o novo NUM ITEM do México e respeitando a unidade da coluna K). Nome em inglês prevalece quando o mesmo número tinha grafias diferentes.

| Material | BR (antigo) | MX (novo) | Unidade nova |
|---|---|---|---|
| Sikapower 1200 | 29078542 (450 mL) | **29237701** (400 mL) | EA |
| Prime 37 4kg | 29276912 | **29237987** | EA |
| Brush 70mm | 222720 | **29196729** | EA |
| Plastic cup 1L | 213560 | **29196707** | EA |
| Paddle stirrers | 224010 | **29196727** | EA |
| Grinding plate G60 125 | 232906 | **29196704** (w/o holes) | EA |
| Rear disc rubber | 233875 | **29196703** | EA |
| UD1140 | 29017705 | **S096486** (300mm) | KG |
| TRIAX1200 E | 29017700 (KG) | **29250986** (rolo 14m/20kg; alt 29250987 5kg) | EA |
| BIAX936 | 29009736 (KG) | **29238490** (rolo 18m/20kg) | EA |
| HM TRIAX1200 | 29210017 (KG) | **29234528** (rolo 13m ≈20kg) | EA |
| HM BIAX1000 | 29464588 (KG) | **29234525** (rolo 16m ≈20kg) | EA |
| HM UD1200 | 29110162 (KG) | **29234519** (rolo 13m ≈20kg; alt 29305383) | EA |
| SPL patch | 29180313 (5m, 5,75 m²) | **29180312** (10m, **11,5 m²**) | EA |
| Breathing cloth | S096512 (M2) | **29227309** Breatex 400mm/50m (rolo 20 m²) | EA |
| Bagging film | 29017040 (M2) | **29232949** 465B 1350mm (por metro linear ÷1,35) | M |
| Release film | 300023948 (M2) | **S096521** 360mm (por metro linear ÷0,36) | M |
| Transport mesh | 260710 (M2) | **29225928** (rolo 155 m²) | EA |
| Peel ply | 29232963 (M2) | **29232947** 450mm (rolo 22,5 m²) | EA |
| Prato K220 acabamento | 233015 | **29196720** ø150 K220 9 furos | EA |

> Rolos HM ≈20 kg calculados por dimensão × gsm (13×1,26×1,2 = 19,7 etc.). **Flag de campo:** o log MX chama 29238494 de "TELAS BX600", mas a lista oficial fev/2026 diz Biax 220 — verificar no almoxarifado. Itens só-México sem fórmula no BOM (esponja roller 298024, PVC core kit 881865, kits LPS etc.) não foram adicionados.


### Esquema de pintura (top coat)

Antes o BOM emitia **sempre** cinza RAL7035 + vermelho RAL3020, independente da
pá. Agora a cor é escolhida no Step 3 (as duas UIs), porque a pá é sempre de
**cor única** ou **cor única com faixas coloridas**.

| Papel | Opções | SAP (kit 1kg) | Embalagem alt. |
|---|---|---|---|
| Cor base | Cinza RAL7035 | 29034878 | 29035852 |
| | Branco RAL9010 | 29034879 | 29035853 |
| Faixa (opcional) | Vermelho RAL3020 | 29035851 | 29035855 |
| | Laranja RAL2009 | 29035720 | 29035854 |
| Diluente | Thinner 12 | 29035856 | — |

Fonte: tabela PINTURA (TOPCOAT) da lista de material. A coluna "embalagem
alternativa" está registrada em `TOPCOAT_COLORS[...].altSap` mas **não entra no
cálculo** — o tamanho dela ainda não foi confirmado, e sem o peso não dá para
converter quantidade (política de zero-mock).

**Quantidade:** cada cor usada consome `ceil(areaComMargem × 0,4 × pintura × 2)`
— a mesma fórmula de antes, aplicada por cor. A faixa usa a mesma quantidade da
base (decisão mantida do comportamento atual; superestima, mas é o que já era
praticado). O thinner soma só as cores efetivamente usadas, então pá de cor
única consome menos que antes.

**Compatibilidade:** `computeFullBOM(..., paintScheme)` é opcional. Omitido,
usa `DEFAULT_PAINT_SCHEME` = cinza + faixa vermelha, exatamente o resultado
anterior — por isso nenhum teste existente precisou de re-baseline.


### Reparos especiais (kit fixo por pá)

Procedimentos cuja lista de material não depende da geometria do dano — o
material é um kit + consumíveis fixos. Catálogo em `SPECIAL_REPAIRS`
(`data.js`), painel "Kits" nas duas UIs (`static/kits.js`), export Excel/PDF
pelos endpoints já existentes.

| Reparo | Fonte | Kits (variantes) |
|---|---|---|
| Serration install (TE) | WI 0052-7690 V03 (v1) + WI 0061-8905 V06 (v2/2.1) + lista REYNOSA | **13 kits**: V90/V100 v1 e v2, V105, V112/V117 v2 e v2.1, V116, V120, V126 v2 e v2.1, V136, V162 (v2≠v2.1: não intercambiáveis) |
| Blade collar replacement (2 MW) | WI 0015-0803 V05 | Mk 1–10 `10207233` (R7035) · Mk 11 `29110316` — kit 15 kg |

Regras: consumíveis/químicos/EPI multiplicam pelo nº de pás; **ferramentas são
reutilizáveis e ficam fixas** (`perBlade:false`). Itens dos documentos sem
número de item entram com SAP `-` (zero-mock — nada inventado).

Flags fechadas (confirmadas pelo usuário, ago/2026): RAL7035 fica no
`29034878` oficial (o `29035854` da lista de campo é a embalagem alternativa
do RAL2009); o "cleaning agent 0,5 l" do doc do collar (sem número) fica
mapeado para o álcool 93% ½ L (`234900`).


### Reedição pelo próprio Excel (aba INPUTS)

Todo Excel gerado no mobile ganha uma aba **INPUTS** (marcador
`BRMP_REEDIT_V1`) com as entradas completas do cálculo: blade, região,
dimensões, dias, interno/externo, esquema de pintura, SO/CIR/título, a pilha
de camadas (material, gsm e overrides ovR1/ovR2/ovX1/ovX2) e as etapas com
quantidade. O endpoint `/api/import-bom-excel` lê essa aba de volta e o botão
**"Reabrir de Excel"** (landing do mobile) reconstrói o estado para reedição —
o Excel entregue vira o arquivo de projeto do reparo.

Na etapa de camadas, tocar no corpo de uma camada abre o seletor em **modo
troca**: o material muda mantendo a posição na pilha, o nome e os overrides de
geometria.
