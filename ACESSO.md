# Como acessar a Calculadora (PC e celular)

A calculadora roda como um site. O mesmo endereço serve as duas versões — dá pra usar no computador **e** no celular.

## Endereços

| Versão | Endereço | Para quê |
|--------|----------|----------|
| **Desktop** (PC) | `<URL>/` | Planejamento completo: tabela de LAYUP, override de geometria, referências de desenho |
| **Mobile** (celular) | `<URL>/m` | Uso em campo: telas grandes de toque, escalonamento, exportar PDF/Excel |

- No PC, no topo tem o botão **📱 Mobile** pra abrir a versão de celular.
- No celular, no topo tem o botão **🖥️ Desktop** pra voltar pra versão de PC.
- As duas versões calculam **exatamente o mesmo** (mesmo `engine.js`).

## Duas formas de rodar

### 1. Na nuvem (Render) — recomendado pra compartilhar
O projeto já tem `render.yaml`. Ao publicar no [Render](https://render.com):
- O serviço sobe em uma URL pública (ex.: `https://brmp-calculadora.onrender.com`).
- Fica protegido por **usuário e senha** (HTTP Basic Auth):
  - Usuário: `vestas` (definido em `APP_USERNAME`).
  - Senha: definida no painel do Render em **Environment → `APP_PASSWORD`** (não fica no git).
- Passe a URL + usuário/senha pro colega. Ele abre no PC (`/`) ou no celular (`/m`).

> No plano grátis do Render o serviço "dorme" após inatividade e demora alguns segundos pra acordar no primeiro acesso — normal.

### 2. Local (Windows) — sem internet
Rode o `INICIAR_CALCULADORA.bat`. Ele instala as dependências, sobe o servidor e abre `http://localhost:8010`. Nesse modo, o celular só acessa se estiver na **mesma rede** e usando o IP do PC (ex.: `http://192.168.0.10:8010/m`).

## Modo debug (só pra manutenção)
Abra a versão desktop com `?debug=1` no fim da URL (ex.: `<URL>/?debug=1`) e, no console do navegador, rode `runBOMTests()` para checar os cálculos contra a referência REV05. Em uso normal os testes **não** carregam.
