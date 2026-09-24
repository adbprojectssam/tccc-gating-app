/*
 * <license header>
 */

import { Button, Text, Badge } from '@react-spectrum/s2';
import Checkmark from '@react-spectrum/s2/icons/Checkmark';
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
 * Success banner shown after a pre-read is submitted (any gate, not just a
 * new project) — replaces <NewProjectView>'s upload prompt there, and takes
 * over the regular exec dashboard's main gate-detail slot otherwise. Two
 * distinct layouts, both from Figma:
 *  - Not yet registered (3211-136600): "Pre-read generated" badge, a single
 *    "View Pre-read" action, and every saved artifact in a dashed "Generated
 *    Pre-read" box. (Registering is done via the header's own "Register for
 *    Gate {number}" button, not duplicated here.)
 *  - Registered for a Gate 1 event (1889-122628 / 1932-123418): "Registered"
 *    badge, a single "View Gate Details" action, and a meeting-details panel.
 */
function GateRegistrationStatusCard({
  facilitatorName,
  gateNumber = '1',
  artifacts = [],
  preReadGenerated = false,
  registeredEvent,
  onViewPreRead,
  onViewGateDetails,
}) {
  const R = LABELS.gateRegistration;
  if (registeredEvent) {
    const meetingOwner = registeredEvent.ownerName || facilitatorName;
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
              facilitator: meetingOwner,
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
            <p className={detailText}>{formatLabel(R.facilitatorLine, { name: meetingOwner })}</p>
          </div>
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
        <h2 className={`es-gate-registration__heading ${preReadPanelTitle}`}>{formatLabel(R.heading, { number: gateNumber })}</h2>
        <p className={`es-gate-registration__body ${dialogDesc}`}>{R.body}</p>

        <div className="es-gate-registration__actions">
          <Button variant="primary" fillStyle="fill" onPress={onViewPreRead}>
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
