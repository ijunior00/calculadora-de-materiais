---
name: verificar-antes-de-concluir
description: Use antes de afirmar que qualquer trabalho neste repositório está pronto, funcionando, corrigido ou testado — e antes de abrir PR ou fazer merge. Garante que a afirmação venha de saída de comando recém-executada (npm test / lint), não de suposição. Use também quando for reportar resultado de mudança em BOM, cálculo, catálogo de materiais ou UI, e quando precisar re-baselinar testes cujo valor esperado mudou.
---

# Verificar antes de concluir

Este projeto calcula lista de materiais para reparo de pás eólicas. Um número
errado vira compra errada de material no campo, em outro país. Por isso a
régua aqui é mais alta que "parece certo": **só afirme o que a saída de um
comando acabou de mostrar.**

## A regra

Antes de dizer *pronto*, *funcionando*, *corrigido*, *testado* ou *passou*,
rode o comando e leia a saída. Se você não rodou, não afirme — diga o que
falta rodar.

Isso não é burocracia. O modo de falha real é sutil: você faz uma mudança
pequena e óbvia, ela quebra um teste distante que você não imaginou tocar, e
como "era óbvio" ninguém rodou nada. Foi exatamente assim que a mudança de
unidade dos tecidos (KG → rolo EA) mexeu em testes de consumíveis que não
tinham relação aparente.

## Comandos deste projeto

```bash
npm test              # 120 testes de BOM em Node, sem navegador (~1s)
npm run lint:skills   # valida as skills de .claude/skills/
npm run check         # os dois acima + sintaxe do backend Python
```

Cobertura por camada:

| Mudou o quê | Verifique com |
|---|---|
| `static/data.js`, `engine.js`, `scarf.js` | `npm test` — cobre o cálculo inteiro |
| `mobile.js`, `app_new.js`, HTML/CSS | `npm test` **e** abra a UI (`python run_server.py`, `/` e `/m`) — a suíte não vê DOM |
| `backend/backend.py` | `npm run check` **e** exercite o endpoint (`curl` no `/api/...`) |
| `.claude/skills/` | `npm run lint:skills` |

`npm test` valida cálculo, não interface. Mudança visual precisa de olho na
tela — ou de uma captura, se você tiver como gerar uma.

## O que conta como evidência

Conta: saída de comando desta rodada; código de saída; um valor que você
imprimiu e conferiu; uma captura de tela da mudança.

Não conta: "a mudança é pequena"; "o teste passava antes"; "a lógica está
correta"; a suíte que você rodou **antes** da última edição; raciocínio sobre
o que o código deveria fazer.

## Re-baselinar teste é permitido — mentir sobre isso, não

Quando você muda uma fórmula ou um número de item de propósito, o valor
esperado antigo fica errado. Atualizar o teste é o certo. O perigoso é
atualizar para fazer o vermelho sumir sem saber por quê.

Antes de mexer num valor esperado, responda:

1. Qual mudança **intencional** fez esse número mudar?
2. O valor novo bate com a fonte (norma, lista de SAP, desenho)?
3. Se você não consegue explicar o número novo, **você achou um bug** — não
   um baseline desatualizado. Pare e investigue (`skill:depuracao-sistematica`).

Deixe a razão no próprio teste, como comentário. Quem ler daqui a seis meses
precisa entender por que o número é esse:

```js
// Catálogo MX: TRIAX1200 agora é rolo de 20 kg (29250986), não KG avulso.
assertItemPresent('TRIAX1200 → 29250986 (MX roll)', b.fabricItems, '29250986'),
```

## Como reportar

Diga o que rodou e o que saiu, com número. `Suíte 120/120, lint ok` informa;
"tudo certo!" não.

Se algo ficou por verificar, diga qual parte e por quê — um item honesto na
lista vale mais que uma afirmação larga que não se sustenta. E se o teste
falhou, relate a falha com a saída: relatório fiel vale mais que boa notícia.

## Sinais de alerta

| Se você pensar… | A realidade é |
|---|---|
| "Mudança trivial, nem precisa testar" | `npm test` leva 1 segundo |
| "Passou antes, deve estar passando" | Você editou depois disso |
| "O teste está errado, não meu código" | Às vezes sim — mas prove antes de editar o teste |
| "Depois eu rodo" | O relatório sai agora; rode agora |
| "A lógica está claramente certa" | Lógica certa e integração certa são coisas diferentes |
