/*
 * <license header>
 */

import { useRef, useState } from 'react';
import { CustomDialog, CloseButton, Button, ActionButton } from '@react-spectrum/s2';
import FileText from '@react-spectrum/s2/icons/FileText';
import Close from '@react-spectrum/s2/icons/Close';
import { LABELS } from '../../constants/labels';
import { dashboardBase, dialogTitle, dialogDesc, dropzoneTitle, bannerTitle, bodyText, detailText } from './styles';

let uid = 0;
const nextUid = () => `f${(uid += 1)}`;

/** Drop-zone glyph: a document (dashed bottom edge) with a download arrow —
 *  matches the Figma upload icon. Uses currentColor so it turns blue on hover. */
function DropFileIcon() {
  return (
    <svg viewBox="0 0 40 40" width="44" height="44" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M22 4H11a3 3 0 0 0-3 3v21"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 4l10 10v14"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 4v7a3 3 0 0 0 3 3h7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8 30.5c0 1.7 1.3 3 3 3h18c1.7 0 3-1.3 3-3"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="0.5 4.5"
      />
      <path d="M20 12.5v10.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path
        d="M15.5 18.5l4.5 4.5 4.5-4.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
 * "Artifact" upload dialog (opened from the Artifacts header CTA). A drag-and-
 * drop zone (with a blue drag-over state) plus a hidden file input; added files
 * appear under "Uploaded Artifacts" and are committed to the shared saved-
 * artifacts state on Save. UI-only for now — no real upload.
 */
function ArtifactDialog({ savedArtifacts = [], onSave, onCancel }) {
  const [files, setFiles] = useState(savedArtifacts);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const added = Array.from(fileList || []).map((f) => ({ id: nextUid(), name: f.name, size: f.size }));
    if (added.length) setFiles((prev) => [...prev, ...added]);
  };

  return (
    <CustomDialog size="M" isDismissible padding="none">
      {/* Dialog renders in a portal outside .es-dashboard, so re-apply the sans
          (Adobe Clean) font here. */}
      <div className={`es-artifact ${dashboardBase}`}>
        <div className="es-artifact__close">
          <CloseButton />
        </div>
        <h2 className={`es-artifact__title ${dialogTitle}`}>{LABELS.artifact.title}</h2>
        <p className={`es-artifact__desc ${dialogDesc}`}>{LABELS.artifact.description}</p>

        <div
          className={dragOver ? 'es-dropzone es-dropzone--over' : 'es-dropzone'}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            addFiles(e.dataTransfer.files);
          }}
        >
          <DropFileIcon />
          <div className={`es-dropzone__title ${dropzoneTitle}`}>{LABELS.artifact.dropTitle}</div>
          <div className={`es-dropzone__subtitle ${dialogDesc}`}>{LABELS.artifact.dropSubtitle}</div>
          <Button
            variant="primary"
            fillStyle="fill"
            onPress={() => inputRef.current && inputRef.current.click()}
          >
            {LABELS.artifact.browse}
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="es-dropzone__input"
            onChange={(e) => addFiles(e.target.files)}
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
                  <div className={detailText}>{formatSize(f.size)}</div>
                </div>
                <ActionButton
                  isQuiet
                  aria-label={`Remove ${f.name}`}
                  onPress={() => setFiles((prev) => prev.filter((x) => x.id !== f.id))}
                >
                  <Close />
                </ActionButton>
              </div>
            ))}
          </div>
        )}

        <div className="es-artifact__footer">
          <Button variant="secondary" fillStyle="outline" onPress={onCancel}>
            {LABELS.artifact.cancel}
          </Button>
          <Button variant="primary" fillStyle="fill" onPress={() => onSave && onSave(files)}>
            {LABELS.artifact.save}
          </Button>
        </div>
      </div>
    </CustomDialog>
  );
}

export default ArtifactDialog;
