/*
 * <license header>
 */

import { useState } from 'react';
import {
  Button,
  Text,
  TextField,
  Picker,
  PickerItem,
  ProgressBar,
  ProgressCircle,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  InlineAlert,
  Heading,
  Content,
} from '@react-spectrum/s2';
import ChevronDown from '@react-spectrum/s2/icons/ChevronDown';
import Visibility from '@react-spectrum/s2/icons/Visibility';
import Refresh from '@react-spectrum/s2/icons/Refresh';
import { LABELS, formatLabel, fieldLabel } from '../../constants/labels';
import SectionCard from './SectionCard';
import { dialogDesc, bannerBody, progressWidth, fullWidth } from './styles';

// Confidence below this (90%) means the extraction is unsure — the field needs
// the user to confirm/enter a value before it counts as "complete".
const LOW_CONFIDENCE = 0.9;

/**
 * Gate 1 readiness card. Rendered inline in the dashboard (not a popup) once
 * "Generate Pre-read" has extracted field values: splits `fields` into four
 * tabs — High Confidence, Low Confidence, Conflicts, Missing Data (Figma
 * 2819-62970 / 2832-108445 / 2850-113798, Conflicts tab per the same node
 * with the "Conflicts" state). Bucket membership is static (based on the
 * field's own data), unlike an earlier version of this card — confirming or
 * resolving a low/conflict/missing field does NOT move it to another tab; the
 * card stays put and gets a checkmark (colored to match its own tab) instead.
 * Once resolved, that field is added to the payload for "Submit for Review"
 * alongside the always-included high-confidence fields.
 *
 * A field is a "conflict" when the extraction includes a `workfrontValue`
 * (the value currently on the Workfront task) that differs from the
 * doc-extracted `value` — independent of confidence. Conflicts are resolved
 * via a dropdown (pick one of the two known values), not free text.
 *
 * The extract-fields call itself happens in the parent (while the upload
 * modal is still open, showing its own loading state) — this component is
 * purely presentational over the `fields` result.
 *
 * NOTE: field labels use the raw Workfront field key until the field/label
 * mappings are provided (see `FIELD_LABELS` in constants/labels.js).
 */
