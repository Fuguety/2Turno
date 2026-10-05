"""Aplica a troca das 17 perguntas (ver README.md desta pasta).

    python profile-audit/question-swap/apply.py --check   valida as saídas em out/
    python profile-audit/question-swap/apply.py           valida e aplica

Aplicar:
  1. questions-pool.json, i18n/en/questions.json e questions-template.txt recebem o
     texto e o tema novos (mesmo id, mesmo agreePole, core continua false).
  2. Para cada perfil com respostas arquivadas, o vetor salvo recebe a diferença
     entre o vetor recalculado com as respostas novas e com as antigas. Assim os
     vetores ajustados à mão depois da auditoria mantêm o ajuste.
  3. answers/<catalog>/<id>.json troca as respostas dessas 17 perguntas pelas
     novas (as antigas respondiam a textos que deixaram de existir).
Perfis sem respostas arquivadas mantêm o vetor.
"""
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..')
DATA = os.path.join(ROOT, 'backend', 'src', 'main', 'resources', 'data')
sys.path.insert(0, os.path.join(ROOT, 'profile-audit'))
from profile_vector import AXIS_ORDER, compute_vector, question_map  # noqa: E402

CODES = {'DT', 'D', 'N', 'C', 'CT'}
PROFILES = {
    'personality': ('personality-profiles.json', 'personalityId'),
    'ideology': ('ideology-profiles.json', 'ideologyId'),
    'country': ('countries-profiles.json', 'countryId'),
}


def load(path, encoding='utf-8'):
    with open(path, encoding=encoding) as f:
        return json.load(f)


def dump(path, data):
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


def collect_outputs(questions):
    qids = {q['id'] for q in questions}
    problems, answers = [], {}
    for batch in load(os.path.join(HERE, 'manifest.json')):
        path = os.path.join(HERE, 'out', f"{batch['batch']}.json")
        if not os.path.exists(path):
            problems.append(f"{batch['batch']}: saída ausente")
            continue
        out = load(path, 'utf-8-sig')
        for pid in batch['ids']:
            got = out.get(pid)
            if not isinstance(got, dict):
                problems.append(f"{batch['batch']}: perfil {pid} ausente")
                continue
            bad = [k for k, v in got.items() if k not in qids or v not in CODES]
            missing = qids - set(got)
            if bad or missing:
                problems.append(f"{batch['batch']}: {pid} inválido (extras/códigos {bad}, faltando {sorted(missing)})")
                continue
            answers[(batch['catalog'], pid)] = got
        neutral = sum(v == 'N' for pid in batch['ids'] for v in out.get(pid, {}).values())
        total = len(batch['ids']) * len(qids)
        if total and neutral / total > 0.2:
            problems.append(f"{batch['batch']}: {neutral / total:.0%} de N (acima de 20%)")
    return problems, answers


def update_questions(questions):
    by_id = {q['id']: q for q in questions}
    pool_path = os.path.join(DATA, 'questions-pool.json')
    pool = load(pool_path)
    old_text = {}
    for q in pool:
        if q['id'] in by_id:
            new = by_id[q['id']]
            assert q['agreePole'] == new['agreePole'], q['id']
            old_text[q['id']] = q['text']
            q['text'], q['topic'], q['core'] = new['pt'], new['topic'], False
    dump(pool_path, pool)

    en_path = os.path.join(DATA, 'i18n', 'en', 'questions.json')
    en = load(en_path)
    for q in en:
        if q['id'] in by_id:
            q['text'] = by_id[q['id']]['en']
    dump(en_path, en)

    tpl_path = os.path.join(ROOT, 'profile-audit', 'questions-template.txt')
    with open(tpl_path, encoding='utf-8') as f:
        tpl = f.read()
    for qid, text in old_text.items():
        old = f'[id={qid}] {text}'
        assert old in tpl, qid
        tpl = tpl.replace(old, f"[id={qid}] {by_id[qid]['pt']}")
    with open(tpl_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(tpl)


def main():
    questions = load(os.path.join(HERE, 'new-questions.json'))
    problems, answers = collect_outputs(questions)
    for p in problems:
        print('ERRO', p)
    print(f'{len(answers)} perfis com respostas válidas')
    if problems or '--check' in sys.argv:
        sys.exit(1 if problems else 0)

    qmap = question_map()  # agreePole não muda, então serve antes e depois
    deltas = []
    for catalog, (profiles_file, key) in PROFILES.items():
        profiles_path = os.path.join(DATA, profiles_file)
        profiles = load(profiles_path)
        for profile in profiles:
            new = answers.get((catalog, profile[key]))
            if new is None:
                continue
            answers_path = os.path.join(ROOT, 'profile-audit', 'answers', catalog, f'{profile[key]}.json')
            with open(answers_path, encoding='utf-8-sig', newline='') as f:
                raw = f.read()
            archived = json.loads(raw)
            before = compute_vector(archived, qmap)
            for qid, code in new.items():
                axis = qid.rsplit('_', 1)[0]
                assert qid in archived[axis]['answers'], (profile[key], qid)
                archived[axis]['answers'][qid] = code
                # Troca só o valor no texto: os arquivos têm formatações variadas
                # (CRLF, indentação) e regravar o JSON inteiro sujaria o diff.
                raw, count = re.subn(rf'("{qid}"\s*:\s*")(?:DT|D|N|C|CT)(")', rf'\g<1>{code}\g<2>', raw)
                assert count == 1, (profile[key], qid, count)
            assert json.loads(raw) == archived, profile[key]
            after = compute_vector(archived, qmap)
            for axis in AXIS_ORDER:
                diff = after[axis] - before[axis]
                if diff:
                    value = min(100.0, max(0.0, profile['vector'][axis] + diff))
                    profile['vector'][axis] = round(value, 1)
                    deltas.append((abs(diff), catalog, profile[key], axis, round(diff, 1)))
            with open(answers_path, 'w', encoding='utf-8', newline='') as f:
                f.write(raw)
        dump(profiles_path, profiles)
    update_questions(questions)

    deltas.sort(reverse=True)
    print(f'{len(deltas)} eixos alterados; maiores mudanças:')
    for _, catalog, pid, axis, diff in deltas[:15]:
        print(f'  {catalog:<12} {pid:<32} {axis:<14} {diff:+}')


if __name__ == '__main__':
    main()
