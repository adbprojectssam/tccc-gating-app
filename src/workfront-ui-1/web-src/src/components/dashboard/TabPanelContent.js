/*
 * <license header>
 */

import { getIcon } from './iconRegistry';
import { cardTitle, bodyText } from './styles';

/**
 * Renders the gray content box shown under the view tabs. Layout adapts to the
 * panel shape: a summary paragraph (Executive Summary), a 2-column checklist
 * (Learning Plan), or a 2-column risk grid with severity badges (Risk View).
 */
function TabPanelContent({ panel }) {
  if (!panel) return null;
  const Checkmark = getIcon('checkmark');

  return (
    <div className="es-tabbox">
      <div className="es-tabpanel__head">
        <h3 className={`es-tabpanel__heading ${cardTitle}`}>{panel.heading}</h3>
        {panel.summary && (
          <span className={`es-tabpanel__summary ${bodyText}`}>
            <strong>{panel.summary.strong}</strong> {panel.summary.rest}
          </span>
        )}
      </div>

      {panel.paragraph && <p className={`es-tabpanel__text ${bodyText}`}>{panel.paragraph}</p>}

      {panel.items && (
        <div className="es-tabpanel__grid">
          {panel.items.map((item) => (
            <div key={item.id} className="es-tabpanel__item">
              {Checkmark && <Checkmark aria-hidden="true" />}
              <span className={bodyText}>{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {panel.risks && (
        <div className="es-tabpanel__grid">
          {panel.risks.map((risk) => (
            <div key={risk.id} className="es-tabpanel__item es-tabpanel__item--risk">
              <span className={`es-tabpanel__risk-title ${bodyText}`}>{risk.title}</span>
              <span className={`es-risk-badge es-risk-badge--${risk.severity.tone}`}>
                {risk.severity.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TabPanelContent;
