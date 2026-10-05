const filesystem = require('node:fs');
const path = require('node:path');
const { readJson, candidateProfiles, electionScores } = require('./brazil-catalogue.cjs');
const supplements = require('../src/data/candidateSupplement.json');
const model = readJson('elections/brazil-2026.json');
const englishModel = readJson('i18n/en/elections/brazil-2026.json');

const profiles =
{
    axes: { pt: model.axes, en: englishModel.axes },
    candidates: candidateProfiles('pt').map(person =>
    {
        const english = candidateProfiles('en').find(candidate => candidate.id === person.id);
        const candidate = model.candidates.find(candidate => candidate.id === person.id);
        return { id: person.id, name: person.name, party: person.party, number: person.number, portrait: person.portrait,
            description: { pt: person.description, en: english.description }, scores: electionScores(candidate, model),
            runningMate: supplements[person.id] || null };
    })
};

const destination = path.resolve(__dirname, '../src/data/electionProfiles.generated.json');
const content = JSON.stringify(profiles, null, 2) + '\n';
if (!filesystem.existsSync(destination) || filesystem.readFileSync(destination, 'utf8') !== content)
{
    filesystem.writeFileSync(destination, content);
}