function PreReadValidation({
  fields = [],
  projectTitle,
  onViewPreRead,
  onUpdatePreRead,
  onSubmitForReview,
  isSubmitting = false,
  submitError = '',
}) {
  const [entered, setEntered] = useState({}); // index → committed/resolved value
  const [openEditors, setOpenEditors] = useState({}); // index → editor/dropdown visible
  const [drafts, setDrafts] = useState({}); // index → current free-text editor value
  const [activeTab, setActiveTab] = useState('high');

  const hasValue = (f) => f.value != null && String(f.value).trim() !== '';
  const hasConflict = (f) => {
    const wf = f.workfrontValue;
    if (wf == null || String(wf).trim() === '') return false;
    return String(wf).trim() !== String(f.value ?? '').trim();
  };
  const isValidated = (i) => entered[i] != null && String(entered[i]).trim() !== '';
  const displayValue = (f, i) => (isValidated(i) ? entered[i] : hasValue(f) ? String(f.value) : '');
  // Static per field — resolving a field does not change which bucket it's in.
  const bucketOf = (f) => {
    if (hasConflict(f)) return 'conflict';
    if (!hasValue(f)) return 'missing';
    return Number(f.confidence) < LOW_CONFIDENCE ? 'low' : 'high';
  };

  const openEditor = (i, f) => {
    setOpenEditors((p) => ({ ...p, [i]: true }));
    setDrafts((p) => ({ ...p, [i]: p[i] ?? (hasValue(f) ? String(f.value) : '') }));
  };
  const setDraft = (i, v) => setDrafts((p) => ({ ...p, [i]: v }));
  const saveEditor = (i) => {
    const v = String(drafts[i] ?? '').trim();
    if (!v) return;
    setEntered((p) => ({ ...p, [i]: v }));
    setOpenEditors((p) => ({ ...p, [i]: false }));
  };
  const resolveConflict = (i, value) => {
    setEntered((p) => ({ ...p, [i]: value }));
    setOpenEditors((p) => ({ ...p, [i]: false }));
  };

  const buckets = { high: [], low: [], conflict: [], missing: [] };
  fields.forEach((f, i) => buckets[bucketOf(f)].push({ f, i }));
  const total = fields.length;

  // Every high-confidence field counts, plus any low/conflict/missing field
  // the user has resolved in place — this is exactly the Submit for Review
  // payload, and what "fields complete" counts against.
  const resolvedNonHigh = [...buckets.low, ...buckets.conflict, ...buckets.missing].filter(({ i }) => isValidated(i));
  const validatedFields = [...buckets.high, ...resolvedNonHigh].map(({ f, i }) => ({
    field: f.field,
    value: displayValue(f, i),
  }));
  const completedCount = validatedFields.length;
  const percent = total ? Math.round((completedCount / total) * 100) : 0;

  const renderCard = ({ f, i }, bucket) => {
    const label = fieldLabel(f.field);

    if (bucket === 'high') {
      return (
        <InlineAlert key={i} variant="positive" styles={fullWidth}>
          <Heading>{label}</Heading>
          <Content>{formatLabel(LABELS.fieldReview.valueLine, { value: displayValue(f, i) })}</Content>
        </InlineAlert>
      );
    }

    const resolved = isValidated(i);
    if (resolved) {
      // Stays in its own tab — variant="positive" gives the same checkmark a
      // high-confidence card gets, then the es-gate1__resolved--<bucket>
      // class recolors it to match this tab instead of green.
      return (
        <InlineAlert key={i} variant="positive" styles={fullWidth} UNSAFE_className={`es-gate1__resolved--${bucket}`}>
          <Heading>{label}</Heading>
          <Content>{formatLabel(LABELS.fieldReview.valueLine, { value: displayValue(f, i) })}</Content>
        </InlineAlert>
      );
    }

    if (bucket === 'conflict') {
      return (
        <InlineAlert key={i} variant="negative" styles={fullWidth}>
          <Heading>{label}</Heading>
          <Content>
            {formatLabel(LABELS.fieldReview.conflictHint, { workfrontValue: f.workfrontValue, value: f.value })}
          </Content>
          {openEditors[i] ? (
            <Picker
              aria-label={formatLabel(LABELS.fieldReview.resolveAriaLabel, { label })}
              styles={fullWidth}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onSelectionChange={(key) => resolveConflict(i, String(key))}
            >
              <PickerItem id={String(f.workfrontValue)}>
                {formatLabel(LABELS.fieldReview.conflictOptionWorkfront, { value: f.workfrontValue })}
              </PickerItem>
              <PickerItem id={String(f.value)}>
                {formatLabel(LABELS.fieldReview.conflictOptionDoc, { value: f.value })}
              </PickerItem>
            </Picker>
          ) : (
            <button
              type="button"
              className="es-gate1__enter"
              onClick={() => setOpenEditors((p) => ({ ...p, [i]: true }))}
            >
              {LABELS.fieldReview.resolveConflict}
            </button>
          )}
        </InlineAlert>
      );
    }

    const missing = bucket === 'missing';
    return (
      <InlineAlert
        key={i}
        variant={missing ? 'negative' : 'notice'}
        styles={fullWidth}
        UNSAFE_className={missing ? 'es-gate1__missing-icon' : undefined}
      >
        <Heading>{missing ? `${label}${LABELS.fieldReview.missingSuffix}` : label}</Heading>
        <Content>
          {missing
            ? LABELS.fieldReview.missingHint
            : formatLabel(LABELS.fieldReview.confidenceHint, {
                percent: Math.round((Number(f.confidence) || 0) * 100),
              })}
        </Content>
        {openEditors[i] ? (
          <div
            className="es-gate1__editor"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                saveEditor(i);
              }
            }}
          >
            <TextField
              aria-label={label}
              value={drafts[i] ?? ''}
              onChange={(v) => setDraft(i, v)}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              styles={fullWidth}
            />
            <Button
              variant="primary"
              fillStyle="fill"
              isDisabled={String(drafts[i] ?? '').trim() === ''}
              onPress={() => saveEditor(i)}
            >
              {LABELS.fieldReview.save}
            </Button>
          </div>
        ) : (
          <button type="button" className="es-gate1__enter" onClick={() => openEditor(i, f)}>
            {missing ? LABELS.fieldReview.enterValue : LABELS.fieldReview.confirmValue}
          </button>
        )}
      </InlineAlert>
    );
  };

  return (
    <SectionCard
      title={LABELS.fieldReview.title}
      subtitle={projectTitle}
      action={
        <span className="es-gate1__version" aria-disabled="true">
          <Text>{LABELS.fieldReview.versionPlaceholder}</Text>
          <ChevronDown />
        </span>
      }
    >
      {fields.length === 0 ? (
        <p className={dialogDesc}>{LABELS.fieldReview.empty}</p>
      ) : (
        <>
          <hr className="es-gate1__divider" />
          <div className="es-gate1__toolbar">
            <div className="es-gate1__progress">
              <ProgressBar styles={progressWidth} aria-label={LABELS.fieldReview.title} value={percent} />
              <span className={bannerBody}>
                {formatLabel(LABELS.fieldReview.progress, { completed: completedCount, total })}
              </span>
            </div>
            <div className="es-gate1__spacer" />
            <div className="es-gate1__actions">
              <Button variant="secondary" fillStyle="outline" onPress={onViewPreRead}>
                <Visibility />
                <Text>{LABELS.fieldReview.viewPreRead}</Text>
              </Button>
              <Button variant="secondary" fillStyle="outline" onPress={onUpdatePreRead}>
                <Refresh />
                <Text>{LABELS.fieldReview.updatePreRead}</Text>
              </Button>
              <Button
                variant="primary"
                fillStyle="fill"
                isDisabled={isSubmitting}
                onPress={() => onSubmitForReview && onSubmitForReview(validatedFields)}
              >
                {isSubmitting && <ProgressCircle size="S" isIndeterminate aria-label={LABELS.fieldReview.submitting} staticColor="white" />}
                <Text>{LABELS.fieldReview.submitForReview}</Text>
              </Button>
            </div>
          </div>

          {submitError && <div className="es-artifact__file-error">{submitError}</div>}

          <Tabs aria-label={LABELS.fieldReview.title} selectedKey={activeTab} onSelectionChange={setActiveTab}>
            <TabList aria-label={LABELS.fieldReview.title}>
              <Tab id="high">
                <span className="es-gate1__tab es-gate1__tab--high">
                  {formatLabel(LABELS.fieldReview.tabHigh, { count: buckets.high.length })}
                </span>
              </Tab>
              <Tab id="low">
                <span className="es-gate1__tab es-gate1__tab--low">
                  {formatLabel(LABELS.fieldReview.tabLow, { count: buckets.low.length })}
                </span>
              </Tab>
              <Tab id="conflict">
                <span className="es-gate1__tab es-gate1__tab--conflict">
                  {formatLabel(LABELS.fieldReview.tabConflict, { count: buckets.conflict.length })}
                </span>
              </Tab>
              <Tab id="missing">
                <span className="es-gate1__tab es-gate1__tab--missing">
                  {formatLabel(LABELS.fieldReview.tabMissing, { count: buckets.missing.length })}
                </span>
              </Tab>
            </TabList>
            <TabPanel id="high">
              <div className="es-tabpanel__grid es-gate1__panel">
                {buckets.high.map((item) => renderCard(item, 'high'))}
              </div>
            </TabPanel>
            <TabPanel id="low">
              <div className="es-tabpanel__grid es-gate1__panel">
                {buckets.low.map((item) => renderCard(item, 'low'))}
              </div>
            </TabPanel>
            <TabPanel id="conflict">
              <div className="es-tabpanel__grid es-gate1__panel">
                {buckets.conflict.map((item) => renderCard(item, 'conflict'))}
              </div>
            </TabPanel>
            <TabPanel id="missing">
              <div className="es-tabpanel__grid es-gate1__panel">
                {buckets.missing.map((item) => renderCard(item, 'missing'))}
              </div>
            </TabPanel>
          </Tabs>
        </>
      )}
    </SectionCard>
  );
}

export default PreReadValidation;
