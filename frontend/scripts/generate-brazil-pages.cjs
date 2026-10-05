const { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } = require('node:fs');
const { join, resolve, dirname } = require('node:path');
const { site, readJson, candidateProfiles, electionScores } = require('./brazil-catalogue.cjs');

const presentation = require('../src/utils/electionPresentation.cjs');
const supplements = require('../src/data/candidateSupplement.json');

const frontendDirectory = resolve(__dirname, '..');
const pagesOnly = process.argv.includes('--catalogue-only');
const outputDirectory = join(frontendDirectory, pagesOnly ? 'node_modules/.cache/brazil-pages' : 'dist');
const publicDirectory = join(frontendDirectory, 'public');
const model = readJson('elections/brazil-2026.json');
const englishModel = readJson('i18n/en/elections/brazil-2026.json');
const generatedPaths = [];

const strings = {
  pt: {
    quiz: 'Fazer o quiz', methodology: 'Metodologia', switchLanguage: 'English', runoff: 'Segundo turno · 25 de outubro de 2026',
    plan: 'Plano de governo (PDF)', axis: 'Eixo', position: 'Posição', basis: 'O que sustenta a posição', sources: 'Fontes',
    scale: '100 favorece o primeiro polo do eixo; 0 favorece o segundo; 50 é o centro.',
    uncertain: count => `${count} das 72 respostas não têm evidência específica e foram centradas em 50. Isso não indica uma posição moderada.`,
    confidence: { high: 'evidência alta', medium: 'evidência média', low: 'evidência baixa' },
    other: 'Comparar com', page: 'p.', methodologyTitle: 'Metodologia e fontes',
    methodologyNote: 'As posições dos candidatos são interpretações editoriais dos planos de governo protocolados no TSE e de atos públicos, como projetos de lei e decretos. Cada um dos 12 eixos tem o mesmo peso, e a compatibilidade é 100 menos a distância média entre as suas respostas e as do candidato. Quando não há evidência específica, a resposta do candidato fica no centro, o que não comprova uma posição moderada.',
    evidenceDate: 'Evidências consultadas até', allSources: 'Lista de fontes'
  },
  en: {
    quiz: 'Take the quiz', methodology: 'Methodology', switchLanguage: 'Português', runoff: 'Runoff · 25 October 2026',
    plan: 'Government programme (PDF, Portuguese)', axis: 'Axis', position: 'Position', basis: 'What supports the position', sources: 'Sources',
    scale: '100 favours the first pole of the axis; 0 favours the second; 50 is the centre.',
    uncertain: count => `${count} of the 72 answers have no specific evidence and were centred at 50. This does not indicate a moderate position.`,
    confidence: { high: 'strong evidence', medium: 'moderate evidence', low: 'weak evidence' },
    other: 'Compare with', page: 'p.', methodologyTitle: 'Methodology and sources',
    methodologyNote: 'Candidate positions are editorial interpretations of the government programmes filed with the TSE and of public acts such as bills and decrees. Each of the 12 axes has equal weight, and compatibility is 100 minus the mean distance between your answers and the candidate’s. Where there is no specific evidence, the candidate’s answer is centred, which does not establish a moderate position.',
    evidenceDate: 'Evidence reviewed up to', allSources: 'Source list'
  }
};

function escapeHtml(value)
{
  return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}



