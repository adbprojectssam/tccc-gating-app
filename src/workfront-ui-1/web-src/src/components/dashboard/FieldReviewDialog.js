/*
 * <license header>
 */

import { useEffect, useRef, useState } from 'react';
import { CustomDialog, CloseButton, Button, TextField, ProgressCircle } from '@react-spectrum/s2';
import AlertTriangle from '@react-spectrum/s2/icons/AlertTriangle';
import AlertDiamond from '@react-spectrum/s2/icons/AlertDiamond';
import CheckmarkCircle from '@react-spectrum/s2/icons/CheckmarkCircle';
import { LABELS, formatLabel, fieldLabel } from '../../constants/labels';
import { getImsAuth } from '../../api/imsAuth';
import { extractFields } from '../../api/artifactClient';
import { MOCK_EXTRACTED_FIELDS } from '../../data/mockExtractedFields';
import { dashboardBase, dialogTitle, dialogDesc, bannerTitle, bannerBody, fullWidth } from './styles';

// Confidence below this (90%) means the extraction is unsure — the field needs
// the user to confirm/enter a value before the pre-read can be shared.
const LOW_CONFIDENCE = 0.9;

/**
 * Field-review dialog. Opened after "Generate Pre-read": it sends the uploaded
 * document ids to the extraction API and lists the returned Workfront field
 * values as cards. Two states (Figma 2318-124544 / 2318-124639):
 *
 *  - "Need Attention": some fields are low-confidence or missing. Those render
 *    as red cards with an "Enter Value" action; valid fields render green.
 *    Footer = Save Draft + (disabled) Confirm & Share Pre-read.
 *  - "Complete your Pre-read": every field is valid/filled — all cards green.
 *    Footer = Cancel + (enabled) Confirm & Share Pre-read.
 *
 * NOTE: field labels use the raw Workfront field key until the field/label
 * mappings are provided (see `FIELD_LABELS` in constants/labels.js).
 */
