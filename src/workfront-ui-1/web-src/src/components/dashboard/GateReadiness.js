/*
 * <license header>
 */

import { ProgressBar, StatusLight } from '@react-spectrum/s2';
import { progressWidth, cardSurface, cardTitle, detailText } from './styles';
import { LABELS, formatLabel } from '../../constants/labels';

/** Readiness checklist with a completion progress bar and optional legend. */
function GateReadiness({ data }) {
  if (!data) return null;
  const total = data.total || (data.items ? data.items.length : 0);
  const completed = data.completed || 0;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  return (
    <section className={`es-readiness es-card--accent ${cardSurface}`}>
      <div className="es-readiness__head">
        <h2 className={`es-card__title ${cardTitle}`}>{data.title}</h2>
        <ProgressBar styles={progressWidth} aria-label={`${data.title} progress`} value={percent} />
        <span className={`es-readiness__count ${detailText}`}>
          {formatLabel(LABELS.templates.countComplete, { completed, total })}
        </span>
      </div>

      <ul className="es-readiness__list">
        {(data.items || []).map((item) => (
          <li key={item.id}>
            <StatusLight variant={item.tone || (item.done ? 'positive' : 'neutral')}>
              {item.label}
            </StatusLight>
          </li>
        ))}
      </ul>

      {data.legend && data.legend.length > 0 && (
        <div className="es-readiness__legend">
          {data.legend.map((entry) => (
            <StatusLight key={entry.id} variant={entry.tone}>
              {entry.label}
            </StatusLight>
          ))}
        </div>
      )}
    </section>
  );
}

export default GateReadiness;
