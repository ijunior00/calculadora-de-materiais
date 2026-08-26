#!/usr/bin/env node
// ============================================================
// lint-skills.mjs — valida as skills de .claude/skills/.
//
// Por que existe: o obra/superpowers (de onde tiramos o método) não valida
// nada disso, e o resultado lá são docs citando skills que já não existem.
// Um erro de frontmatter faz a skill simplesmente nunca disparar — falha
// silenciosa, difícil de perceber. Este linter roda no CI.
//
// Uso:  node scripts/lint-skills.mjs
// Sai 0 se tudo válido, 1 se houver erro.
// ============================================================
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS_DIR = join(ROOT, '.claude', 'skills');
const MAX_DESC = 1024;

const errors = [];
const warnings = [];

if (!existsSync(SKILLS_DIR)) {
    console.log('Nenhum diretório .claude/skills — nada a validar.');
    process.exit(0);
}

const dirs = readdirSync(SKILLS_DIR).filter((d) => statSync(join(SKILLS_DIR, d)).isDirectory());
const found = new Map(); // nome da skill -> caminho

for (const dir of dirs) {
    const file = join(SKILLS_DIR, dir, 'SKILL.md');
    const rel = `.claude/skills/${dir}/SKILL.md`;
    if (!existsSync(file)) {
        errors.push(`${dir}/: falta SKILL.md`);
        continue;
    }
    const raw = readFileSync(file, 'utf8');

    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    if (!m) {
        errors.push(`${rel}: sem frontmatter YAML delimitado por ---`);
        continue;
    }
    const [, fm, body] = m;

    const field = (key) => {
        const r = fm.match(new RegExp(`^${key}:[ \\t]*(.+?)[ \\t]*$`, 'm'));
        return r ? r[1].replace(/^["']|["']$/g, '') : null;
    };
    const name = field('name');
    const description = field('description');

    if (!name) errors.push(`${rel}: frontmatter sem campo "name"`);
    else if (name !== dir) errors.push(`${rel}: name "${name}" != diretório "${dir}"`);
    else found.set(name, rel);

    if (!description) {
        errors.push(`${rel}: frontmatter sem campo "description" — sem ela a skill nunca dispara`);
    } else {
        if (description.length > MAX_DESC) errors.push(`${rel}: description tem ${description.length} chars (máx ${MAX_DESC})`);
        if (description.length < 40) warnings.push(`${rel}: description muito curta (${description.length} chars) — pode não disparar`);
        if (!/\b(quando|use|usar)\b/i.test(description)) warnings.push(`${rel}: description não diz QUANDO usar a skill`);
    }

    if (body.trim().length < 200) warnings.push(`${rel}: corpo muito curto (${body.trim().length} chars)`);
    const bodyLines = body.split('\n').length;
    if (bodyLines > 500) warnings.push(`${rel}: ${bodyLines} linhas (>500) — considere mover detalhe para references/`);
}

// Referências cruzadas entre skills devem resolver — o problema exato que
// deixou docs órfãos no superpowers.
for (const dir of dirs) {
    const file = join(SKILLS_DIR, dir, 'SKILL.md');
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, 'utf8');
    for (const ref of raw.matchAll(/`skill:([a-z0-9-]+)`/g)) {
        if (!found.has(ref[1])) errors.push(`.claude/skills/${dir}/SKILL.md: referencia skill inexistente "${ref[1]}"`);
    }
    // Arquivos citados como references/... precisam existir
    for (const ref of raw.matchAll(/\((references\/[A-Za-z0-9_.-]+)\)/g)) {
        if (!existsSync(join(SKILLS_DIR, dir, ref[1]))) errors.push(`.claude/skills/${dir}/SKILL.md: arquivo citado não existe: ${ref[1]}`);
    }
}

for (const w of warnings) console.log(`  aviso  ${w}`);
for (const e of errors) console.error(`  ERRO   ${e}`);

if (errors.length) {
    console.error(`\n  ✗ ${errors.length} erro(s) em ${dirs.length} skill(s)\n`);
    process.exit(1);
}
console.log(`\n  ✓ ${dirs.length} skill(s) válida(s)${warnings.length ? ` (${warnings.length} aviso(s))` : ''}\n`);
