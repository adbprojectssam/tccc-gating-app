/*
 * <license header>
 */

import { Badge } from '@react-spectrum/s2';
import SectionCard from './SectionCard';
import { bodyText, detailText } from './styles';

/** Key KPIs list — each row shows a name/target line and a status badge. */
function KeyKPIs({ data }) {
  if (!data) return null;
  return (
    <SectionCard title={data.title} subtitle={data.subtitle}>
      <ul className="es-kpis">
        {(data.items || []).map((item) => (
          <li key={item.id} className="es-kpi">
            <div className="es-kpi__text">
              <div className={`es-kpi__name ${bodyText}`}>{item.name}</div>
              <div className={`es-kpi__detail ${detailText}`}>{item.detail}</div>
            </div>
            {item.status && <Badge variant={item.status.tone}>{item.status.label}</Badge>}
          </li>
        ))}
      </ul>
      {data.footnote && <p className={`es-kpis__footnote ${detailText}`}>{data.footnote}</p>}
    </SectionCard>
  );
}

export default KeyKPIs;
