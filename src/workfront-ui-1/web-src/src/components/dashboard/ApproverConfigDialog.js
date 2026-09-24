import { useEffect, useRef, useState } from 'react';
import { ActionButton, Button, CloseButton, CustomDialog, Picker, PickerItem, SearchField, Text } from '@react-spectrum/s2';
import Add from '@react-spectrum/s2/icons/Add';
import Close from '@react-spectrum/s2/icons/Close';
import { LABELS } from '../../constants/labels';
import { dashboardBase, dialogTitle, dialogDesc, approverFieldWidth } from './styles';

const DECISION_MAKERS = {
  1: ['OUP', 'OU Hub', 'GDI'],
  2: ['OUP', 'OU Hub', 'GDI', 'Finance'],
  3: ['OUP', 'OU Hub', 'GDI', 'Finance', 'Market GM'],
  4: ['OUP', 'OU Hub', 'GDI', 'Finance', 'Market GM'],
  5: ['OUP', 'OU Hub', 'GDI', 'Global Innovation'],
};

// The rows list shows 4 rows before it needs to scroll (see .es-approver-dialog__rows).
const DEFAULT_ROW_COUNT = 4;
const emptyRows = (role) => Array.from({ length: DEFAULT_ROW_COUNT }, () => ({ role, userId: '' }));

function ApproverConfigDialog({ gateNumber, users, taskId, onCancel, onSave, isSaving = false, error = '' }) {
  const roles = DECISION_MAKERS[Number(gateNumber)] || DECISION_MAKERS[1];
  const [rows, setRows] = useState(() => emptyRows(roles[0]));
  // Set right before adding a row so the scroll-into-view effect below only
  // fires for that action, not for the gate-switch reset.
  const justAddedRef = useRef(false);
  const rowRefs = useRef([]);

  useEffect(() => setRows(emptyRows(roles[0])), [gateNumber, roles]);

  useEffect(() => {
    if (!justAddedRef.current) return;
    justAddedRef.current = false;
    const lastRow = rowRefs.current[rows.length - 1];
    if (lastRow) lastRow.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [rows.length]);

  const updateRow = (index, changes) => setRows((current) => current.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  const removeRow = (index) => setRows((current) => current.filter((_, i) => i !== index));
  const addRow = () => {
    justAddedRef.current = true;
    setRows((current) => [...current, { role: roles[0], userId: '' }]);
  };
  const canSave = !isSaving && rows.length > 0 && rows.every((row) => row.role && row.userId);

  return (
    <CustomDialog size="M" isDismissible={!isSaving} padding="none">
      <div className={`es-approver-dialog ${dashboardBase}`}>
        <div className="es-approver-dialog__close"><CloseButton aria-label="Close" onPress={onCancel} /></div>
        <div className="es-approver-dialog__header">
          <h2 className={dialogTitle}>{`${LABELS.approval.configureTitle} - Gate ${gateNumber}`}</h2>
          <p className={dialogDesc}>{LABELS.approval.configureDescription}</p>
        </div>
        <div className="es-approver-dialog__rows">
          {rows.map((row, index) => (
            <div className="es-approver-dialog__row" key={`${index}-${row.role}`} ref={(el) => { rowRefs.current[index] = el; }}>
              <Picker size="S" aria-label="Decision maker" styles={approverFieldWidth} selectedKey={row.role} onSelectionChange={(role) => updateRow(index, { role })}>
                {roles.map((role) => <PickerItem key={role} id={role}>{role}</PickerItem>)}
              </Picker>
              <SearchField size="S" aria-label="Search approver name" styles={approverFieldWidth} placeholder={LABELS.approval.searchApprover} value={users.find((user) => user.ID === row.userId)?.name || ''} onChange={(value) => {
                const match = users.find((user) => user.name.toLowerCase() === value.toLowerCase());
                updateRow(index, { userId: match ? match.ID : '' });
              }} />
              {/* Plain icon button, NOT CloseButton — CloseButton dismisses the enclosing dialog regardless of onPress. */}
              <ActionButton isQuiet size="S" aria-label="Remove approver" onPress={() => removeRow(index)}><Close /></ActionButton>
            </div>
          ))}
        </div>
        {error && <div className="es-artifact__file-error">{error}</div>}
        <div className="es-approver-dialog__footer">
          <Button variant="secondary" fillStyle="outline" size="S" onPress={addRow}>
            <Add />
            <Text>{LABELS.approval.addApprover}</Text>
          </Button>
          <div className="es-approver-dialog__actions">
            <Button variant="secondary" fillStyle="outline" size="S" onPress={onCancel}>{LABELS.artifact.cancel}</Button>
            <Button variant="primary" fillStyle="fill" size="S" isDisabled={!canSave} onPress={() => onSave(rows)}>{isSaving ? LABELS.approval.saving : LABELS.approval.save}</Button>
          </div>
        </div>
      </div>
    </CustomDialog>
  );
}

export default ApproverConfigDialog;

