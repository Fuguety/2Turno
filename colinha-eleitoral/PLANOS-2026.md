# Planos de governo 2026: leitura pergunta a pergunta

Leitura integral dos programas de Lula (PT, 84 pp.) e Flávio Bolsonaro (PL, 75 pp.) protocolados no
TSE, baixados de [planodegoverno2026.com.br](https://planodegoverno2026.com.br) em 05/10/2026.
Os PDFs dos 13 candidatos do 1º turno e o texto extraído ficam em `planos-de-governo/` (não
versionados). As páginas abaixo são as do PDF, que coincidem com a numeração impressa.

Objetivo: substituir codificações `NEUTRAL` marcadas como incertas por posições documentadas e
corrigir intensidades que os planos contradizem. As mudanças abaixo foram aplicadas a
`backend/src/main/resources/data/elections/brazil-2026.json` como `brazil-presidential-2026-v2`
(ver [MODEL-BRAZIL-2026.md](MODEL-BRAZIL-2026.md)).

## Resumo

| | Lula | Flávio |
| --- | ---: | ---: |
| Respostas alteradas | 13 | 12 |
| Respostas incertas | 16 → 12 | 31 → 22 |

| Eixo | Lula v1 → v2 | Flávio v1 → v2 | Distância entre eles |
| --- | ---: | ---: | ---: |
| `coordenacao` | 70,8 → 75,0 | 33,3 → 29,2 | 37,5 → 45,8 |
| `protecao_social` | 62,5 → 66,7 | 41,7 → 45,8 | 20,8 → 20,9 |
| `tributacao` | 79,2 | 29,2 | 50,0 |
| `provisao_publica` | 58,3 → 62,5 | 25,0 → 16,7 | 33,3 → 45,8 |
| `trabalho` | 75,0 → 79,2 | 25,0 → 20,8 | 50,0 → 58,4 |
| `direitos_sociais` | 62,5 → 70,8 | 45,8 → 33,3 | 16,7 → 37,5 |
| `laicidade` | 58,3 | 50,0 | 8,3 |
| `armas` | 83,3 | 16,7 | 66,6 |
| `justica_penal` | 66,7 → 75,0 | 20,8 → 12,5 | 45,9 → 62,5 |
| `ambiente` | 58,3 | 29,2 → 20,8 | 29,1 → 37,5 |
| `diplomacia_eleitoral` | 75,0 → 87,5 | 50,0 | 25,0 → 37,5 |
| `contrapesos` | 58,3 | 37,5 → 33,3 | 20,8 → 25,0 |

O efeito geral é **afastar** os dois perfis: as respostas neutras por falta de evidência puxavam
ambos para o centro. A maior mudança é em `direitos_sociais`, onde Flávio tinha cinco de seis
respostas neutras.

## Flávio Bolsonaro: mudanças propostas

| Pergunta | Atual → proposto | Evidência |
| --- | --- | --- |
| `coordenacao_1` crédito subsidiado a setores estratégicos | NEUTRAL? → DISAGREE | p. 71: "limitando o crédito subsidiado com recursos do Tesouro"; p. 55: o Estado "como regulador e coordenador, não como empresário". |
| `protecao_social_5` ampliar cobertura a quem está fora | NEUTRAL? → AGREE | p. 25: "Assistentes automatizados vão indicar a cada brasileiro os serviços e benefícios a que ele tem direito". |
| `provisao_publica_3` estatais estratégicas sob controle público | NEUTRAL? → DISAGREE | p. 70: "retomar o Programa Nacional de Desestatização com critério, avaliando caso a caso". A CAIXA é mantida (p. 46), por isso não é STRONGLY. |
| `provisao_publica_5` expansão do superior por vagas públicas | NEUTRAL? → DISAGREE | p. 37: a proposta para o superior é o Empréstimo Contingente à Renda; não há expansão da rede pública. Inferência por omissão, confiança baixa. |
| `trabalho_4` contratos especiais para jovens e 50+ | AGREE → STRONGLY_AGREE | pp. 43–44: contrato para 18–24 anos "com menor custo na folha" e contrato para 50+ desempregados há 12 meses. |
| `direitos_sociais_4` esporte feminino pelo sexo de nascimento | NEUTRAL? → STRONGLY_AGREE | pp. 40–41: "assegurar que a categoria feminina, da base ao alto rendimento, seja disputada por atletas do sexo feminino". |
| `direitos_sociais_6` conteúdo sobre sexualidade depende dos pais | NEUTRAL? → AGREE | p. 35: "quem decide sobre os valores que o filho recebe são os pais"; educação "livre de doutrinação". Não fala de sexualidade nem de autorização prévia, por isso não é STRONGLY. |
| `justica_penal_3` progressão de regime para hediondos | DISAGREE → STRONGLY_DISAGREE | p. 15: "acabar com a progressão de regime de quem comete crimes hediondos". |
| `justica_penal_5` penas alternativas para crimes sem violência | NEUTRAL? → DISAGREE | p. 16: furto ou revenda de celular com "pena inicial quadruplicada, também sem benefícios". |
| `ambiente_1` estudos ambientais completos mesmo com demora | NEUTRAL? → DISAGREE | p. 50: se o órgão "não decidir nem se manifestar dentro desse prazo, a licença deve ser concedida". |
| `ambiente_5` desmatamento líquido zero, inclusive o legal | NEUTRAL? → DISAGREE | p. 58: meta de "zerar o desmatamento ilegal até 2029", "sem criar novas obrigações ou custos" para o produtor dentro da lei. |
| `contrapesos_4` Judiciário deixa espaço ao Congresso e Executivo | AGREE → STRONGLY_AGREE | p. 65: "presumindo a constitucionalidade do processo legislativo"; devolver ao povo, "por meio de seus representantes eleitos, o poder de decidir" (p. 66). |

Codificações atuais que o plano confirma: `coordenacao_6` (p. 27), `protecao_social_4` (p. 43),
`provisao_publica_4` (voucher-creche p. 21; voucher educacional p. 36), `provisao_publica_6`
(p. 50), `trabalho_1` e `trabalho_2` (negociado sobre o legislado, pp. 44–45), `trabalho_6`
(p. 45), `justica_penal_2` (p. 13), `justica_penal_4` (meio milhão de vagas, p. 14),
`justica_penal_6` (p. 13), `ambiente_2` (p. 50), `ambiente_4` (fracking, p. 52),
`diplomacia_eleitoral_6` (adesão à OCDE com convergência de normas, p. 63), `contrapesos_2`,
`contrapesos_3` e `contrapesos_6` (p. 65).

Seguem neutras e incertas, porque o plano não trata do tema: preferência a produto nacional,
preço de combustível, IR de altas rendas e dividendos (o plano só promete revisar "a majoração de
impostos efetuada pelo atual governo", p. 30), salário mínimo, pejotização, LGBT, cotas raciais,
casais do mesmo sexo (p. 17 diz apenas "respeita todos os arranjos familiares"), ONU, Mercosul e
quase toda a laicidade.

**O plano de Flávio não tem nenhuma proposta sobre armas para civis.** As seis respostas do eixo
`armas` vêm só do histórico legislativo (PDL 343/2023, PL 2.734/2021). Vale mostrar isso na
interface.

## Lula: mudanças propostas

| Pergunta | Atual → proposto | Evidência |
| --- | --- | --- |
| `coordenacao_3` compras públicas preferem produto nacional | AGREE → STRONGLY_AGREE | p. 51: "margens de preferência com estímulos para empresas brasileiras", conteúdo local. |
| `coordenacao_4` combustível segue o mercado internacional | DISAGREE → STRONGLY_DISAGREE | p. 66: "Continuaremos a atuar para mitigar a volatilidade dos preços internacionais". |
| `coordenacao_6` menos exigências para abrir empresa | NEUTRAL? → AGREE | p. 57: "vamos simplificar ainda mais o ambiente de negócios". |
| `protecao_social_6` rever regras de benefícios se faltar orçamento | NEUTRAL? → DISAGREE | p. 49: arcabouço que "controlou o crescimento das despesas sem prejudicar as políticas sociais". |
| `provisao_publica_4` financiar vagas privadas em escola e creche | NEUTRAL? → DISAGREE | p. 31: expansão de creches pela construção pública (Novo PAC); não há voucher. Inferência por omissão, confiança baixa. |
| `trabalho_4` contratos fora da CLT para jovens e 50+ | NEUTRAL? → DISAGREE | p. 75: alterar "regras que induzem a precarização" e "os marcos regressivos contidos na legislação". |
| `direitos_sociais_1` políticas contra discriminação LGBT | AGREE → STRONGLY_AGREE | pp. 23, 26, 29, 75: LGBTQIAP+ citada em políticas, segurança e trabalho. |
| `direitos_sociais_3` manter cotas raciais | AGREE → STRONGLY_AGREE | pp. 19–20: cotas na universidade e no serviço público, ampliadas para quilombolas. |
| `justica_penal_4` prioridade é construir vagas para encarcerar mais | AGREE → NEUTRAL | p. 28: amplia o sistema federal para isolar lideranças, mas a prioridade declarada é o Pena Justa e a redução da reincidência. AGREE exagera. |
| `justica_penal_6` polícia com mais margem e menos regras federais | DISAGREE → STRONGLY_DISAGREE | p. 30: câmeras corporais "com padrões nacionais" e controle externo da atividade policial. |
| `diplomacia_eleitoral_3` integração com a América do Sul | AGREE → STRONGLY_AGREE | p. 80: "A integração sul-americana é o primeiro círculo de projeção estratégica do Brasil". |
| `diplomacia_eleitoral_4` negociar fora das regras do Mercosul | DISAGREE → STRONGLY_DISAGREE | p. 80: "Consolidaremos o Mercosul como principal plataforma de integração". |
| `diplomacia_eleitoral_5` coalizões contra fome e clima | AGREE → STRONGLY_AGREE | pp. 81–82: Aliança Global contra a Fome e TFFF como "prioridades de nossa ação externa". |

Para revisão sem mudança proposta: `armas_5` (STRONGLY_AGREE para concentrar a fiscalização numa
autoridade civil federal). A p. 28 fala em reforçar "a Polícia Federal e o Exército", não em
concentrar. AGREE talvez seja mais fiel.

Seguem neutras e incertas: aborto (p. 21 fala em "direitos sexuais e reprodutivos", sem proposta
legal), esporte feminino, educação sexual, licenciamento ambiental e o eixo `contrapesos` inteiro
(p. 16 só promete "diálogo permanente com os atores do judiciário").

## Outras melhorias possíveis

1. **Mostrar a fonte na tela de resultado.** Cada eixo já tem `evidence` com página e confiança.
   Exibir "o que o plano diz" com a citação e o link para a página do PDF deixa a comparação
   verificável e mostra onde a resposta é uma inferência.
2. **Sinalizar eixos sem evidência no plano.** Por exemplo, armas para Flávio e contrapesos para
   Lula: o usuário deve saber que ali a posição vem de outra fonte, ou de nenhuma.
3. **Separar "neutro por evidência" de "neutro por falta de dados".** Hoje os dois contam como 50.
   Uma opção é excluir do cálculo de distância as perguntas incertas do candidato.
4. **Usar os outros 11 planos** no catálogo de 86 figuras brasileiras ou numa futura versão do 1º
   turno.
