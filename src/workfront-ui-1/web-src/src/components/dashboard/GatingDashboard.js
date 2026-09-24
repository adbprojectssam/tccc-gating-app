/*
 * <license header>
 */

import { useEffect, useState } from 'react';
import { DialogContainer } from '@react-spectrum/s2';
import './dashboard.css';
import ProjectHeader from './ProjectHeader';
import ArtifactDialog from './ArtifactDialog';
import PreReadSidePanel from './PreReadSidePanel';
import GateEventSelector from './GateEventSelector';
import GateRegistrationStatusCard from './GateRegistrationStatusCard';
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
import { fetchGateEvents, filterEligibleGateEvents } from '../../api/gateEventsClient';
import { fetchApprovers, assignApprovers } from '../../api/approversClient';
import ApproverConfigDialog from './ApproverConfigDialog';
import { LABELS, formatLabel } from '../../constants/labels';

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

  // Seeds from the project's own computed default (pipeline.currentKey, or
  // project.defaultGate, falling back to '1') so the first-relevant gate is
  // selected on load — including for a brand-new project — instead of always
  // assuming gate 1 is the right key.
  const [selectedGate, setSelectedGate] = useState(defaultGate);
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
  const [draftVersions, setDraftVersions] = useState([]);
  const [selectedDraftId, setSelectedDraftId] = useState(null);
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
  // True while the inline gate-event selector (Figma 1889-121823 calendar /
  // 1889-121630 list) is showing in the main gate-detail slot, replacing
  // whatever else was there — not a modal.
  const [isRegistering, setRegistering] = useState(false);
  // Set once the user successfully registers a gate for an event — flips that
  // gate's main slot to the "registered" status card (Figma 1889-121384 /
  // 1889-121464) and hides its header "Register" button right away, ahead of
  // the silent refresh below confirming it server-side. Keyed by gate so
  // registering one gate doesn't affect any other gate's own state.
  const [registeredEvents, setRegisteredEvents] = useState({});
  const registeredEvent = registeredEvents[selectedGate] || null;
  // Drives the loading/error state on the pre-read side panel's "Download"
  // button while the generated pre-read document is being located.
  const [isDownloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [gateMeetings, setGateMeetings] = useState([]);
  const [gateMeetingsLoading, setGateMeetingsLoading] = useState(true);
  const [gateMeetingsError, setGateMeetingsError] = useState('');
  const [approvers, setApprovers] = useState([]);
  const [isApproverDialogOpen, setApproverDialogOpen] = useState(false);
  const [isSavingApprovers, setSavingApprovers] = useState(false);
  const [approverError, setApproverError] = useState('');

  useEffect(() => {
    let active = true;
    if (!project) {
      setGateMeetings([]);
      setGateMeetingsLoading(false);
      return () => {
        active = false;
      };
    }
    setGateMeetingsLoading(true);
    setGateMeetingsError('');
    (async () => {
      try {
        const ctx = await getImsAuth();
        const meetings = await fetchGateEvents({
          hostname: ctx.hostname,
          imsToken: ctx.imsToken,
          imsOrg: ctx.imsOrg,
        });
        if (!active) return;
        setGateMeetings(filterEligibleGateEvents(meetings, project.registrationMatchFields));
        setGateMeetingsLoading(false);
      } catch (error) {
        if (!active) return;
        setGateMeetingsError(error.message);
        setGateMeetingsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [project?.registrationMatchFields]);

  useEffect(() => {
    let active = true;
    getImsAuth().then((ctx) => fetchApprovers({ hostname: ctx.hostname, imsToken: ctx.imsToken, imsOrg: ctx.imsOrg }))
      .then((users) => { if (active) setApprovers(users); })
      .catch(() => { if (active) setApprovers([]); });
    return () => { active = false; };
  }, []);

  if (!project) return null;

  const gate = (project.gateData && project.gateData[selectedGate]) || {};

  const handleGateSelect = (id) => {
    if (id !== selectedGate) {
      // Switching gates: these screens replace the main gate-detail slot but
      // aren't keyed per gate, so without this they'd keep showing the
      // PREVIOUS gate's in-progress registration/pre-read-validation state
      // instead of the newly selected gate's own default detail view.
      setRegistering(false);
      setFields([]);
      setDraftVersions([]);
      setSelectedDraftId(null);
      setPreReadSubmitted(false);
      setSavedArtifacts([]);
      setExtractError('');
      setSubmitError('');
    }
    setSelectedGate(id);
    if (onGateSelect) onGateSelect(id);
  };

  // Header CTAs open their modals; anything else bubbles up.
  const handleAction = (id) => {
    if (id === 'register-gate') {
      setRegistering(true);
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

  const handleApprovalAction = async (id) => {
    if (id !== 'configure-approvers') return;
    setApproverError('');
    setApproverDialogOpen(true);
  };

  const handleSaveApprovers = async (rows) => {
    if (!gate.id) return;
    setSavingApprovers(true);
    setApproverError('');
    try {
      const ctx = await getImsAuth();
      await assignApprovers({
        hostname: ctx.hostname,
        taskId: gate.id,
        approverIds: rows.map((row) => row.userId),
        imsToken: ctx.imsToken,
        imsOrg: ctx.imsOrg,
      });
      setApproverDialogOpen(false);
    } catch (error) {
      setApproverError(error.message);
    } finally {
      setSavingApprovers(false);
    }
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
  const runReview = async (newFiles, onDone) => {
    const ids = newFiles.map((f) => f.documentId).filter(Boolean);
    if (!ids.length) return;
    const addedArtifacts = newFiles.map((f) => ({ id: f.documentId, name: f.name, size: f.size }));
    setSavedArtifacts((previous) => [...previous, ...addedArtifacts]);
    setExtracting(true);
    setExtractError('');
    try {
      const list = await runExtraction(ids);
      setFields(list);
      const draft = { id: `draft-${Date.now()}`, label: `Draft ${draftVersions.length + 1}`, documentIds: ids, fields: list };
      setDraftVersions((previous) => [...previous, draft]);
      setSelectedDraftId(draft.id);
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
    if (!gate.id) {
      setSubmitError('This gate has no Workfront task yet, so there is nothing to submit against.');
      return;
    }
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
      setFields([]);
      setSavedArtifacts([]);
      setDraftVersions([]);
      setSelectedDraftId(null);
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
  const baseActions = project.header.actions || [];
  // Prepended when the selected gate has a real Workfront task that isn't
  // registered for a Gate meeting event yet ("DE:Gate Meeting Innovation" is
  // empty) — leftmost pill in the header action row. `!registeredEvent` is
  // the optimistic, immediate half of this (this session just registered
  // it); `!gate.gateMeetingRegistered` is the server-confirmed half, caught
  // up by the silent refresh onRegistered triggers.
  const registerAction =
    gate.id && !gate.gateMeetingRegistered && !registeredEvent
      ? {
          id: 'register-gate',
          label: formatLabel(LABELS.gateRegistration.registerHeaderButton, { number: selectedGate }),
          variant: 'secondary',
          fillStyle: 'outline',
          icon: 'calendarEdit',
        }
      : null;
  const header = {
    ...project.header,
    actions: registerAction ? [registerAction, ...baseActions] : baseActions,
  };

  // Built once, used wherever it's relevant: the new-project onboarding view
  // and the regular exec dashboard both just render this (or not) — artifacts
  // can be uploaded/reviewed for a gate at any point, not only for a brand new
  // project. Null once the pre-read has been submitted or nothing's pending.
  const readinessCard =
    fields.length > 0 && !preReadSubmitted ? (
      <PreReadValidation
        key={selectedDraftId || 'draft-empty'}
        fields={fields}
        drafts={draftVersions}
        selectedDraftId={selectedDraftId}
        onDraftChange={(id) => {
          const draft = draftVersions.find((item) => item.id === id);
          if (draft) {
            setSelectedDraftId(id);
            setFields(draft.fields);
          }
        }}
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

  // Takes over the main gate-detail slot (next to Gate Pipeline) ahead of
  // everything else — the event selector while choosing (Figma 1889-121823 /
  // 1889-121630 / 1889-121287, inline, not a modal), then the "just
  // submitted" success card (Figma 3211-136600) once a pre-read is shared,
  // and finally the "registered" status card once a Gate event's been
  // picked (Figma 1889-121384 / 1889-121464). Shared between the
  // new-project and regular exec layouts so there's one implementation of
  // each state.
  const mainSlotOverride = registeredEvent ? (
    <GateRegistrationStatusCard
      facilitatorName={project.ownerName}
      gateNumber={selectedGate}
      preReadGenerated={!!gate.preReadGenerated}
      registeredEvent={registeredEvent}
      onViewPreRead={() => handleAction('pre-read')}
      onViewGateDetails={() => {
        // Dismiss this gate's "just registered" success card so the normal
        // gate-detail view (Stage/Target/tags/PMO comments) for whichever
        // gate is currently selected takes over the main slot again. Safe to
        // drop entirely: gate.gateMeetingRegistered (from the Workfront
        // refresh above) is what actually keeps the header's Register button
        // hidden going forward, not this local map.
        setRegisteredEvents((prev) => {
          const next = { ...prev };
          delete next[selectedGate];
          return next;
        });
      }}
    />
  ) : preReadSubmitted ? (
    <GateRegistrationStatusCard
      facilitatorName={project.ownerName}
      gateNumber={selectedGate}
      preReadGenerated={!!gate.preReadGenerated}
      artifacts={savedArtifacts}
      onViewPreRead={() => handleAction('pre-read')}
    />
  ) : null;

  if (isRegistering) {
    return (
      <div className={`es-registration-screen ${dashboardBase}`}>
        <GateEventSelector
          gateNumber={selectedGate}
          registrationLevel={project.registrationLevel}
          registrationMatchFields={project.registrationMatchFields}
          meetings={gateMeetings}
          meetingsLoading={gateMeetingsLoading}
          meetingsError={gateMeetingsError}
          taskId={gate.id}
          onCancel={() => setRegistering(false)}
          onRegistered={(event) => {
            setRegisteredEvents((prev) => ({ ...prev, [selectedGate]: event }));
            setRegistering(false);
            if (onProjectRefresh) onProjectRefresh();
          }}
        />
      </div>
    );
  }

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
          gateNumber={selectedGate}
          preReadGenerated={!!gate.preReadGenerated}
          registeredEvent={registeredEvent}
          onViewPreRead={() => handleAction('pre-read')}
          readinessCard={readinessCard}
          mainSlotOverride={mainSlotOverride}
        />
      ) : (
        <div className="es-exec">
          <KeyMetrics data={gate.keyMetrics} />
          <div className="es-body">
            <GatePipeline
              data={pipeline}
              selectedKey={selectedGate}
              onGateSelect={handleGateSelect}
              dimmed={isPreReadPanelOpen}
            />
            <div className="es-body__main">
              {mainSlotOverride || readinessCard || (
                <>
                  <GateDetailCard gate={gate.gateDetail} />
                  <AIRecommendation data={gate.aiRecommendation} />
                  <BeyondTheSummary data={gate.beyondSummary} />
                  <IOFields data={gate.ioFields} />
                  <KeyKPIs data={gate.keyKpis} />
                  {/* Approval Trail only makes sense once the gate has an actual meeting to track. */}
                  {(gate.gateMeetingRegistered || registeredEvent) && (
                    <ApprovalTable data={gate.approval} onHeaderAction={handleApprovalAction} />
                  )}
                  <GateReadiness data={gate.gateReadiness} />
                </>
              )}
            </div>
          </div>
        </div>
      )}

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

      <DialogContainer onDismiss={() => setApproverDialogOpen(false)}>
        {isApproverDialogOpen && (
          <ApproverConfigDialog
            gateNumber={selectedGate}
            taskId={gate.id}
            users={approvers}
            isSaving={isSavingApprovers}
            error={approverError}
            onCancel={() => setApproverDialogOpen(false)}
            onSave={handleSaveApprovers}
          />
        )}
      </DialogContainer>

      <DialogContainer onDismiss={() => setUpdatePreReadOpen(false)}>
        {isUpdatePreReadOpen && (
          <ArtifactDialog
            key={`update-${savedArtifacts.map((artifact) => artifact.id).join('-')}`}
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
        gateName={gate.gateDetail?.title}
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
    </div>
  );
}

export default GatingDashboard;