function FieldReviewDialog({ documentIds = [], onCancel, onConfirm, onSaveDraft }) {
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [fields, setFields] = useState([]);
  const [entered, setEntered] = useState({}); // index → committed user value (validates the field)
  const [openEditors, setOpenEditors] = useState({}); // index → editor visible
  const [drafts, setDrafts] = useState({}); // index → current editor text
  const [error, setError] = useState('');
  const ctxRef = useRef(null);

  // Fetch the extracted fields once, when the dialog opens.
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const ctx = await getImsAuth();
        ctxRef.current = ctx;
        const result = await extractFields({
          projectId: ctx.projectId,
          documentIds,
          imsToken: ctx.imsToken,
          imsOrg: ctx.imsOrg,
        });
        if (!active) return;
        const list = Array.isArray(result) ? result : [];
        // Empty extraction → fall back to the temporary mock so the UI can be
        // exercised before the endpoint returns real data.
        setFields(list.length > 0 ? list : MOCK_EXTRACTED_FIELDS);
        setStatus('ready');
      } catch (e) {
        if (!active) return;
        setError(e.message);
        setStatus('error');
      }
    })();
    return () => {
      active = false;
    };
    // documentIds is fixed for the dialog's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasValue = (f) => f.value != null && String(f.value).trim() !== '';
  const isValidated = (i) => entered[i] != null && String(entered[i]).trim() !== '';
  const needsReview = (f, i) => Number(f.confidence) < LOW_CONFIDENCE && !isValidated(i);
  const displayValue = (f, i) => (isValidated(i) ? entered[i] : hasValue(f) ? String(f.value) : '');

  const reviewCount = fields.reduce((n, f, i) => n + (needsReview(f, i) ? 1 : 0), 0);
  const allValid = status === 'ready' && fields.length > 0 && reviewCount === 0;

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

  const collectValues = () =>
    fields.map((f, i) => ({
      field: f.field,
      value: isValidated(i) ? entered[i] : f.value,
      confidence: f.confidence,
      page: f.page,
      source: f.source,
    }));

  const handleConfirm = () => onConfirm && onConfirm(collectValues());
  const handleSaveDraft = () => (onSaveDraft ? onSaveDraft(collectValues()) : onCancel && onCancel());

  const renderCard = (f, i) => {
    if (!needsReview(f, i)) {
      return (
        <div key={`${f.field}-${i}`} className="es-fieldreview__card es-fieldreview__card--valid">
          <div className="es-fieldreview__card-main">
            <div className={`es-fieldreview__card-title ${bannerTitle}`}>{fieldLabel(f.field)}</div>
            <div className={`es-fieldreview__card-value ${bannerBody}`}>
              {formatLabel(LABELS.fieldReview.valueLine, { value: displayValue(f, i) })}
            </div>
          </div>
          <span className="es-fieldreview__card-icon es-fieldreview__card-icon--ok">
            <CheckmarkCircle aria-hidden="true" />
          </span>
        </div>
      );
    }
    const missing = !hasValue(f);
    const label = fieldLabel(f.field);
    return (
      <div key={`${f.field}-${i}`} className="es-fieldreview__card es-fieldreview__card--review">
        <div className="es-fieldreview__card-main">
          <div className={`es-fieldreview__card-title ${bannerTitle}`}>
            {label}
            {missing ? LABELS.fieldReview.missingSuffix : ''}
          </div>
          <div className={`es-fieldreview__card-hint ${bannerBody}`}>
            {missing
              ? formatLabel(LABELS.fieldReview.missingHint, { label })
              : LABELS.fieldReview.lowConfidenceHint}
          </div>
          {openEditors[i] ? (
            <div
              className="es-fieldreview__editor"
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
            <button type="button" className="es-fieldreview__enter" onClick={() => openEditor(i, f)}>
              {LABELS.fieldReview.enterValue}
            </button>
          )}
        </div>
        <span className="es-fieldreview__card-icon es-fieldreview__card-icon--warn">
          <AlertTriangle aria-hidden="true" />
        </span>
      </div>
    );
  };

  return (
    <CustomDialog size="M" isDismissible padding="none">
      {/* Portal renders outside .es-dashboard — re-apply the sans font. */}
      <div className={`es-fieldreview ${dashboardBase}`}>
        <div className="es-fieldreview__close">
          <CloseButton />
        </div>

        {status === 'loading' && (
          <div className="es-fieldreview__center">
            <ProgressCircle isIndeterminate aria-label={LABELS.fieldReview.loading} />
            <span className={dialogDesc}>{LABELS.fieldReview.loading}</span>
          </div>
        )}

        {status === 'error' && (
          <>
            <h2 className={`es-fieldreview__title ${dialogTitle}`}>{LABELS.fieldReview.needAttentionTitle}</h2>
            <div className="es-fieldreview__notice">
              <span className={bannerBody}>{error || LABELS.fieldReview.error}</span>
              <AlertDiamond aria-hidden="true" />
            </div>
          </>
        )}

        {status === 'ready' &&
          (fields.length === 0 ? (
            <>
              <h2 className={`es-fieldreview__title ${dialogTitle}`}>{LABELS.fieldReview.needAttentionTitle}</h2>
              <div className={`es-fieldreview__empty ${dialogDesc}`}>{LABELS.fieldReview.empty}</div>
            </>
          ) : (
            <>
              <h2 className={`es-fieldreview__title ${dialogTitle}`}>
                {allValid ? LABELS.fieldReview.completeTitle : LABELS.fieldReview.needAttentionTitle}
              </h2>
              {!allValid && (
                <p className="es-fieldreview__subtitle">
                  {formatLabel(LABELS.fieldReview.reviewSubtitle, { count: reviewCount })}
                </p>
              )}
              <p className={`es-fieldreview__desc ${dialogDesc}`}>{LABELS.fieldReview.body}</p>

              <div className="es-fieldreview__list">{fields.map(renderCard)}</div>

              <div className="es-fieldreview__footer">
                {allValid ? (
                  <>
                    <Button variant="secondary" fillStyle="outline" onPress={onCancel}>
                      {LABELS.fieldReview.cancel}
                    </Button>
                    <Button variant="primary" fillStyle="fill" onPress={handleConfirm}>
                      {LABELS.fieldReview.confirmShare}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="secondary" fillStyle="outline" onPress={handleSaveDraft}>
                      {LABELS.fieldReview.saveDraft}
                    </Button>
                    <Button variant="primary" fillStyle="fill" isDisabled>
                      {LABELS.fieldReview.confirmShare}
                    </Button>
                  </>
                )}
              </div>
            </>
          ))}
      </div>
    </CustomDialog>
  );
}

export default FieldReviewDialog;
