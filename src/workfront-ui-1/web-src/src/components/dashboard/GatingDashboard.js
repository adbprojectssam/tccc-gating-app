/*
 * <license header>
 */

import { useState } from 'react';
import { DialogContainer } from '@react-spectrum/s2';
import './dashboard.css';
import ProjectHeader from './ProjectHeader';
import NeedAttentionDialog from './NeedAttentionDialog';
import ArtifactDialog from './ArtifactDialog';
import PreReadSidePanel from './PreReadSidePanel';
import GateEventSelectorDialog from './GateEventSelectorDialog';
import NewProjectView from './NewProjectView';
import KeyMetrics from './KeyMetrics';
import GatePipeline from './GatePipeline';
import GateDetailCard from './GateDetailCard';
import AIRecommendation from './AIRecommendation';
import BeyondTheSummary from './BeyondTheSummary';
import IOFields from './IOFields';
import KeyKPIs from './KeyKPIs';
import ApprovalTable from './ApprovalTable';
import GateReadiness from './GateReadiness';
import PreReadValidation from './PreReadValidation';
import { dashboardBase } from './styles';
import { getImsAuth } from '../../api/imsAuth';
import { extractFields, submitValidatedFields } from '../../api/artifactClient';
import { fetchProjectDocuments, findGatePreReadDocument } from '../../api/documentsClient';

/**
 * Top-level composition of the gating dashboard.
 *
 * Project-level chrome (header, pipeline) is constant; the selected
 * gate — driven by clicks in the Gate Pipeline — decides which gate payload is
 * rendered. Each section below renders only when its slice exists for that gate,
 * so Gate 1 (no AI/KPI sections) and Gate 2 (full set) share the same code.
 */
