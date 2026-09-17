/*
 * <license header>
 */

import { useEffect, useRef, useState } from 'react';
import { CustomDialog, CloseButton, Button, ActionButton, ProgressCircle, Badge } from '@react-spectrum/s2';
import Close from '@react-spectrum/s2/icons/Close';
import { LABELS } from '../../constants/labels';
import { getImsAuth } from '../../api/imsAuth';
import { uploadArtifact, deleteArtifact } from '../../api/artifactClient';
import { dashboardBase, dialogTitle, dialogDesc, dropzoneTitle, bannerTitle, bodyText, detailText } from './styles';

let uid = 0;
const nextUid = () => `f${(uid += 1)}`;

/** Drop-zone illustration (Figma "S2_lin_dropToUpload"). Uses currentColor so
 *  it can be recolored via CSS like the rest of the dropzone glyphs. */
function DropToUploadIcon() {
  return (
    <svg viewBox="0 0 96 96" width="96" height="96" fill="none" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M12 68.74C13.1046 68.74 14 69.6354 14 70.74V74.24C14 75.0684 14.6716 75.74 15.5 75.74H19C20.1046 75.74 21 76.6354 21 77.74C21 78.8446 20.1046 79.74 19 79.74H15.5C12.4624 79.74 10 77.2776 10 74.24V70.74C10 69.6354 10.8954 68.74 12 68.74ZM34.5 75.74C35.6046 75.74 36.5 76.6354 36.5 77.74C36.5 78.8446 35.6046 79.74 34.5 79.74H27C25.8954 79.74 25 78.8446 25 77.74C25 76.6354 25.8954 75.74 27 75.74H34.5ZM51.5 75.74C52.6046 75.74 53.5 76.6354 53.5 77.74C53.5 78.8446 52.6046 79.74 51.5 79.74H44C42.8954 79.74 42 78.8446 42 77.74C42 76.6354 42.8954 75.74 44 75.74H51.5ZM68.5 75.74C69.6046 75.74 70.5 76.6354 70.5 77.74C70.5 78.8446 69.6046 79.74 68.5 79.74H61C59.8954 79.74 59 78.8446 59 77.74C59 76.6354 59.8954 75.74 61 75.74H68.5ZM84 68.74C85.1046 68.74 86 69.6354 86 70.74V74.24C86 77.2776 83.5376 79.74 80.5 79.74H77C75.8954 79.74 75 78.8446 75 77.74C75 76.6354 75.8954 75.74 77 75.74H80.5C81.3284 75.74 82 75.0684 82 74.24V70.74C82 69.6354 82.8954 68.74 84 68.74ZM47.5586 15.74C49.5319 15.74 51.4273 16.5191 52.8262 17.9099L67.8125 32.8103C69.2118 34.2015 70 36.0908 70 38.0632V59.3172C69.9999 63.4274 66.6517 66.7398 62.5459 66.74H33.4541C29.3483 66.7398 26.0001 63.4274 26 59.3172V23.1629C26.0001 19.0526 29.3483 15.7402 33.4541 15.74H47.5586ZM84 55.24C85.1046 55.24 86 56.1354 86 57.24V64.74C86 65.8446 85.1046 66.74 84 66.74C82.8954 66.74 82 65.8446 82 64.74V57.24C82 56.1354 82.8954 55.24 84 55.24ZM12 54.74C13.1046 54.74 14 55.6354 14 56.74V64.24C14 65.3446 13.1046 66.24 12 66.24C10.8954 66.24 10 65.3446 10 64.24V56.74C10 55.6354 10.8954 54.74 12 54.74ZM33.4541 19.74C31.5356 19.7402 30.0001 21.2835 30 23.1629V59.3172C30.0001 61.1965 31.5356 62.7398 33.4541 62.74H62.5459C64.4644 62.7398 65.9999 61.1965 66 59.3172V38.0632C66 37.1592 65.6387 36.2901 64.9922 35.6472L50.0059 20.7468C49.3589 20.1036 48.4785 19.74 47.5586 19.74H33.4541ZM47.0479 31.74C48.1523 31.7424 49.0461 32.6396 49.0439 33.7439L49.0088 49.5252L54.2227 45.2009C55.0727 44.4958 56.3338 44.6128 57.0391 45.4627C57.7442 46.3127 57.6272 47.5738 56.7773 48.2791L48.3389 55.2791C47.9599 55.5934 47.4936 55.7454 47.0293 55.7381C47.0182 55.7382 47.0072 55.74 46.9961 55.74C46.376 55.7387 45.8221 55.4553 45.4561 55.0115L37.2344 48.2888C36.3793 47.5898 36.2524 46.3295 36.9512 45.4744C37.6502 44.6193 38.9105 44.4924 39.7656 45.1912L45.0088 49.4773L45.0439 33.7361C45.0464 32.6316 45.9434 31.7377 47.0479 31.74ZM19 40.74C20.1046 40.74 21 41.6354 21 42.74C21 43.8446 20.1046 44.74 19 44.74H15.5C14.6716 44.74 14 45.4116 14 46.24V49.74C14 50.8446 13.1046 51.74 12 51.74C10.8954 51.74 10 50.8446 10 49.74V46.24C10 43.2024 12.4624 40.74 15.5 40.74H19ZM80.5 40.74C83.5376 40.74 86 43.2024 86 46.24V49.74C86 50.8446 85.1046 51.74 84 51.74C82.8954 51.74 82 50.8446 82 49.74V46.24C82 45.4116 81.3284 44.74 80.5 44.74H77C75.8954 44.74 75 43.8446 75 42.74C75 41.6354 75.8954 40.74 77 40.74H80.5Z"
      />
    </svg>
  );
}

