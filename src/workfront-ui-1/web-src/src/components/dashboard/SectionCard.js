/*
 * <license header>
 */

/**
 * Generic card container used by every section of the dashboard.
 * Purely presentational: title, optional header action, and children.
 */
import { cardSurface, cardTitle, subtitleText } from './styles';

function SectionCard({ title, subtitle, action, accent, id, children }) {
  const className = `es-card ${cardSurface}${accent ? ' es-card--accent' : ''}`;
  const hasHead = title || action;
  return (
    <section className={className} id={id}>
      {hasHead && (
        <div className="es-card__head">
          <div>
            {title && <h2 className={`es-card__title ${cardTitle}`}>{title}</h2>}
            {subtitle && <div className={`es-card__subtitle ${subtitleText}`}>{subtitle}</div>}
          </div>
          {action && <div className="es-card__action">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export default SectionCard;
