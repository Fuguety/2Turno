# Troca de 17 perguntas (2026-10-02)

Uma análise de itens sobre as respostas auditadas de ~800 perfis mostrou perguntas que mal
acompanhavam o próprio eixo (ex.: armas em `poder`, r=0,22), que mediam outro eixo (vacina
obrigatória → `controle`; grandes fortunas em `controle` → `economia`) ou que repetiam outra
pergunta do mesmo eixo. Essas 17 perguntas foram trocadas mantendo o **id** e o **agreePole**;
nenhuma é `core`, então os quizzes curto e completo não mudaram de composição.

| Arquivo | O que é |
|---|---|
| `new-questions.json` | As 17 perguntas novas (PT, EN, polo, tema). |
| `build_batches.py` | Gera `batches/<catalog>-NN.txt` (não versionado; rode de novo para recriar): 20 perfis por lote, com metadados e o persona brief dos eixos tocados, e `manifest.json`. |
| `out/<catalog>-NN.json` | Respostas dos subagentes (Sonnet), `{perfil: {pergunta: código}}`. |
| `apply.py` | `--check` valida as saídas; sem flag, aplica a troca. |

## Como os vetores foram atualizados

Só os perfis com respostas arquivadas em `answers/` foram reauditados (758 de 920). Para cada um,
o vetor salvo recebeu a **diferença** entre o vetor recalculado com as respostas novas e com as
antigas — assim os vetores ajustados à mão depois da auditoria preservam o ajuste. Perfis sem
arquivo em `answers/` mantiveram o vetor; o erro máximo de uma troca é ~5 pontos por eixo (1 de
20 respostas), e na prática bem menor. Quando forem reauditados pelo fluxo normal, já usam as
perguntas novas.

`answers/<catalog>/<id>.json` teve as respostas dessas 17 perguntas substituídas no próprio
arquivo: com o mesmo id, manter a resposta antiga faria qualquer recálculo aplicá-la a um texto que
não existe mais. As respostas antigas continuam no histórico do git.
