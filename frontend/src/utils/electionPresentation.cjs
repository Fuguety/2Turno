const axisIdentifiers = ['coordenacao', 'protecao_social', 'tributacao', 'provisao_publica', 'trabalho', 'direitos_sociais', 'laicidade', 'armas', 'justica_penal', 'ambiente', 'diplomacia_eleitoral', 'contrapesos'];

const familyLabels =
{
    left: ['Esquerda', 'Left', '#923448', '#f8e9ee'],
    'centre-left': ['Centro-esquerda', 'Centre-left', '#376146', '#eaf1e8'],
    centre: ['Centro', 'Centre', '#555b61', '#eef0f2'],
    'centre-right': ['Centro-direita', 'Centre-right', '#216172', '#e8f3f5'],
    right: ['Direita', 'Right', '#304e91', '#eaf0fc'],
    unavailable: ['Perfil incompleto', 'Incomplete profile', '#53615b', '#eef1ee']
};

const subtypeLabels =
{
    'social-democracy': ['Social-democracia', 'Social democracy'],
    developmentalism: ['Desenvolvimentismo', 'Developmentalism'],
    'social-liberalism': ['Liberalismo social', 'Social liberalism'],
    'liberal-conservatism': ['Conservadorismo liberal', 'Liberal conservatism'],
    'economic-liberalism': ['Liberalismo econômico', 'Economic liberalism'],
    'social-conservatism': ['Conservadorismo social', 'Social conservatism'],
    'progressive-centrism': ['Centrismo progressista', 'Progressive centrism'],
    'conservative-centrism': ['Centrismo conservador', 'Conservative centrism'],
    'balanced-centrism': ['Centrismo equilibrado', 'Balanced centrism'],
    'mixed-profile': ['Perfil misto', 'Mixed profile'],
    unavailable: ['Classificação indisponível', 'Classification unavailable']
};

const explanations =
{
    coordenacao: ['uma política industrial mais ativa', 'maior coordenação econômica pelo mercado', 'more active industrial policy', 'more market-led economic coordination'],
    protecao_social: ['a ampliação da proteção social', 'maior contenção dos gastos sociais', 'expanded social protection', 'greater restraint in social spending'],
    tributacao: ['maior progressividade dos impostos', 'a redução geral de impostos', 'more progressive taxation', 'broad tax reductions'],
    provisao_publica: ['a provisão e o controle públicos', 'a provisão privada e as concessões', 'public provision and ownership', 'private provision and concessions'],
    trabalho: ['proteções trabalhistas definidas em lei', 'maior flexibilidade negociada nas relações de trabalho', 'statutory labour protections', 'greater negotiated flexibility in labour relations'],
    direitos_sociais: ['a ampliação de direitos sociais', 'a preservação de normas sociais tradicionais', 'expanded social rights', 'the preservation of traditional social norms'],
    laicidade: ['decisões públicas laicas', 'mais referências religiosas nas decisões políticas', 'secular public decisions', 'more religious references in political decisions'],
    armas: ['restrições ao acesso civil a armas', 'a ampliação do acesso civil a armas', 'restrictions on civilian access to firearms', 'expanded civilian access to firearms'],
    justica_penal: ['a reintegração e as garantias processuais', 'penas e encarceramento mais amplos', 'reintegration and procedural safeguards', 'expanded sentences and incarceration'],
    ambiente: ['maior prioridade à proteção ambiental', 'maior flexibilidade no uso de recursos naturais', 'greater priority for environmental protection', 'more flexibility in natural resource use'],
    diplomacia_eleitoral: ['a cooperação multilateral', 'maior autonomia e acordos bilaterais', 'multilateral cooperation', 'greater autonomy and bilateral agreements'],
    contrapesos: ['um controle judicial mais amplo', 'maior margem de decisão dos Poderes eleitos', 'broader judicial oversight', 'greater discretion for elected branches']
};



function escapeHtml(value)
{
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
}



function percentagePair(score)
{
    if (typeof score !== 'number' || !Number.isFinite(score) || score < 0 || score > 100) return null;
    const left = Math.round(score * 10) / 10;
    return { left, right: Math.round((100 - left) * 10) / 10, displayLeft: Math.round(left), displayRight: 100 - Math.round(left), position: 100 - left };
}



