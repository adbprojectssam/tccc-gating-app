/*
 * <license header>
 */

import { useEffect, useState } from 'react';
import { Button, Text, CloseButton, InlineAlert, Content } from '@react-spectrum/s2';
import ChevronDown from '@react-spectrum/s2/icons/ChevronDown';
import Refresh from '@react-spectrum/s2/icons/Refresh';
import Download from '@react-spectrum/s2/icons/Download';
import FileText from '@react-spectrum/s2/icons/FileText';
import { LABELS, formatLabel } from '../../constants/labels';
import { MOCK_PRE_READ_SUMMARY } from '../../data/mockPreReadSummary';
import './preReadPanel.css';
import {
  dashboardBase,
  dialogDesc,
  bannerTitle,
  fullWidth,
  generateButtonWidth,
  preReadPanelTitle,
  preReadPanelSubtitle,
  preReadSectionTitle,
  preReadValueText,
  dsfvCardLabel,
  dsfvCardValue,
  modalScrimBg,
} from './styles';

/**
 * Docked side panel (Figma 2862-117426 populated / 2960-124543 empty), opened
 * by "View pre-read" on the Gate 1 readiness card and by the header's
 * "Pre-read" action (replacing the old PreReadDialog). No Spectrum Drawer
 * exists in this S2 version, so — like the chat widget's panel — this is a
 * plain fixed-position shell rather than a Dialog.
 *
 * `preReadGenerated` (the selected gate's own persisted flag — see
 * `mapWorkfrontProject.js`, sourced from Workfront's "DE:Build Stage Gate
 * Report?" field) decides which state renders: the empty "No pre-read
 * generated" state, or the full read-only summary. That's a real,
 * gate-persisted flag — unlike whether an extraction happened this session.
 * In the empty state, "Generate Pre-read" just closes the panel (generating
 * one happens via the Artifacts flow elsewhere, not from here).
 *
 * Business Case Summary and Key Metrics come from real project DE fields
 * (see `mapWorkfrontProject.js`'s `preReadSummary`, passed in as a prop). DSFV
 * Snapshot has no real data source yet (no precedent anywhere in the app), so
 * it — along with the facilitator name and source files — still comes from
 * the temporary `mockPreReadSummary.js` until a real source exists.
 */
function PreReadSidePanel({ isOpen, onClose, projectTitle, preReadGenerated = false, preReadSummary, onUpdatePreRead, onDownloadPdf }) {
  // Mounted immediately at its closed (off-screen) position, then flipped to
  // "entered" a frame later so the transform/opacity transitions to their
  // open values actually animate instead of snapping straight there.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setEntered(false);
      return;
    }
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, [isOpen]);

  if (!isOpen) return null;
  const summary = MOCK_PRE_READ_SUMMARY;
  const hasPreRead = preReadGenerated;
  const businessCaseSummary = preReadSummary?.businessCaseSummary || '';
  const keyMetrics = preReadSummary?.keyMetrics || [];

  return (
    <>
      <div
        className={`es-preread-panel__overlay ${modalScrimBg} ${entered ? 'es-preread-panel__overlay--visible' : ''}`}
        onClick={onClose}
      />
      <div className={`es-preread-panel ${dashboardBase} ${entered ? 'es-preread-panel--open' : ''}`}>
        <div className="es-preread-panel__close">
          <CloseButton onPress={onClose} />
        </div>

        <div className="es-preread-panel__header">
          <div className="es-preread-panel__header-row">
            <h2 className={`es-preread-panel__title ${preReadPanelTitle}`}>{LABELS.preReadPanel.title}</h2>
            <span className={hasPreRead ? 'es-gate1__version es-gate1__version--active' : 'es-gate1__version'} aria-disabled={!hasPreRead}>
              <Text>{hasPreRead ? LABELS.preReadPanel.currentVersion : LABELS.preReadPanel.versionPlaceholder}</Text>
              <ChevronDown />
            </span>
          </div>
          {projectTitle && <p className={preReadPanelSubtitle}>{projectTitle}</p>}
        </div>

        <hr className="es-gate1__divider" />

        <div className="es-preread-panel__scroll">
          {!hasPreRead ? (
            <div className="es-preread-panel__empty">
              <div className="es-preread-panel__empty-icon">
                <FileText aria-hidden="true" />
              </div>
              <div className="es-preread-panel__empty-text">
                <p className="es-preread-panel__empty-title">{LABELS.preReadPanel.emptyTitle}</p>
                <p className={dialogDesc}>{LABELS.preReadPanel.emptyBody}</p>
              </div>
              <Button variant="primary" fillStyle="fill" styles={generateButtonWidth} onPress={onClose}>
                {LABELS.artifact.generatePreRead}
              </Button>
            </div>
          ) : (
            <>
              <InlineAlert variant="positive" fillStyle="subtleFill" styles={fullWidth}>
                <Content>
                  {formatLabel(LABELS.preReadPanel.sharedNotice, { facilitator: summary.facilitatorName })}
                </Content>
              </InlineAlert>

              <div className="es-preread-panel__sections">
                <section className="es-preread-panel__section">
                  <h3 className={preReadSectionTitle}>{LABELS.preReadPanel.businessCaseSummary}</h3>
                  {businessCaseSummary ? (
                    <p className={preReadValueText}>{businessCaseSummary}</p>
                  ) : (
                    <p className="es-preread-panel__missing">{LABELS.preReadPanel.missingValue}</p>
                  )}
                </section>

                <section className="es-preread-panel__section">
                  <h3 className={preReadSectionTitle}>{LABELS.preReadPanel.keyMetrics}</h3>
                  <div className="es-preread-panel__metrics">
                    {keyMetrics.map((metric) => (
                      <div key={metric.label} className="es-preread-panel__metric-row">
                        <span className={bannerTitle}>{metric.label}</span>
                        {metric.value ? (
                          <span className={preReadValueText}>{metric.value}</span>
                        ) : (
                          <span className="es-preread-panel__missing">{LABELS.preReadPanel.missingValue}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                <section className="es-preread-panel__section es-preread-panel__section--dsfv">
                  <h3 className={preReadSectionTitle}>{LABELS.preReadPanel.dsfvSnapshot}</h3>
                  <div className="es-preread-panel__dsfv">
                    {summary.dsfvSnapshot.map((item) => (
                      <div key={item.label} className="es-preread-panel__dsfv-card">
                        <div className={dsfvCardLabel}>{item.label}</div>
                        <div className={dsfvCardValue}>{item.value}</div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="es-preread-panel__section">
                  <h3 className={preReadSectionTitle}>{LABELS.preReadPanel.source}</h3>
                  {summary.sourceFiles.map((file) => (
                    <p key={file} className={preReadValueText}>
                      {file}
                    </p>
                  ))}
                </section>
              </div>
            </>
          )}
        </div>

        {hasPreRead && (
          <div className="es-preread-panel__footer">
            <Button variant="primary" fillStyle="outline" onPress={onUpdatePreRead}>
              <Refresh />
              <Text>{LABELS.preReadPanel.updatePreRead}</Text>
            </Button>
            <Button variant="primary" fillStyle="fill" onPress={onDownloadPdf}>
              <Download />
              <Text>{LABELS.preReadPanel.downloadPdf}</Text>
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

export default PreReadSidePanel;
