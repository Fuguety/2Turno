# Brazil-only election experience

> **Superseded on 2026-10-05.** The site is now branded **2 Turno** and publishes only Lula and Flávio Bolsonaro: two candidate pages and a methodology page per language, with portraits under `/fotos/`. The 86-profile catalogue below is no longer published; the backend `/catalog` endpoint and `brazil-catalogue.json` still exist. Old `/personalities` URLs redirect in `frontend/vercel.json`.

Implemented locally on 2026-10-05. The default frontend build is the Brazilian presidential election
edition. The political model, coded candidate answers, axis scores, and matching formula from the
preceding task are unchanged.

## Scope and profile count

The published catalogue contains **86 Brazilian profiles for political comparison**, including **53 profiles categorized
as politicians** and 33 activists, thinkers, economists, writers, and institutional figures. Every
Brazilian politician identified in the current source catalogue is retained, including candidates
categorized as activists rather than politicians. Figures such as Renan Santos, Guilherme Boulos,
Nikolas Ferreira, Augusto Cury, Richard Rasmussen, and party presidential candidates are explicitly included.
All Brazilian profiles are retained: category labels do not reliably distinguish active candidates
from intellectuals, and historical Brazilian figures also remain available for context.

Country scope means affiliation with Brazilian political history and public life, not birthplace.
Brazilian imperial rulers remain relevant Brazilian profiles. A reference to Brazil in a foreign
figure's biography does not qualify that figure; Dom Manuel I, for example, is excluded.

The explicit registry is [brazil-catalogue.json](../backend/src/main/resources/data/elections/brazil-catalogue.json):

- `countryCode: BR`
- `electionId: brazil-2026`
- primary identifiers: `lula-da-silva`, `flavio-bolsonaro`
- 86 reviewed `profileIds`

Production filtering uses this registry, never a language-dependent name/biography heuristic.
Unlisted profiles are excluded by default; new Brazilian profiles need an explicit registry entry.
The same file is consumed by Java, TypeScript, and the CommonJS publication scripts.

All **477 original personality records**, their vectors, English overlays, source files, portraits,
general quiz, and international page-generation tools remain in the repository. No profile or
historical/source dataset was deleted. Filtering does not modify stored scores.

## Where the filter is enforced

| Surface | Enforcement |
| --- | --- |
| Catalogue API | `BrazilCatalogueService` selects registry IDs before sorting or searching |
| Search API | Searches only filtered names/roles, accent-insensitively, in PT or EN |
| Direct profile API | Out-of-scope IDs return HTTP 404 before any profile is returned |
| Browser catalogue/search | Registry and BR code checked again; primary flags derive from the registry |
| Election results | Existing election endpoints return only calibrated Lula/Flávio profiles; client also rejects foreign candidate IDs |
| Per-axis results/ties | Client validates candidate keys and closest-candidate identifiers |
| Comparisons | Primary profiles use the existing election axes; other Brazilian profiles retain explicitly labeled original axes |
| Recommendations | Election results show only the two eligible candidates; global book/country/personality recommendation components are not mounted |
| Home examples | The international `EXAMPLE_RESULTS` fixtures and original general App are not imported into the election entry point |
| Static catalogues/profiles | The new generator emits only registry profiles in both languages |
| Static related profiles | Only Brazilian runoff candidates are linked; no global matching/recommendation generator is called |
| Portraits | Vite public-directory copying is disabled; publication copies only the 86 allowed portraits plus four brand/icon assets |
| Local development | Static profile routes and public-asset middleware apply the same scope and reject foreign URLs |
| Deployment routing | The broad SPA rewrite was removed; nonexistent foreign pages/assets receive normal hosting 404s |
| Publication audit | Every build checks profile pages, portraits, outgoing catalogue links, bundles, sitemap, and representative international fixtures |

The catalogue index includes a search form that opens the same filtered interactive search on the
election homepage. No international autocomplete endpoint is used.