function writePage(path, title, description, content, language)
{
  const text = strings[language];
  const prefix = language === 'en' ? '/en' : '';
  const translatedPath = language === 'en' ? path.replace(/^\/en/, '') : `/en${path}`;
  const candidateLinks = site.candidates.map(candidate =>
    `<a href="${prefix}/candidatos/${candidate.id}">${escapeHtml(candidate.name)}</a>`).join('');
  const html = `<!doctype html><html lang="${language === 'en' ? 'en' : 'pt-BR'}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} | ${site.name}</title><meta name="description" content="${escapeHtml(description)}">
<meta property="og:site_name" content="${site.name}"><meta property="og:title" content="${escapeHtml(title)} | ${site.name}">
<meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${site.website}${path}">
<link rel="canonical" href="${site.website}${path}"><link rel="icon" href="/favicon.ico"><link rel="stylesheet" href="/election-profile.css">
</head><body><header><a class="brand" href="${prefix || '/'}">${site.name}</a><nav><a href="${prefix || '/'}">${text.quiz}</a>${candidateLinks}
<a href="${prefix}/election-methodology">${text.methodology}</a><a href="${translatedPath}">${text.switchLanguage}</a></nav></header>
<main>${content}</main><footer>${site.name} · ${text.runoff}</footer></body></html>`;
  const destination = join(outputDirectory, `${path.replace(/^\//, '')}.html`);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, html);
  generatedPaths.push(path);
}



// "pp. 47–58, 63–69" → 47; só a primeira página, que é onde o link do PDF abre.
function firstPage(locator)
{
  const match = locator.match(/\bpp?\. (\d+)/);
  return match ? Number(match[1]) : null;
}



function sourceLinks(evidence, person, language)
{
  const text = strings[language];
  return evidence.sourceIds.map(identifier =>
  {
    const source = model.sources.find(entry => entry.id === identifier);
    if (identifier === person.planSourceId)
    {
      const page = firstPage(evidence.locator);
      return `<a href="${person.planUrl}${page ? `#page=${page}` : ''}">${text.plan.replace(/ \(.*/, '')}</a>`;
    }
    return `<a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a>`;
  }).join('<br>');
}



function writeCandidate(person, others, language)
{
  const text = strings[language];
  const prefix = language === 'en' ? '/en' : '';
  const candidate = model.candidates.find(profile => profile.id === person.id);
  const axes = language === 'en' ? englishModel.axes : model.axes;
  const scores = electionScores(candidate, model);
  const classification = presentation.classificationLabels(scores, language);
  const rows = axes.map(axis =>
  {
    const evidence = candidate.evidence[axis.id];
    const score = scores[axis.id];
    return `<tr><th scope="row">${escapeHtml(axis.label)}<small>${escapeHtml(axis.leftPole)} ↔ ${escapeHtml(axis.rightPole)}</small></th>
<td data-label="${text.position}">${presentation.axisBarMarkup(axis, score, language)}</td>
<td data-label="${text.basis}">${escapeHtml(language === 'en' ? evidence.summaryEnglish : evidence.summary)}<small>${text.confidence[evidence.confidence]} · ${escapeHtml(evidence.locator)}</small></td>
<td data-label="${text.sources}">${sourceLinks(evidence, person, language)}</td></tr>`;
  }).join('');
  const comparison = others.map(other => `<a href="${prefix}/candidatos/${other.id}">${escapeHtml(other.name)} (${other.party} · ${other.number})</a>`).join(' ');
  const description = `${person.name} (${person.party} · ${person.number}): ${language === 'en' ? 'positions on the 12 runoff axes, with sources' : 'posições nos 12 eixos do 2º turno, com fontes'}`;
  writePage(`${prefix}/candidatos/${person.id}`, `${person.name} · ${person.party} ${person.number}`, description, `<div class="intro candidate-page-header" style="--ideology-color:${classification.color};--ideology-background:${classification.background}">
<div><img class="portrait" src="${person.portrait}" alt="${escapeHtml(person.name)}" width="160" height="160" onerror="this.hidden=true;this.nextElementSibling.hidden=false">
<span class="portrait-fallback static-portrait-fallback" hidden role="img" aria-label="${language === 'en' ? 'Portrait unavailable' : 'Retrato indisponível'}: ${escapeHtml(person.name)}">${escapeHtml(person.name.charAt(0))}</span></div>
<div><h1>${escapeHtml(person.name)}</h1><p class="ballot">${person.party} · ${person.number}</p><p>${escapeHtml(person.description)}</p>
<p><a href="${person.planUrl}">${text.plan}</a></p>${presentation.ideologyHeaderMarkup(scores, language)}</div></div>
<p>${text.scale}</p><p>${text.uncertain(candidate.uncertainQuestionIds.length)}</p>
<section aria-labelledby="candidate-axes-title"><h2 id="candidate-axes-title">${language === 'en' ? 'Profile across the 12 axes' : 'Perfil nos 12 eixos'}</h2>
${presentation.axisProfileMarkup(axes, scores, language)}</section>
<h2>${language === 'en' ? 'Evidence and sources' : 'Evidências e fontes'}</h2>
<div class="table"><table><thead><tr><th>${text.axis}</th><th>${text.position}</th><th>${text.basis}</th><th>${text.sources}</th></tr></thead>
<tbody>${rows}</tbody></table></div>
${presentation.runningMateMarkup(supplements[person.id], language)}
<p>${text.other} ${comparison} · <a href="${prefix || '/'}">${text.quiz}</a></p>`, language);
}



