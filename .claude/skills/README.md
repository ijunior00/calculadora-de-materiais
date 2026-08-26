# Skills do projeto

Skills locais que o Claude Code carrega automaticamente ao trabalhar neste
repositório. Cada uma dispara pela `description` do seu frontmatter quando a
tarefa se encaixa.

| Skill | Quando dispara |
|---|---|
| `verificar-antes-de-concluir` | Antes de afirmar que algo está pronto/funcionando; antes de PR ou merge |
| `depuracao-sistematica` | Teste falhou, número saiu errado, ou a 2ª/3ª tentativa de corrigir não pegou |
| `alterar-catalogo-bom` | Trocar item/SAP, mudar unidade, ajustar fórmula, adicionar modelo de pá |

Validação: `npm run lint:skills` (roda no CI).

## Crédito

O **método** destas skills é adaptado do
[obra/superpowers](https://github.com/obra/superpowers) (v6.3.0), de Jesse
Vincent — licença MIT. As ideias aproveitadas: exigir evidência de execução
antes de declarar conclusão, achar causa raiz antes de corrigir, parar depois
de três tentativas falhas, e a tabela de "sinais de alerta" que confronta o
raciocínio que leva a pular processo.

Nenhum código foi copiado. Os textos foram reescritos para este projeto
(cálculo de BOM de reparo de pás) e para português.

```
MIT License — Copyright (c) 2025 Jesse Vincent
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## O que fizemos diferente do original

A revisão do `obra/superpowers` apontou quatro fraquezas. Cada uma foi tratada
aqui:

| Fraqueza lá | Como resolvemos |
|---|---|
| **Sem CI** — a suíte existe mas não roda em PR | `.github/workflows/ci.yml` roda testes, linter e sintaxe do backend em todo push e PR |
| **`npm test` quebrado na raiz** (o README manda rodar, mas não existe script) | `npm test` funciona e roda os 120 testes em ~1s; `npm run check` roda tudo |
| **Sem validação de frontmatter** — skill mal formada nunca dispara, em silêncio | `scripts/lint-skills.mjs` valida frontmatter, nome vs diretório, tamanho e **referências cruzadas** entre skills |
| **Telemetria opt-out** para o site do autor | Nenhuma telemetria. Nada aqui faz chamada de rede |

Duas diferenças a mais, de estilo:

- **Sem injeção forçada de contexto.** O original injeta um texto em toda
  sessão dizendo "você NÃO tem escolha, é inegociável". Aqui as skills
  disparam pela descrição, como o mecanismo nativo prevê, e explicam *por que*
  cada passo importa em vez de proibir. Modelo que entende o motivo aplica
  melhor em caso que a regra não previu — e você continua livre para dizer
  "pula isso agora".
- **Escopo do projeto, não genérico.** As skills citam os arquivos, comandos e
  armadilhas reais daqui (unidade de rolo vs quilo, `CATALOG MISMATCH`,
  política de zero-mock).