function classifyProfile(scores)
{
    if (!axisIdentifiers.every(identifier => percentagePair(scores?.[identifier]))) return { family: 'unavailable', subtype: 'unavailable', index: null, traits: [] };
    const publicEconomy = axisIdentifiers.slice(0, 5).reduce((sum, identifier) => sum + scores[identifier], 0) / 5;
    const progressive = (scores.direitos_sociais + scores.laicidade) / 2;
    const index = 100 - (.65 * publicEconomy + .25 * progressive + .10 * scores.ambiente);
    const family = index <= 30 ? 'left' : index < 43 ? 'centre-left' : index <= 57 ? 'centre' : index < 70 ? 'centre-right' : 'right';
    let subtype = 'mixed-profile';
    if (publicEconomy >= 62 && progressive >= 62) subtype = 'social-democracy';
    else if (publicEconomy >= 62 && scores.direitos_sociais <= 38) subtype = 'social-conservatism';
    else if (publicEconomy >= 62) subtype = 'developmentalism';
    else if (publicEconomy <= 38 && scores.direitos_sociais <= 38) subtype = 'liberal-conservatism';
    else if (publicEconomy <= 38) subtype = 'economic-liberalism';
    else if (publicEconomy >= 42 && publicEconomy <= 62 && progressive >= 62 && scores.justica_penal >= 58) subtype = 'social-liberalism';
    else if (family === 'centre' && progressive >= 62) subtype = 'progressive-centrism';
    else if (family === 'centre' && progressive <= 38) subtype = 'conservative-centrism';
    else if (family === 'centre' && Math.abs(publicEconomy - 50) <= 8 && Math.abs(progressive - 50) <= 8) subtype = 'balanced-centrism';
    const traits = ['armas', 'justica_penal', 'diplomacia_eleitoral', 'contrapesos'].filter(identifier => Math.abs(scores[identifier] - 50) >= 12)
        .map(identifier => ({ axisId: identifier, side: scores[identifier] >= 62 ? 'left' : 'right' }));
    return { family, subtype, index: Math.round(index * 10) / 10, traits };
}



function classificationLabels(scores, language = 'pt')
{
    const classification = classifyProfile(scores);
    const column = language === 'en' ? 1 : 0;
    const family = familyLabels[classification.family];
    return { ...classification, familyLabel: family[column], subtypeLabel: subtypeLabels[classification.subtype][column], color: family[2], background: family[3] };
}



function ideologyHeaderMarkup(scores, language = 'pt')
{
    const classification = classificationLabels(scores, language);
    const note = language === 'en'
        ? 'Calculated from the twelve-axis profile. A descriptive estimate, not a party label.'
        : 'Calculado a partir do perfil nos doze eixos. Uma estimativa descritiva, não uma filiação partidária.';
    return `<header class="ideology-header" data-family="${classification.family}" data-subtype="${classification.subtype}" style="--ideology-color:${classification.color};--ideology-background:${classification.background}">
<p class="ideology-family">${classification.familyLabel}</p><h2>${classification.subtypeLabel}</h2><p class="profile-note">${note}</p></header>`;
}



function axisExplanation(axisIdentifier, score, language = 'pt')
{
    const pair = percentagePair(score);
    if (!pair || !explanations[axisIdentifier]) return language === 'en' ? 'No score is available for this axis.' : 'Não há pontuação disponível para este eixo.';
    if (Math.abs(pair.left - 50) < 8) return language === 'en'
        ? 'Your answers balance the two poles, without a clear preference on this axis.'
        : 'Suas respostas equilibram os dois polos, sem uma preferência clara neste eixo.';
    const preference = explanations[axisIdentifier][(language === 'en' ? 2 : 0) + (pair.left >= 50 ? 0 : 1)];
    const strong = Math.abs(pair.left - 50) >= 25;
    return language === 'en' ? `Your answers indicate ${strong ? 'a strong' : 'a moderate'} preference for ${preference}.`
        : `Suas respostas indicam uma preferência ${strong ? 'forte' : 'moderada'} por ${preference}.`;
}



