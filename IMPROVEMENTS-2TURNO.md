# Melhorias da página inicial do 2 Turno

## Seções e navegação

Os três cartões principais — teste, Lula e Flávio Bolsonaro — continuam como entrada. Abaixo deles estão, nesta ordem: introdução ao 2 Turno, espectro político, os 12 eixos, como funciona, exemplo de resultado e chamada para metodologia e fontes.

O cabeçalho oferece início, fazer o teste, ambos os candidatos, metodologia e seletor de idioma. A ligação para o teste abre a escolha de duração, inclusive ao acessar diretamente `/#teste` ou `/en#teste`. As seções têm âncoras para espectro, eixos, funcionamento e exemplo.

## Famílias políticas e cores

| Família | Cor principal | Fundo |
|---|---|---|
| Esquerda | `#923448` | `#f8e9ee` |
| Centro-esquerda | `#376146` | `#eaf1e8` |
| Centro | `#555b61` | `#eef0f2` |
| Centro-direita | `#216172` | `#e8f3f5` |
| Direita | `#304e91` | `#eaf0fc` |

O centro usa cinza neutro. Os nomes acompanham todas as cores. A fonte única é `familyLabels` em `electionPresentation.cjs`, compartilhada com os cabeçalhos estáticos de candidatos, resultados e badges. Os cartões de candidatos usam a mesma cor na borda; os marcadores da comparação usam a cor da família de cada perfil, preservando nomes e símbolos. Os subtipos não alteram a cor da família.

## Os 12 pares exibidos

Os rótulos são lidos de `electionProfiles.generated.json`, gerado a partir dos modelos eleitorais português e inglês, sem redefinir os eixos na apresentação.

| Eixo | Primeiro polo | Segundo polo |
|---|---|---|
| Coordenação econômica | Política industrial ativa | Coordenação pelo mercado |
| Proteção social e orçamento | Ampliação da proteção social | Contenção de gastos sociais |
| Tributação | Maior progressividade | Redução geral de impostos |
| Serviços e empresas públicas | Provisão e controle públicos | Provisão privada e concessões |
| Relações de trabalho | Proteção definida em lei | Flexibilidade negociada |
| Direitos e costumes | Ampliação de direitos sociais | Preservação de normas tradicionais |
| Religião e Estado | Decisões públicas laicas | Referências religiosas na política |
| Armas de fogo | Acesso civil restrito | Acesso civil ampliado |
| Justiça penal | Reintegração e garantias processuais | Penas e encarceramento ampliados |
| Meio ambiente | Prioridade à proteção ambiental | Flexibilidade para uso de recursos |
| Política externa | Cooperação multilateral | Autonomia e acordos bilaterais |
| Equilíbrio entre Poderes | Controle judicial mais amplo | Maior margem dos Poderes eleitos |

As grades exibem quatro eixos por linha em desktop amplo, três em desktop menor, dois em tablet e um em celular. O espectro usa três, dois ou um cartão por linha.

## Exemplo e compatibilidade

O exemplo usa um vetor fixo, na ordem dos eixos acima: `[38, 42, 35, 32, 38, 42, 65, 45, 58, 52, 60, 55]`. É identificado como ilustrativo e não como respostas de um usuário real. O classificador existente retorna **Centro-direita / Liberalismo econômico**. Quatro eixos são mostrados, mas o vetor completo participa da classificação e da comparação.

`compareElectionVector` envia esse vetor ao endpoint existente `POST /api/elections/brazil-2026/compare`. O backend calcula os vetores dos candidatos e a compatibilidade por `ElectionComparisonService`, sem uma cópia desse algoritmo na apresentação. No modelo atual, o exemplo produz **82,4% para Flávio Bolsonaro** e **74,5% para Lula**.

A compatibilidade é `100 − média das diferenças absolutas` entre os 12 eixos, com pesos iguais e arredondamento para uma casa decimal. Não representa concordância com essa porcentagem de todas as opiniões do candidato. Se a API falhar ou retornar um modelo incompatível, o perfil ilustrativo permanece visível, os percentuais não são apresentados e há opção de tentar novamente.

## Componentes e traduções

Criados: `HomeEducation`, `PoliticalSpectrum`, `PoliticalFamilyCard`, `AxisExplanationCard`, `HowItWorks` e `ResultExample`.

Reutilizados: `ProfileCard`, `IdeologyHeader`, `AxisProfile`, `AxisBar`, `CandidateCard`, `CandidateQuickInfo`, `ProfilePortrait` e `ComparisonAxis`. Os retratos permanecem no catálogo compartilhado; nenhuma nova cópia de caminhos de imagem foi introduzida. `ProfileCard` aceita um identificador próprio e um título de exemplo, evitando IDs duplicados e um segundo título principal na página inicial.

Todas as novas mensagens estão em português e inglês em `frontend/src/i18n/electionEducation.json`, selecionadas pelo `LANG` existente. Os nomes das famílias continuam no módulo compartilhado e os nomes dos eixos nos modelos traduzidos existentes.

## Arquivos alterados ou adicionados

- `frontend/src/components/election/HomeEducation.tsx`
- `frontend/src/components/election/ProfileComponents.tsx`
- `frontend/src/ElectionApp.tsx`
- `frontend/src/i18n/electionEducation.json`
- `frontend/src/styles/education.css`
- `frontend/src/main.tsx`
- `frontend/src/services/electionApi.ts`
- `frontend/src/utils/electionPresentation.cjs`
- `frontend/src/utils/electionPresentation.d.cts`
- `frontend/scripts/check-election-browser.cjs`
- `IMPROVEMENTS-2TURNO.md`

## Validação

- Frontend: 10 arquivos de testes, 84 testes aprovados.
- Backend eleitoral: 17 testes de `ElectionComparisonTest` e 5 de `BrazilCatalogueTest` aprovados.
- ESLint e build de produção aprovados; auditoria do artefato confirma os dois candidatos e os dois retratos em ambos os idiomas.
- Navegador Edge: português e inglês em 1280, 768 e 390 pixels; página inicial, 12 pares de polos, cinco famílias, cores compartilhadas, quatro eixos do exemplo, percentuais iguais à resposta real da API, quiz completo de 36 perguntas, resultados, comparação e páginas dos candidatos.
- Verificados ausência de overflow horizontal, carregamento dos retratos, fallback para retratos ausentes, modal de informações e navegação por teclado.
- Verificados falha da API do exemplo e recuperação após tentar novamente.
- Capturas em `frontend/node_modules/.cache/election-browser/`.

## Inconsistências e limites encontrados

O classificador eleitoral atual produz somente cinco famílias. Esquerda radical, extrema-direita, libertarianismo, anarquismo e terceira posição pertencem à referência ou ao projeto geral; não foram incluídos porque este classificador não os retorna.

Os 12 eixos são calculados separadamente e todos participam igualmente da compatibilidade. A família ampla usa apenas os cinco eixos econômicos (65%), direitos e costumes e laicidade (25%) e ambiente (10%). Os demais eixos participam do perfil, de características e, conforme as regras, de subtipos. O texto novo distingue essas funções; não afirma que todos os eixos têm peso igual na classificação.

O README ainda documenta a arquitetura geral do 12 Axes em uma seção explicitamente identificada como tal, com famílias e formatos diferentes. Essa documentação não foi transportada para a página eleitoral.

A configuração local existente apontava para a API publicada, e o JAR previamente compilado continha o modelo v1. A validação usou o backend recompilado e o proxy local para o modelo v2. A demonstração publicada exige a mesma API v2 que o quiz atual já exige. Nenhum dado de candidato, resposta, peso ou regra de pontuação foi modificado.
