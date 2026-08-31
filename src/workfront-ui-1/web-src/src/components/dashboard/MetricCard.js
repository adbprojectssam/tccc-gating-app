/*
 * <license header>
 */

import { Meter, StatusLight, Badge } from '@react-spectrum/s2';
import MiniBars from './MiniBars';
import { fullWidth, metricSurface, metricValue, labelText, detailText } from './styles';

/** Renders the right-hand visual of a metric card based on `visual.kind`. */
function MetricVisual({ visual }) {
  if (!visual) return null;

  if (visual.kind === 'bars') {
    return <MiniBars data={visual.data} caption={visual.caption} ariaLabel={visual.ariaLabel} />;
  }

  if (visual.kind === 'meter') {
    return (
      <div className="es-metric__meter">
        <Meter
          styles={fullWidth}
          label={visual.label}
          value={visual.percent}
          variant={visual.tone || 'informative'}
        />
      </div>
    );
  }

  if (visual.kind === 'comparison') {
    return (
      <div className="es-compare">
        {visual.bars.map((bar) => (
          <div className="es-compare__col" key={bar.id}>
            <span className="es-compare__value">{bar.value}</span>
            <div className="es-compare__track">
              <div
                className={bar.highlight ? 'es-compare__bar es-compare__bar--hl' : 'es-compare__bar'}
                style={{ height: `${bar.pct}%` }}
              />
            </div>
            <span className="es-compare__label">{bar.label}</span>
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
      <div className="es-metric__body">
        <div className="es-metric__text">
          <div className={`es-metric__value ${metricValue}`}>{metric.value}</div>
          <div className={`es-metric__label ${labelText}`}>{metric.label}</div>
          {metric.trend && (
            <StatusLight variant={metric.trend.tone || 'positive'}>{metric.trend.text}</StatusLight>
          )}
        </div>
        <div className="es-metric__visual">
          <MetricVisual visual={metric.visual} />
        </div>
      </div>
      <div className="es-metric__foot">
        {metric.badge && <Badge variant={metric.badge.tone || 'neutral'}>{metric.badge.label}</Badge>}
        {metric.footnote && <span className={`es-metric__footnote ${detailText}`}>{metric.footnote}</span>}
      </div>
    </div>
  );
}

export default MetricCard;
