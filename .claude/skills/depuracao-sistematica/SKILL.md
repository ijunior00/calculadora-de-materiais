---
name: depuracao-sistematica
description: Use quando um teste falhar, um número do BOM sair errado, o desenho não refletir o que deveria, ou algo neste projeto não funcionar como esperado. Também quando a segunda ou terceira tentativa de corrigir a mesma coisa não pegou, ou quando o usuário disser "continua errado", "não é isso", "estamos travados". Impõe achar a causa raiz antes de propor correção, em vez de tentar remendos por palpite.
---

# Depuração sistemática

Corrigir por palpite parece rápido e quase nunca é. Cada tentativa às cegas
muda o estado do código, então a próxima investigação começa de um lugar pior
— e no fim ninguém sabe mais quais das cinco alterações eram necessárias.

**Ache a causa antes de escrever a correção.** Custa alguns minutos e é a
diferença entre consertar e disfarçar.

## Fase 1 — Reproduzir e localizar

Leia a mensagem de erro inteira, incluindo qual asserção falhou e com quais
valores. A suíte deste projeto imprime `esperado` vs `obtido` — isso costuma
já apontar a camada.

```bash
npm test                       # a suíte inteira, ~1s
node scripts/run-tests.mjs     # mesma coisa, com o log completo
```

Para isolar um cálculo sem passar pela UI, carregue os módulos direto em Node
e imprima o valor intermediário:

```bash
node -e "
  const fs=require('fs');
  eval(fs.readFileSync('static/data.js','utf8')+fs.readFileSync('static/engine.js','utf8'));
  const r = computeLayup({rstart:0,rend:500,x1:0,x2:500,chordRef:'LE'},
                         [{layerName:'L1',materialType:'BIAX',gsm:'600'}]);
  console.log(JSON.stringify(r.layupRows, null, 2));
"
```

Pergunte também: **o que mudou desde que funcionava?** `git diff` e
`git log --oneline -5` respondem em segundos e resolvem boa parte dos casos.

## Fase 2 — Instrumentar a fronteira certa

Este app tem camadas bem separadas. Descubra em qual o valor já está errado,
em vez de adivinhar:

```
data.js (catálogo, fórmulas)
   → engine.js (computeLayup / computeFullBOM)
      → scarf.js (escalonamento, desenho)
         → mobile.js / app_new.js (UI)
            → backend.py (PDF/Excel)
```

Imprima o valor em cada fronteira e ache a primeira onde ele já está errado.
O bug está entre essa fronteira e a anterior. Sem isso, é comum "consertar" a
UI quando o número já saiu errado do `data.js`.

Foi assim que apareceu o caso dos overrides: a geometria estava certa no
`engine.js` e errada no desenho — o `computeScarf` simplesmente não lia os
campos de override. Nenhum ajuste na UI teria resolvido.

## Fase 3 — Uma hipótese por vez

Escreva a hipótese antes de testar: *"o `calcQty` divide por largura de rolo
errada"*. Mude **uma** coisa. Se não resolveu, desfaça antes da próxima.
Manter três mudanças especulativas empilhadas é como se perde o rastro.

## Fase 4 — Teste primeiro, depois a correção

Escreva (ou ajuste) o teste que falha pelo motivo certo, veja falhar, aí
corrija. Ver o vermelho antes importa: um teste que já passa não estava
testando o bug.

Depois rode `npm test` inteiro — a correção pode ter mexido em outro lugar
(ver `skill:verificar-antes-de-concluir`).

## A regra das três tentativas

**Se três correções não pegaram, pare de tentar a quarta.** Três falhas
seguidas quase nunca significam "quase lá" — significam que a premissa está
errada. O bug provavelmente não está onde você procura.

Ao bater nas três, faça o seguinte em vez de tentar de novo:

- Diga em voz alta o que você **acreditava** e o que a evidência mostra.
- Volte à Fase 2 e instrumente uma camada acima da que você vinha mexendo.
- Considere que o comportamento "errado" talvez esteja certo e a expectativa
  é que está errada — acontece quando a norma ou a lista de material mudou.
- Traga o usuário: ele conhece o processo de reparo e às vezes a resposta é
  de campo, não de código.

Quando o usuário disser "para de chutar", "ultra-think isso" ou "continua
errado", ele está te dizendo que você já passou das três. Volte à Fase 1.

## Não invente dado

Se a causa raiz for um dado que você não tem — gramatura, número de item,
tamanho de rolo — **não estime**. O projeto tem política de zero-mock: dado
sem fonte fica pendente e documentado (ver `PENDING_REV06.md`), nunca
preenchido com um valor plausível. Um número inventado que passa no teste é
pior que um teste vermelho.

## Sinais de alerta

| Se você pensar… | A realidade é |
|---|---|
| "Vou só tentar isso e ver" | Isso é palpite. Escreva a hipótese primeiro |
| "Deve ser problema de cache/ambiente" | Raramente é. Prove antes de culpar |
| "Vou tratar esse caso específico" | Remendo no sintoma; a causa continua lá |
| "Mudo essas três coisas juntas" | Se funcionar, você não sabe qual resolveu |
| "O teste está errado" | Talvez — mas prove com a fonte antes de editá-lo |
