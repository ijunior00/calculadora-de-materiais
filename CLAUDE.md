# Blade Repair Materials Planner (BRMP)

Calcula a lista de materiais e ferramentas (BOM) para reparo de pás eólicas,
espelhando a planilha `Blade_Repair_Materials_Estimate - REV05.xlsx`.

**O resultado deste cálculo vira pedido de compra de material para reparo em
campo.** Número errado custa dinheiro e tempo de equipe em sítio. É por isso
que o projeto insiste em fonte para cada dado e em rodar a suíte antes de
afirmar qualquer coisa.

## Arquitetura

Todo o cálculo roda no navegador; o backend só serve páginas e gera arquivos.

```
static/data.js      catálogo (itens, SAP, unidades, fórmulas de quantidade)
static/engine.js    cálculo: computeLayup() e computeFullBOM()
static/scarf.js     escalonamento e desenho (SVG)
static/mobile.js    UI mobile  (/m)     ← controller M
static/app_new.js   UI desktop (/)
static/test.js      suíte de 203 testes (runBOMTests)
backend/backend.py  FastAPI: serve as páginas, gera PDF/Excel
```

## Comandos

```bash
npm test              # 203 testes de BOM em Node, sem navegador (~1s)
npm run test:verbose  # o mesmo, com log completo
npm run lint:skills   # valida .claude/skills/
npm run check         # tudo acima + sintaxe do backend
python run_server.py  # sobe o app em :8010  →  / (desktop) e /m (mobile)
```

A suíte também roda no navegador — é o mesmo `static/test.js`, útil quando
você quer inspecionar a UI junto. Abra com `?debug=1` e chame `runBOMTests()`
no console. Sem `?debug`, o harness não carrega.

| Página | Resultado | Por quê |
|---|---|---|
| `/m?debug=1` (mobile) | **203** | carrega `scarf.js`; cobre o escalonamento |
| `/?debug=1` (desktop) | **201** | não carrega `scarf.js`; aqueles 2 testes se auto-pulam |
| `npm test` (Node) | **203** | carrega `scarf.js` com stubs de DOM |

Verificado asserção por asserção: as execuções são idênticas nas asserções em
comum. A diferença do desktop é só cobertura menor, não divergência.

## Regras do projeto

**Zero-mock.** Nunca invente número de item, gramatura, tamanho de rolo ou
fórmula. Dado sem fonte (lista oficial de SAP, norma, desenho, log de consumo)
fica pendente em `PENDING_REV06.md` — não entra no catálogo com valor
plausível. Um número inventado que passa no teste é pior que um teste vermelho.

**Unidade é crítica.** Material vendido por quilo, rolo, m² ou metro linear
usa fórmulas diferentes. Ver `skill:alterar-catalogo-bom` antes de mexer.

**`CATALOG MISMATCH` é proposital.** Quando o layup pede um tecido que a pá
não tem no catálogo, o item aparece marcado assim em vez de sumir em silêncio.
Não "conserte" escondendo — pergunte ao usuário.

**Re-baseline precisa de justificativa.** Mudar valor esperado de teste é
normal quando a fórmula mudou de propósito — mas cada mudança leva comentário
explicando a origem. Se você não consegue explicar o número novo, achou um bug.

**Idioma.** A interface do app é 100% em **inglês** (idioma comum do time e
da lista de SAP) — qualquer texto novo visível ao usuário nasce em inglês.
Documentação e comentários de contexto seguem em português.

## Fluxo de trabalho

Branch de desenvolvimento: `claude/project-review-optimization-mejn0m`.
Nunca commite direto na `main` — PR e merge.

Antes de abrir PR: `npm run check` verde. O CI roda o mesmo em todo push.

## Documentos

| Arquivo | Conteúdo |
|---|---|
| `CALCULATION_LOGIC.md` | Todas as fórmulas, overlaps por norma, tabela De→Para do catálogo México |
| `PENDING_REV06.md` | Dados aguardando confirmação (política zero-mock) |
| `ACESSO.md` | URL de produção e acesso |
| `.claude/skills/README.md` | Skills do projeto e crédito ao método de origem |

## Pendências conhecidas

- **SAP 29238494**: a lista oficial (fev/2026) diz Biax 220 g/m²; o log de
  consumo do México registrou "TELAS BX600". Mantido como Biax 220 e sinalizado
  em comentário — aguardando conferência no almoxarifado.
