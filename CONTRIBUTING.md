# Contributing to 12 Axes

Thanks for taking the time to help. Issues and pull requests are both welcome, and small fixes are as useful as new features.

## What you can contribute

- Bug reports, with the steps to reproduce, what you expected, and what happened.
- Corrections to a profile's description, category, or links, ideally with a source.
- Fixes to the Portuguese or English text of the quiz, results, or catalog pages.
- Frontend and backend improvements.
- New ideologies, countries, or personalities, following the audit process below.

Other languages are not planned for now. Browser translation covers them, and every new language would add a full copy of the questions and catalogs to maintain.

For anything larger than a fix, open an issue first so we can agree on the approach before you write the code.

## Setting up

The [README](README.md#running-locally) covers the requirements and how to run the backend and frontend locally.

## Pull request checklist

Keep each pull request to one change. Before asking for a review:

1. After backend or catalog changes, run `mvn test` in `backend/`.
2. After catalog text changes, run `python scripts/check_i18n.py` from the repository root so every entry has its English version.
3. After frontend or translation changes, run `npm ci`, `npm test`, and `npm run build` in `frontend/`. The build also generates the static catalog pages, so it catches broken profile data.
4. In the description, say what changed, how you tested it, and which entries still need a translation, if any.
5. For text changes, check the quiz, the results screen, the share card, and the generated pages in both languages.

CI runs the same checks on every pull request, and `main` only receives changes through reviewed pull requests with passing CI.

## Adding or re-auditing a profile

Profiles are never placed on the axes by hand. Each one answers the 240 questions, and its vector comes from those answers. Read [`profile-audit/NEW_PROFILE.md`](profile-audit/NEW_PROFILE.md) before you start. The `/new_ideology`, `/new_country`, and `/new_personality` skills in `.claude/skills/` run the whole process in [Claude Code](https://claude.com/claude-code).

A profile pull request needs:

- metadata in both `data/*.json` (Portuguese) and `data/i18n/en/*.json` (English), with Brazil-specific references generalized in English;
- the 240 answers archived in `profile-audit/answers/<catalog>/<id>.json`;
- a clean run of `python profile-audit/validate.py <catalog> <id>`;
- a `religions` tag that follows the rule in `NEW_PROFILE.md`;
- for countries and personalities, an image from Wikimedia Commons with its source recorded, compressed with `npm run optimize:images`.

## Commit messages

Use a short subject in the `type(scope): summary` form, for example `feat(country): dagestan` or `fix(frontend): quiz navigation`. This is a convention, and CI does not enforce it.

## License of contributions

12 Axes is not open source. By opening a pull request, you agree that your contribution is covered by the [LICENSE](LICENSE), which lets the author use, change, and publish it as part of the project. Please only submit work you wrote yourself or have the right to share.
