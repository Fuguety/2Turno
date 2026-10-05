# Lula–Flávio Bolsonaro election model

Model: `brazil-presidential-2026-v2`. Evidence cutoff: **2026-10-05**. Candidate identifiers remain `lula-da-silva` and `flavio-bolsonaro`; party and ballot numbers are PT/13 and PL/22.

The [TSE runoff announcement](https://www.tse.jus.br/comunicacao/noticias/2026/Outubro/flavio-bolsonaro-e-lula-vao-disputar-o-2o-turno-para-a-presidencia-da-republica) identifies this contest. Candidate answers are editorial interpretations of published positions, not answers personally submitted by the candidates. Numerical scores are derived from those interpretations.

## Architecture and compatibility

The existing project uses Java 21/Spring Boot and TypeScript/React. The general model is defined in `backend/src/main/resources/data/{axes,questions,personalities,ideologies,countries}.json`, with English overlays in `data/i18n/en/`. `QuizDataService` loads these resources; `ScoringService` converts responses into axis percentages; `ProfileMatchScorer` compares the general catalogue. The frontend's `quizSelection.ts` selects core questions with distinct topics and balanced agreement poles.

Replacing the meanings of the original twelve axes would invalidate existing personality/country/ideology vectors, shared results, and Claude's ongoing catalogue work. This implementation therefore adds a versioned Brazilian election bank alongside the general model, reusing its question records, answer scale, scorer, payload, and frontend selection functions. The general quiz, candidate catalogue vectors, and unrelated profiles retain their original meanings.

Election-specific candidate profiles are in `data/elections/brazil-2026.json`; each contains 72 coded answers, explicit uncertain-question identifiers, and evidence for every axis. There is no separately maintained candidate vector: the shared scorer derives it from those answers. English text is in `data/i18n/en/elections/brazil-2026.json`.

An existing general quiz vector cannot be converted by relabeling its coordinates. Election answers or a vector produced with this election model are required. Persist `modelId` with saved results; do not silently substitute this model for the general one.

## Twelve axes and candidate scores

All scores use **0–100**. A larger score favors the **first** pole; 50 is centered. LEFT/RIGHT are storage identifiers for first/second pole, not a claim about the political left or right.

| Axis identifier | First pole ↔ second pole | Lula | Flávio Bolsonaro |
| --- | --- | ---: | ---: |
| `coordenacao` | Política industrial ativa ↔ Coordenação pelo mercado | 75.0 | 29.2 |
| `protecao_social` | Ampliação da proteção social ↔ Contenção de gastos sociais | 66.7 | 45.8 |
| `tributacao` | Maior progressividade ↔ Redução geral de impostos | 79.2 | 29.2 |
| `provisao_publica` | Provisão e controle públicos ↔ Provisão privada e concessões | 62.5 | 16.7 |
| `trabalho` | Proteção definida em lei ↔ Flexibilidade negociada | 79.2 | 20.8 |
| `direitos_sociais` | Ampliação de direitos sociais ↔ Preservação de normas tradicionais | 70.8 | 33.3 |
| `laicidade` | Decisões públicas laicas ↔ Referências religiosas na política | 58.3 | 50.0 |
| `armas` | Acesso civil restrito ↔ Acesso civil ampliado | 83.3 | 16.7 |
| `justica_penal` | Reintegração e garantias processuais ↔ Penas e encarceramento ampliados | 75.0 | 12.5 |
| `ambiente` | Prioridade à proteção ambiental ↔ Flexibilidade para uso de recursos | 58.3 | 20.8 |
| `diplomacia_eleitoral` | Cooperação multilateral ↔ Autonomia e acordos bilaterais | 87.5 | 50.0 |
| `contrapesos` | Controle judicial mais amplo ↔ Maior margem dos Poderes eleitos | 58.3 | 33.3 |

Economic coordination measures production policy; social protection measures benefit coverage and budget tradeoffs; taxation measures who pays and the tax burden; public provision measures service delivery and ownership; labour measures statutory versus negotiated employment rules. These related dimensions ask different policy questions. Secular governance is separated from individual social rights, and firearm access from sentencing and policing. Environmental regulation, international cooperation, and institutional checks complete the twelve dimensions.

Judicial review versus elected branches' discretion is used instead of labeling either candidate democratic or authoritarian. Both sides can support constitutional government. International cooperation versus bilateral discretion is used instead of equating sovereignty with hostility to foreign countries.

Each axis contributes exactly one twelfth of overall distance. Economic issues collectively occupy five axes, an explicit design choice rather than an accidental consequence of more questions. Distinct topics and balanced coverage do not establish statistical independence; respondent studies would be needed for empirical reliability and construct validation.

## Questions and core mechanism

The election bank adds **72 new questions**, six per axis, all `core: true`, with three LEFT and three RIGHT agreement poles, unit weight, and distinct topic identifiers. It does not overwrite the original 240 questions or their audited answers.

Variants use the existing selection contract:

| Variant | Questions per axis | Total | Selection |
| --- | ---: | ---: | --- |
| short | 3 | 36 | Existing core/topic selector; 2/1 agreement-pole balance per axis |
| extended | 5 | 60 | Existing selector; 3/2 balance per axis |
| extreme | 6 | 72 | All questions, reordered by existing balanced selector |

The extended format is the default. There are no general-model archetype questions or religion-based candidate exclusions in this bank. The server rejects unknown or repeated questions, incomplete axis coverage, and a selection whose pole counts differ by more than one. Asking fewer questions increases sampling uncertainty; these lengths are coverage choices, not a validated psychometric reliability claim.

Questions avoid candidate names and present policies such as SUS purchasing, tax compensation, working hours, firearms, licensing, and judicial procedures. Specific references like STF, CLT, and Mercosul are used where the policy needs them.

## Scoring and matching

The existing five answer levels toward agreement are 1, 0.75, 0.5, 0.25, and 0. For a LEFT statement, this is its contribution toward the first pole. For a RIGHT statement, the contribution is `1 - agreement`.

`axisScore = 100 × mean(firstPoleContribution)`

User and candidate scores use the same function and one-decimal precision. Every election question affects exactly one axis. Neutral answers contribute 50; an unmeasured axis is centered only inside the scorer, while the election submission API requires complete axis coverage.

`distance = sum(abs(userScore - candidateScore)) / 12`

`compatibility = 100 - distance`

Election matching is identified as `mean-absolute-distance-v1`. It uses equal axis weights without catalogue percentiles, direction bonuses, or archetype effects. The general catalogue's existing matcher remains unchanged. A complete 0–100 swing in one question changes overall unrounded distance by at most `100 / (12 × questionsPerAxis)`: 2.78 in short, 1.67 in extended, 1.39 in extreme. Display rounding can add a small reporting difference.

Candidate ordering and ties are decided using unrounded distance over the scored coordinates. All equally closest candidates are returned; rounded display scores can coincide even if the unrounded distances differ. Compatibility expresses agreement on this questionnaire, not a probability of voting for a candidate or an endorsement.

## Candidate coding and uncertainty

Directly supported strong policy commitments can receive STRONGLY_AGREE/STRONGLY_DISAGREE. Qualified positions and policy interpretation receive AGREE/DISAGREE. Where a specific current position could not be established, the answer is NEUTRAL and marked uncertain. Opposition to a proposal is not inferred automatically from party affiliation or from Jair Bolsonaro's positions.

Neutral coding for missing evidence is a computational midpoint, **not evidence that the candidate personally holds a centrist position**. Consumers should display uncertainty from the model endpoint alongside scores. Confidence labels describe evidence coverage and are not statistical confidence intervals.

Lula has 12 uncertain answers; Flávio has 22 (v1 had 16 and 31; v2 resolved 4 and 9 of them after a full reading of both programmes, see [PLANOS-2026.md](PLANOS-2026.md)). The largest gaps concern specific social measures, religion in public decisions, bilateral/Mercosul choices, and some judicial procedures. Partial agreement on benefits, private service purchasing, platform-worker autonomy, and resource development is retained; differences are not maximized artificially.

The [PT programme](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/proposta-pt) and [PL programme](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/proposta-pl) are the principal current sources. Programmes state intentions, legislation records government action, and a bill or decree-repeal proposal records its author's position; proposed measures must not be presented as enacted law. A party statement is weaker evidence of the individual candidate's secular policy, and a religious speech does not establish support for religious appointment requirements.

### Important mixed positions

- Social protection is not coded as expansion versus abolition: both profiles retain benefits.
- Service delivery distinguishes public networks from private purchasing within publicly funded services.
- Platform-driver autonomy does not imply rejecting all labour protection.
- Environmental commitments coexist with resource development; oil/gas support is counted in both profiles.
- Cooperation and sovereignty can coexist; evidence on specific Flávio multilateral commitments is limited.
- Institutional reform proposals are scored as legal checks and elected-branch discretion, not assumed intent to end democracy.

## API for colinha-eleitoral

The controller is `/api/elections/brazil-2026`. All endpoints accept `?lang=pt` or `?lang=en`.

- `GET /model`: all axes, questions, candidates' coded answers, uncertainty, evidence, sources, and model date.
- `GET /quiz?variant=extended`: `{modelId, asOf, quiz}`, where `quiz` is the existing QuizPayload contract. It returns the 72-question selection pool; `questionCount` is the number to actually ask.
- `POST /results`: score a completed election quiz and compare both candidates.
- `POST /compare`: compare a complete vector already scored with this model.

Select short/extended questions with `selectAndBalanceQuestions(response.quiz)` and extreme questions with `selectAllQuestionsBalanced(response.quiz)`. Keep the wrapper's `modelId` with the answers.

Example results request shape (the abbreviated answer list must be expanded to a complete balanced selection):

```json
{
  "modelId": "brazil-presidential-2026-v2",
  "variant": "extended",
  "answers": [
    {"questionId": "br2026_coordenacao_1", "answer": "AGREE"}
  ]
}
```

Complete centered vector example:

```json
{
  "modelId": "brazil-presidential-2026-v2",
  "scores": {
    "coordenacao": 50,
    "protecao_social": 50,
    "tributacao": 50,
    "provisao_publica": 50,
    "trabalho": 50,
    "direitos_sociais": 50,
    "laicidade": 50,
    "armas": 50,
    "justica_penal": 50,
    "ambiente": 50,
    "diplomacia_eleitoral": 50,
    "contrapesos": 50
  }
}
```

The comparison response includes each axis's labels and poles, `userScore`, and `candidateScores` keyed by the two existing candidate identifiers; sorted candidate distances/compatibilities with names, parties, and ballot numbers; and `closestCandidateIds`. `answeredQuestionCounts` records measured coverage for quiz submissions and is empty for imported vectors, whose original answer coverage cannot be verified.

Frontend request and response contracts are in `frontend/src/types/election.ts`. The default frontend now consumes these endpoints through a Brazil-only election entry point, with the filtered catalogue and publication pipeline described in [BRAZIL-ONLY.md](BRAZIL-ONLY.md). A voting slip interface and publishing/deployment remain outside this change.

Changes to questions, pole meanings, candidate coding, or matching interpretation should produce a new model identifier before saved results are reused across versions. For now this is a single dated model, with no historical-model routing.

## Evidence locations

Source IDs below resolve to the linked source list. Low confidence and neutral coding are deliberate.

### Luiz Inácio Lula da Silva (Lula)

| Axis | Evidence confidence | Source identifiers | Locator |
| --- | --- | --- | --- |
| `coordenacao` | medium | tse-pt | pp. 47–58, 63–69 |
| `protecao_social` | medium | tse-pt | pp. 18–26, 47–49 |
| `tributacao` | high | ir-2025 | Lei 15.270/2025, arts. 2–3 |
| `provisao_publica` | medium | tse-pt | pp. 30–40, 52–53, 66 |
| `trabalho` | high | tse-pt, apps-2024 | pp. 73–77; PLP 12/2024, art. 3 |
| `direitos_sociais` | medium | tse-pt | pp. 18–26, 75 |
| `laicidade` | low | pt-laicidade | 26/12/2025; política inter-religiosa |
| `armas` | high | armas-decreto, armas-pf | Decreto 11.615/2023; transferência em julho de 2025 |
| `justica_penal` | medium | tse-pt, pena-justa, forca-decreto | pp. 26–30; plano 2025–2027; Decreto 12.341/2024 |
| `ambiente` | medium | tse-pt | pp. 63–73 |
| `diplomacia_eleitoral` | high | tse-pt | pp. 77–82 |
| `contrapesos` | low | tse-pt | pp. 15–18 |

### Flávio Bolsonaro

| Axis | Evidence confidence | Source identifiers | Locator |
| --- | --- | --- | --- |
| `coordenacao` | medium | tse-pl | pp. 27–28, 55–56, 62–64, 69–71 |
| `protecao_social` | medium | tse-pl | pp. 42–43, 70–73 |
| `tributacao` | medium | tse-pl | pp. 30–31, 71–72 |
| `provisao_publica` | medium | tse-pl | pp. 21, 35–39, 46, 50–51, 69–70 |
| `trabalho` | medium | tse-pl | pp. 43–45 |
| `direitos_sociais` | medium | tse-pl | pp. 9, 17, 35, 40–41 |
| `laicidade` | low | flavio-religiao | 19/09/2026; declarações em Chapecó |
| `armas` | medium | armas-pdl, armas-advogados | PDL 343/2023; PL 2.734/2021, discutido em abril de 2025 |
| `justica_penal` | high | tse-pl, forca-pdl | pp. 13–16; PDL 29/2025 |
| `ambiente` | medium | tse-pl | pp. 49–59, 63 |
| `diplomacia_eleitoral` | low | tse-pl | pp. 61–64 |
| `contrapesos` | medium | tse-pl | pp. 65–66, 69–71 |

## Source list

- **tse-pt:** [Programa de governo de Lula apresentado ao TSE](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/proposta-pt) — primary; accessed 2026-10-05.
- **tse-pl:** [Programa de governo de Flávio Bolsonaro apresentado ao TSE](https://www.tse.jus.br/eleicoes/eleicoes-2026-content/arquivos/proposta-pl) — primary; accessed 2026-10-05.
- **ir-2025:** [Lei 15.270/2025: isenção e tributação mínima de altas rendas](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/l15270.htm) — primary; accessed 2026-10-05.
- **apps-2024:** [PLP 12/2024: proposta do Executivo sobre motoristas de aplicativos](https://www.planalto.gov.br/ccivil_03/projetos/ato_2023_2026/2024/plp/plp-012.htm) — primary; accessed 2026-10-05.
- **pt-laicidade:** [PT: reconhecimento da cultura gospel e Estado laico](https://pt.org.br/blog-secretarias/reconhecimento-da-cultura-gospel-fortalece-a-diversidade-e-estado-laico/) — party-statement; accessed 2026-10-05.
- **flavio-religiao:** [Agência Estado/UOL: declarações de Flávio sobre religião em Chapecó](https://noticias.uol.com.br/ultimas-noticias/agencia-estado/2026/09/19/flavio-falas-de-lula-sobre-a-igreja-catolica-sao-ameaca-a-liberdade-religiosa.htm) — reported-statement; accessed 2026-10-05.
- **armas-decreto:** [Decreto 11.615/2023: controle de armas](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/decreto/d11615.htm) — primary; accessed 2026-10-05.
- **armas-pf:** [Agência Gov: transferência dos CACs para a Polícia Federal](https://agenciagov.ebc.com.br/noticias/202505/exercito-prepara-passagem-do-controle-sobre-cac-para-policia-federal) — primary; accessed 2026-10-05.
- **armas-pdl:** [Senado: PDL 343/2023, coautoria de Flávio Bolsonaro](https://www25.senado.leg.br/web/atividade/materias/-/materia/160194) — primary; accessed 2026-10-05.
- **armas-advogados:** [Senado: PL 2.734/2021, autoria de Flávio Bolsonaro](https://www25.senado.leg.br/web/atividade/materias/-/materia/149286) — primary; accessed 2026-10-05.
- **pena-justa:** [CNJ: Plano Pena Justa](https://www.cnj.jus.br/plano-pena-justa-preve-mais-de-300-metas-para-levar-dignidade-a-presos-e-presas-no-pais/) — primary; accessed 2026-10-05.
- **forca-decreto:** [Decreto 12.341/2024: uso da força por profissionais de segurança](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/decreto/d12341.htm) — primary; accessed 2026-10-05.
- **forca-pdl:** [Senado: PDL 29/2025, autoria de Flávio Bolsonaro](https://www25.senado.leg.br/web/atividade/materias/-/materia/167042) — primary; accessed 2026-10-05.
- **tse-segundo-turno:** [TSE: Lula e Flávio no segundo turno de 2026](https://www.tse.jus.br/comunicacao/noticias/2026/Outubro/flavio-bolsonaro-e-lula-vao-disputar-o-2o-turno-para-a-presidencia-da-republica) — primary; accessed 2026-10-05.

## Full question and candidate-answer audit

All statements below are new election questions. LEFT agreement increases the first-pole score; RIGHT agreement decreases it. † means the current specific position is uncertain and was centered, rather than inferred from affiliation. Answer labels use the existing enum.

### Coordenação econômica

| Identifier | Statement | Agreement favors | Lula | Flávio |
| --- | --- | --- | --- | --- |
| `br2026_coordenacao_1` | O governo deve oferecer crédito com juros reduzidos para desenvolver setores industriais escolhidos como estratégicos. | LEFT | AGREE | DISAGREE |
| `br2026_coordenacao_2` | A escolha dos setores econômicos que devem crescer deve ficar principalmente com as empresas, sem prioridades definidas pelo governo. | RIGHT | DISAGREE | AGREE |
| `br2026_coordenacao_3` | Compras do governo devem dar preferência a produtos nacionais para desenvolver a indústria brasileira, mesmo com custo maior. | LEFT | STRONGLY_AGREE | NEUTRAL † |
| `br2026_coordenacao_4` | Os preços dos combustíveis devem acompanhar o mercado internacional, sem medidas do governo para suavizar as variações. | RIGHT | STRONGLY_DISAGREE | NEUTRAL † |
| `br2026_coordenacao_5` | O governo deve definir metas de produção e inovação para orientar investimentos em setores estratégicos. | LEFT | AGREE | DISAGREE |
| `br2026_coordenacao_6` | As exigências para abrir e manter empresas devem ser reduzidas, mantendo as regras de segurança dos produtos. | RIGHT | AGREE | STRONGLY_AGREE |

### Proteção social e orçamento

| Identifier | Statement | Agreement favors | Lula | Flávio |
| --- | --- | --- | --- | --- |
| `br2026_protecao_social_1` | Benefícios para famílias de baixa renda devem crescer acima da inflação quando a arrecadação permitir. | LEFT | AGREE | NEUTRAL † |
| `br2026_protecao_social_2` | O crescimento dos gastos com benefícios sociais deve ficar abaixo do crescimento da arrecadação para reduzir a dívida pública. | RIGHT | DISAGREE | AGREE |
| `br2026_protecao_social_3` | Programas de transferência de renda devem ser mantidos enquanto a família permanecer em situação de pobreza. | LEFT | AGREE | AGREE |
| `br2026_protecao_social_4` | Ao conseguir emprego, a família deve sair gradualmente dos programas de transferência de renda, com prazo de transição. | RIGHT | AGREE | AGREE |
| `br2026_protecao_social_5` | O governo deve ampliar a cobertura dos benefícios sociais para alcançar famílias elegíveis que ainda estão fora dos programas. | LEFT | AGREE | AGREE |
| `br2026_protecao_social_6` | Se houver falta de dinheiro no orçamento, as regras dos benefícios sociais devem ser revistas para conter despesas. | RIGHT | DISAGREE | AGREE |

### Tributação

| Identifier | Statement | Agreement favors | Lula | Flávio |
| --- | --- | --- | --- | --- |
| `br2026_tributacao_1` | A redução do imposto de renda de quem ganha menos deve ser compensada com maior cobrança sobre rendas muito altas. | LEFT | STRONGLY_AGREE | NEUTRAL † |
| `br2026_tributacao_2` | A prioridade tributária deve ser reduzir a carga total de impostos, em vez de redistribuir a cobrança entre grupos de renda. | RIGHT | DISAGREE | STRONGLY_AGREE |
| `br2026_tributacao_3` | Lucros e dividendos recebidos por pessoas de renda muito alta devem contribuir para um imposto de renda mínimo. | LEFT | STRONGLY_AGREE | NEUTRAL † |
| `br2026_tributacao_4` | O governo deve priorizar cortes nos impostos sobre consumo, mesmo sem aumentar a cobrança sobre altas rendas. | RIGHT | NEUTRAL | STRONGLY_AGREE |
| `br2026_tributacao_5` | O governo deve fechar benefícios tributários usados principalmente por pessoas de alta renda, ainda que isso aumente a cobrança sobre elas. | LEFT | AGREE | NEUTRAL † |
| `br2026_tributacao_6` | Reduzir impostos pagos por empresas deve ser prioridade em relação a ampliar a tributação das rendas mais altas. | RIGHT | DISAGREE | AGREE |

### Serviços e empresas públicas

| Identifier | Statement | Agreement favors | Lula | Flávio |
| --- | --- | --- | --- | --- |
| `br2026_provisao_publica_1` | Para ampliar o atendimento de saúde, o governo deve priorizar a expansão da rede pública do SUS. | LEFT | AGREE | NEUTRAL † |
| `br2026_provisao_publica_2` | Para diminuir filas do SUS, o governo deve priorizar a contratação de vagas disponíveis em hospitais privados. | RIGHT | AGREE | STRONGLY_AGREE |
| `br2026_provisao_publica_3` | Empresas estatais de setores estratégicos devem continuar sob controle público. | LEFT | STRONGLY_AGREE | DISAGREE |
| `br2026_provisao_publica_4` | Onde faltam vagas na rede pública, o governo deve financiar vagas em escolas ou creches privadas. | RIGHT | DISAGREE | STRONGLY_AGREE |
| `br2026_provisao_publica_5` | A expansão do ensino superior deve priorizar novas vagas em universidades e institutos públicos. | LEFT | AGREE | DISAGREE |
| `br2026_provisao_publica_6` | A expansão da infraestrutura deve priorizar concessões operadas por empresas privadas. | RIGHT | AGREE | STRONGLY_AGREE |

### Relações de trabalho

| Identifier | Statement | Agreement favors | Lula | Flávio |
| --- | --- | --- | --- | --- |
| `br2026_trabalho_1` | A lei deve reduzir a jornada semanal e garantir dois dias de descanso, sem reduzir salários. | LEFT | STRONGLY_AGREE | DISAGREE |
| `br2026_trabalho_2` | Trabalhadores e empresas devem ter mais liberdade para negociar a jornada, respeitando os direitos básicos da Constituição. | RIGHT | DISAGREE | STRONGLY_AGREE |
| `br2026_trabalho_3` | O salário mínimo deve ter aumentos reais definidos por uma regra nacional, além da reposição da inflação. | LEFT | STRONGLY_AGREE | NEUTRAL † |
| `br2026_trabalho_4` | Novas formas de contrato devem facilitar a contratação de jovens e pessoas acima de 50 anos, mesmo com regras diferentes das da CLT. | RIGHT | DISAGREE | STRONGLY_AGREE |
| `br2026_trabalho_5` | O governo deve fiscalizar contratos de pessoa jurídica para impedir que substituam empregos que deveriam ter proteção da CLT. | LEFT | STRONGLY_AGREE | NEUTRAL † |
| `br2026_trabalho_6` | O trabalho por aplicativos deve manter contratos flexíveis, com proteção social sem obrigar todas as plataformas a contratar pela CLT. | RIGHT | AGREE | STRONGLY_AGREE |

### Direitos e costumes

| Identifier | Statement | Agreement favors | Lula | Flávio |
| --- | --- | --- | --- | --- |
| `br2026_direitos_sociais_1` | O governo deve manter políticas específicas para combater a discriminação contra pessoas LGBT. | LEFT | STRONGLY_AGREE | NEUTRAL † |
| `br2026_direitos_sociais_2` | A legislação sobre aborto deve continuar limitada às situações que já são permitidas por lei. | RIGHT | NEUTRAL † | AGREE |
| `br2026_direitos_sociais_3` | As cotas raciais no acesso à educação devem ser mantidas como medida de redução de desigualdades. | LEFT | STRONGLY_AGREE | NEUTRAL † |
| `br2026_direitos_sociais_4` | A participação em categorias femininas do esporte deve ser definida pelo sexo de nascimento. | RIGHT | NEUTRAL † | STRONGLY_AGREE |
| `br2026_direitos_sociais_5` | As políticas públicas devem reconhecer diferentes formas de família, incluindo casais do mesmo sexo. | LEFT | AGREE | NEUTRAL † |
| `br2026_direitos_sociais_6` | Os conteúdos sobre sexualidade nas escolas devem depender de autorização prévia dos responsáveis. | RIGHT | NEUTRAL † | AGREE |

### Religião e Estado

| Identifier | Statement | Agreement favors | Lula | Flávio |
| --- | --- | --- | --- | --- |
| `br2026_laicidade_1` | As leis devem ser justificadas por razões públicas, sem depender da doutrina de uma religião. | LEFT | AGREE | NEUTRAL † |
| `br2026_laicidade_2` | Referências religiosas devem ter papel explícito na orientação das prioridades do governo. | RIGHT | NEUTRAL † | AGREE |
| `br2026_laicidade_3` | O governo deve tratar todas as religiões e as pessoas sem religião de forma igual. | LEFT | AGREE | AGREE |
| `br2026_laicidade_4` | O compromisso com valores religiosos deve ser um critério relevante na escolha de autoridades públicas. | RIGHT | NEUTRAL † | NEUTRAL † |
| `br2026_laicidade_5` | Serviços públicos devem atender as pessoas sem exigir adesão a práticas religiosas. | LEFT | NEUTRAL † | NEUTRAL † |
| `br2026_laicidade_6` | Escolas públicas devem poder oferecer ensino de uma religião específica quando houver demanda das famílias. | RIGHT | NEUTRAL † | NEUTRAL † |

### Armas de fogo

| Identifier | Statement | Agreement favors | Lula | Flávio |
| --- | --- | --- | --- | --- |
| `br2026_armas_1` | A compra de armas por civis deve exigir comprovação de necessidade, além de antecedentes e capacidade técnica. | LEFT | STRONGLY_AGREE | DISAGREE |
| `br2026_armas_2` | O direito de portar arma deve ser ampliado para categorias profissionais sujeitas a risco, como advogados. | RIGHT | DISAGREE | STRONGLY_AGREE |
| `br2026_armas_3` | Deve haver limites baixos para a quantidade de armas e munições que cada civil pode comprar. | LEFT | AGREE | DISAGREE |
| `br2026_armas_4` | As regras para colecionadores, atiradores e caçadores devem facilitar a compra e o transporte de armas legalizadas. | RIGHT | DISAGREE | STRONGLY_AGREE |
| `br2026_armas_5` | Uma autoridade federal civil deve concentrar a fiscalização das armas de uso civil. | LEFT | STRONGLY_AGREE | NEUTRAL † |
| `br2026_armas_6` | Adultos sem antecedentes e aprovados em testes devem ter acesso mais amplo a armas para defesa pessoal. | RIGHT | DISAGREE | STRONGLY_AGREE |

### Justiça penal

| Identifier | Statement | Agreement favors | Lula | Flávio |
| --- | --- | --- | --- | --- |
| `br2026_justica_penal_1` | O sistema prisional deve ampliar estudo e trabalho para favorecer a reintegração de quem cumpre pena. | LEFT | AGREE | NEUTRAL † |
| `br2026_justica_penal_2` | A idade para responder criminalmente como adulto deve cair de 18 para 16 anos. | RIGHT | DISAGREE | STRONGLY_AGREE |
| `br2026_justica_penal_3` | Para condenados por crimes hediondos, como estupro, a passagem para regimes menos restritivos deve continuar possível conforme a lei. | LEFT | AGREE | STRONGLY_DISAGREE |
| `br2026_justica_penal_4` | A prioridade da política prisional deve ser construir mais vagas para ampliar o encarceramento. | RIGHT | NEUTRAL | STRONGLY_AGREE |
| `br2026_justica_penal_5` | Para crimes sem violência, penas alternativas à prisão devem ser ampliadas. | LEFT | AGREE | DISAGREE |
| `br2026_justica_penal_6` | As forças policiais devem ter mais margem para decidir sobre o uso da força, com menos regras federais detalhadas. | RIGHT | STRONGLY_DISAGREE | STRONGLY_AGREE |

### Meio ambiente

| Identifier | Statement | Agreement favors | Lula | Flávio |
| --- | --- | --- | --- | --- |
| `br2026_ambiente_1` | Obras com grande impacto devem passar por estudos ambientais completos, mesmo que a licença demore mais. | LEFT | AGREE | DISAGREE |
| `br2026_ambiente_2` | O licenciamento ambiental deve ter prazos mais curtos para acelerar projetos produtivos. | RIGHT | NEUTRAL † | STRONGLY_AGREE |
| `br2026_ambiente_3` | Metas de redução de emissões devem orientar decisões sobre investimentos e uso do solo. | LEFT | AGREE | AGREE |
| `br2026_ambiente_4` | O Brasil deve ampliar a exploração de petróleo e gás em novas áreas, cumpridas as exigências ambientais. | RIGHT | AGREE | STRONGLY_AGREE |
| `br2026_ambiente_5` | O governo deve buscar desmatamento líquido zero, incluindo a compensação de cortes que hoje são legais. | LEFT | STRONGLY_AGREE | DISAGREE |
| `br2026_ambiente_6` | A geração de renda com recursos naturais deve ter prioridade onde a exploração puder cumprir a legislação ambiental. | RIGHT | AGREE | STRONGLY_AGREE |

### Política externa

| Identifier | Statement | Agreement favors | Lula | Flávio |
| --- | --- | --- | --- | --- |
| `br2026_diplomacia_eleitoral_1` | O Brasil deve buscar soluções para conflitos internacionais por meio de instituições como a ONU. | LEFT | AGREE | NEUTRAL † |
| `br2026_diplomacia_eleitoral_2` | A política externa deve priorizar acordos diretos entre países em vez de compromissos com grandes blocos. | RIGHT | DISAGREE | AGREE |
| `br2026_diplomacia_eleitoral_3` | O Brasil deve aprofundar a integração política e econômica com os países da América do Sul. | LEFT | STRONGLY_AGREE | NEUTRAL † |
| `br2026_diplomacia_eleitoral_4` | O Brasil deve ter mais liberdade para negociar acordos comerciais fora das regras comuns do Mercosul. | RIGHT | STRONGLY_DISAGREE | NEUTRAL † |
| `br2026_diplomacia_eleitoral_5` | O Brasil deve participar de coalizões internacionais para enfrentar fome e mudanças climáticas. | LEFT | STRONGLY_AGREE | NEUTRAL † |
| `br2026_diplomacia_eleitoral_6` | O Brasil deve evitar compromissos internacionais que limitem sua margem de decisão sobre políticas internas. | RIGHT | DISAGREE | DISAGREE |

### Equilíbrio entre Poderes

| Identifier | Statement | Agreement favors | Lula | Flávio |
| --- | --- | --- | --- | --- |
| `br2026_contrapesos_1` | Tribunais devem poder suspender atos dos Poderes eleitos que violem a Constituição, mesmo quando tenham apoio popular. | LEFT | AGREE | AGREE |
| `br2026_contrapesos_2` | O STF deve ter menos competências e concentrar sua atuação no julgamento de questões constitucionais. | RIGHT | NEUTRAL † | STRONGLY_AGREE |
| `br2026_contrapesos_3` | Um ministro do STF deve poder suspender uma medida em caso urgente, desde que a decisão seja revista rapidamente pelo colegiado. | LEFT | NEUTRAL † | DISAGREE |
| `br2026_contrapesos_4` | Em disputas sobre políticas públicas, o Judiciário deve deixar maior espaço de decisão para o Congresso e o Executivo. | RIGHT | NEUTRAL † | STRONGLY_AGREE |
| `br2026_contrapesos_5` | Órgãos de controle devem poder investigar decisões do governo sem autorização prévia de autoridades eleitas. | LEFT | AGREE | AGREE |
| `br2026_contrapesos_6` | O número de organizações autorizadas a contestar leis diretamente no STF deve ser reduzido. | RIGHT | NEUTRAL † | AGREE |

## Validation and remaining work

See [VALIDATION-BRAZIL-2026.md](VALIDATION-BRAZIL-2026.md) for the original model checks and [BRAZIL-ONLY.md](BRAZIL-ONLY.md) for subsequent frontend integration and country filtering. Remaining work is fresh source review if positions change, voting-slip generation, and respondent-based validation of reliability; an audit of all other political profiles is intentionally deferred.

