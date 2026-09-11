/*
 * <license header>
 */

import { useState } from 'react';
import { DialogContainer } from '@react-spectrum/s2';
import './dashboard.css';
import ProjectHeader from './ProjectHeader';
import NeedAttentionDialog from './NeedAttentionDialog';
import ArtifactDialog from './ArtifactDialog';
import PreReadDialog from './PreReadDialog';
import FieldReviewDialog from './FieldReviewDialog';
import KeyMetrics from './KeyMetrics';
import GatePipeline from './GatePipeline';
import GateDetailCard from './GateDetailCard';
import AIRecommendation from './AIRecommendation';
import BeyondTheSummary from './BeyondTheSummary';
import IOFields from './IOFields';
import KeyKPIs from './KeyKPIs';
import ApprovalTable from './ApprovalTable';
import GateReadiness from './GateReadiness';
import { dashboardBase } from './styles';

/**
 * Top-level composition of the gating dashboard.
 *
 * Project-level chrome (header, pipeline) is constant; the selected
 * gate — driven by clicks in the Gate Pipeline — decides which gate payload is
 * rendered. Each section below renders only when its slice exists for that gate,
 * so Gate 1 (no AI/KPI sections) and Gate 2 (full set) share the same code.
 */
function GatingDashboard({ project, onAction, onGateSelect }) {
  const pipeline = project && project.pipeline;
  const defaultGate = (pipeline && pipeline.currentKey) || project?.defaultGate || '1';

  const [selectedGate, setSelectedGate] = useState('1');
  const [isAttentionOpen, setAttentionOpen] = useState(false);
  const [isArtifactOpen, setArtifactOpen] = useState(false);
  // Bumped every time the Artifacts popup opens so it remounts fresh — the
  // previous session's uploaded-file list is cleared (see the `key` below).
  const [artifactSession, setArtifactSession] = useState(0);
  const [isPreReadOpen, setPreReadOpen] = useState(false);
  const [isFieldReviewOpen, setFieldReviewOpen] = useState(false);
  // Shared across the two header dialogs: the saved source artifact(s) and, once
  // generated, the pre-read metadata. UI-only session state for now.
  const [savedArtifacts, setSavedArtifacts] = useState([]);
  const [preRead, setPreRead] = useState(null);
  // Document ids sent to the field-extraction API when the field-review opens.
  const [reviewDocumentIds, setReviewDocumentIds] = useState([]);

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
      setArtifactOpen(true);
      return;
    }
    if (id === 'pre-read') {
      setPreReadOpen(true);
      return;
    }
    if (onAction) onAction(id);
  };

  const handleGeneratePreRead = (readyFiles) => {
    // Files are uploaded to Workfront. Record them, then send their document ids
    // to the extraction API by opening the field-review dialog.
    const ids = readyFiles.map((f) => f.documentId).filter(Boolean);
    setSavedArtifacts(readyFiles.map((f) => ({ id: f.documentId, name: f.name, size: f.size })));
    setReviewDocumentIds(ids);
    setArtifactOpen(false);
    setFieldReviewOpen(true);
  };

  const handleConfirmFields = (finalValues) => {
    // Extracted (and user-confirmed) field values. Sharing the pre-read / saving
    // back to Workfront is a later phase — record and close for now.
    // eslint-disable-next-line no-console
    console.info('[fieldreview] confirm & share pre-read:', finalValues);
    setFieldReviewOpen(false);
  };

  const handleSaveDraftFields = (draftValues) => {
    // Partial (unshared) review — persisting the draft is a later phase.
    // eslint-disable-next-line no-console
    console.info('[fieldreview] saved draft:', draftValues);
    setFieldReviewOpen(false);
  };

  const handleGenerate = () => {
    setPreRead({
      by: 'A1',
      at: new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    });
  };

  return (
    <div className={`es-dashboard ${dashboardBase}`}>
      <ProjectHeader header={project.header} onAction={handleAction} />

      <div className="es-exec">
        <KeyMetrics data={gate.keyMetrics} />
        <div className="es-body">
          <GatePipeline
            data={pipeline}
            selectedKey={selectedGate}
            onGateSelect={handleGateSelect}
          />
          <div className="es-body__main">
            <GateDetailCard gate={gate.gateDetail} />
            <AIRecommendation data={gate.aiRecommendation} />
            <BeyondTheSummary data={gate.beyondSummary} />
            <IOFields data={gate.ioFields} />
            <KeyKPIs data={gate.keyKpis} />
            <ApprovalTable data={gate.approval} />
            <GateReadiness data={gate.gateReadiness} />
          </div>
        </div>
      </div>

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
          />
        )}
      </DialogContainer>

      <DialogContainer onDismiss={() => setFieldReviewOpen(false)}>
        {isFieldReviewOpen && (
          <FieldReviewDialog
            documentIds={reviewDocumentIds}
            onCancel={() => setFieldReviewOpen(false)}
            onConfirm={handleConfirmFields}
            onSaveDraft={handleSaveDraftFields}
          />
        )}
      </DialogContainer>

      <DialogContainer onDismiss={() => setPreReadOpen(false)}>
        {isPreReadOpen && (
          <PreReadDialog
            savedArtifacts={savedArtifacts}
            preRead={preRead}
            onCancel={() => setPreReadOpen(false)}
            onGoToArtifact={() => {
              setPreReadOpen(false);
              setArtifactOpen(true);
            }}
            onGenerate={handleGenerate}
            onDownload={() => {
              /* stub: download the generated pre-read (no backend yet) */
            }}
          />
        )}
      </DialogContainer>
    </div>
  );
}

export default GatingDashboard;
