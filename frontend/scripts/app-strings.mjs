// Textos do app reaproveitados pelas páginas estáticas, lidos direto de
// src/i18n/index.ts (explicação de cada eixo, usada no helper "?" das barras),
// para não manter uma cópia própria.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Normaliza CRLF: num checkout no Windows o arquivo vem com \r\n e os marcadores abaixo não casariam.
const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../src/i18n/index.ts'), 'utf8').replace(/\r\n/g, '\n');

// O arquivo declara o dicionário PT e depois o EN; cada um tem um bloco
// `axisExplanations: { ... }` com entradas `id: 'texto'`.
function explanationBlocks() {
  const blocks = [];
  const marker = 'axisExplanations: {\n';
  let from = 0;
  for (;;) {
    const start = source.indexOf(marker, from);
    if (start === -1) break;
    const end = source.indexOf('\n  },', start);
    const body = source.slice(start + marker.length, end);
    const entries = {};
    for (const m of body.matchAll(/(\w+):\s*'((?:[^'\\]|\\.)*)'/g)) entries[m[1]] = m[2].replace(/\\'/g, "'");
    blocks.push(entries);
    from = end;
  }
  if (blocks.length < 2) throw new Error(`app-strings: esperava pelo menos 2 blocos axisExplanations, achei ${blocks.length}`);
  return blocks;
}

const [pt, en] = explanationBlocks();
export const AXIS_EXPLANATIONS = { pt, en };
