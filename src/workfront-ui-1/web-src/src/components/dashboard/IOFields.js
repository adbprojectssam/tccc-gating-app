/*
 * <license header>
 */

import {
  TextField,
  TextArea,
  Picker,
  PickerItem,
  DatePicker,
} from '@react-spectrum/s2';
import SectionCard from './SectionCard';
import { getIcon } from './iconRegistry';
import { fullWidth, bannerBody, linkText } from './styles';

const InfoCircle = getIcon('infoCircle');

/**
 * Configurable IO fields section. Renders one input per field based on
 * `field.type` (text | textarea | select | date), honoring `required`,
 * `placeholder`, `isReadOnly` and `value`. Reused for both Gate 1 (read-only,
 * locked "Business Case") and Gate 2 (editable, required "Margin Guidance").
 * Fields are size "L" (16px) to match Figma "Text field (L)".
 */
function renderField(field) {
  const common = {
    styles: fullWidth,
    size: 'L',
    label: field.label,
    isRequired: field.required,
    necessityIndicator: field.required ? 'icon' : undefined,
    isReadOnly: field.isReadOnly,
  };

  switch (field.type) {
    case 'select':
      return (
        <Picker key={field.id} {...common} placeholder={field.placeholder}>
          {(field.options || []).map((option) => (
            <PickerItem key={option.id} id={option.id}>
              {option.label}
            </PickerItem>
          ))}
        </Picker>
      );
    case 'date':
      return <DatePicker key={field.id} {...common} />;
    case 'textarea':
      return (
        <TextArea
          key={field.id}
          {...common}
          value={field.isReadOnly ? field.value : undefined}
          defaultValue={field.isReadOnly ? undefined : field.value}
          placeholder={field.placeholder}
        />
      );
    case 'text':
    default:
      return (
        <TextField
          key={field.id}
          {...common}
          value={field.isReadOnly ? field.value : undefined}
          defaultValue={field.isReadOnly ? undefined : field.value}
          placeholder={field.placeholder}
        />
      );
  }
}

function IOFields({ data }) {
  if (!data) return null;

  // Figma "Open in Workfront" link: dark (#292929), medium, underlined.
  const action = data.workfrontUrl ? (
    <a className={`es-link ${linkText}`} href={data.workfrontUrl} target="_blank" rel="noreferrer">
      {data.workfrontLabel}
    </a>
  ) : null;

  return (
    <SectionCard title={data.title} action={action}>
      <div className="es-fields">{(data.fields || []).map(renderField)}</div>

      {data.locked && (
        <div className="es-banner es-banner--info es-banner--row">
          <p className={`es-banner__body ${bannerBody}`}>
            {data.lockedTitle ? `${data.lockedTitle} - ${data.lockedMessage}` : data.lockedMessage}
          </p>
          {InfoCircle && (
            <span className="es-banner__icon" aria-hidden="true">
              <InfoCircle />
            </span>
          )}
        </div>
      )}
    </SectionCard>
  );
}

export default IOFields;
