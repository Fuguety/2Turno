import { useEffect, useState } from 'react';
import { QuestionCard } from './components/QuestionCard';
import { LANG } from './i18n';
import { fetchElectionQuiz, submitElectionAnswers } from './services/electionApi';
import site from './site.json';
import profiles from './data/electionProfiles.generated.json';
import { CandidateCard, ComparisonAxis, ProfileCard, candidatePage, profileText } from './components/election/ProfileComponents';
import type { ElectionComparison, ElectionQuiz } from './types/election';
import type { AnswerValue, QuizPayload, QuizVariant } from './types/quiz';
import { selectAllQuestionsBalanced, selectAndBalanceQuestions } from './utils/quizSelection';

const languagePrefix = LANG === 'en' ? '/en' : '';
const text = LANG === 'pt' ? {
  title: '2 Turno — Lula x Flávio Bolsonaro',
  heading: 'Lula ou Flávio? Veja de quem você está mais perto.',
  introduction: 'Responda a perguntas sobre 12 temas, de impostos a armas, e compare suas respostas com as posições de Lula e Flávio Bolsonaro tiradas dos planos de governo e de atos públicos.',
  runoff: 'Segundo turno · 25 de outubro de 2026',
  candidates: 'Candidatos do segundo turno',
  proposals: 'Ver posições por eixo',
  start: 'Fazer o quiz',
  formats: ['Curto — 36 perguntas', 'Completo — 60 perguntas', 'Todos os temas — 72 perguntas'],
  previous: 'Anterior',
  next: 'Próxima',
  finish: 'Comparar respostas',
  restart: 'Começar novamente',
  loading: 'Carregando o quiz…',
  results: 'Suas respostas, Lula e Flávio Bolsonaro',
  closest: 'Mais próximo das suas respostas:',
  tie: 'Os dois candidatos estão igualmente próximos das suas respostas.',
  compatibility: 'Compatibilidade',
  axis: 'Eixo',
  user: 'Você',
  disclaimer: 'Proximidade neste questionário não é recomendação de voto. Posições sem evidência específica foram centradas; consulte as fontes e incertezas.',
  methodology: 'Metodologia e fontes',
  unavailable: 'Esta página não existe no 2 Turno.',
  leave: 'Voltar ao início',
  navigation: 'Navegação'
} : {
  title: '2 Turno — Lula vs. Flávio Bolsonaro',
  heading: 'Lula or Flávio? See who you are closer to.',
  introduction: 'Answer questions on 12 topics, from taxes to guns, and compare your answers with Lula’s and Flávio Bolsonaro’s positions, drawn from their government programmes and public record.',
  runoff: 'Runoff · 25 October 2026',
  candidates: 'Runoff candidates',
  proposals: 'See positions by axis',
  start: 'Take the quiz',
  formats: ['Short — 36 questions', 'Extended — 60 questions', 'All topics — 72 questions'],
  previous: 'Previous',
  next: 'Next',
  finish: 'Compare answers',
  restart: 'Start again',
  loading: 'Loading the quiz…',
  results: 'Your answers, Lula and Flávio Bolsonaro',
  closest: 'Closest to your answers:',
  tie: 'Both candidates are equally close to your answers.',
  compatibility: 'Compatibility',
  axis: 'Axis',
  user: 'You',
  disclaimer: 'Closeness on this questionnaire is not a voting recommendation. Positions without specific evidence were centered; consult the sources and uncertainty.',
  methodology: 'Methodology and sources',
  unavailable: 'This page does not exist on 2 Turno.',
  leave: 'Return home',
  navigation: 'Navigation'
};

