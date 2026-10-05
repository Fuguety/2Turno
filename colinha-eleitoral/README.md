# Colinha eleitoral 2026 (12axes)

Este diretório reúne o planejamento e os artefatos de apoio da funcionalidade que cruza o resultado
do quiz do 12axes com os candidatos reais das eleições de 2026 e gera uma "colinha" (números na ordem
da urna), inspirada no [colinha.ai](https://colinha.ai).

## Ideia

1. A pessoa faz o quiz normalmente.
2. Na página de resultados, uma seção "Seus candidatos em 2026" lista os candidatos de cada cargo no
   estado dela, ordenados por proximidade (mesmo algoritmo de `ProfileMatchScorer`).
3. A pessoa marca suas escolhas e gera a colinha para imprimir ou compartilhar. As escolhas ficam só
   no dispositivo (`localStorage`).

## Escopo inicial: 2º turno (25/10/2026)

O 1º turno (04/10) não dá tempo. No 2º turno só há presidente e alguns governadores, quase todos já
com perfil no catálogo `personality`, então a cobertura é praticamente completa.

Perfis de candidatos de 2026 que já existem em `backend/src/main/resources/data/personalities.json`:
`lula-da-silva`, `flavio-bolsonaro`, `tarcisio-de-freitas`, `fernando-haddad`, `romeu-zema`,
`ronaldo-caiado`, `marina-silva`, `renan-santos`, `ciro-gomes`, `guilherme-boulos`, `jair-bolsonaro`.

## Fontes de dados

- **Candidatos (TSE):** MCP "Eleições dev" (`list_candidates`, `get_candidate`, `list_parties`). Traz
  número, partido, cargo, UF, situação da candidatura e URL da foto (DivulgaCandContas).
- **Fotos alternativas:** `https://assets.colinha.ai/candidatos/fotos/2026/{tseCandidateId}.jpeg`
  (públicas, mas não oficiais; preferir as do TSE).

## Regras

- **Neutralidade:** falar em "proximidade com suas respostas", nunca "recomendamos" ou "vote em".
- **Mostrar todos** os candidatos do cargo, inclusive os sem perfil (marcados como "sem perfil").
- Os perfis envolvidos passam a ter peso eleitoral: reauditar cada um (ver
  [`profile-audit/README.md`](../profile-audit/README.md)) antes de lançar.

## Fase 2 (depois, se fizer sentido)

Deputados e senadores pouco conhecidos não dá para auditar um a um. A aproximação seria criar perfis
de partidos e mostrar "partidos mais próximos" junto com a lista de candidatos do partido na UF,
deixando claro que é uma estimativa pelo partido, não pelo candidato.

## Pendências

- [ ] Definir o desenho da funcionalidade (fluxo, endpoints, componentes do frontend)
- [ ] Mapear candidatos do TSE para ids do catálogo (`candidates-map.json`)
- [ ] Reauditar os perfis de candidatos envolvidos
- [ ] Atualizar a lista com o resultado oficial do 1º turno (quem foi ao 2º turno, por UF)