## Primary candidates and model compatibility

Lula and Flávio are featured above the quiz controls, occupy the first two catalogue positions, and
appear as the related candidates on Brazilian profile pages. Both languages preserve this ordering.
Results rank them by the existing mean absolute distance, rather than forcing the catalogue order.

The quiz consumes `/api/elections/brazil-2026/quiz` and submits to its `/results` endpoint with
`brazil-presidential-2026-v2`. The existing 36/60/72 formats, Brazilian question bank, core/topic
selection, unit weights, and scoring scale are reused. General archetypes and global religion-based
matching are not appended.

The 84 other Brazilian profiles retain their original twelve-axis vectors. They are available for
historical and ideological context, with an explicit notice that they cannot be matched to answers
on the new election dimensions. Scores are not guessed or converted just to include them.

Primary profile pages and the profile API derive Lula/Flávio's election coordinates from the same
coded answer bank. The publication helper applies the existing percentage calculation, with tests
checking all twelve coordinates against the backend suite's expected values.

Portuguese is the default. `/en` and its catalogue/profile pages retain English translations.
Old general-result coordinates and saved general-quiz progress are not interpreted as election
answers. The old general implementation remains reusable internally, without being part of this build.

## API additions

- `GET /api/elections/brazil-2026/catalog?lang=pt&query=flavio`
- `GET /api/elections/brazil-2026/profiles/lula-da-silva?lang=en`

The first returns filtered metadata and primary flags. The second returns a filtered person,
an explicit model identifier, axis descriptions, and coordinates. Foreign identifiers return 404.
No general catalogue service, scorer, political vector, or candidate answer was changed.

## Validation

| Check | Result |
| --- | --- |
| Election + Brazil catalogue backend tests | **22 passed**, including unchanged 17 election tests |
| Full backend regression | **171 run; 170 passed; same pre-existing benchmark failure** |
| Backend package with election/catalogue tests | **Passed** |
| Frontend suite | **55 passed**, nine files |
| TypeScript and production build | **Passed** |
| Static publication | **179 generated routes**, including 86 profiles in each language |
| Artifact audit | **86 profiles per language; 86 portraits; no foreign profile pages/cards/links/fixtures** |
| Locale checker | **Passed** |
| Whitespace and CommonJS syntax checks | **Passed** |
| Lint | No lint script/plugin is configured |
| Real browser, Portuguese | Homepage loaded 86 unique profiles plus two featured cards; no foreign candidates |
| Real browser, complete short quiz | 36 neutral answers produced 12 centered user coordinates and only Lula/Flávio matches |
| Real browser, English | English election homepage and filtered catalogue loaded |
| Visual check | Desktop homepage and mobile results inspected |

The existing catalogue benchmark still reports **75.37796976241901** against a required **76.5**.
This is the same failure recorded before the political-model work and before filtering. No tests,
thresholds, or unrelated profiles were altered to make it pass.

Navigation tests now verify Brazilian catalogues and direct foreign-page/portrait rejection.
Unused dependency prewarming is disabled in their HTTP-only test server, preventing shutdown from
waiting for browser modules that those tests do not request. This does not change the production
frontend's module loading.

The source checksum snapshot confirms that the election JSON, English election questions,
personalities, personality vectors, shared scorer, and election matching service remained
byte-for-byte unchanged during this step. Other existing files were edited only as listed below.
No reset, revert, clean, or source-data discard was performed.

## Reproducing

From `frontend/`:

```text
npm test -- --reporter=dot
npm run build
```

The build runs TypeScript, Vite, the Brazil-only generator, and the artifact audit.
`npm run generate:pages` also runs the audit and will fail rather than silently accept an output
directory containing international pages or portraits. Use the standard build to produce fresh
generated output.

From `backend/`, using Java 21:

```text
mvn -Dtest=ElectionComparisonTest,BrazilCatalogueTest package
mvn test
```

