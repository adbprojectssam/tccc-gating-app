import { useEffect, useState } from 'react';
import { Button, CloseButton, CustomDialog, Picker, PickerItem, SearchField, Text } from '@react-spectrum/s2';
import { LABELS } from '../../constants/labels';
import { dashboardBase, dialogTitle, dialogDesc } from './styles';

const DECISION_MAKERS = {
  1: ['OUP', 'OU Hub', 'GDI'],
  2: ['OUP', 'OU Hub', 'GDI', 'Finance'],
  3: ['OUP', 'OU Hub', 'GDI', 'Finance', 'Market GM'],
  4: ['OUP', 'OU Hub', 'GDI', 'Finance', 'Market GM'],
  5: ['OUP', 'OU Hub', 'GDI', 'Global Innovation'],
};

function ApproverConfigDialog({ gateNumber, users, taskId, onCancel, onSave, isSaving = false, error = '' }) {
  const roles = DECISION_MAKERS[Number(gateNumber)] || DECISION_MAKERS[1];
  const [rows, setRows] = useState([{ role: roles[0], userId: '' }]);

  useEffect(() => setRows([{ role: roles[0], userId: '' }]), [gateNumber, roles]);

  const updateRow = (index, changes) => setRows((current) => current.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  const removeRow = (index) => setRows((current) => current.filter((_, i) => i !== index));
  const canSave = !isSaving && rows.length > 0 && rows.every((row) => row.role && row.userId);

  return (
    <CustomDialog size="M" isDismissible={!isSaving} padding="none">
      <div className={`es-approver-dialog ${dashboardBase}`}>
        <div className="es-approver-dialog__close"><CloseButton aria-label="Close" onPress={onCancel} /></div>
        <h2 className={dialogTitle}>{`${LABELS.approval.configureTitle} - Gate ${gateNumber}`}</h2>
        <p className={dialogDesc}>{LABELS.approval.configureDescription}</p>
        <div className="es-approver-dialog__rows">
          {rows.map((row, index) => (
            <div className="es-approver-dialog__row" key={`${index}-${row.role}`}>
              <Picker aria-label="Decision maker" selectedKey={row.role} onSelectionChange={(role) => updateRow(index, { role })}>
                {roles.map((role) => <PickerItem key={role} id={role}>{role}</PickerItem>)}
              </Picker>
              <SearchField aria-label="Search approver name" placeholder={LABELS.approval.searchApprover} value={users.find((user) => user.ID === row.userId)?.name || ''} onChange={(value) => {
                const match = users.find((user) => user.name.toLowerCase() === value.toLowerCase());
                updateRow(index, { userId: match ? match.ID : '' });
              }} />
              <Button variant="secondary" fillStyle="clear" aria-label="Remove approver" onPress={() => removeRow(index)}><Text>×</Text></Button>
            </div>
          ))}
        </div>
        <Button variant="secondary" fillStyle="outline" onPress={() => setRows((current) => [...current, { role: roles[0], userId: '' }])}>{LABELS.approval.addApprover}</Button>
        {error && <div className="es-artifact__file-error">{error}</div>}
        <div className="es-approver-dialog__footer">
          <Button variant="secondary" fillStyle="outline" onPress={onCancel}>{LABELS.artifact.cancel}</Button>
          <Button variant="primary" fillStyle="fill" isDisabled={!canSave} onPress={() => onSave(rows)}>{isSaving ? LABELS.approval.saving : LABELS.approval.save}</Button>
        </div>
      </div>
    </CustomDialog>
  );
}

export default ApproverConfigDialog;