function writeMethodology(language)
{
  const text = strings[language];
  const prefix = language === 'en' ? '/en' : '';
  const candidates = candidateProfiles(language).map(person =>
  {
    const candidate = model.candidates.find(profile => profile.id === person.id);
    return `<li><a href="${prefix}/candidatos/${person.id}">${escapeHtml(person.name)}</a>: ${text.uncertain(candidate.uncertainQuestionIds.length)}</li>`;
  }).join('');
  const sources = model.sources.map(source => `<li id="${source.id}"><a href="${escapeHtml(source.url)}">${escapeHtml(source.title)}</a></li>`).join('');
  writePage(`${prefix}/election-methodology`, text.methodologyTitle, text.methodologyNote, `<h1>${text.methodologyTitle}</h1>
<p>${text.methodologyNote}</p><p>${text.scale}</p><ul>${candidates}</ul>
<h2>${language === 'en' ? 'Calculated ideological labels' : 'Rótulos ideológicos calculados'}</h2>
<p>${language === 'en'
    ? 'These descriptive labels are a transparent heuristic, separate from the established compatibility calculation. The broad family uses an index of 100 minus a weighted average: 65% for the five economic axes, 25% for social rights and secularism, and 10% for the environment. Index boundaries are 30, 43, 57 and 70, from left to right. The other axes remain visible in the full profile; they are not treated as equivalent left–right signals.'
    : 'Estes rótulos descritivos são uma heurística transparente, separada do cálculo estabelecido de compatibilidade. A família ampla usa um índice de 100 menos uma média ponderada: 65% para os cinco eixos econômicos, 25% para direitos sociais e laicidade e 10% para meio ambiente. Os limites do índice são 30, 43, 57 e 70, da esquerda à direita. Os demais eixos continuam visíveis no perfil completo; não são tratados como sinais equivalentes de esquerda–direita.'}</p>
<p>${language === 'en'
    ? 'Subtypes combine economic and social preferences using 38/62 as directional thresholds, with a narrower central range for balanced centrism. Mixed profiles keep a mixed label. Missing evidence centred at 50 affects the labels too; consult each candidate’s evidence.'
    : 'Os subtipos combinam preferências econômicas e sociais usando 38/62 como limites direcionais, com uma faixa central mais estreita para o centrismo equilibrado. Perfis mistos mantêm esse rótulo. A ausência de evidência centrada em 50 também afeta os rótulos; consulte as evidências de cada candidato.'}</p>
<p>${text.evidenceDate} ${model.asOf}.</p><h2>${text.allSources}</h2><ul>${sources}</ul>`, language);
}



