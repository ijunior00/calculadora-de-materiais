#!/usr/bin/env node
// ============================================================
// run-tests.mjs — roda a suíte de BOM (static/test.js) sem navegador.
//
// Por que existe: até então os testes só rodavam se alguém abrisse o app
// com ?debug=1 e digitasse runBOMTests() no console. Isso torna a suíte
// invisível para CI e fácil de esquecer. Aqui ela roda em Node puro, sem
// dependências, e devolve exit code — que é o que o CI precisa.
//
// Uso:  node scripts/run-tests.mjs [--quiet]
// Sai com 0 se tudo passou, 1 se algo falhou ou a suíte não carregou.
// ============================================================
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const QUIET = process.argv.includes('--quiet');

// Ordem importa: data → engine → scarf → test (mesma ordem das tags <script>).
const SOURCES = ['static/data.js', 'static/engine.js', 'static/scarf.js', 'static/test.js'];

// Stubs mínimos de browser. data.js e engine.js são puros; scarf.js só toca
// o DOM dentro de funções que os testes não chamam, então um stub inerte
// basta para o arquivo carregar e expor computeScarf() de verdade.
const noopEl = {
    style: {}, classList: { add() {}, remove() {}, toggle() {} },
    appendChild() {}, remove() {}, click() {}, focus() {},
    innerHTML: '', textContent: '', value: '',
};
const lines = [];
const sandboxConsole = {
    log: (...a) => lines.push(fmt(a)),
    warn: (...a) => lines.push(fmt(a)),
    error: (...a) => lines.push(fmt(a)),
    group: (...a) => lines.push(fmt(a)),
    groupEnd: () => {},
};
function fmt(args) {
    // Descarta os argumentos de estilo do console.log('%c...', 'css') do browser.
    const parts = args.filter((a) => typeof a !== 'string' || !/^(color|font)[:-]/.test(a));
    return parts.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ')
        .replace(/%c/g, '');
}

const sandbox = {
    console: sandboxConsole,
    document: {
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => [],
        createElement: () => ({ ...noopEl }),
        body: { appendChild() {}, removeChild() {} },
    },
    // M é o estado do controller mobile (mobile.js). Os testes de escalonamento
    // preenchem e restauram os campos que usam, então um objeto vazio serve.
    M: { layers: [], length: 0, width: 0, blade: '', region: '', so: '', cir: '', title: '' },
    setTimeout, clearTimeout, JSON, Math, Date, Object, Array, Number, String, Boolean, isNaN, parseFloat, parseInt,
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;

const ctx = vm.createContext(sandbox);
for (const rel of SOURCES) {
    const code = readFileSync(join(ROOT, rel), 'utf8');
    try {
        vm.runInContext(code, ctx, { filename: rel });
    } catch (err) {
        console.error(`\nFalha ao carregar ${rel}:\n  ${err.message}\n`);
        process.exit(1);
    }
}

if (typeof sandbox.runBOMTests !== 'function') {
    console.error('\nrunBOMTests() não foi exposta — static/test.js mudou de forma?\n');
    process.exit(1);
}

const tally = sandbox.runBOMTests();
if (!QUIET) console.log(lines.join('\n'));

const total = tally.pass + tally.fail;
if (tally.fail === 0) {
    console.log(`\n  ✓ ${total} testes passaram\n`);
    process.exit(0);
}
// Em caso de falha, sempre mostra o log — mesmo com --quiet, senão o CI
// reporta "falhou" sem dizer o quê.
if (QUIET) console.log(lines.join('\n'));
console.error(`\n  ✗ ${tally.fail} de ${total} testes FALHARAM\n`);
process.exit(1);
