/*
 * <license header>
 */

import { useEffect, useRef, useState } from 'react';
import { CustomDialog, CloseButton, Button, ActionButton, ProgressCircle } from '@react-spectrum/s2';
import FileText from '@react-spectrum/s2/icons/FileText';
import Close from '@react-spectrum/s2/icons/Close';
import { LABELS } from '../../constants/labels';
import { getImsAuth } from '../../api/imsAuth';
import { uploadArtifact, deleteArtifact } from '../../api/artifactClient';
import { dashboardBase, dialogTitle, dialogDesc, dropzoneTitle, bannerTitle, bodyText, detailText } from './styles';

let uid = 0;
const nextUid = () => `f${(uid += 1)}`;

/** Drop-zone glyph: a document (dashed bottom edge) with a download arrow —
 *  matches the Figma upload icon. Uses currentColor so it turns blue on hover. */
function DropFileIcon() {
  return (
    <svg viewBox="0 0 40 40" width="44" height="44" fill="none" aria-hidden="true" focusable="false">
      <path d="M22 4H11a3 3 0 0 0-3 3v21" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 4l10 10v14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M22 4v7a3 3 0 0 0 3 3h7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 30.5c0 1.7 1.3 3 3 3h18c1.7 0 3-1.3 3-3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.5 4.5" />
      <path d="M20 12.5v10.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M15.5 18.5l4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Bytes → "1.2 MB" / "640 KB" (matches the Figma file-size format). */
function formatSize(bytes) {
  if (bytes == null) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * "Artifact" upload dialog (opened from the Artifacts header CTA). Supports
 * multiple files: each selected/dropped file uploads to Workfront (attached to
 * the project) and appears under "Uploaded Artifacts"; the ✕ deletes it from
 * Workfront. While a delete is in flight ALL other CTAs are disabled, and
 * "Generate Pre-read" only enables once every upload/delete has settled.
 */
function ArtifactDialog({ onGenerate, onCancel }) {
  const [files, setFiles] = useState([]);
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
  const busy = anyUploading || deleting;
  const readyCount = files.filter((f) => f.status === 'ready').length;
  const canGenerate = !busy && readyCount > 0;

  return (
    <CustomDialog size="M" isDismissible padding="none">
      {/* Portal renders outside .es-dashboard — re-apply the sans font. */}
      <div className={`es-artifact ${dashboardBase}`}>
        <div className="es-artifact__close">
          <CloseButton isDisabled={deleting} />
        </div>
        <h2 className={`es-artifact__title ${dialogTitle}`}>{LABELS.artifact.title}</h2>
        <p className={`es-artifact__desc ${dialogDesc}`}>{LABELS.artifact.description}</p>

        <div
          className={dragOver ? 'es-dropzone es-dropzone--over' : 'es-dropzone'}
          onDragOver={(e) => {
            e.preventDefault();
            if (!deleting) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!deleting) addFiles(e.dataTransfer.files);
          }}
        >
          <DropFileIcon />
          <div className={`es-dropzone__title ${dropzoneTitle}`}>{LABELS.artifact.dropTitle}</div>
          <div className={`es-dropzone__subtitle ${dialogDesc}`}>{LABELS.artifact.dropSubtitle}</div>
          <Button
            variant="primary"
            fillStyle="fill"
            isDisabled={deleting}
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
            {files.map((f) => (
              <div key={f.id} className="es-artifact__file">
                <FileText aria-hidden="true" />
                <div className="es-artifact__file-meta">
                  <div className={bodyText}>{f.name}</div>
                  <div className={f.status === 'error' ? 'es-artifact__file-error' : detailText}>
                    {f.status === 'uploading'
                      ? LABELS.artifact.uploading
                      : f.status === 'error'
                        ? f.error || LABELS.artifact.uploadFailed
                        : `${formatSize(f.size)}, ${LABELS.artifact.uploadedToday}`}
                  </div>
                </div>
                {f.status === 'uploading' ? (
                  <ProgressCircle size="S" isIndeterminate aria-label="Uploading" />
                ) : (
                  <ActionButton
                    isQuiet
                    aria-label={`Remove ${f.name}`}
                    isDisabled={deleting}
                    onPress={() => removeFile(f)}
                  >
                    {deletingId === f.id ? <ProgressCircle size="S" isIndeterminate aria-label="Deleting" /> : <Close />}
                  </ActionButton>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="es-artifact__footer">
          <Button variant="secondary" fillStyle="outline" isDisabled={deleting} onPress={onCancel}>
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
