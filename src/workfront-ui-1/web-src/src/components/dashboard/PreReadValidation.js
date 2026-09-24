/*
 * <license header>
 */

import { useMemo, useState } from 'react';
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
 * The extraction agent can return multiple entries for the same field name —
 * e.g. several "risks" or "evidence_highlights" bullets, each its own array
 * item with its own confidence. Left as-is, that field would render as
 * several duplicate-labeled cards, sometimes split across different tabs
 * when the bullets' confidences straddle LOW_CONFIDENCE. Merge same-named
 * entries into one card instead: values joined into a single string, and
 * confidence set to the LOWEST among them (if any one bullet needs review,
 * the whole field does). Fields that only appear once pass through unchanged.
 */
function mergeDuplicateFields(fields) {
  const order = [];
  const byField = new Map();
  fields.forEach((f) => {
    if (!byField.has(f.field)) {
      order.push(f.field);
      byField.set(f.field, []);
    }
    byField.get(f.field).push(f);
  });
  return order.map((key) => {
    const group = byField.get(key);
    if (group.length === 1) {
      const item = group[0];
      const conflictValues = [item.workfrontValue, ...(Array.isArray(item.conflictValues) ? item.conflictValues : []), item.value]
        .filter((value) => value != null && String(value).trim() !== '')
        .map(String)
        .filter((value, index, values) => values.indexOf(value) === index);
      return { ...item, conflictValues };
    }
    const values = group.map((f) => f.value).filter((v) => v != null && String(v).trim() !== '');
    const confidence = group.reduce((min, f) => Math.min(min, Number(f.confidence) || 0), Infinity);
    const workfrontValue = group.map((f) => f.workfrontValue).find((v) => v != null && String(v).trim() !== '');
    return {
      ...group[0],
      value: values.length ? values.join('; ') : null,
      confidence: Number.isFinite(confidence) ? confidence : 0,
      workfrontValue,
      conflictValues: [workfrontValue, ...values]
        .filter((value) => value != null && String(value).trim() !== '')
        .map(String)
        .filter((value, index, allValues) => allValues.indexOf(value) === index),
    };
  });
}

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
  drafts = [],
  selectedDraftId = null,
  onDraftChange,
  projectTitle,
  onViewPreRead,
  onUpdatePreRead,
  onSubmitForReview,
  isSubmitting = false,
  submitError = '',
}) {
  const [entered, setEntered] = useState({}); // index → committed/resolved value
  const [openEditors, setOpenEditors] = useState({}); // index → editor/dropdown visible
  const [editorDrafts, setEditorDrafts] = useState({}); // index → current free-text editor value
  const [activeTab, setActiveTab] = useState('high');

  // One entry per field name (see mergeDuplicateFields) — everything below
  // indexes into this, not the raw `fields` prop.
  const mergedFields = useMemo(() => mergeDuplicateFields(fields), [fields]);

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
    setEditorDrafts((p) => ({ ...p, [i]: p[i] ?? (hasValue(f) ? String(f.value) : '') }));
  };
  const setDraft = (i, v) => setEditorDrafts((p) => ({ ...p, [i]: v }));
  const saveEditor = (i) => {
    const v = String(editorDrafts[i] ?? '').trim();
    if (!v) return;
    setEntered((p) => ({ ...p, [i]: v }));
    setOpenEditors((p) => ({ ...p, [i]: false }));
  };
  const cancelEditor = (i) => {
    setOpenEditors((p) => ({ ...p, [i]: false }));
    setEditorDrafts((p) => {
      const next = { ...p };
      delete next[i];
      return next;
    });
  };

  const buckets = { high: [], low: [], conflict: [], missing: [] };
  mergedFields.forEach((f, i) => buckets[bucketOf(f)].push({ f, i }));
  const total = mergedFields.length;

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
          <Heading UNSAFE_className="es-gate1__card-title">{label}</Heading>
          <Content UNSAFE_className="es-gate1__card-body">
            {formatLabel(LABELS.fieldReview.valueLine, { value: displayValue(f, i) })}
          </Content>
          {openEditors[i] ? (
            <div className="es-gate1__editor">
              <TextField aria-label={label} value={editorDrafts[i] ?? ''} onChange={(value) => setDraft(i, value)} autoFocus styles={fullWidth} />
              <Button variant="secondary" fillStyle="outline" onPress={() => cancelEditor(i)}>{LABELS.fieldReview.cancel}</Button>
              <Button variant="primary" fillStyle="fill" isDisabled={String(editorDrafts[i] ?? '').trim() === ''} onPress={() => saveEditor(i)}>{LABELS.fieldReview.save}</Button>
            </div>
          ) : (
            <button type="button" className="es-gate1__enter" onClick={() => openEditor(i, f)}>{LABELS.fieldReview.edit}</button>
          )}
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
          <Heading UNSAFE_className="es-gate1__card-title">{label}</Heading>
          <Content UNSAFE_className="es-gate1__card-body">
            {formatLabel(LABELS.fieldReview.valueLine, { value: displayValue(f, i) })}
          </Content>
        </InlineAlert>
      );
    }

    // Conflicts render their resolver inline immediately (no collapsed
    // trigger link, per Figma 2850-115001 / 2992-136650) — the card is
    // always "in progress" until a value is confirmed, since there's no
    // single value to show at rest.
    if (bucket === 'conflict') {
      const options = f.conflictValues || [f.workfrontValue, f.value].filter(Boolean).map(String);
      const isWorkfrontValue = (value) => f.workfrontValue != null && String(f.workfrontValue).trim() === String(value).trim();
      const defaultValue = options.find((value) => !isWorkfrontValue(value)) || options[0] || '';
      const selectedValue = editorDrafts[i] ?? defaultValue;
      return (
        <InlineAlert key={i} variant="negative" styles={fullWidth}>
          <Heading UNSAFE_className="es-gate1__card-title">{label}</Heading>
          {options.length <= 2 ? (
            <div className="es-gate1__conflict-rows" role="radiogroup" aria-label={formatLabel(LABELS.fieldReview.resolveAriaLabel, { label })}>
              {options.map((value) => {
                const wf = isWorkfrontValue(value);
                const selected = selectedValue === value;
                return (
                  <div className="es-gate1__conflict-row" key={value}>
                    <span className="es-gate1__conflict-row-label">{wf ? LABELS.fieldReview.conflictWorkfrontLabel : LABELS.fieldReview.conflictDocLabel}</span>
                    <label className="es-gate1__conflict-radio-field">
                      <input type="radio" name={`es-gate1-conflict-${i}`} checked={selected} onChange={() => setDraft(i, value)} />
                      <span>{value}</span>
                    </label>
                    {!wf && f.docName && selected && (
                      <span className="es-gate1__conflict-caption">{formatLabel(LABELS.fieldReview.foundIn, { doc: f.docName })}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <Picker aria-label={formatLabel(LABELS.fieldReview.resolveAriaLabel, { label })} selectedKey={selectedValue || null} styles={fullWidth} UNSAFE_className="es-gate1__conflict-picker" onSelectionChange={(key) => setDraft(i, String(key))}>
              {options.map((value) => (
                <PickerItem key={value} id={value}>
                  {formatLabel(isWorkfrontValue(value) ? LABELS.fieldReview.conflictOptionWorkfront : LABELS.fieldReview.conflictOptionDoc, { value })}
                </PickerItem>
              ))}
            </Picker>
          )}
          <button type="button" className="es-gate1__enter" disabled={!selectedValue} onClick={() => setEntered((p) => ({ ...p, [i]: selectedValue }))}>{LABELS.fieldReview.confirmValue}</button>
        </InlineAlert>
      );
    }

    if (bucket === 'missing') {
      // No collapsed state — there's no existing value to show at rest, so
      // the entry field is always visible (Figma 2992-132927).
      return (
        <div key={i} className="es-gate1__card-plain">
          <Heading UNSAFE_className="es-gate1__card-title">{label}</Heading>
          <div
            className="es-gate1__editor"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                saveEditor(i);
              }
            }}
          >
            <TextField aria-label={label} placeholder={LABELS.fieldReview.enterValue} value={editorDrafts[i] ?? ''} onChange={(v) => setDraft(i, v)} styles={fullWidth} />
          </div>
          <div className="es-gate1__editor-actions">
            <Button variant="secondary" fillStyle="outline" onPress={() => setDraft(i, '')}>{LABELS.fieldReview.cancel}</Button>
            <Button variant="primary" fillStyle="fill" isDisabled={String(editorDrafts[i] ?? '').trim() === ''} onPress={() => saveEditor(i)}>{LABELS.fieldReview.save}</Button>
          </div>
        </div>
      );
    }

    // Low confidence: collapsed "Review" card until opened, then a plain
    // (unaccented) editor card with the confidence caption below the field
    // and a "Confirm value" button (Figma 2992-130940).
    if (openEditors[i]) {
      return (
        <div key={i} className="es-gate1__card-plain">
          <Heading UNSAFE_className="es-gate1__card-title">{label}</Heading>
          <div className="es-gate1__editor">
            <TextField
              aria-label={label}
              value={editorDrafts[i] ?? ''}
              onChange={(v) => setDraft(i, v)}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              styles={fullWidth}
            />
          </div>
          <Content UNSAFE_className="es-gate1__card-body">
            {formatLabel(LABELS.fieldReview.confidenceCaption, { percent: Math.round((Number(f.confidence) || 0) * 100) })}
          </Content>
          <div className="es-gate1__editor-actions">
            <Button variant="secondary" fillStyle="outline" onPress={() => cancelEditor(i)}>{LABELS.fieldReview.cancel}</Button>
            <Button variant="primary" fillStyle="fill" isDisabled={String(editorDrafts[i] ?? '').trim() === ''} onPress={() => saveEditor(i)}>{LABELS.fieldReview.confirmValue}</Button>
          </div>
        </div>
      );
    }
    return (
      <InlineAlert key={i} variant="notice" styles={fullWidth}>
        <Heading UNSAFE_className="es-gate1__card-title">{label}</Heading>
        <Content UNSAFE_className="es-gate1__card-body">
          {formatLabel(LABELS.fieldReview.confidenceHint, { percent: Math.round((Number(f.confidence) || 0) * 100) })}
        </Content>
        <button type="button" className="es-gate1__enter" onClick={() => openEditor(i, f)}>{LABELS.fieldReview.review}</button>
      </InlineAlert>
    );
  };

  return (
    <SectionCard
      title={LABELS.fieldReview.title}
      subtitle={projectTitle}
      action={
        drafts.length > 0 ? (
          <Picker
            size="S"
            aria-label={LABELS.fieldReview.versionPlaceholder}
            selectedKey={selectedDraftId || drafts[drafts.length - 1].id}
            onSelectionChange={onDraftChange}
          >
            {drafts.map((draft, index) => (
              <PickerItem key={draft.id} id={draft.id}>{`${draft.label} ${index === drafts.length - 1 ? '(Current)' : ''}`.trim()}</PickerItem>
            ))}
          </Picker>
        ) : (
          <span className="es-gate1__version" aria-disabled="true">
            <Text>{LABELS.fieldReview.versionPlaceholder}</Text>
            <ChevronDown />
          </span>
        )
      }
    >
      {mergedFields.length === 0 ? (
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