/** Generic document file-type glyph (Figma "S2_Icon_ DOC_20_N"). */
function DocFileIcon() {
  return (
    <svg viewBox="0 0 13 16" width="13" height="16" fill="none" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M11.1162 0C12.1549 0.000227774 12.9999 0.86527 13 1.92871V14.0713C13 15.1346 12.155 15.9998 11.1162 16H1.77051C0.794312 15.9999 0 15.1563 0 14.1201V14.0576H1.04199V14.1201C1.04199 14.5467 1.3686 14.8944 1.77051 14.8945H11.1162C11.5807 14.8943 11.958 14.525 11.958 14.0713V1.92871C11.9579 1.47504 11.5806 1.10569 11.1162 1.10547H4.18066V2.9541C4.18044 3.7719 3.55347 4.43725 2.7832 4.4375H1.04199V8H0V3.88477C0 3.84905 0.00366881 3.8141 0.00976562 3.78027C0.0100041 3.77896 0.0105483 3.77768 0.0107422 3.77637C0.019795 3.72811 0.0356767 3.68251 0.0556641 3.63965C0.0602011 3.62999 0.0652291 3.62078 0.0703125 3.61133C0.0934971 3.56838 0.12053 3.52786 0.15332 3.49316L3.29102 0.162109C3.32356 0.127531 3.36212 0.099743 3.40234 0.0751953C3.41141 0.0697421 3.42036 0.0644924 3.42969 0.0595703C3.46992 0.0383932 3.51231 0.0202843 3.55762 0.0107422H3.56055C3.59255 0.00417335 3.62537 2.96497e-05 3.65918 0H11.1162ZM5.16504 9C6.24596 9.00007 6.85394 9.8204 6.85938 10.8145C6.86477 11.9225 6.16995 12.6669 5.1543 12.667C4.08972 12.667 3.45914 11.8847 3.45898 10.8311C3.45898 9.81523 4.13835 9 5.16504 9ZM9.25586 9C9.59805 9 9.82069 9.02759 9.96191 9.09277C9.98892 9.10362 9.99993 9.12484 10 9.15723V9.75C9.99987 9.79837 9.97281 9.79882 9.95117 9.78809C9.77195 9.70119 9.51666 9.66798 9.24512 9.66797C8.51721 9.66797 8.0713 10.119 8.07129 10.8252C8.07129 11.6724 8.69049 11.993 9.26074 11.9932C9.52687 11.9932 9.7283 11.9714 9.92383 11.9062C9.95099 11.8954 9.96777 11.901 9.96777 11.9336V12.4932C9.96773 12.5311 9.95635 12.5585 9.92383 12.5693C9.74458 12.6345 9.47299 12.667 9.16895 12.667C8.11514 12.667 7.29499 12.0421 7.29492 10.8525C7.29492 9.7498 8.05534 9 9.25586 9ZM1.09766 9.04297C2.39572 9.0431 3.03125 9.7715 3.03125 10.7764C3.03121 12.0745 2.03179 12.623 1.1084 12.623C0.749873 12.623 0.206057 12.6232 0.0322266 12.6123C0.0107425 12.6121 0 12.5954 0 12.5576V9.10352C0 9.07635 0.0054927 9.065 0.0380859 9.05957C0.201097 9.05414 0.614254 9.04297 1.09766 9.04297ZM5.1543 9.66797C4.61111 9.66797 4.23638 10.0918 4.23633 10.8359C4.23633 11.4932 4.57323 11.999 5.18164 11.999C5.74632 11.9988 6.08301 11.5365 6.08301 10.8359C6.07753 10.1137 5.74077 9.6681 5.1543 9.66797ZM0.754883 9.70605V11.9609C0.863416 11.9664 0.950459 11.9717 1.0752 11.9717C1.78681 11.9717 2.25391 11.5422 2.25391 10.7871C2.25389 10.0592 1.78711 9.70117 1.0918 9.70117C0.961467 9.70117 0.874368 9.70062 0.754883 9.70605Z"
      />
    </svg>
  );
}

