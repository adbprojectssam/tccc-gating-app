/*
 * <license header>
 */

import {
  Badge,
  Picker,
  PickerItem,
  TextArea,
  Text,
} from '@react-spectrum/s2';
import MovieCamera from '@react-spectrum/s2/icons/MovieCamera';
import SectionCard from './SectionCard';
import { getIcon } from './iconRegistry';
import { fullWidth, stageText, detailText, bannerTitle, bannerBody, linkText } from './styles';

const CheckmarkCircle = getIcon('checkmarkCircle');

/** Current gate detail: status banner, stage, tags and PMO comments. */
function GateDetailCard({ gate, onLiveStatusChange }) {
  if (!gate) return null;

  const liveStatus = gate.liveStatus;
  // Figma "Picker (S)" with an orange movie-camera leading icon. S2 re-renders
  // the value-slot icon with its own classes, so the orange fill is applied via
  // the .es-live-status wrapper in CSS (targets the value icon, not the chevron).
  const action = liveStatus ? (
    <span className="es-live-status">
      <Picker
        size="S"
        aria-label={liveStatus.ariaLabel}
        defaultSelectedKey={liveStatus.selectedKey}
        onSelectionChange={(key) => onLiveStatusChange && onLiveStatusChange(key)}
      >
        {liveStatus.options.map((option) => (
          <PickerItem key={option.id} id={option.id} textValue={option.label}>
            <MovieCamera />
            <Text>{option.label}</Text>
          </PickerItem>
        ))}
      </Picker>
    </span>
  ) : null;

  return (
    <SectionCard title={gate.title} subtitle={gate.target} action={action}>
      {gate.approval && (
        <div className="es-banner es-banner--positive">
          <div className="es-banner__head">
            <span className={`es-banner__title ${bannerTitle}`}>{gate.approval.title}</span>
            {CheckmarkCircle && (
              <span className="es-banner__icon" aria-hidden="true">
                <CheckmarkCircle />
              </span>
            )}
          </div>
          <p className={`es-banner__body ${bannerBody}`}>{gate.approval.detail}</p>
          {gate.approval.linkLabel && (
            <a className={`es-link ${linkText}`} href={gate.approval.linkHref || '#'}>
              {gate.approval.linkLabel}
            </a>
          )}
        </div>
      )}

      {gate.stage && (
        <div className="es-stage">
          <p className={`es-stage__title ${stageText}`}>
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
        </div>
      )}

      {gate.tags && gate.tags.length > 0 && (
        <div className="es-tag-row">
          {gate.tags.map((tag) => (
            <Badge key={tag} variant="neutral" fillStyle="subtle" size="S">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {gate.pmoComments && (
        <div className="es-pmo">
          <TextArea
            styles={fullWidth}
            label={gate.pmoComments.label}
            value={gate.pmoComments.value || ''}
            isReadOnly
            placeholder={!gate.pmoComments.value ? gate.pmoComments.emptyText : undefined}
          />
        </div>
      )}
    </SectionCard>
  );
}

export default GateDetailCard;