function copyPublicFile(source, destinationPath = source)
{
  if (!/^\/(?:personalities\/portraits\/[a-z0-9-]+\.(?:jpg|jpeg|png|webp)|[a-z0-9-]+\.(?:png|ico))$/.test(source))
  {
    throw new Error(`Invalid public asset path: ${source}`);
  }
  const origin = join(publicDirectory, source.slice(1));
  if (!existsSync(origin)) throw new Error(`Missing asset: ${source}`);
  const destination = join(outputDirectory, destinationPath.slice(1));
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(origin, destination);
}



function generate()
{
  mkdirSync(outputDirectory, { recursive: true });
  const styles = 'body{max-width:1100px;margin:auto;padding:24px 16px;background:#f4f1e8;color:#1a1a18;font:16px/1.6 system-ui}header,nav{display:flex;gap:20px;flex-wrap:wrap;align-items:center}header{justify-content:space-between;margin-bottom:32px}.brand{font-weight:800;font-size:1.3rem;text-decoration:none}a{color:#102e24}small{display:block;color:#5b5a55}.intro{display:flex;gap:24px;align-items:center;flex-wrap:wrap}.ballot{font-weight:700;font-size:1.2rem}img{object-fit:cover;border-radius:50%}.table{overflow:auto}table{border-collapse:collapse;width:100%;background:#fbf9f3}th,td{text-align:left;vertical-align:top;padding:14px;border-bottom:1px solid #e2ddcf}th small{font-weight:normal}.bar{display:block;position:relative;width:100px;height:6px;margin-top:8px;border-radius:3px;background:linear-gradient(90deg,#2f6dc0,#cf5a22)}.bar i{position:absolute;top:-4px;width:4px;height:14px;margin-left:-2px;background:#1a1a18}footer{margin-top:40px;border-top:1px solid #e2ddcf;padding-top:16px}';
  writeFileSync(join(outputDirectory, 'election-profile.css'), styles + readFileSync(join(frontendDirectory, 'src/styles/profile.css'), 'utf8'));
  for (const language of ['pt', 'en'])
  {
    const profiles = candidateProfiles(language);
    profiles.forEach(person => writeCandidate(person, profiles.filter(other => other.id !== person.id), language));
    writeMethodology(language);
  }
  if (!pagesOnly)
  {
    const home = readFileSync(join(outputDirectory, 'election.html'), 'utf8');
    writeFileSync(join(outputDirectory, 'index.html'), home);
    writeFileSync(join(outputDirectory, 'br.html'), home);
    writeFileSync(join(outputDirectory, 'en.html'), home.replace('lang="pt-BR"', 'lang="en"')
      .replaceAll('2 Turno — Lula x Flávio Bolsonaro', '2 Turno — Lula vs. Flávio Bolsonaro')
      .replaceAll('Responda ao quiz e veja, eixo por eixo, se você está mais perto de Lula ou de Flávio Bolsonaro no 2º turno de 2026, com fontes dos planos de governo.',
        'Take the quiz and see, axis by axis, whether you are closer to Lula or Flávio Bolsonaro in Brazil’s 2026 runoff, with sources from their government programmes.')
      .replace(`rel="canonical" href="${site.website}/"`, `rel="canonical" href="${site.website}/en"`)
      .replace('content="pt_BR"', 'content="en"')
      .replace(`content="${site.website}/"`, `content="${site.website}/en"`));
    generatedPaths.push('/', '/en');
    const locations = generatedPaths.map(path => `<url><loc>${site.website}${path}</loc></url>`).join('');
    writeFileSync(join(outputDirectory, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations}</urlset>`);
    writeFileSync(join(outputDirectory, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${site.website}/sitemap.xml\n`);
    site.candidates.forEach(candidate => copyPublicFile(candidate.portraitSource, candidate.portrait));
    ['/favicon.ico', '/favicon-16x16.png', '/favicon-32x32.png'].forEach(path => copyPublicFile(path));
  }
  process.stdout.write(`${site.name} pages: ${generatedPaths.length}.\n`);
}

generate();
