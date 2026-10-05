# Election model validation — 2026-10-05

Political data and source audit: [MODEL-BRAZIL-2026.md](MODEL-BRAZIL-2026.md).

## Results

| Check | Result |
| --- | --- |
| Baseline backend before model changes | 149 tests: 148 passed; one pre-existing ScorerBenchmarkTest failure |
| Full backend after model changes | 166 tests: 165 passed; same benchmark failure and numerical result |
| Election-specific suite on final source | 17 passed, zero failures/errors/skips |
| Existing frontend baseline | 47 passed |
| Frontend including election selection | 50 passed across eight test files |
| Frontend TypeScript, Vite and page generation | Passed; generated 1,858 PT/EN pages |
| Backend production package | Passed, including a final package run with all 17 election tests selected |
| Catalogue locale checker | Passed |
| Election PT/EN structural and score consistency | Passed in startup validation and tests |
| Whitespace checks on modified/new task files | Passed |
| Lint | No lint script or lint plugin is configured; no new lint tool added |

The full backend suite **is not green**. Its existing failure is
`ScorerBenchmarkTest.scorerKeepsCoreMatchingPropertiesInsideEachCatalog`, line 57:
moderate-noise source-profile recovery is **75.37796976241901**, against a minimum of **76.5**.
The identical value failed before any election changes. No catalogue profiles, matching coefficients,
thresholds, or benchmark assertions were altered to mask that failure.

The normal test-inclusive package lifecycle consequently still fails at that existing test.
A separate `-DskipTests package` verifies packaging, and the final
`-Dtest=ElectionComparisonTest package` runs the election suite and successfully packages final sources.
This does not imply the unrelated full-suite failure is resolved.

Frontend tests report existing Vite/plugin esbuild deprecation warnings; these did not prevent tests
or the production build.

## Meaningful coverage

The election tests verify twelve axes, six unique core topics per axis, three agreement statements
for each pole, opposite endpoint scores, neutral scores, every question's five-step monotonicity,
isolation to its assigned axis, bounded single-topic influence, PT/EN invariance, reproducible
candidate vectors, candidate self-matches, and both candidates returned on exact ties.

API tests cover the three served quiz variants, complete short/extended/extreme submissions,
per-axis scores for the user and both candidates, answered-question counts, and rejection of
unknown/repeated/incomplete/unbalanced answers, null answers, stale model identifiers,
general-model coordinates, out-of-range numbers, and non-finite vectors.

Frontend tests pass the actual JSON bank through the existing random core/topic selectors repeatedly
and verify 36/60/72 question totals, equal per-axis coverage, distinct IDs/topics, core/unit weights,
and balanced poles. They do not introduce an alternative selection algorithm.

## Reproducing checks

Use **Java 21** and Maven. The shell's default Java was Java 8; checks used the installed Java 21
runtime and Maven 3.9.11 under ignored `.tools/`. Dependencies were cached in
`.tools/maven-repository`, without changing repository dependencies.

From `backend/`:

```text
mvn --batch-mode --no-transfer-progress test
mvn --batch-mode --no-transfer-progress -Dtest=ElectionComparisonTest package
mvn --batch-mode --no-transfer-progress -DskipTests package
```

From `frontend/`:

```text
npm test -- --reporter=dot
npm run build
```

From the repository root:

```text
python scripts/check_i18n.py
git diff --check -- backend/src/main/java/com/twelveaxes/service/ScoringService.java
```

The checks in this workspace also used `-Dmaven.repo.local=<repository>/.tools/maven-repository`.
Run the project from an allowed frontend origin; the existing origin/CORS enforcement also applies
to the new `/api/elections/brazil-2026` endpoints.

## Existing work preserved

The repository already contained extensive Claude/user changes when this task began. A checksum
snapshot of all **1,718 initially tracked files** was taken before editing. Comparing final contents
shows only `ScoringService.java` changed among those tracked files; its generic scoring formula is
preserved. The existing untracked colinha planning README received an additive integration notice.

General axes/questions, existing candidate catalogue entries, English catalogue overlays, all other
political profiles, match coefficients, and existing tests were left intact. No reset, revert, clean,
discard, or source-file replacement was performed. Build outputs and local tooling are ignored.

## File inventory

