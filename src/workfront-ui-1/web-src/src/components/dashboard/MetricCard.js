/*
 * <license header>
 */

import { StatusLight, Badge } from '@react-spectrum/s2';
import MiniBars from './MiniBars';
import { metricSurface, metricValue, labelText, detailText, chartValue, chartCaption } from './styles';

/** Renders the right-hand visual of a metric card based on `visual.kind`. */
function MetricVisual({ visual }) {
  if (!visual) return null;

  if (visual.kind === 'bars') {
    return <MiniBars data={visual.data} caption={visual.caption} ariaLabel={visual.ariaLabel} />;
  }

  if (visual.kind === 'meter') {
    // Figma "Progress bar (S)": two rows — label + value (space-between) on top,
    // seafoam track full-width below.
    return (
      <div className="es-capex">
        <div className="es-capex__head">
          <span className={`es-capex__label ${detailText}`}>{visual.label}</span>
          <span className={`es-capex__value ${detailText}`}>{visual.percent}%</span>
        </div>
        <div className="es-capex__track">
          <div className="es-capex__fill" style={{ width: `${visual.percent}%` }} />
        </div>
      </div>
    );
  }

  if (visual.kind === 'comparison') {
    return (
      <div className="es-compare">
        {visual.bars.map((bar) => (
          <div className="es-compare__col" key={bar.id}>
            <span className={`es-compare__value ${chartValue}`}>{bar.value}</span>
            <div className="es-compare__track">
              <div
                className={bar.highlight ? 'es-compare__bar es-compare__bar--hl' : 'es-compare__bar'}
                style={{ height: `${bar.pct}%` }}
              />
            </div>
            <span className={`es-compare__label ${chartCaption}`}>{bar.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

/** A single Key Metrics card. Presentational — driven entirely by `metric`. */
function MetricCard({ metric }) {
  return (
    <div className={`es-metric ${metricSurface}`}>
      <div className="es-metric__left">
        <div className={`es-metric__value ${metricValue}`}>{metric.value}</div>
        <div className={`es-metric__label ${labelText}`}>{metric.label}</div>
        <div className="es-metric__delta">
          {metric.trend && (
            <StatusLight variant={metric.trend.tone || 'positive'}>{metric.trend.text}</StatusLight>
          )}
          {metric.badge && <Badge variant={metric.badge.tone || 'neutral'}>{metric.badge.label}</Badge>}
          {metric.footnote && (
            <span className={`es-metric__footnote ${detailText}`}>{metric.footnote}</span>
          )}
        </div>
      </div>
      <div className="es-metric__visual">
        <MetricVisual visual={metric.visual} />
      </div>
    </div>
  );
}

export default MetricCard;