/** PDF file-type glyph (Figma "S2_Icon_ PDF_20_N"). */
function PdfFileIcon() {
  return (
    <svg viewBox="0 0 13 16" width="13" height="16" fill="none" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M11.1158 0H3.65956C3.62549 0 3.59238 0.00399466 3.56013 0.0106344C3.55917 0.0108504 3.55815 0.0107424 3.55718 0.0109583C3.51182 0.0205131 3.46961 0.0380572 3.42933 0.0592721C3.41992 0.0642384 3.41107 0.0695286 3.40191 0.0750348C3.36158 0.0996505 3.32344 0.127775 3.29084 0.162485L0.153084 3.49316C0.12028 3.52787 0.0936811 3.56852 0.0704896 3.61149C0.065353 3.62105 0.0604197 3.63033 0.0558424 3.6401C0.0358551 3.68296 0.0193262 3.72777 0.0102734 3.77603C0.0100191 3.77743 0.0101717 3.77884 0.00991737 3.78024C0.00381437 3.81409 0 3.8488 0 3.88453V8.00005H1.04158V4.43731H2.78276C3.55337 4.43731 4.18035 3.77182 4.18035 2.95367V1.10555H11.1158C11.5804 1.10555 11.9584 1.475 11.9584 1.92888V14.0713C11.9584 14.5252 11.5804 14.8945 11.1158 14.8945H1.77068C1.3687 14.8945 1.04158 14.5472 1.04158 14.1206V14.0577H0V14.1206C0 15.1568 0.794407 16 1.77068 16H11.1158C12.1547 16 13 15.1348 13 14.0713V1.92888C13 0.865221 12.1547 0 11.1158 0Z"
      />
      <path
        fill="currentColor"
        d="M1.35499 11.5592H0.854139V12.8235H0.0458984V9.30151H1.35499C2.16811 9.30151 2.57457 9.78821 2.57457 10.4353C2.57457 11.0175 2.20107 11.5592 1.35499 11.5592ZM1.29355 10.8769C1.61498 10.8769 1.75209 10.7063 1.75209 10.4353C1.75209 10.1646 1.61498 9.99399 1.29355 9.99399H0.854139V10.8769H1.29355ZM5.97679 11.0626C5.97679 12.106 5.29631 12.8235 4.23744 12.8235H2.99446V9.30151H4.23744C5.29631 9.30151 5.97679 10.0141 5.97679 11.0626ZM4.18556 12.0809C4.79525 12.0809 5.15452 11.7097 5.15452 11.0626C5.15452 10.4153 4.79525 10.0342 4.18556 10.0342H3.8027V12.0809H4.18556ZM6.42984 9.30151H8.58989V9.98902H7.23808V10.7314H8.24955V11.3986H7.23808V12.8235H6.42984V9.30151Z"
      />
    </svg>
  );
}

