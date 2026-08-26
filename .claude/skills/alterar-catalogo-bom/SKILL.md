---
name: alterar-catalogo-bom
description: Use ao mexer no catálogo de materiais ou no cálculo do BOM deste projeto — trocar número de item/SAP, mudar unidade (KG, EA, M², metro linear, rolo), ajustar fórmula de quantidade, adicionar modelo de pá, alterar overlap ou gramatura. Também quando chegar lista nova de material de outro país ou revisão de norma. Cobre onde editar em data.js, como converter unidade sem errar a conta, como re-baselinar os testes e o que documentar antes do PR.
---

# Alterar catálogo e cálculo do BOM

Este é o fluxo que mais se repete no projeto e o que tem maior custo se sair
errado: o número aqui vira pedido de compra de material para reparo em campo.
Vale ir devagar nas duas coisas que quase sempre mordem — **unidade** e
**valor esperado de teste**.

## Onde fica cada coisa (`static/data.js`)

| Estrutura | O que guarda |
|---|---|
| `FABRICS_DB.standard` | Tecidos de vidro E |
| `FABRICS_DB.V150` | Tecidos HM (usados por V150 e V162) |
| `FABRICS_SPECIAL` | SPL, CFM50, CORE, CORE_ROOT, BALSA |
| `BLADE_MATERIAL_MAP` | Quais materiais cada modelo de pá aceita |
| `BLADE_MODELS` | Lista de modelos (o dropdown do desktop é separado, em `front-end/index.html`) |
| `STANDARD_OVERLAPS` / `computeFiberOverlap()` | Overlaps por % da gramatura (norma 0149-9754 §12) |
| `PPE_ITEMS`, `CONSUMABLE_TOOLS`, `CHEMICALS`, `CONSUMABLES`, `TOOLS` | Cada item com seu `calcQty` |

O cálculo em si vive no `engine.js` e quase nunca precisa mudar — na grande
maioria dos casos a alteração é só de dado, no `data.js`.

## Unidade é onde o erro acontece

Trocar o número do item é fácil. O risco está em trocar um item vendido por
quilo por um vendido em rolo e deixar a fórmula antiga.

Para tecidos, o `engine.js` faz (linhas ~300):

```
qty = ceil(pesoKg / kgPerUnit)     // regra geral
qty = ceil(pesoKg * kgPerUnit)     // exceção: UD1200 standard, unidade M²
```

Então:

| Como o material é vendido | Escreva |
|---|---|
| Por quilo | `unit: 'KG', kgPerUnit: 1` |
| Rolo de 20 kg | `unit: 'EA', kgPerUnit: 20` |
| Patch/rolo por área (SPL) | `rollArea:` em m² — `qty = ceil(área / rollArea)` |
| Filme por metro linear | `unit: 'M'` e divida a área pela **largura do rolo** no `calcQty` |
| Rolo fechado por área (peel ply, breatex) | `unit: 'EA'` e divida pela **área do rolo** |

Exemplos reais do catálogo México:

```js
// rolo 14m × 1265mm ≈ 20 kg
'TRIAX1200': { sap: '29250986', desc: '...', unit: 'EA', kgPerUnit: 20 },

// filme de 1350mm vendido por metro linear: m² ÷ 1,35 = metros
{ sap: '29232949', unit: 'M', calcQty: (s,d,lay) => s.Vacuum > 0
    ? Math.ceil(lay.splAreaM2 * s.Vacuum * 1.4 / 1.35) : 0 },
```

Sempre deixe a conversão explícita em comentário, com a conta. Daqui a seis
meses ninguém lembra de onde saiu o `1.35`.

## Passo a passo

1. **Confirme a fonte.** Lista oficial de SAP, norma, desenho ou log de
   consumo. Sem fonte, não altere — o projeto tem política de zero-mock:
   dado sem origem vai para `PENDING_REV06.md`, não para o catálogo.
2. **Edite `static/data.js`** e comente a mudança citando a origem e o número
   antigo. O comentário é o que permite auditar depois:
   ```js
   // Catálogo MX: 29237701 (400 mL) substitui o BR 29078542 (450 mL).
   ```
3. **Cheque os acoplamentos.** Um modelo de pá novo precisa entrar em
   `BLADE_MODELS`, em `BLADE_MATERIAL_MAP` **e** no `<select>` do
   `front-end/index.html` (o mobile lê da lista, o desktop é hardcoded).
   Tecido HM novo pode precisar do seletor de catálogo no `engine.js`.
4. **Rode `npm test`.** Vai falhar onde o valor esperado mudou de propósito.
5. **Re-baselinize com justificativa.** Cada valor esperado que você mudar
   ganha um comentário dizendo por quê. Se não souber explicar o número novo,
   você achou um bug — vá para `skill:depuracao-sistematica`.
6. **Confira uma saída real de BOM**, não só o verde da suíte. Monte um caso
   parecido com um reparo de verdade e olhe se a quantidade faz sentido
   fisicamente (`node -e` carregando `data.js` + `engine.js`).
7. **Atualize `CALCULATION_LOGIC.md`** — tabela De→Para para troca de item,
   ou a regra nova, se mudou fórmula.
8. **Commit, PR, merge** só depois de `npm run check` verde
   (`skill:verificar-antes-de-concluir`).

## Cheiro de erro

- Quantidade que pula de ordem de grandeza (2 → 40 rolos): quase sempre é
  `kgPerUnit` invertido, ou dividir onde deveria multiplicar.
- Item que sumiu do BOM: o material provavelmente não está no
  `BLADE_MATERIAL_MAP` daquele modelo, ou o `calcQty` retorna 0 porque a
  etapa está desligada.
- `CATALOG MISMATCH` na saída: o layup pede um tecido que o catálogo daquela
  pá não tem. É proposital — aparece em vez de sumir em silêncio. Trate como
  pergunta ao usuário, não como bug a esconder.

## Conflito entre fontes

Quando a lista oficial e o log de campo discordam sobre o mesmo número — como
o `29238494`, que a lista chama de Biax 220 e o campo chamou de "BX600" —
**mantenha a fonte oficial, marque em comentário e avise o usuário para
conferir**. Não escolha silenciosamente; quem resolve isso é o almoxarifado.
