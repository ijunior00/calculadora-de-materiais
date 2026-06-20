# PENDÊNCIAS PARA REV06 — Blade Repair Materials Estimate

**Documento gerado em:** 2026-04-28
**Aplicável à versão de referência:** `Blade_Repair_Materials_Estimate - REV05.xlsx`
**Status do app:** alinhado a REV05 estritamente. **Nenhum dado inferido.**

> **Para o gestor da calculadora**: este documento lista materiais que o REV05 introduziu **parcialmente** e que precisam ser finalizados em REV06 antes de poderem ser calculados pelo aplicativo. O motivo é simples: a planilha REV05 declarou esses materiais em uma sheet de roadmap (`Blades_Fabrics`), mas **não atualizou o restante do workbook** (form de entrada, fórmulas SUMIF, catálogo de SAPs, tabela de overlaps). Sem esses dados originais da planilha, o app não tem como calcular sem inventar valores — e o requisito é zero mock data.

---

## Resumo executivo

REV05 trouxe duas evoluções em relação a REV04:

1. **✅ Sheet `Blades_Fabrics` (NOVA, 13×7)** — matriz que mapeia, por modelo de pá, quais fabrics são válidos. **O app já implementa essa filtragem** corretamente em `engine.js → bladeSupports()`. Resolve o bug histórico de SPL/Core sendo plotados em V82/V90/V100/V112.

2. **⚠️ 5 novos materiais listados apenas como rótulos** em `Blades_Fabrics`, mas não conectados ao pipeline de cálculo da REV05. **Estes precisam ser fechados em REV06.**

---

## Materiais pendentes — precisam de fechamento em REV06

| # | Material | Pá | Onde está em REV05 | Onde NÃO está em REV05 |
|---|----------|----|---------------------|------------------------|
| 1 | **Quadrax 850 g/m²** | V82 | `Blades_Fabrics!A7` | LAYUP overlap, Fabrics_aux SUMIF, Fabrics catálogo (SAP), Materials linha de fórmula, Layer Data Input form, Lists |
| 2 | **Quadrax 566 g/m²** | V82 | `Blades_Fabrics!A8` | (idem) |
| 3 | **Biax ±45° 450 g/m²** | V136 | `Blades_Fabrics!F11` | (idem) |
| 4 | **Biax ±45° 200 g/m²** | V136 | `Blades_Fabrics!F12` | (idem) |
| 5 | **Biax ±80° 1200 g/m² (E-glass)** | V136 | `Blades_Fabrics!F13` | (idem). REV05 só tem BIAX1200 HM (`Fabrics!A19 = 29110146`, exclusivo V150) |

---

## Para cada material acima, REV06 precisa preencher:

### A. `Lists` sheet — habilitar tipo/GSM no master de validação
- `Lists!E2:E7` precisa incluir `QUADRAX` (atualmente: BIAX, UD, TRIAX, CORE, SPL, CFM50)
- `Lists!G2:G8` precisa incluir GSMs `200, 450, 566, 850` (atualmente: 600, 900, 936, 1000, 1140, 1200, 1500)

### B. `Layer Data Input` sheet — habilitar combinação no form do usuário
Atualmente C4:E16 tem 13 linhas — uma por combinação válida `MaterialType / GSM / Grade(E ou HM)`. Adicionar:

| Material type | Aerial Weight (GSM) | Grades aplicáveis |
|---------------|---------------------|-------------------|
| QUADRAX       | 850                 | (E ou HM?)        |
| QUADRAX       | 566                 | (E ou HM?)        |
| BIAX          | 450                 | (E)               |
| BIAX          | 200                 | (E)               |
| BIAX          | 1200                | hoje só HM — V136 vai usar E? |

### C. `LAYUP` sheet — overlap span/chord
Atualmente `LAYUP!H4:J16` tem 14 linhas (uma por fabric). Adicionar 5 linhas com **valores reais de engenharia** (dimensões de scarffing/overlap em mm — não vale proporção GSM):

