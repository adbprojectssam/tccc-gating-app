/*
 * <license header>
 */

import { Button, Text } from '@react-spectrum/s2';
import Checkmark from '@react-spectrum/s2/icons/Checkmark';
import FileText from '@react-spectrum/s2/icons/FileText';
import { LABELS, formatLabel } from '../../constants/labels';
import { cardTitle, dialogDesc, positiveStatus, bodyText, detailText, generatedNote } from './styles';

/** Bytes → "1.2 MB" / "640 KB" (matches the Figma file-size format). */
function formatSize(bytes) {
  if (bytes == null) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** "Oct 15, 2026" for the registered-event confirmation note. */
function formatEventDate(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * "Pre-read complete" status card (Figma gating-registration screen). Replaces
 * the onboarding hero banner in <NewProjectView> once the pre-read is confirmed
 * (100%). Shows the first saved artifact on the right, and either the
 * Register/View-Pre-read actions or — once registered — a confirmation note.
 */
function GateRegistrationStatusCard({ facilitatorName, artifact, registeredEvent, onRegister, onViewPreRead }) {
  const R = LABELS.gateRegistration;
  const body = facilitatorName
    ? formatLabel(R.bodyWithFacilitator, { facilitator: facilitatorName })
    : R.bodyGeneric;

  return (
    <section className="es-gate-registration">
      <div className="es-gate-registration__content">
        <div className="es-gate-registration__step">
          <Checkmark aria-hidden="true" />
          <span className={`es-gate-registration__step-label ${positiveStatus}`}>{R.complete}</span>
        </div>
        <h2 className={`es-gate-registration__heading ${cardTitle}`}>{R.heading}</h2>
        <p className={`es-gate-registration__body ${dialogDesc}`}>{body}</p>

        <div className="es-gate-registration__actions">
          {registeredEvent ? (
            <div className={`es-gate-registration__registered ${generatedNote}`}>
              <Checkmark aria-hidden="true" />
              <span>
                {formatLabel(R.registeredNote, {
                  name: registeredEvent.name,
                  date: formatEventDate(registeredEvent.date),
                })}
              </span>
            </div>
          ) : (
            <Button variant="primary" fillStyle="fill" onPress={onRegister}>
              <Text>{R.registerButton}</Text>
            </Button>
          )}
          <Button variant="secondary" fillStyle="outline" onPress={onViewPreRead}>
            <Text>{R.viewPreRead}</Text>
          </Button>
        </div>
      </div>

      {artifact && (
        <>
          <div className="es-gate-registration__divider" aria-hidden="true" />
          <div className="es-gate-registration__artifact">
            <div className="es-gate-registration__artifact-item">
              <FileText aria-hidden="true" />
              <div className="es-gate-registration__artifact-meta">
                <div className={bodyText}>{artifact.name}</div>
                <div className={detailText}>{formatSize(artifact.size)}, {LABELS.artifact.uploadedToday}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default GateRegistrationStatusCard;