/** Uppercase extension from a filename, e.g. "Budget_v3.xlsx" → "XLSX". */
function fileExtension(name) {
  const m = /\.([a-z0-9]+)$/i.exec(name || '');
  return m ? m[1].toUpperCase() : '';
}

/** Badge color per extension (docx=informative, spreadsheets=positive, else
 *  neutral) — matches the Figma file-list treatment. */
function badgeVariant(extension) {
  if (extension === 'DOC' || extension === 'DOCX') return 'informative';
  if (extension === 'XLS' || extension === 'XLSX' || extension === 'CSV') return 'positive';
  return 'neutral';
}

/** File-type icon per extension — only a generic-document and a PDF glyph
 *  exist in the design, so anything not a PDF uses the generic glyph. */
function FileTypeIcon({ extension }) {
  return extension === 'PDF' ? <PdfFileIcon /> : <DocFileIcon />;
}

/**
 * "Artifact" upload dialog (opened from the Artifacts header CTA, and reused
 * for "Update Pre-read"). Supports multiple files: each selected/dropped file
 * uploads to Workfront (attached to the project) and appears under "Uploaded
 * Artifacts"; the ✕ deletes it from Workfront. While a delete is in flight ALL
 * other CTAs are disabled, and "Validate Data" only enables once every
 * upload/delete has settled.
 *
 * `initialFiles` seeds the list with already-uploaded artifacts (used when
 * opened via "Update Pre-read", so the user sees previously uploaded
 * artifacts alongside anything new they add — removing one here deletes it
 * from Workfront just like a freshly-added file).
 *
 * `isGenerating`/`generateError` are driven by the parent: clicking "Validate
 * Data" calls `onGenerate` with every ready file (existing + new), and the
 * parent calls the extract-fields action *before* dismissing this dialog —
 * `isGenerating` shows a loading state here while that call is in flight, and
 * the dialog stays open (with `generateError` shown) if it fails, so the user
 * can retry.
 */
