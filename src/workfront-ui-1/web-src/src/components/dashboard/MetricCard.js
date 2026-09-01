/*
 * <license header>
 */

import { StatusLight, Badge } from '@react-spectrum/s2';
import MiniBars from './MiniBars';
import { metricSurface, metricValue, labelText, detailText, chartValue, chartCaption, deltaText } from './styles';

/** Renders the right-hand visual of a metric card based on `visual.kind`. */
function MetricVisual({ visual }) {
  if (!visual) return null;

  if (visual.kind === 'bars') {
    return (
      <MiniBars
        data={visual.data}
        caption={visual.caption}
        ariaLabel={visual.ariaLabel}
        marker={visual.marker}
      />
    );
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
    // Figma "zooms" the bars: both fill most of the chart height so the small
    // gap between the values stays readable (tallest ≈ full, shortest ≈ 90%).
    const pcts = visual.bars.map((bar) => bar.pct);
    const maxPct = Math.max(...pcts);
    const minPct = Math.min(...pcts);
    const span = maxPct - minPct;
    const barHeight = (pct) => (span === 0 ? 100 : 90 + ((pct - minPct) / span) * 10);
    return (
      <div className="es-compare">
        {visual.bars.map((bar) => (
          <div className="es-compare__col" key={bar.id}>
            <span className={`es-compare__value ${chartValue}`}>{bar.value}</span>
            <div className="es-compare__track">
              <div
                className={bar.highlight ? 'es-compare__bar es-compare__bar--hl' : 'es-compare__bar'}
                style={{ height: `${barHeight(bar.pct)}%` }}
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
            <span className="es-trend">
              <StatusLight variant={metric.trend.tone || 'positive'}>
                {metric.trend.label || metric.trend.text}
              </StatusLight>
              {metric.trend.delta && (
                <span className={`es-trend__delta ${deltaText}`}>
                  <span
                    className={`es-trend__arrow es-trend__arrow--${metric.trend.tone || 'positive'}`}
                    aria-hidden="true"
                  >
                    {metric.trend.direction === 'down' ? '▼' : '▲'}
                  </span>
                  {metric.trend.delta}
                </span>
              )}
            </span>
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
