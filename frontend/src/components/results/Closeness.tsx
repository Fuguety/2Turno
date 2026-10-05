import type { CSSProperties, ReactNode } from 'react';
import { t } from '../../i18n';
import type { Axis, AxisResult } from '../../types/quiz';

// Eixos que mais aproximam o usuário de um perfil (personalidade ou país): menor
// distância entre os dois valores, preferindo eixos em que o usuário tem posição definida.
const CLOSENESS_AXES = 3;
const BALANCED_DISTANCE = 7.5;
const BALANCED_PENALTY = 15;

interface ClosenessProps {
  /** Vetor de 12 eixos (leftPercent) do perfil comparado. */
  vector?: Record<string, number>;
  name: string;
  /** Miniatura do perfil no marcador (retrato ou bandeira). */
  face: ReactNode;
  axes: Axis[];
  results: Map<string, AxisResult>;
}

export function Closeness({ vector, name, face, axes, results }: ClosenessProps) {
  if (!vector) return null;
  const rows = axes
    .map((axis) => {
      const result = results.get(axis.id);
      const target = vector[axis.id];
      if (!result || target === undefined) return null;
      const user = result.leftPercent;
      const balanced = Math.abs(user - 50) < BALANCED_DISTANCE;
      return { axis, result, user, target, rank: Math.abs(user - target) + (balanced ? BALANCED_PENALTY : 0) };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.rank - b.rank)
    .slice(0, CLOSENESS_AXES);
  if (rows.length === 0) return null;

  return (
    <div className="e-close">
      <p className="e-close-title">{t.closenessTitle}</p>
      <ul>
        {rows.map(({ axis, result, user, target }) => {
          // leftPercent alto = polo esquerdo; na trilha o polo esquerdo fica à esquerda.
          const color = user >= 50 ? axis.leftColor : axis.rightColor;
          return (
            <li key={axis.id} style={{ '--ac': color } as CSSProperties}>
              <div className="e-close-head">
                <b>{result.label}</b>
                <span>{user >= 50 ? result.leftPole : result.rightPole}</span>
              </div>
              <div
                className="e-close-track"
                role="img"
                aria-label={`${result.label}: ${t.closenessYou} ${Math.round(user)}% ${result.leftPole}, ${name} ${Math.round(target)}% ${result.leftPole}`}
              >
                <span className="e-close-mid" />
                <span className="e-close-pin e-close-them" style={{ left: `${100 - target}%` }} title={name}>
                  {face}
                </span>
                <span className="e-close-pin e-close-you" style={{ left: `${100 - user}%` }} title={t.closenessYou}>
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z" />
                  </svg>
                </span>
              </div>
              <div className="e-close-poles">
                <span>{result.leftPole}</span>
                <span>{result.rightPole}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
