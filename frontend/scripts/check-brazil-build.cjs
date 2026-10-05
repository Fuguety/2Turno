const { readdirSync, readFileSync } = require('node:fs');
const { resolve, join, relative } = require('node:path');
const { site, candidateIds } = require('./brazil-catalogue.cjs');

const outputDirectory = resolve(__dirname, '../dist');

function filesWithin(directory)
{
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesWithin(path) : [path];
  });
}



function requireCondition(condition, message)
{
  if (!condition) throw new Error(message);
}



// O build publica só o 2º turno: quiz, uma página por candidato e a metodologia, nos dois idiomas.
function checkBuild()
{
  const paths = filesWithin(outputDirectory).map(file => relative(outputDirectory, file).replaceAll('\\', '/'));
  const allowedPortraits = new Set(site.candidates.map(candidate => candidate.portrait.slice(1)));
  for (const path of paths)
  {
    requireCondition(!/^(?:en\/)?(?:countries|ideologies|personalities)(?:\/|\.html$)/.test(path), `Out-of-scope artifact: ${path}`);
    if (path.startsWith('fotos/')) requireCondition(allowedPortraits.has(path), `Unexpected portrait: ${path}`);
    const candidate = path.match(/^(?:en\/)?candidatos\/([^/]+)\.html$/);
    if (candidate) requireCondition(candidateIds.has(candidate[1]), `Unexpected candidate page: ${path}`);
    if (!/\.(?:html|xml|js)$/.test(path)) continue;
    const content = readFileSync(join(outputDirectory, path), 'utf8');
    for (const match of content.matchAll(/(?:href|src)="(?:\/en)?\/(?:candidatos\/([^/"?#]+)|(?:countries|ideologies|personalities)(?:\/|"))/g))
    {
      requireCondition(match[1] && candidateIds.has(match[1]), `Out-of-scope link in ${path}: ${match[0]}`);
    }
    if (path.endsWith('.html')) requireCondition(!/12 ?Axes/.test(content.replace(/https:\/\/12axes\.vercel\.app/g, '')), `Old 12Axes branding in ${path}`);
    requireCondition(!/EXAMPLE_RESULTS|donald-trump|javier-milei|mao-zedong/.test(content), `International profile fixture in ${path}`);
  }
  for (const language of ['', 'en/'])
  {
    for (const page of [...[...candidateIds].map(identifier => `candidatos/${identifier}.html`), 'election-methodology.html'])
    {
      requireCondition(paths.includes(`${language}${page}`), `Missing page: ${language}${page}`);
    }
  }
  const portraits = paths.filter(path => path.startsWith('fotos/'));
  requireCondition(portraits.length === allowedPortraits.size, 'Missing candidate portraits');
  process.stdout.write(`${site.name} artifact audit passed: ${candidateIds.size} candidates per language, ${portraits.length} portraits.\n`);
}

checkBuild();