function axisBarMarkup(axis, score, language = 'pt')
{
    const pair = percentagePair(score);
    if (!pair) return `<p class="profile-note">${language === 'en' ? 'Score unavailable' : 'Pontuação indisponível'}</p>`;
    const leftPole = escapeHtml(axis.leftPole);
    const rightPole = escapeHtml(axis.rightPole);
    const accessible = escapeHtml(`${axis.label}: ${axis.leftPole} ${pair.left}%, ${axis.rightPole} ${pair.right}%`);
    return `<div class="axis-bar">
<div class="axis-pole-labels"><span class="${pair.left >= 58 ? 'is-dominant' : ''}">${leftPole} <b>${pair.displayLeft}%</b></span><span class="${pair.right >= 58 ? 'is-dominant' : ''}">${rightPole} <b>${pair.displayRight}%</b></span></div>
<div class="profile-axis-track" role="img" aria-label="${accessible}"><span class="profile-axis-centre"></span><span class="profile-axis-marker" style="left:${pair.position}%"></span></div>
<details class="axis-exact"><summary>${language === 'en' ? 'Exact percentages' : 'Percentuais exatos'}</summary><p>${leftPole}: ${pair.left.toFixed(1)}% · ${rightPole}: ${pair.right.toFixed(1)}%</p></details></div>`;
}



function axisProfileMarkup(axes, scores, language = 'pt', explainUser = false)
{
    return `<div class="axis-profile">${axes.map(axis => `<article class="profile-axis" data-axis="${escapeHtml(axis.id)}">
<h3>${escapeHtml(axis.label)}</h3>${axisBarMarkup(axis, scores?.[axis.id], language)}
${explainUser ? `<p class="axis-explanation">${escapeHtml(axisExplanation(axis.id, scores?.[axis.id], language))}</p>` : ''}</article>`).join('')}</div>`;
}



function comparisonAxisMarkup(axis, markers, language = 'pt')
{
    const valid = markers.flatMap(marker =>
    {
        const pair = percentagePair(marker.score);
        return pair ? [{ ...marker, pair }] : [];
    });
    const accessible = escapeHtml(valid.map(marker => `${marker.name}: ${axis.leftPole} ${marker.pair.left}%, ${axis.rightPole} ${marker.pair.right}%`).join('; '));
    const pins = valid.map((marker, index) => `<span class="comparison-marker marker-${index}" style="left:${marker.pair.position}%;top:${index * 32}px${/^#[0-9a-f]{6}$/i.test(marker.color || '') ? `;background:${marker.color};box-shadow:0 0 0 1px ${marker.color}` : ''}" aria-hidden="true"><b>${escapeHtml(marker.symbol)}</b></span>`).join('');
    const values = markers.map(marker =>
    {
        const pair = percentagePair(marker.score);
        return `<li><b>${escapeHtml(marker.symbol)} · ${escapeHtml(marker.name)}</b>: ${pair ? `${pair.left.toFixed(1)}% / ${pair.right.toFixed(1)}%` : (language === 'en' ? 'Unavailable' : 'Indisponível')}</li>`;
    }).join('');
    return `<article class="comparison-axis" data-axis="${escapeHtml(axis.id)}"><h3>${escapeHtml(axis.label)}</h3>
<div class="axis-pole-labels"><span>${escapeHtml(axis.leftPole)}</span><span>${escapeHtml(axis.rightPole)}</span></div>
<div class="comparison-track" role="img" aria-label="${accessible}"><span class="comparison-centre"></span>${pins}</div>
<ul class="comparison-values">${values}</ul></article>`;
}



function runningMateMarkup(runningMate, language = 'pt')
{
    const title = language === 'en' ? 'Vice President / running mate' : 'Vice-presidente / candidato a vice';
    if (!runningMate || runningMate.status !== 'confirmed' || !runningMate.name)
        return `<section class="running-mate"><h2>${title}</h2><p>${language === 'en' ? 'Running mate not confirmed' : 'Candidato a vice não confirmado'}</p></section>`;
    return `<section class="running-mate"><h2>${title}</h2><div class="running-mate-identity"><span class="portrait-fallback" role="img" aria-label="${language === 'en' ? 'Portrait unavailable' : 'Retrato indisponível'}">${escapeHtml(runningMate.name.charAt(0))}</span><div><h3>${escapeHtml(runningMate.name)}</h3><p>${escapeHtml(runningMate.party || '')}</p></div></div>
<p>${escapeHtml(runningMate.description?.[language] || (language === 'en' ? 'Biography unavailable' : 'Biografia indisponível'))}</p>${runningMate.sourceUrl ? `<a href="${escapeHtml(runningMate.sourceUrl)}" rel="noopener noreferrer" target="_blank">${language === 'en' ? 'Source: TSE' : 'Fonte: TSE'}</a>` : ''}</section>`;
}

module.exports = { axisIdentifiers, familyLabels, subtypeLabels, escapeHtml, percentagePair, classifyProfile, classificationLabels, ideologyHeaderMarkup, axisExplanation, axisBarMarkup, axisProfileMarkup, comparisonAxisMarkup, runningMateMarkup };
