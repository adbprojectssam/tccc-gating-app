/*
 * <license header>
 */

import MetricCard from './MetricCard';
import { sectionTitle } from './styles';

/** The "Key Metrics" row of metric cards. */
function KeyMetrics({ data }) {
  if (!data) return null;
  return (
    <section className="es-metrics">
      {data.title && <h2 className={`es-section-title ${sectionTitle}`}>{data.title}</h2>}
      <div className="es-metrics__grid">
        {(data.metrics || []).map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </div>
    </section>
  );
}

export default KeyMetrics;
