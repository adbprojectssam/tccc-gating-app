/*
 * <license header>
 */

import { useState } from 'react';
import { Button, Text, Badge } from '@react-spectrum/s2';
import Checkmark from '@react-spectrum/s2/icons/Checkmark';
import CalendarEdit from '@react-spectrum/s2/icons/CalendarEdit';
import Calendar from '@react-spectrum/s2/icons/Calendar';
import FileText from '@react-spectrum/s2/icons/FileText';
import { LABELS, formatLabel } from '../../constants/labels';
import { dialogDesc, bodyText, detailText, preReadPanelTitle, boldLabelText } from './styles';

/** Bytes → "1.2 MB" / "640 KB" (matches the Figma file-size format). */
function formatSize(bytes) {
  if (bytes == null) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "Oct 15, 2026" for the registered-event heading/meeting details. */
function formatEventDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * Onboarding hero banner that replaces the upload prompt in <NewProjectView>
 * once the pre-read is confirmed. Two distinct layouts, both from Figma:
 *  - Not yet registered (1849-101071): "Complete" badge, Register/View-Pre-read
 *    actions, and every saved artifact in a dashed "Generated Pre-read" box.
 *  - Registered for a Gate 1 event (1889-122628 / 1932-123418): "Registered"
 *    badge, a single "View Gate Details" action, and a meeting-details panel
 *    with an "Add to calendar" toggle (UI-only — no calendar integration
 *    exists yet, matching how registration itself has no backend persistence).
 */
function GateRegistrationStatusCard({
  facilitatorName,
  gateNumber = '1',
  artifacts = [],
  preReadGenerated = false,
  registeredEvent,
  onRegister,
  onViewPreRead,
  onViewGateDetails,
}) {
  const R = LABELS.gateRegistration;
  const [addedToCalendar, setAddedToCalendar] = useState(false);

  if (registeredEvent) {
    return (
      <section className="es-gate-registration">
        <div className="es-gate-registration__content">
          <Badge variant="positive">
            <Checkmark aria-hidden="true" />
            <Text>{preReadGenerated ? R.registeredSharedBadge : R.registeredBadge}</Text>
          </Badge>
          <h2 className={`es-gate-registration__heading ${preReadPanelTitle}`}>
            {formatLabel(R.registeredHeading, { name: registeredEvent.name })}
          </h2>
          <p className={`es-gate-registration__body ${dialogDesc}`}>
            {formatLabel(R.registeredBody, {
              date: formatEventDate(registeredEvent.date),
              facilitator: facilitatorName,
            })}
          </p>

          <div className="es-gate-registration__actions">
            <Button variant="primary" fillStyle="fill" onPress={onViewGateDetails}>
              <Text>{R.viewGateDetails}</Text>
            </Button>
          </div>
        </div>

        <div className="es-gate-registration__meeting">
          <div className="es-gate-registration__meeting-icon">
            <Calendar aria-hidden="true" />
          </div>
          <div className="es-gate-registration__meeting-details">
            <h3 className={boldLabelText}>{formatLabel(R.meetingTitle, { number: gateNumber })}</h3>
            <p className={detailText}>{registeredEvent.name}</p>
            <p className={detailText}>{formatEventDate(registeredEvent.date)}</p>
            <p className={detailText}>{formatLabel(R.facilitatorLine, { name: facilitatorName })}</p>
          </div>
          <Button
            variant="secondary"
            fillStyle="outline"
            UNSAFE_className={addedToCalendar ? 'es-gate-registration__calendar-btn--added' : 'es-gate-registration__calendar-btn'}
            onPress={() => setAddedToCalendar(true)}
          >
            {addedToCalendar && <Checkmark aria-hidden="true" />}
            <Text>{R.addToCalendar}</Text>
          </Button>
          {addedToCalendar && <p className="es-gate-registration__added">{R.addedToCalendar}</p>}
        </div>
      </section>
    );
  }

  return (
    <section className="es-gate-registration">
      <div className="es-gate-registration__content">
        <Badge variant="positive">
          <Checkmark aria-hidden="true" />
          <Text>{R.complete}</Text>
        </Badge>
        <h2 className={`es-gate-registration__heading ${preReadPanelTitle}`}>{R.heading}</h2>
        <p className={`es-gate-registration__body ${dialogDesc}`}>{R.body}</p>

        <div className="es-gate-registration__actions">
          <Button variant="primary" fillStyle="fill" onPress={onRegister}>
            <CalendarEdit />
            <Text>{R.registerButton}</Text>
          </Button>
          <Button variant="primary" fillStyle="outline" onPress={onViewPreRead}>
            <Text>{R.viewPreRead}</Text>
          </Button>
        </div>
      </div>

      {artifacts.length > 0 && (
        <div className="es-gate-registration__artifact">
          <h3 className={boldLabelText}>{R.artifactTitle}</h3>
          <div className="es-gate-registration__artifact-list">
            {artifacts.map((artifact) => (
              <div key={artifact.id || artifact.name} className="es-gate-registration__artifact-item">
                <FileText aria-hidden="true" />
                <div className="es-gate-registration__artifact-meta">
                  <div className={bodyText}>{artifact.name}</div>
                  <div className={detailText}>
                    {formatLabel(R.uploadedBy, { size: formatSize(artifact.size), name: facilitatorName })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default GateRegistrationStatusCard;