From the root: `python scripts/check_i18n.py`.
Local Maven tooling and logs remain under ignored `.tools/`; no project dependency was added.
The browser check used temporary local servers and a separate hidden browser profile, all stopped
after verification. No deployment was performed.

## Remaining international data and limitations

The original general backend endpoints, archived frontend components, international generator
scripts, fixtures, and source portraits still contain international data. They are deliberately
retained for reuse and are not fetched, linked, mounted, copied, or bundled by the election website.
Deliberately calling a general API or manually running the old generator can still access that data.

Brazilian biographies retain historical context. For example, Renan Santos's source biography
mentions Milei as an influence; this is text about a Brazilian profile, not a foreign profile,
matching candidate, search entry, recommendation, or link. The country filter does not censor
source biographies.

The previously deployed website is unchanged until this new artifact is deployed. The existing
catalogue benchmark, empirical model validation, voting-slip generation, and calibration of any
additional figures onto the election axes remain separate future work.

## Files changed

15 new files and 13 narrowly edited existing files:

- [README.md](../README.md)
- [backend/src/main/java/com/twelveaxes/controller/ElectionController.java](../backend/src/main/java/com/twelveaxes/controller/ElectionController.java)
- [backend/src/main/java/com/twelveaxes/model/BrazilCatalogue.java](../backend/src/main/java/com/twelveaxes/model/BrazilCatalogue.java)
- [backend/src/main/java/com/twelveaxes/service/BrazilCatalogueService.java](../backend/src/main/java/com/twelveaxes/service/BrazilCatalogueService.java)
- [backend/src/main/resources/data/elections/brazil-catalogue.json](../backend/src/main/resources/data/elections/brazil-catalogue.json)
- [backend/src/test/java/com/twelveaxes/BrazilCatalogueTest.java](../backend/src/test/java/com/twelveaxes/BrazilCatalogueTest.java)
- [colinha-eleitoral/BRAZIL-ONLY.md](BRAZIL-ONLY.md)
- [colinha-eleitoral/MODEL-BRAZIL-2026.md](MODEL-BRAZIL-2026.md)
- [colinha-eleitoral/README.md](README.md)
- [colinha-eleitoral/VALIDATION-BRAZIL-2026.md](VALIDATION-BRAZIL-2026.md)
- [frontend/election.html](../frontend/election.html)
- [frontend/package.json](../frontend/package.json)
- [frontend/scripts/brazil-catalogue.cjs](../frontend/scripts/brazil-catalogue.cjs)
- [frontend/scripts/brazil-public.ts](../frontend/scripts/brazil-public.ts)
- [frontend/scripts/catalogue-dev.ts](../frontend/scripts/catalogue-dev.ts)
- [frontend/scripts/check-brazil-build.cjs](../frontend/scripts/check-brazil-build.cjs)
- [frontend/scripts/generate-brazil-pages.cjs](../frontend/scripts/generate-brazil-pages.cjs)
- [frontend/src/ElectionApp.tsx](../frontend/src/ElectionApp.tsx)
- [frontend/src/i18n/index.ts](../frontend/src/i18n/index.ts)
- [frontend/src/main.tsx](../frontend/src/main.tsx)
- [frontend/src/services/electionApi.ts](../frontend/src/services/electionApi.ts)
- [frontend/src/styles/election.css](../frontend/src/styles/election.css)
- [frontend/src/types/election.ts](../frontend/src/types/election.ts)
- [frontend/src/utils/brazilElection.test.ts](../frontend/src/utils/brazilElection.test.ts)
- [frontend/src/utils/brazilElection.ts](../frontend/src/utils/brazilElection.ts)
- [frontend/test/catalogueNavigation.test.ts](../frontend/test/catalogueNavigation.test.ts)
- [frontend/vercel.json](../frontend/vercel.json)
- [frontend/vite.config.ts](../frontend/vite.config.ts)