| FABRIC      | SPAN (mm) | CHORD (mm) |
|-------------|-----------|------------|
| QUADRAX850  | ?         | ?          |
| QUADRAX566  | ?         | ?          |
| BIAX450     | ?         | ?          |
| BIAX200     | ?         | ?          |
| BIAX1200 (E-glass, se diferente do HM) | ? | ? |

### D. `Fabrics_aux` sheet — fórmula SUMIF para o weight kg
Adicionar 5 linhas após G26 (TRIAX1500), no mesmo padrão das existentes:
```
G27 = QUADRAX850
H27 = =SUMIF(LAYUP!$A$18:$A$70, Table22[[#This Row],[Material]], LAYUP!$N$18:$N$70) * Table22[[#This Row],[Factor]]
I27 = KG
J27 = 1.2  (ou outro fator de waste)
K27 = Lamination
```
…e renumerar as linhas CFM50/SPL/CORE em sequência.

### E. `Fabrics` catálogo — SAP, descrição completa, unidade
Adicionar linhas em `Fabrics!A_:I_`:

| IN (SAP) | Material | Spec doc | Unit | Unit (antigo) | H (key) | I (kgPerUnit) | Grade |
|----------|----------|----------|------|---------------|---------|---------------|-------|
| ?        | QUADRAX 850g/m² ... | ?      | KG/M²/EA | ?             | QUADRAX850 | ?         | E ou HM |
| ?        | QUADRAX 566g/m² ... | ?      | ?    | ?             | QUADRAX566 | ?         | ?     |
| ?        | BIAX ±45 450g/m² ... | ?     | ?    | ?             | BIAX450   | ?         | E     |
| ?        | BIAX ±45 200g/m² ... | ?     | ?    | ?             | BIAX200   | ?         | E     |
| ?        | BIAX ±80 1200g/m² (E-glass, se distinta da HM 29110146) | ? | ? | ? | BIAX1200_E | ? | E |

### F. `Materials` sheet — linhas com fórmula de quantidade
Adicionar 5 linhas (entre as linhas 78–87 dos outros fabrics) seguindo o padrão:
```
F_n = =IF('Damage Data Input'!$C$1="V150", _xlfn.XLOOKUP(...), _xlfn.XLOOKUP(...))
G_n = QUADRAX850   (ou outro material key)
H_n = =IF('Damage Data Input'!$C$1="V150", ROUNDUP(Fabrics_aux!H_n / Materials!M_n, 0), ROUNDUP(Fabrics_aux!H_n / M_n, 0))
I_n = =_xlfn.XLOOKUP(Table2[[#This Row],[IN]], Fabrics!$A$2:$A$_, Fabrics!$D$2:$D$_)
J_n = 1.2
K_n = Lamination
M_n = =_xlfn.XLOOKUP(Table2[[#This Row],[IN]], Fabrics!$A$2:$A$_, Fabrics!$I$2:$I$_)
```

---

## O que o app faz HOJE com esses materiais pendentes

- O dropdown de Material Type em `Layer Data Input` (Step 2 do app) **não exibe** as opções pendentes — `BLADE_MATERIAL_MAP` em [data.js](static/data.js) lista apenas as combinações de REV05 que estão totalmente conectadas.
- Os 5 materiais são **representados fielmente** via a constante `BLADE_REFERENCE_FABRICS` em [data.js](static/data.js), que espelha exatamente os rótulos da sheet `Blades_Fabrics` do REV05 (sem SAP, sem overlaps, sem dados invenados). Um painel de leitura exclusiva exibe essas fabrics no Step 2 abaixo da tabela de camadas, identificando cada item com a célula de origem (`Blades_Fabrics!A7`, etc.) e o status `SAP: not assigned`.
- Um teste automatizado em [test.js](static/test.js) (`testBladeReferenceFabricsStructure`) verifica que a estrutura de `BLADE_REFERENCE_FABRICS` está correta (V82 = 2 entradas, V136 = 3 entradas, sources corretos).
- Um segundo teste (`testRev05PendingMaterialsAreNotInjected`) **falha intencionalmente** se alguém futuramente tentar adicionar essas opções sem updates correspondentes em STANDARD_OVERLAPS / FABRICS_DB / Lists.
- Os comentários nas linhas correspondentes de [data.js](static/data.js) referenciam este documento e citam as células exatas de `Blades_Fabrics` (`A7`, `A8`, `F11`, `F12`, `F13`).