function GatingDashboard({ project, onAction, onGateSelect, onProjectRefresh }) {
  const pipeline = project && project.pipeline;
  const defaultGate = (pipeline && pipeline.currentKey) || project?.defaultGate || '1';

  const [selectedGate, setSelectedGate] = useState('1');
  const [isAttentionOpen, setAttentionOpen] = useState(false);
  const [isArtifactOpen, setArtifactOpen] = useState(false);
  // Bumped every time the Artifacts popup opens so it remounts fresh — the
  // previous session's uploaded-file list is cleared (see the `key` below).
  const [artifactSession, setArtifactSession] = useState(0);
  const [isPreReadPanelOpen, setPreReadPanelOpen] = useState(false);
  const [isUpdatePreReadOpen, setUpdatePreReadOpen] = useState(false);
  // The saved source artifact(s) for this gate. UI-only session state for now.
  const [savedArtifacts, setSavedArtifacts] = useState([]);
  // The extraction result, once the Gate 1 readiness card has something to show.
  const [fields, setFields] = useState([]);
  // Drives the loading state inside whichever upload dialog (Artifacts /
  // Update Pre-read) is open — the extract-fields call happens while it's
  // still open, and only closes on success.
  const [isExtracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  // Drives the loading/error state on the Gate 1 readiness card's "Submit for
  // Review" button while the submit-validated-fields call is in flight.
  const [isSubmitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  // Set once a pre-read is confirmed & shared — flips the Gate 1 sub-label in
  // the new-project onboarding view to "Pre-read submitted", and swaps the
  // onboarding hero for the "pre-read complete" status card (see below).
  const [preReadSubmitted, setPreReadSubmitted] = useState(false);
  const [isRegisterOpen, setRegisterOpen] = useState(false);
  // Set once the user successfully registers for a Gate 1 event — shown as a
  // confirmation note on the status card.
  const [registeredEvent, setRegisteredEvent] = useState(null);
  // Drives the loading/error state on the pre-read side panel's "Download"
  // button while the generated pre-read document is being located.
  const [isDownloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  if (!project) return null;

  const gate = (project.gateData && project.gateData[selectedGate]) || {};

  const handleGateSelect = (id) => {
    setSelectedGate(id);
    if (onGateSelect) onGateSelect(id);
  };

  // Header CTAs open their modals; anything else bubbles up.
  const handleAction = (id) => {
    if (id === 'need-attention') {
      setAttentionOpen(true);
      return;
    }
    if (id === 'artifacts') {
      // New session each open → the dialog remounts with an empty file list.
      setArtifactSession((n) => n + 1);
      setExtractError('');
      setArtifactOpen(true);
      return;
    }
    if (id === 'pre-read') {
      setPreReadPanelOpen(true);
      return;
    }
    if (onAction) onAction(id);
  };

  // Calls the extract-fields action with the given project/document ids.
  // Resolves to the field list — the action itself falls back to mock data on
  // an empty extraction, so no fallback is needed here. Throws on error.
  const runExtraction = async (documentIds) => {
    const ctx = await getImsAuth();
    const result = await extractFields({
      projectId: ctx.projectId,
      documentIds,
      imsToken: ctx.imsToken,
      imsOrg: ctx.imsOrg,
    });
    return Array.isArray(result) ? result : [];
  };

  // Shared by both the initial "Generate Pre-read" and "Update Pre-read" —
  // the dialog (seeded with any existing artifacts for the latter) always
  // hands back the full ready-file set, so this just records it and re-runs
  // extraction over it. `onDone` closes whichever dialog called it.
  const runReview = async (readyFiles, onDone) => {
    const ids = readyFiles.map((f) => f.documentId).filter(Boolean);
    setSavedArtifacts(readyFiles.map((f) => ({ id: f.documentId, name: f.name, size: f.size })));
    setExtracting(true);
    setExtractError('');
    try {
      const list = await runExtraction(ids);
      setFields(list);
      onDone();
    } catch (e) {
      setExtractError(e.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleGeneratePreRead = (readyFiles) => runReview(readyFiles, () => setArtifactOpen(false));
  const handleUpdatePreRead = (readyFiles) => runReview(readyFiles, () => setUpdatePreReadOpen(false));

  // "Submit for Review": sends the validated [{ field, value }] payload
  // (high-confidence fields, plus anything the user confirmed/entered) to the
  // submit-validated-fields action, against the currently selected gate's
  // Workfront task id. Only flips to "submitted" once that call succeeds.
  const handleSubmitForReview = async (validatedFields) => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const ctx = await getImsAuth();
      await submitValidatedFields({
        fields: validatedFields,
        taskId: gate.id,
        imsToken: ctx.imsToken,
        imsOrg: ctx.imsOrg,
      });
      setPreReadSubmitted(true);
      // Workfront now has the submitted fields (e.g. "DE:Build Stage Gate
      // Report?" may have flipped) — silently re-fetch so the dashboard
      // reflects them without a visible reload.
      if (onProjectRefresh) onProjectRefresh();
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // "Download" on the pre-read side panel: finds this gate's generated
  // pre-read among the project's Workfront documents (a "DOCU" named
  // "Gate {number} pre-read" and attached to this gate's own task), then
  // opens its downloadURL directly — same-origin navigation within the
  // Workfront host, authenticated by the user's existing Workfront session.
  const handleDownloadPreRead = async () => {
    setDownloading(true);
    setDownloadError('');
    try {
      const ctx = await getImsAuth();
      const documents = await fetchProjectDocuments({
        projectId: ctx.projectId,
        hostname: ctx.hostname,
        imsToken: ctx.imsToken,
        imsOrg: ctx.imsOrg,
      });
      const match = findGatePreReadDocument(documents, { gateNumber: selectedGate, taskId: gate.id });
      if (!match || !match.downloadURL) {
        throw new Error(`No pre-read document found for Gate ${selectedGate}.`);
      }
      window.open(`https://${ctx.hostname}${match.downloadURL}`, '_blank', 'noopener');
    } catch (e) {
      setDownloadError(e.message);
    } finally {
      setDownloading(false);
    }
  };

  const isNew = !!project.isNew;
  // The onboarding header drops the "Need Attention" CTA (Figma new-project state).
  const header = isNew
    ? { ...project.header, actions: (project.header.actions || []).filter((a) => a.id !== 'need-attention') }
    : project.header;

  // Built once, used wherever it's relevant: the new-project onboarding view
  // and the regular exec dashboard both just render this (or not) — artifacts
  // can be uploaded/reviewed for a gate at any point, not only for a brand new
  // project. Null once the pre-read has been submitted or nothing's pending.
  const readinessCard =
    fields.length > 0 && !preReadSubmitted ? (
      <PreReadValidation
        fields={fields}
        projectTitle={header.title}
        onViewPreRead={() => setPreReadPanelOpen(true)}
        onUpdatePreRead={() => {
          setExtractError('');
          setUpdatePreReadOpen(true);
        }}
        onSubmitForReview={handleSubmitForReview}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    ) : null;

  return (
    <div className={`es-dashboard ${dashboardBase}`}>
      <ProjectHeader header={header} onAction={handleAction} />

      {isNew ? (
        <NewProjectView
          onUpload={() => handleAction('artifacts')}
          preReadSubmitted={preReadSubmitted}
          savedArtifacts={savedArtifacts}
          keyMetrics={gate.keyMetrics}
          ownerName={project.ownerName}
          registeredEvent={registeredEvent}
          onRegister={() => setRegisterOpen(true)}
          onViewPreRead={() => handleAction('pre-read')}
          readinessCard={readinessCard}
        />
      ) : (
        <div className="es-exec">
          <KeyMetrics data={gate.keyMetrics} />
          <div className="es-body">
            <GatePipeline
              data={pipeline}
              selectedKey={selectedGate}
              onGateSelect={handleGateSelect}
            />
            <div className="es-body__main">
              {readinessCard || (
                <>
                  <GateDetailCard gate={gate.gateDetail} />
                  <AIRecommendation data={gate.aiRecommendation} />
                  <BeyondTheSummary data={gate.beyondSummary} />
                  <IOFields data={gate.ioFields} />
                  <KeyKPIs data={gate.keyKpis} />
                  <ApprovalTable data={gate.approval} />
                  <GateReadiness data={gate.gateReadiness} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <DialogContainer onDismiss={() => setAttentionOpen(false)}>
        {isAttentionOpen && (
          <NeedAttentionDialog
            data={project.needAttention}
            onPrimaryAction={() => setAttentionOpen(false)}
          />
        )}
      </DialogContainer>

      <DialogContainer onDismiss={() => setArtifactOpen(false)}>
        {isArtifactOpen && (
          <ArtifactDialog
            key={artifactSession}
            onGenerate={handleGeneratePreRead}
            onCancel={() => setArtifactOpen(false)}
            isGenerating={isExtracting}
            generateError={extractError}
          />
        )}
      </DialogContainer>

      <DialogContainer onDismiss={() => setUpdatePreReadOpen(false)}>
        {isUpdatePreReadOpen && (
          <ArtifactDialog
            onGenerate={handleUpdatePreRead}
            onCancel={() => setUpdatePreReadOpen(false)}
            initialFiles={savedArtifacts}
            isGenerating={isExtracting}
            generateError={extractError}
          />
        )}
      </DialogContainer>

      <PreReadSidePanel
        isOpen={isPreReadPanelOpen}
        onClose={() => setPreReadPanelOpen(false)}
        projectTitle={header.title}
        preReadGenerated={!!gate.preReadGenerated}
        preReadSummary={project.preReadSummary}
        onUpdatePreRead={() => {
          setPreReadPanelOpen(false);
          setExtractError('');
          setUpdatePreReadOpen(true);
        }}
        onDownloadPdf={handleDownloadPreRead}
        isDownloading={isDownloading}
        downloadError={downloadError}
      />

      <DialogContainer onDismiss={() => setRegisterOpen(false)}>
        {isRegisterOpen && (
          <GateEventSelectorDialog
            registrationLevel={project.registrationLevel}
            onCancel={() => setRegisterOpen(false)}
            onRegistered={(event) => {
              setRegisteredEvent(event);
              setRegisterOpen(false);
            }}
          />
        )}
      </DialogContainer>
    </div>
  );
}

export default GatingDashboard;
