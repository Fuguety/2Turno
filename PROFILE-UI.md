# Election profile UI

Changes are in the existing Brazilian project at `C:\Users\lucze\UNI\2Turno`.

The home page now has three main cards: questionnaire, Lula (PT · 13), and Flávio Bolsonaro (PL · 22). Desktop uses three columns; mobile stacks the cards. Questionnaire lengths use radio buttons after the questionnaire CTA.

Results include a full user profile with twelve dual-pole bars, complementary percentages, exact values, and deterministic neutral explanations. Candidate cards show existing portraits, compatibility, calculated family/subtype, quick information, and full-profile links. Each comparison axis places the user and both candidates on the same scale, in separate marker lanes to avoid overlapping markers.

Candidate pages remain generated static pages. They use the same CommonJS profile renderer and stylesheet as React results, while preserving evidence, confidence notes, PDF page links, sources, and translated routes. Mobile evidence tables become stacked cards. Missing candidate portraits show an initial; missing or unconfirmed running mates have translated fallbacks.

Running mates are sourced from the [TSE runoff announcement](https://www.tse.jus.br/comunicacao/noticias/2026/Outubro/flavio-bolsonaro-e-lula-vao-disputar-o-2o-turno-para-a-presidencia-da-republica) and [registered tickets](https://www.tse.jus.br/comunicacao/noticias/2026/Setembro/tse-valida-seis-registros-de-candidatura-a-presidencia-da-republica). VP portraits use placeholders because the current published asset set contains only the two presidential portraits.

## Shared implementation

- `frontend/src/utils/electionPresentation.cjs`: classification, translations, explanations, percentages, shared profile/comparison markup, and running-mate fallback.
- `frontend/src/components/election/ProfileComponents.tsx`: IdeologyHeader, AxisBar, AxisProfile, CandidateCard, ProfileCard, portraits, quick information, and comparison.
- `frontend/scripts/generate-election-profiles.cjs`: derives frontend profile data from the established election model before dev, tests, and build.
- `frontend/src/styles/profile.css`: shared responsive styling.

Classification is a descriptive heuristic, independent of the established compatibility scoring. The family index is 100 minus 65% of the average of the five economic axes, 25% of rights/secularism, and 10% of environment. Family boundaries are 30, 43, 57, and 70. Subtypes use economic/social combinations, with balanced and mixed fallbacks. The remaining axes retain their own directional meanings in the twelve-axis overview. This is documented in both methodology pages; candidate names never determine classification or header colors.

Percentage bars retain the existing convention: 100 favours the first pole and 0 the second. Marker position is 100 minus the first-pole score. Rounded display percentages complement to 100; exact one-decimal percentages remain available.

## Validation

- `npm test`: 84 tests passed in 10 files.
- `npm run lint`: passed. ESLint covers the profile-related scripts/components and modified election app/configuration.
- `npm run build`: TypeScript, production bundling, static generation, and Brazilian artifact audit passed (two candidates per language, two presidential portraits).
- `npm run test:browser`: passed against both development and production with the real backend, using Edge. Portuguese and English at 1280px and 390px cover home layout, portraits, quick-info focus trapping/restoration, the 36-question flow, user profile, axis percentages, comparison markers, candidate pages, source anchors, and horizontal overflow. Missing-image fallbacks also passed.
- `git diff --check`: passed.
- `mvn test`: 170 of 171 passed. The unchanged `ScorerBenchmarkTest.scorerKeepsCoreMatchingPropertiesInsideEachCatalog` fails its seeded recovery benchmark: 75.37796976241901 against a minimum of 76.5. No backend source, model, evidence, or score changes were made.

Browser screenshots are under `frontend/node_modules/.cache/election-browser/`. To repeat browser verification, run the backend on port 8080 and the frontend on port 5173, then run `npm run test:browser` from `frontend`. Edge must be installed.

No commit or deployment was performed.
