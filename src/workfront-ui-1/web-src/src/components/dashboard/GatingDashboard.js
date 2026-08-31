/*
 * <license header>
 */

import { useState } from 'react';
import { DialogContainer } from '@react-spectrum/s2';
import './dashboard.css';
import ProjectHeader from './ProjectHeader';
import NeedAttentionDialog from './NeedAttentionDialog';
import KeyMetrics from './KeyMetrics';
import GatePipeline from './GatePipeline';
import GateDetailCard from './GateDetailCard';
import AIRecommendation from './AIRecommendation';
import BeyondTheSummary from './BeyondTheSummary';
import IOFields from './IOFields';
import KeyKPIs from './KeyKPIs';
import ApprovalTable from './ApprovalTable';
import GateReadiness from './GateReadiness';
import TabPanelContent from './TabPanelContent';
import { getIcon } from './iconRegistry';
import { dashboardBase } from './styles';

/**
 * Top-level composition of the gating dashboard.
 *
 * Project-level chrome (header, view tabs, pipeline) is constant; the selected
 * gate — driven by clicks in the Gate Pipeline — decides which gate payload is
 * rendered. Each section below renders only when its slice exists for that gate,
 * so Gate 1 (no AI/KPI sections) and Gate 2 (full set) share the same code.
 */
function GatingDashboard({ project, onAction, onGateSelect }) {
  const pipeline = project && project.pipeline;
  const defaultGate = (pipeline && pipeline.currentKey) || project?.defaultGate || '1';

  // Nothing selected initially (matches Figma's resting state). S2 <Tabs> forces
  // a selection, so we use a toggle strip: click a tab to open its panel, click
  // it again to close.
  const [activeTabId, setActiveTabId] = useState(null);
  const [selectedGate, setSelectedGate] = useState('1');
  const [isAttentionOpen, setAttentionOpen] = useState(false);

  if (!project) return null;
  const tabs = project.tabs || [];
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const toggleTab = (id) => setActiveTabId((current) => (current === id ? null : id));

  const gate = (project.gateData && project.gateData[selectedGate]) || {};

  const handleGateSelect = (id) => {
    setSelectedGate(id);
    if (onGateSelect) onGateSelect(id);
  };

  // The "Need Attention" CTA opens a modal; other header actions bubble up.
  const handleAction = (id) => {
    if (id === 'need-attention') {
      setAttentionOpen(true);
      return;
    }
    if (onAction) onAction(id);
  };

  return (
    <div className={`es-dashboard ${dashboardBase}`}>
      <ProjectHeader header={project.header} onAction={handleAction} />

      <div className="es-tabs" role="tablist" aria-label="Project views">
        {tabs.map((tab) => {
          const Icon = getIcon(tab.icon);
          const isActive = tab.id === activeTabId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? 'es-tab es-tab--active' : 'es-tab'}
              onClick={() => toggleTab(tab.id)}
            >
              {Icon && <Icon aria-hidden="true" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab && <TabPanelContent panel={activeTab.panel} />}

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
            onPrimaryAction={() => {
              setActiveTabId('risk-view');
              setAttentionOpen(false);
            }}
          />
        )}
      </DialogContainer>
    </div>
  );
}

export default GatingDashboard;