---

## Checklist de aceite para REV06

Quando o gestor entregar REV06, confirmar:

- [ ] `Lists!E_` inclui `QUADRAX` se aplicável
- [ ] `Lists!G_` inclui GSMs novos
- [ ] `Layer Data Input!C_:E_` tem linha para cada nova combinação
- [ ] `LAYUP!H_:J_` tem **span/chord reais de engenharia** para as 5 fabrics
- [ ] `Fabrics_aux!G_:K_` tem linha SUMIF para cada nova fabric com factor confirmado
- [ ] `Fabrics!A_:I_` tem **SAP real** (não TBD), descrição completa, kgPerUnit
- [ ] `Materials!F_:M_` tem linha com fórmula `IF/XLOOKUP` espelhando as linhas 78–87
- [ ] `Blades_Fabrics` continua como single source of truth da disponibilidade por modelo (sem mudança esperada)
- [ ] Verificar se o BIAX 200gsm (V136) e Quadrax 566 são tão leves que possam exigir tratamento especial (ex.: unidade EA em vez de KG, factor de waste maior)

Após receber REV06, esta pendência deve ser fechada em PR único atualizando:
- `data.js` (BLADE_MATERIAL_MAP, STANDARD_OVERLAPS, FABRICS_DB, MATERIAL_TYPES, GSM_OPTIONS; remover entradas de `BLADE_REFERENCE_FABRICS` conforme migradas)
- `engine.js` (fabricTypes array)
- `test.js` (re-habilitar `testRev05NewMaterials` validando contra os SAPs/overlaps reais de REV06; atualizar `testBladeReferenceFabricsStructure` para refletir entradas removidas)
- `CALCULATION_LOGIC.md` (atualizar a tabela de modelos)
- Apagar este arquivo (`PENDING_REV06.md`).

---

## Anexos — comprovação técnica da pendência

Busca textual exaustiva por `Quadrax`, `850gsm`, `566gsm`, `450gsm`, `200gsm`, `±45`, `±80`, `BI80`, `BI45` em todas as 11 sheets de REV05 retorna apenas:

```
[Fabrics]        B17  'FABRIC HM BI45 600G 1260'   ← BIAX600 HM, V150 (já mapeado, SAP 29116888)
[Fabrics]        B19  'FABRIC HM BI80 1200G 1260'  ← BIAX1200 HM, V150 (já mapeado, SAP 29110146)
[Blades_Fabrics] A7   'Quadrax 850gsm'             ← V82  — APENAS rótulo
[Blades_Fabrics] A8   'Quadrax 566gsm'             ← V82  — APENAS rótulo
[Blades_Fabrics] F11  'Biax ±45 450gsm'            ← V136 — APENAS rótulo
[Blades_Fabrics] F12  'Biax ±45 200gsm'            ← V136 — APENAS rótulo
[Blades_Fabrics] F13  'Biax ±80 1200gsm'           ← V136 — APENAS rótulo
```

Os hits em `Fabrics!B17` e `B19` são as fabrics HM do V150 já completamente mapeadas (`BIAX600 HM` = SAP 29116888, `BIAX1200 HM` = SAP 29110146). `BI45`/`BI80` é abreviação Vestas para o ângulo do weave (Biax ±45° / Biax ±80°) — não são GSMs.

Conclusão: os 5 materiais novos do `Blades_Fabrics` existem em REV05 **somente como labels**.