export default function ElectionApp()
{
  const [choosingFormat, setChoosingFormat] = useState(false);
  const [variant, setVariant] = useState<QuizVariant>('extended');
  const [model, setModel] = useState<ElectionQuiz | null>(null);
  const [quiz, setQuiz] = useState<QuizPayload | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [comparison, setComparison] = useState<ElectionComparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const path = window.location.pathname.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
  const available = ['/', '/br', '/en', '/results', '/en/results', '/240questions'].includes(path);

  useEffect(() =>
  {
    document.title = text.title;
    document.documentElement.lang = LANG === 'pt' ? 'pt-BR' : 'en';
  }, []);

  async function startQuiz()
  {
    setBusy(true);
    setError(null);
    try
    {
      const response = await fetchElectionQuiz(variant);
      setModel(response);
      setQuiz(variant === 'extreme' ? selectAllQuestionsBalanced(response.quiz) : selectAndBalanceQuestions(response.quiz));
      setAnswers({});
      setQuestionIndex(0);
      setComparison(null);
    }
    catch (failure)
    {
      setError((failure as Error).message);
    }
    finally
    {
      setBusy(false);
    }
  }



  async function finishQuiz()
  {
    if (!quiz || !model) return;
    setBusy(true);
    setError(null);
    try
    {
      const result = await submitElectionAnswers({
        modelId: model.modelId,
        variant: quiz.variant,
        answers: quiz.questions.map(question => ({ questionId: question.id, answer: answers[question.id] }))
      });
      setComparison(result);
      setQuiz(null);
    }
    catch (failure)
    {
      setError((failure as Error).message);
    }
    finally
    {
      setBusy(false);
    }
  }

  const question = quiz?.questions[questionIndex];

  return <div className="election-app">
    <header className="election-header">
      <a className="election-brand" href={languagePrefix || '/'}>{site.name}</a>
      <nav aria-label={text.navigation}>
        {site.candidates.map(candidate => <a key={candidate.id} href={candidatePage(candidate.id)}>{candidate.name}</a>)}
        <a href={`${languagePrefix}/election-methodology`}>{text.methodology}</a>
        <a href={LANG === 'pt' ? '/en' : '/'} lang={LANG === 'pt' ? 'en' : 'pt-BR'}>{LANG === 'pt' ? 'English' : 'Português'}</a>
      </nav>
    </header>
    <main>
      {!available ? <section><h1>{text.unavailable}</h1><a href={languagePrefix || '/'}>{text.leave}</a></section> : <>
        {error && <p role="alert">{error}</p>}
        {busy && <p role="status">{text.loading}</p>}
        {!quiz && !comparison && <>
          <p className="election-kicker">{text.runoff}</p>
          <h1>{text.heading}</h1>
          <p>{text.introduction}</p>
          <div className="home-options">
            <article className="questionnaire-card">
              <span className="questionnaire-symbol" aria-hidden="true">12</span>
              <h2>{profileText.questionnaire}</h2>
              <p>{profileText.questionnaireDescription}</p>
              <button className="profile-link" type="button" disabled={busy} onClick={() => setChoosingFormat(true)}>{profileText.start}</button>
            </article>
            {profiles.candidates.map(candidate => <CandidateCard key={candidate.id} candidate={candidate} />)}
          </div>
          {choosingFormat && <section className="election-start" aria-label={profileText.formats}>
            <fieldset className="format-options">
              <legend>{profileText.formats}</legend>
              {(['short', 'extended', 'extreme'] as const).map((format, index) => <label key={format}>
                <input type="radio" name="questionnaire-format" value={format} checked={variant === format}
                  onChange={() => setVariant(format)} disabled={busy} />{text.formats[index]}
              </label>)}
            </fieldset>
            <button type="button" onClick={startQuiz} disabled={busy}>{profileText.begin}</button>
          </section>}
        </>}
        {quiz && question && <section>
          <p>{questionIndex + 1} / {quiz.questions.length}</p>
          <progress aria-label={text.start} value={Object.keys(answers).length} max={quiz.questions.length} />
          <QuestionCard key={question.id} question={question} axisLabel={quiz.axes.find(axis => axis.id === question.axisId)?.label}
            options={quiz.answerOptions} selected={answers[question.id]} disabled={busy}
            onSelect={answer => setAnswers(previous => ({ ...previous, [question.id]: answer }))} />
          <div className="election-actions">
            <button type="button" disabled={busy || questionIndex === 0} onClick={() => setQuestionIndex(questionIndex - 1)}>{text.previous}</button>
            {questionIndex < quiz.questions.length - 1
              ? <button type="button" disabled={busy || !answers[question.id]} onClick={() => setQuestionIndex(questionIndex + 1)}>{text.next}</button>
              : <button type="button" disabled={busy || Object.keys(answers).length !== quiz.questions.length} onClick={finishQuiz}>{text.finish}</button>}
          </div>
        </section>}
        {comparison && <section>
          <h1>{text.results}</h1>
          <p>{comparison.closestCandidateIds.length === 2 ? text.tie : `${text.closest} ${comparison.candidates[0].name}`}</p>
          <ProfileCard axes={comparison.axes.map(entry => entry.axis)}
            scores={Object.fromEntries(comparison.axes.map(entry => [entry.axis.id, entry.userScore]))} />
          <h2>{text.candidates}</h2>
          <div className="election-grid">{comparison.candidates.map(match =>
          {
            const candidate = profiles.candidates.find(profile => profile.id === match.id);
            if (!candidate) return null;
            const scores = Object.fromEntries(comparison.axes.map(entry => [entry.axis.id, entry.candidateScores[match.id]]));
            return <CandidateCard key={match.id} candidate={{ ...candidate, scores }} compatibility={match.compatibility} />;
          })}</div>
          <section className="comparison-section" aria-labelledby="comparison-title">
            <h2 id="comparison-title">{profileText.compare}</h2>
            <p>{profileText.exact}</p>
            {comparison.axes.map(entry => <ComparisonAxis key={entry.axis.id} axis={entry.axis} markers={[
              { name: profileText.you, symbol: '★', score: entry.userScore },
              ...profiles.candidates.map(candidate => ({ name: candidate.name, symbol: String(candidate.number), score: entry.candidateScores[candidate.id] }))
            ]} />)}
          </section>
          <p>{text.disclaimer}</p>
          <a href={`${languagePrefix}/election-methodology`}>{text.methodology}</a>
          <div className="election-actions"><button type="button" onClick={() => setComparison(null)}>{text.restart}</button></div>
        </section>}
      </>}
    </main>
    <footer>{site.name} · {text.runoff}</footer>
  </div>;
}
