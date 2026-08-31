/*
 * <license header>
 */

import {
  sectionTitle,
  stepLabel,
  stepStatus,
  markerGlyph,
  markerCompleted,
  markerCurrent,
  markerAttention,
  markerNotStarted,
} from './styles';

const MARKER_TOKENS = {
  completed: markerCompleted,
  current: markerCurrent,
  attention: markerAttention,
  'not-started': markerNotStarted,
};

/**
 * Vertical gate stepper matching the design (circular markers + connector
 * lines + status colors). Controlled by the parent via `selectedKey` so it can
 * drive which gate's data is shown.
 *
 * Marker styling:
 *   - completed        → green filled (always)
 *   - selected + !done → "current" dark filled (the gate being viewed)
 *   - attention        → red outline
 *   - not-started      → gray outline, disabled (not clickable)
 */
function GatePipeline({ data, selectedKey, onGateSelect }) {
  if (!data) return null;
  const gates = data.gates || [];

  return (
    <nav className="es-pipeline" aria-label={data.title}>
      {data.title && <h2 className={`es-section-title ${sectionTitle}`}>{data.title}</h2>}
      <ol className="es-pipeline__list">
        {gates.map((gate, index) => {
          const id = String(gate.number);
          const disabled = gate.status === 'not-started';
          const isSelected = id === String(selectedKey);
          const markerState =
            gate.status !== 'completed' && isSelected ? 'current' : gate.status;
          const stepClass = `es-step es-step--${gate.status}${isSelected ? ' es-step--selected' : ''}`;
          return (
            <li key={gate.number} className={stepClass}>
              <button
                type="button"
                className="es-step__btn"
                disabled={disabled}
                aria-current={isSelected ? 'step' : undefined}
                onClick={() => onGateSelect && onGateSelect(id)}
              >
                <span className={`es-step__marker ${markerGlyph} ${MARKER_TOKENS[markerState]}`} aria-hidden="true">
                  {gate.status === 'completed' ? '✓' : gate.number}
                </span>
                <span className="es-step__text">
                  <span className={`es-step__label ${stepLabel}`}>{gate.label}</span>
                  <span className={`es-step__status ${stepStatus}`}>{gate.statusLabel}</span>
                </span>
              </button>
              {index < gates.length - 1 && <span className="es-step__line" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default GatePipeline;
