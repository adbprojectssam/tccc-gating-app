/*
 * <license header>
 */

import {
  InlineAlert,
  Heading,
  Content,
  Link,
  Badge,
  Picker,
  PickerItem,
  TextArea,
} from '@react-spectrum/s2';
import SectionCard from './SectionCard';
import { fullWidth, bodyText, detailText } from './styles';

/** Current gate detail: status banner, stage, tags and PMO comments. */
function GateDetailCard({ gate, onLiveStatusChange }) {
  if (!gate) return null;

  const liveStatus = gate.liveStatus;
  const action = liveStatus ? (
    <Picker
      aria-label={liveStatus.ariaLabel}
      defaultSelectedKey={liveStatus.selectedKey}
      onSelectionChange={(key) => onLiveStatusChange && onLiveStatusChange(key)}
    >
      {liveStatus.options.map((option) => (
        <PickerItem key={option.id} id={option.id}>
          {option.label}
        </PickerItem>
      ))}
    </Picker>
  ) : null;

  return (
    <SectionCard title={gate.title} subtitle={gate.target} action={action}>
      {gate.approval && (
        <InlineAlert variant={gate.approval.tone || 'positive'}>
          <Heading>{gate.approval.title}</Heading>
          <Content>
            {gate.approval.detail}
            {gate.approval.linkLabel && (
              <>
                {' '}
                <Link href={gate.approval.linkHref || '#'}>{gate.approval.linkLabel}</Link>
              </>
            )}
          </Content>
        </InlineAlert>
      )}

      {gate.stage && (
        <div className="es-stage">
          <p className={`es-stage__title ${bodyText}`}>
            <strong>{gate.stage.label}</strong> {gate.stage.text}
          </p>
          {(gate.stage.statusLabel || gate.stage.approvedOn) && (
            <div className="es-stage__row">
              {gate.stage.statusLabel && (
                <Badge variant={gate.stage.tone || 'positive'}>{gate.stage.statusLabel}</Badge>
              )}
              {gate.stage.approvedOn && (
                <span className={`es-stage__approved ${detailText}`}>{gate.stage.approvedOn}</span>
              )}
            </div>
          )}
          {gate.tags && gate.tags.length > 0 && (
            <div className="es-tag-row">
              {gate.tags.map((tag) => (
                <Badge key={tag} variant="neutral">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {gate.pmoComments && (
        <div className="es-pmo">
          <TextArea
            styles={fullWidth}
            label={gate.pmoComments.label}
            value={gate.pmoComments.value || ''}
            isReadOnly
            description={!gate.pmoComments.value ? gate.pmoComments.emptyText : undefined}
          />
        </div>
      )}
    </SectionCard>
  );
}

export default GateDetailCard;
