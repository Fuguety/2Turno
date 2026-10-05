"""Monta os lotes da reauditoria das 17 perguntas trocadas (ver README desta pasta)."""
import json
import os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')
DATA = os.path.join(ROOT, 'backend', 'src', 'main', 'resources', 'data')
HERE = os.path.dirname(os.path.abspath(__file__))
BATCH_SIZE = 20
CATALOGS = {
    'personality': ('personalities.json', 'figura histórica/pública'),
    'ideology': ('ideologies.json', 'ideologia política'),
    'country': ('countries.json', 'país/nação'),
}
AXIS_HINT = {
    'estrutura': 'Federal × Unitário (descentralização territorial; NÃO é democracia × autocracia)',
    'representacao': 'Democracia × Autocracia (quem governa e sob quais controles)',
    'poder': 'Segurança × Liberdade (limites do Estado sobre a vida civil)',
    'imigracao': 'Assimilação × Multicultura',
    'intervencao': 'Não intervencionista × Nacionalista assertivo (projeção externa)',
    'economia': 'Público × Privado (quem possui e presta bens e serviços)',
    'controle': 'Planejamento/regulação × Livre mercado',
    'comercio': 'Protecionismo × Globalismo',
    'moral': 'Progressista × Tradicionalista',
    'tecnologia': 'Tecnologia × Biologia/natureza',
}

HEADER = """Você está respondendo, pergunta a pergunta, {n} perguntas NOVAS do quiz 12axes para {count} perfis do catálogo "{tipo}". Esses perfis já foram auditados nas outras perguntas; o persona brief de cada eixo (abaixo, por perfil) resume a leitura já feita. Avalie CADA perfil sozinho e de forma independente: não aproxime as respostas de um perfil às de outro parecido.

METODOLOGIA (obrigatória):
- Para cada perfil, simule genuinamente como o próprio perfil / seus porta-vozes reais responderiam CADA pergunta. Não escolha um valor-alvo e trabalhe de trás para frente.
- Códigos: DT (discordo totalmente), D (discordo), N (neutro/indiferente), C (concordo), CT (concordo totalmente). "C" significa concordo, não alternativa C.
- N só para indiferença GENUÍNA — nunca para "não falou disso" ou "é anacrônico". Para figuras/países históricos, extrapole pelos princípios documentados (ex.: carros autônomos → atitude diante de técnica e progresso; criptografia → atitude diante de vigilância estatal). Mire em no máximo ~15% de N por perfil.
- Falso oposto: rejeitar um polo não implica endossar o outro. Perfis heterodoxos podem discordar das duas direções.
- "O Brasil" nas perguntas = o próprio país/Estado do perfil (para países históricos, aquele Estado naquele período).
- Use o persona brief do eixo da pergunta como âncora, mas responda pelo sentido literal de cada pergunta.

=== PERGUNTAS NOVAS ===
{questions}

=== PERFIS ===
{profiles}

SAÍDA (obrigatória): use a ferramenta Write para gravar UM arquivo JSON estrito (sem markdown) exatamente em:
{out}
Formato: {{"<id do perfil>": {{"<id da pergunta>": "<código>", ... as {n} perguntas}}, ... todos os {count} perfis}}
Antes de gravar, confira: todos os perfis presentes, {n} respostas cada, só códigos DT/D/N/C/CT. Depois responda apenas "OK {batch}" e uma linha de resumo.
"""


def main():
    questions = json.load(open(os.path.join(HERE, 'new-questions.json'), encoding='utf-8'))
    qblock = '\n'.join(
        f"[id={q['id']}] (eixo {q['id'].rsplit('_', 1)[0]}: {AXIS_HINT[q['id'].rsplit('_', 1)[0]]}) {q['pt']}"
        for q in questions)
    axes = sorted({q['id'].rsplit('_', 1)[0] for q in questions}, key=list(AXIS_HINT).index)
    os.makedirs(os.path.join(HERE, 'batches'), exist_ok=True)
    os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
    manifest = []
    for catalog, (meta_file, tipo) in CATALOGS.items():
        meta = json.load(open(os.path.join(DATA, meta_file), encoding='utf-8'))
        entries = []
        for m in meta:
            path = os.path.join(ROOT, 'profile-audit', 'answers', catalog, f"{m['id']}.json")
            if not os.path.exists(path):
                continue
            answers = json.load(open(path, encoding='utf-8-sig'))
            lines = [f"## {m['id']} — {m['name']}"]
            for field in ('role', 'category', 'lifespan', 'period'):
                if m.get(field):
                    lines.append(f"{field}: {m[field]}")
            lines.append(f"description: {m['description']}")
            for ax in axes:
                lines.append(f"brief[{ax}]: {answers[ax]['personaBrief']}")
            entries.append((m['id'], '\n'.join(lines)))
        for start in range(0, len(entries), BATCH_SIZE):
            chunk = entries[start:start + BATCH_SIZE]
            name = f"{catalog}-{start // BATCH_SIZE + 1:02d}"
            out = os.path.abspath(os.path.join(HERE, 'out', f'{name}.json'))
            text = HEADER.format(n=len(questions), count=len(chunk), tipo=tipo, questions=qblock,
                                 profiles='\n\n'.join(e[1] for e in chunk), out=out, batch=name)
            with open(os.path.join(HERE, 'batches', f'{name}.txt'), 'w', encoding='utf-8', newline='\n') as f:
                f.write(text)
            manifest.append({'batch': name, 'catalog': catalog, 'ids': [e[0] for e in chunk]})
    with open(os.path.join(HERE, 'manifest.json'), 'w', encoding='utf-8', newline='\n') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)
    print(len(manifest), 'lotes,', sum(len(b['ids']) for b in manifest), 'perfis')


if __name__ == '__main__':
    main()