function ArtifactDialog({ onGenerate, onCancel, initialFiles = [], isGenerating = false, generateError = '' }) {
  const [files, setFiles] = useState(() =>
    initialFiles.map((f) => ({ id: f.id, name: f.name, size: f.size, status: 'ready', documentId: f.id }))
  );
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const inputRef = useRef(null);
  const ctxRef = useRef(null);

  // Read the Workfront context (project id, host, IMS token) for the actions.
  useEffect(() => {
    getImsAuth().then((a) => {
      ctxRef.current = a;
    });
  }, []);

  const patch = (id, changes) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...changes } : f)));

  const uploadOne = async (localId, file) => {
    const ctx = ctxRef.current || (await getImsAuth());
    ctxRef.current = ctx;
    try {
      const doc = await uploadArtifact({
        projectId: ctx.projectId,
        hostname: ctx.hostname,
        imsToken: ctx.imsToken,
        imsOrg: ctx.imsOrg,
        file,
      });
      patch(localId, { status: 'ready', documentId: doc.id });
    } catch (e) {
      patch(localId, { status: 'error', error: e.message });
    }
  };

  const addFiles = (fileList) => {
    const list = Array.from(fileList || []);
    list.forEach((file) => {
      const localId = nextUid();
      setFiles((prev) => [...prev, { id: localId, name: file.name, size: file.size, status: 'uploading' }]);
      uploadOne(localId, file);
    });
  };

  const removeFile = async (f) => {
    if (!f.documentId) {
      // Never persisted (still uploading / failed) — drop locally.
      setFiles((prev) => prev.filter((x) => x.id !== f.id));
      return;
    }
    const ctx = ctxRef.current || (await getImsAuth());
    ctxRef.current = ctx;
    setDeletingId(f.id);
    try {
      await deleteArtifact({
        documentId: f.documentId,
        hostname: ctx.hostname,
        imsToken: ctx.imsToken,
        imsOrg: ctx.imsOrg,
      });
      setFiles((prev) => prev.filter((x) => x.id !== f.id));
    } catch (e) {
      patch(f.id, { error: e.message });
    } finally {
      setDeletingId(null);
    }
  };

  const anyUploading = files.some((f) => f.status === 'uploading');
  const deleting = deletingId != null;
  const locked = deleting || isGenerating;
  const busy = anyUploading || locked;
  const readyCount = files.filter((f) => f.status === 'ready').length;
  const canGenerate = !busy && readyCount > 0;

  return (
    <CustomDialog size="M" isDismissible={!isGenerating} padding="none">
      {/* Portal renders outside .es-dashboard — re-apply the sans font. */}
      <div className={`es-artifact ${dashboardBase}`}>
        <div className="es-artifact__close">
          <CloseButton isDisabled={locked} />
        </div>
        <h2 className={`es-artifact__title ${dialogTitle}`}>{LABELS.artifact.title}</h2>
        <p className={`es-artifact__desc ${dialogDesc}`}>{LABELS.artifact.description}</p>

        {isGenerating ? (
          <div className="es-artifact__generating">
            <ProgressCircle isIndeterminate aria-label={LABELS.fieldReview.loading} />
            <span className={dialogDesc}>{LABELS.fieldReview.loading}</span>
          </div>
        ) : (
          <>
            <div
              className={dragOver ? 'es-dropzone es-dropzone--over' : 'es-dropzone'}
              onDragOver={(e) => {
                e.preventDefault();
                if (!locked) setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (!locked) addFiles(e.dataTransfer.files);
              }}
            >
              <DropToUploadIcon />
              <div className={`es-dropzone__title ${dropzoneTitle}`}>{LABELS.artifact.dropTitle}</div>
              <div className={`es-dropzone__subtitle ${dialogDesc}`}>{LABELS.artifact.dropSubtitle}</div>
              <Button
                variant="primary"
                fillStyle="fill"
                isDisabled={locked}
                onPress={() => inputRef.current && inputRef.current.click()}
              >
                {LABELS.artifact.browse}
              </Button>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="es-dropzone__input"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>

            {files.length > 0 && (
              <div className="es-artifact__uploaded">
                <div className={`es-artifact__uploaded-title ${bannerTitle}`}>{LABELS.artifact.uploaded}</div>
                {files.map((f) => {
                  const extension = fileExtension(f.name);
                  return (
                    <div key={f.id} className="es-artifact__file">
                      <div className="es-artifact__file-icon">
                        <FileTypeIcon extension={extension} />
                      </div>
                      <div className="es-artifact__file-meta">
                        <div className={bodyText}>{f.name}</div>
                        {f.status === 'uploading' && <div className={detailText}>{LABELS.artifact.uploading}</div>}
                        {f.status === 'error' && (
                          <div className="es-artifact__file-error">{f.error || LABELS.artifact.uploadFailed}</div>
                        )}
                      </div>
                      {f.status === 'uploading' ? (
                        <ProgressCircle size="S" isIndeterminate aria-label="Uploading" />
                      ) : (
                        <>
                          {f.status === 'ready' && (
                            <Badge variant={badgeVariant(extension)} fillStyle="subtle">
                              {extension}
                            </Badge>
                          )}
                          <ActionButton
                            isQuiet
                            aria-label={`Remove ${f.name}`}
                            isDisabled={locked}
                            onPress={() => removeFile(f)}
                          >
                            {deletingId === f.id ? (
                              <ProgressCircle size="S" isIndeterminate aria-label="Deleting" />
                            ) : (
                              <Close />
                            )}
                          </ActionButton>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {generateError && <div className="es-artifact__file-error">{generateError}</div>}
          </>
        )}

        <div className="es-artifact__footer">
          <Button variant="secondary" fillStyle="outline" isDisabled={locked} onPress={onCancel}>
            {LABELS.artifact.cancel}
          </Button>
          <Button
            variant="primary"
            fillStyle="fill"
            isDisabled={!canGenerate}
            onPress={() => onGenerate && onGenerate(files.filter((f) => f.status === 'ready'))}
          >
            {LABELS.artifact.generatePreRead}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
}

export default ArtifactDialog;
