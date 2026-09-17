/*
 * <license header>
 */

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
  dialogTitle,
  dialogDesc,
  cardTitle,
  bodyText,
  bannerTitle,
  fullWidth,
  generateButtonWidth,
} from './styles';

/**
 * Docked side panel (Figma 2862-120801 populated / 2960-124543 empty), opened
 * by "View pre-read" on the Gate 1 readiness card and by the header's
 * "Pre-read" action (replacing the old PreReadDialog). No Spectrum Drawer
 * exists in this S2 version, so — like the chat widget's panel — this is a
 * plain fixed-position shell rather than a Dialog.
 *
 * `fields` decides which state renders: empty ("No pre-read generated", with
 * a CTA into the upload flow) before any extraction has happened, or the full
 * read-only summary once it has. Business Case Summary / Key Metrics / DSFV
 * Snapshot have no real data source yet (not part of the extract-fields
 * shape) — content comes from the temporary `mockPreReadSummary.js` until a
 * real source exists.
 */
function PreReadSidePanel({ isOpen, onClose, projectTitle, fields = [], onGenerate, onUpdatePreRead, onDownloadPdf }) {
  if (!isOpen) return null;
  const summary = MOCK_PRE_READ_SUMMARY;
  const hasPreRead = fields.length > 0;

  return (
    <div className={`es-preread-panel ${dashboardBase}`}>
      <div className="es-preread-panel__close">
        <CloseButton onPress={onClose} />
      </div>

      <div className="es-preread-panel__header">
        <div className="es-preread-panel__header-row">
          <h2 className={`es-preread-panel__title ${dialogTitle}`}>{LABELS.preReadPanel.title}</h2>
          <span className="es-gate1__version" aria-disabled="true">
            <Text>{LABELS.preReadPanel.versionPlaceholder}</Text>
            <ChevronDown />
          </span>
        </div>
        {projectTitle && <p className={dialogDesc}>{projectTitle}</p>}
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
            <Button variant="primary" fillStyle="fill" styles={generateButtonWidth} onPress={onGenerate}>
              {LABELS.artifact.generatePreRead}
            </Button>
          </div>
        ) : (
          <>
            <InlineAlert variant="positive" styles={fullWidth}>
              <Content>
                {formatLabel(LABELS.preReadPanel.sharedNotice, { facilitator: summary.facilitatorName })}
              </Content>
            </InlineAlert>

            <section className="es-preread-panel__section">
              <h3 className={cardTitle}>{LABELS.preReadPanel.businessCaseSummary}</h3>
              <p className={bodyText}>{summary.businessCaseSummary}</p>
            </section>

            <section className="es-preread-panel__section">
              <h3 className={cardTitle}>{LABELS.preReadPanel.keyMetrics}</h3>
              <div className="es-preread-panel__metrics">
                {summary.keyMetrics.map((metric) => (
                  <div key={metric.label} className="es-preread-panel__metric-row">
                    <span className={bannerTitle}>{metric.label}</span>
                    <span className={bodyText}>{metric.value}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="es-preread-panel__section">
              <h3 className={cardTitle}>{LABELS.preReadPanel.dsfvSnapshot}</h3>
              <div className="es-preread-panel__dsfv">
                {summary.dsfvSnapshot.map((item) => (
                  <div key={item.label} className="es-preread-panel__dsfv-card">
                    <div className={bannerTitle}>{item.label}</div>
                    <div className={bodyText}>{item.value}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="es-preread-panel__section">
              <h3 className={cardTitle}>{LABELS.preReadPanel.source}</h3>
              {summary.sourceFiles.map((file) => (
                <p key={file} className={bodyText}>
                  {file}
                </p>
              ))}
            </section>
          </>
        )}
      </div>

      {hasPreRead && (
        <div className="es-preread-panel__footer">
          <Button variant="secondary" fillStyle="outline" onPress={onUpdatePreRead}>
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
  );
}

export default PreReadSidePanel;