There are 14 new implementation/test/data/documentation files and two narrowly edited existing
files (`ScoringService.java` and the planning README).

| File | Change |
| --- | --- |
| [backend/src/main/resources/data/elections/brazil-2026.json](../backend/src/main/resources/data/elections/brazil-2026.json) | New election axes, 72 core questions, two answer-based profiles, uncertainty and 14 sources. |
| [backend/src/main/resources/data/i18n/en/elections/brazil-2026.json](../backend/src/main/resources/data/i18n/en/elections/brazil-2026.json) | English axis/question/title translation; scoring metadata inherited from the base. |
| [backend/src/main/java/com/twelveaxes/controller/ElectionController.java](../backend/src/main/java/com/twelveaxes/controller/ElectionController.java) | Four election model/quiz/results/compare endpoints. |
| [backend/src/main/java/com/twelveaxes/model/ElectionModel.java](../backend/src/main/java/com/twelveaxes/model/ElectionModel.java) | Election model, evidence, sources, translations and quiz wrapper records. |
| [backend/src/main/java/com/twelveaxes/model/ElectionAnswerRequest.java](../backend/src/main/java/com/twelveaxes/model/ElectionAnswerRequest.java) | Validated answer submission with explicit model and variant. |
| [backend/src/main/java/com/twelveaxes/model/ElectionVectorRequest.java](../backend/src/main/java/com/twelveaxes/model/ElectionVectorRequest.java) | Validated vector comparison contract. |
| [backend/src/main/java/com/twelveaxes/model/ElectionComparison.java](../backend/src/main/java/com/twelveaxes/model/ElectionComparison.java) | Per-axis three-way scores, candidate matching, ties and coverage response. |
| [backend/src/main/java/com/twelveaxes/service/ElectionDataService.java](../backend/src/main/java/com/twelveaxes/service/ElectionDataService.java) | Versioned resource loading, structural integrity and localization. |
| [backend/src/main/java/com/twelveaxes/service/ElectionComparisonService.java](../backend/src/main/java/com/twelveaxes/service/ElectionComparisonService.java) | Coverage validation, common scoring and equal-axis distance matching. |
| [backend/src/main/java/com/twelveaxes/service/ScoringService.java](../backend/src/main/java/com/twelveaxes/service/ScoringService.java) | Extracted unchanged answer accumulation and exposed scoring for a versioned bank. |
| [backend/src/test/java/com/twelveaxes/ElectionComparisonTest.java](../backend/src/test/java/com/twelveaxes/ElectionComparisonTest.java) | 17 election scoring, profile, localization and API test cases. |
| [frontend/src/types/election.ts](../frontend/src/types/election.ts) | Frontend request/response contracts for future colinha integration. |
| [frontend/src/utils/electionQuizSelection.test.ts](../frontend/src/utils/electionQuizSelection.test.ts) | Three tests against the real bank and existing frontend selectors. |
| [colinha-eleitoral/README.md](README.md) | Added integration notice to the existing planning document. |
| [colinha-eleitoral/MODEL-BRAZIL-2026.md](MODEL-BRAZIL-2026.md) | Full political model report, source references and all 72 coded question answers. |
| [colinha-eleitoral/VALIDATION-BRAZIL-2026.md](VALIDATION-BRAZIL-2026.md) | Validation results, limitations and this file inventory. |

## Remaining issues and limits

- The pre-existing catalogue benchmark needs a separate investigation.
- The subsequent [Brazil-only implementation](BRAZIL-ONLY.md) connected the frontend to the election
  endpoints and filtered publication. A voting-slip interface remains future work.
- Sixteen Lula and 31 Flávio item positions lack sufficiently specific evidence and are explicitly
  centered. Displaying a centered uncertain score as a confirmed moderate position would be misleading.
- Evidence confidence is editorial, not a statistical interval. Survey-based reliability, scale
  independence, and alternative weighting sensitivity have not been empirically validated.
- The data is a dated snapshot of stated intentions and recorded actions, not a forecast of governing
  outcomes. Re-audit and increment the model version if substantive positions or questions change.
- Old general-model results cannot be converted reliably to these twelve coordinates.
- No other-profile audit, deployment, voting-slip interface, or historical-model routing was added.

