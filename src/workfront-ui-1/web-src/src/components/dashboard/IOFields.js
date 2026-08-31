/*
 * <license header>
 */

import {
  TextField,
  TextArea,
  Picker,
  PickerItem,
  DatePicker,
  Link,
  InlineAlert,
  Heading,
  Content,
} from '@react-spectrum/s2';
import SectionCard from './SectionCard';
import { fullWidth } from './styles';

/**
 * Configurable IO fields section. Renders one input per field based on
 * `field.type` (text | textarea | select | date), honoring `required`,
 * `placeholder`, `isReadOnly` and `value`. Reused for both Gate 1 (read-only,
 * locked "Business Case") and Gate 2 (editable, required "Margin Guidance").
 */
function renderField(field) {
  const common = {
    styles: fullWidth,
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

  const action = data.workfrontUrl ? (
    <Link href={data.workfrontUrl} target="_blank">
      {data.workfrontLabel}
    </Link>
  ) : null;

  return (
    <SectionCard title={data.title} action={action}>
      <div className="es-fields">{(data.fields || []).map(renderField)}</div>

      {data.locked && (
        <InlineAlert variant="informative">
          <Heading>{data.lockedTitle || 'Locked'}</Heading>
          <Content>{data.lockedMessage}</Content>
        </InlineAlert>
      )}
    </SectionCard>
  );
}

export default IOFields;
