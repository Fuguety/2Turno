const { readFileSync } = require('node:fs');
const { resolve, join } = require('node:path');

const dataDirectory = resolve(__dirname, '../../backend/src/main/resources/data');
const site = require('../src/site.json');
const candidateIds = new Set(site.candidates.map(candidate => candidate.id));

function readJson(filename)
{
  return JSON.parse(readFileSync(join(dataDirectory, filename), 'utf8'));
}



// Os dois candidatos do 2º turno, com textos do catálogo geral no idioma pedido e a configuração do site.
function candidateProfiles(language = 'pt')
{
  const profiles = new Map(readJson('personalities.json').map(person => [person.id, person]));
  const translations = new Map(language === 'en'
    ? readJson('i18n/en/personalities.json').map(person => [person.id, person]) : []);
  return site.candidates.map(candidate =>
  {
    const person = profiles.get(candidate.id);
    if (!person) throw new Error(`Missing candidate profile: ${candidate.id}`);
    return { ...person, ...translations.get(candidate.id), ...candidate };
  });
}



function electionScores(candidate, model)
{
  const agreement = { STRONGLY_AGREE: 1, AGREE: .75, NEUTRAL: .5, DISAGREE: .25, STRONGLY_DISAGREE: 0 };
  return Object.fromEntries(model.axes.map(axis =>
  {
    const questions = model.questions.filter(question => question.axisId === axis.id);
    const total = questions.reduce((sum, question) =>
    {
      const answer = agreement[candidate.answers[question.id]];
      return sum + (question.agreePole === 'LEFT' ? answer : 1 - answer);
    }, 0);
    return [axis.id, Math.round(1000 * total / questions.length) / 10];
  }));
}

module.exports = { site, candidateIds, readJson, candidateProfiles, electionScores };
