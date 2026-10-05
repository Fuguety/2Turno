import { t } from '../i18n';

interface ProgressHeaderProps {
  current: number;
  total: number;
  /** Perguntas por eixo, vindo do payload. */
  questionsPerAxis?: number;
  /** Numero de eixos: define quantos segmentos a barra tem. */
  axisCount?: number;
  /** Perguntas de arquetipo do fim do quiz: ganham um segmento proprio no fim da barra. */
  extraCount?: number;
  /** Posicao (1..extraCount) na etapa de arquetipo; ausente durante as perguntas comuns. */
  extraCurrent?: number;
}

export function ProgressHeader({ current, total, axisCount, extraCount = 0, extraCurrent }: ProgressHeaderProps) {
  // Na etapa de arquetipo as perguntas comuns ja estao completas e o segmento
  // extra avanca; o texto troca de "Pergunta X de 36" para o arquetipo.
  const inExtra = extraCurrent !== undefined && extraCount > 0;
  // Porcentagem pelas perguntas ja respondidas sobre o total com as extras:
  // so chega a 100% quando o arquetipo tambem foi respondido.
  const grandTotal = total + extraCount;

  // Um segmento por pergunta quando cabe (ate axisCount); acima disso, um
  // segmento por bloco de perguntas (240/12 = 20), com preenchimento parcial.
  const segmentCount = Math.max(1, Math.min(total, axisCount && axisCount > 0 ? axisCount : 12));
  const perSegment = total / segmentCount;
  const answered = inExtra ? total + extraCurrent - 1 : Math.max(0, current - 1);
  const percent = grandTotal === 0 ? 0 : Math.round((answered / grandTotal) * 100);

  const label = inExtra ? t.archetypeHeader : t.progress(current, total);
  const splitAt = inExtra ? -1 : label.indexOf(' ');

  return (
    <header className="quiz-progress">
      <div className="quiz-progress-meta">
        <span>
          {splitAt > 0 ? (
            <>
              {label.slice(0, splitAt + 1)}
              <b>{label.slice(splitAt + 1)}</b>
            </>
          ) : (
            label
          )}
        </span>
        <span>{inExtra ? t.archetypeStep(extraCurrent, extraCount) : t.progressDone(percent)}</span>
      </div>
      <div
        className="quiz-progress-segs"
        role="progressbar"
        aria-label={t.progressAria(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        {Array.from({ length: segmentCount + (extraCount > 0 ? 1 : 0) }, (_, index) => {
          const isExtra = index === segmentCount;
          const start = isExtra ? total : index * perSegment;
          const size = isExtra ? extraCount : perSegment;
          const end = start + size;
          const isDone = answered >= end;
          const isNow = !isDone && answered >= start && answered < end;
          const fill = isDone ? 100 : isNow ? ((answered - start) / size) * 100 : 0;
          return (
            <span key={index} className={isDone ? 'done' : isNow ? 'now' : undefined} aria-hidden="true">
              <i style={{ width: `${fill}%` }} />
            </span>
          );
        })}
      </div>
    </header>
  );
}
