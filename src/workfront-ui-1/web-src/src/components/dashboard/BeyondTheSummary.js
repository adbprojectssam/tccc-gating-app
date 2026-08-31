/*
 * <license header>
 */

import { useState } from 'react';
import { SegmentedControl, SegmentedControlItem, InlineAlert, Heading, Content } from '@react-spectrum/s2';
import SectionCard from './SectionCard';
import { detailText, cardTitle, overlineText, bodyText } from './styles';

/**
 * "Beyond the Summary" — a SegmentedControl (Commercial / Technical / Planning /
 * Financial) that swaps a labeled field grid + an optional dependency note.
 * Fully data-driven via `data.tabs`.
 */
function BeyondTheSummary({ data }) {
  const tabs = (data && data.tabs) || [];
  const [selected, setSelected] = useState((data && data.selectedTab) || (tabs[0] && tabs[0].id));
  if (!data) return null;

  const active = tabs.find((tab) => tab.id === selected) || tabs[0];

  return (
    <SectionCard title={data.title}>
      {data.description && <p className={`es-beyond__desc ${detailText}`}>{data.description}</p>}

      <SegmentedControl
        aria-label="Beyond the summary categories"
        defaultSelectedKey={selected}
        onSelectionChange={setSelected}
      >
        {tabs.map((tab) => (
          <SegmentedControlItem key={tab.id} id={tab.id}>
            {tab.label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>

      {active && (
        <div className="es-beyond__panel">
          {active.sectionTitle && <h3 className={`es-beyond__subtitle ${cardTitle}`}>{active.sectionTitle}</h3>}
          <div className="es-beyond__grid">
            {(active.fields || []).map((field) => (
              <div key={field.id} className="es-beyond__field">
                <div className={`es-beyond__label ${overlineText}`}>{field.label}</div>
                <div className={`es-beyond__value ${bodyText}${field.tone ? ` es-beyond__value--${field.tone}` : ''}`}>
                  {field.value}
                </div>
              </div>
            ))}
          </div>
          {active.note && (
            <InlineAlert variant="informative">
              <Heading>{active.note.title}</Heading>
              <Content>{active.note.text}</Content>
            </InlineAlert>
          )}
        </div>
      )}
    </SectionCard>
  );
}

export default BeyondTheSummary;
