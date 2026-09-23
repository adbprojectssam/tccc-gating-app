/*
 * <license header>
 */

import { Button, Text, Badge } from '@react-spectrum/s2';
import AlertDiamond from '@react-spectrum/s2/icons/AlertDiamond';
import FileText from '@react-spectrum/s2/icons/FileText';
import KeyMetrics from './KeyMetrics';
import GatePipeline from './GatePipeline';
import GateRegistrationStatusCard from './GateRegistrationStatusCard';
import { LABELS } from '../../constants/labels';
import { cardSurface, cardTitle, sectionTitle, bannerBody, bodyText, dialogDesc } from './styles';

/** Dashed document + download-arrow glyph for the (display-only) drop zone. */
function DropGlyph() {
  return (
    <svg viewBox="0 0 40 40" width="52" height="52" fill="none" aria-hidden="true" focusable="false">
      <path d="M22 4H11a3 3 0 0 0-3 3v21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 4l10 10v14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 4v7a3 3 0 0 0 3 3h7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 30.5c0 1.7 1.3 3 3 3h18c1.7 0 3-1.3 3-3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.5 4.5" />
      <path d="M20 12.5v10.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M15.5 18.5l4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** A locked/empty section card (IO fields, approval trail) with an amber alert. */
function LockCard({ title, message }) {
  return (
    <section className={`es-lockcard ${cardSurface}`}>
      <h2 className={`es-lockcard__title ${cardTitle}`}>{title}</h2>
      <div className="es-lockcard__alert">
        <span className={bannerBody}>{message}</span>
        <AlertDiamond aria-hidden="true" />
      </div>
    </section>
  );
}

// Empty KPI cards — placeholder values, no chart visuals (Figma new-project state).
const EMPTY_METRICS = {
  title: LABELS.sections.keyMetrics,
  metrics: [
    { id: 'absolute-volume', value: '-- UC', label: LABELS.metrics.absoluteVolume, footnote: LABELS.footnotes.g1Baseline },
    { id: 'incremental-volume', value: '-- UC', label: LABELS.metrics.incrementalVolume, footnote: LABELS.footnotes.g1Baseline },
    { id: 'gp-margin', value: '-- %', label: LABELS.metrics.gpMargin, footnote: LABELS.footnotes.g1Baseline },
    { id: 'capex', value: '$ --', label: LABELS.metrics.capex, footnote: LABELS.footnotes.g1Baseline },
  ],
};

/**
 * New-project onboarding dashboard. Rendered instead of the normal exec
 * dashboard when `project.isNew` is true: empty KPI cards, the fresh gate
 * pipeline, and one of three hero states — upload prompt (Figma 1849-100981,
 * full-width above the Gate Pipeline row), or — once artifacts are uploaded —
 * the Gate 1 readiness card (`readinessCard`, built by the parent so it's a
 * single implementation shared with the regular exec dashboard) or the
 * "pre-read complete" status card, both of which sit in the Gate Pipeline
 * row's main slot instead (Figma 1849-101071 / 1889-122628 / 1932-123418's
 * "main-gate-detail" — the banner sits next to the pipeline, not above it),
 * replacing the locked IO-fields/approval-trail placeholders. `onUpload` opens
 * the Artifacts dialog; `preReadSubmitted` flips the Gate 1 sub-label once a
 * pre-read is shared.
 */
function NewProjectView({
  onUpload,
  preReadSubmitted,
  savedArtifacts = [],
  keyMetrics,
  ownerName,
  gateNumber = '1',
  preReadGenerated,
  registeredEvent,
  onRegister,
  onViewPreRead,
  readinessCard,
  mainSlotOverride,
}) {
  const O = LABELS.onboarding;
  // Once the pre-read is confirmed, the hero banner's Key Metrics row shows
  // real values (Figma 1849-101071 / 1889-122628 / 1932-123418) instead of
  // the "--" placeholders shown before anything's been submitted.
  const metrics = preReadSubmitted && keyMetrics ? keyMetrics : EMPTY_METRICS;

  const pipeline = {
    title: LABELS.sections.gatePipeline,
    currentKey: '1',
    gates: [
      { number: 1, label: 'Gate 1', status: 'current', statusLabel: preReadSubmitted ? O.gate1PreRead : LABELS.status.notStarted },
      { number: 2, label: 'Gate 2', status: 'not-started', statusLabel: LABELS.status.notStarted },
      { number: 3, label: 'Gate 3', status: 'not-started', statusLabel: LABELS.status.notStarted },
      { number: 4, label: 'Gate 4', status: 'not-started', statusLabel: LABELS.status.notStarted },
      { number: 5, label: 'Gate 5', status: 'not-started', statusLabel: LABELS.status.notStarted },
    ],
  };

  const hasHero = !preReadSubmitted && !readinessCard && !mainSlotOverride;

  return (
    <div className="es-exec">
      <KeyMetrics data={metrics} />

      {hasHero && (
        <section className="es-onboard">
          <div className="es-onboard__info">
            <Badge variant="accent">{O.badge}</Badge>
            <h2 className={`es-onboard__heading ${sectionTitle}`}>{O.heading}</h2>
            <p className={`es-onboard__body ${dialogDesc}`}>{O.body}</p>
            <div className="es-onboard__actions">
              <Button variant="primary" fillStyle="fill" onPress={onUpload}>
                <FileText />
                <Text>{O.uploadArtifacts}</Text>
              </Button>
              <a className="es-onboard__learn" href={O.learnMoreHref}>
                {O.learnMore} <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
          <div className="es-onboard__drop" aria-hidden="true">
            <DropGlyph />
            <div className={`es-onboard__drop-title ${bodyText}`}>{O.dropTitle}</div>
            <div className={`es-onboard__drop-sub ${dialogDesc}`}>{O.dropSubtitle}</div>
          </div>
        </section>
      )}

      <div className="es-body">
        <GatePipeline data={pipeline} selectedKey={null} />
        <div className="es-body__main">
          {mainSlotOverride ? (
            mainSlotOverride
          ) : preReadSubmitted ? (
            <GateRegistrationStatusCard
              facilitatorName={ownerName}
              gateNumber={gateNumber}
              preReadGenerated={preReadGenerated}
              artifacts={savedArtifacts}
              registeredEvent={registeredEvent}
              onRegister={onRegister}
              onViewPreRead={onViewPreRead}
            />
          ) : readinessCard ? (
            readinessCard
          ) : (
            <>
              <LockCard title={O.ioTitle} message={O.ioLocked} />
              <LockCard title={LABELS.sections.approvalTrail} message={O.approvalNotInitialized} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewProjectView;
