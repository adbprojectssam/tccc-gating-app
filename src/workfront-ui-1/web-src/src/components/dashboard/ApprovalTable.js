/*
 * <license header>
 */

import {
  TableView,
  TableHeader,
  TableBody,
  Column,
  Row,
  Cell,
  Badge,
  StatusLight,
  Button,
} from '@react-spectrum/s2';
import SectionCard from './SectionCard';
import { fullWidth, dateCellText } from './styles';
import { getIcon } from './iconRegistry';

const Calendar = getIcon('calendar');

/** Initials avatar for mock mode — swap for S2 <Avatar src> once we have image URLs. */
function AvatarCircle({ name }) {
  const initials = (name || '')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return <span className="es-avatar" aria-hidden="true">{initials}</span>;
}

function renderCell(row, columnId) {
  if (columnId === 'name') {
    return (
      <div className="es-approver">
        <AvatarCircle name={row.name} />
        <span>{row.name}</span>
      </div>
    );
  }
  if (columnId === 'date') {
    // Figma date cell: leading Calendar icon (#505050) + date text.
    return (
      <div className="es-datecell">
        {Calendar && (
          <span className="es-datecell__icon" aria-hidden="true">
            <Calendar />
          </span>
        )}
        <span className={dateCellText}>{row.date}</span>
      </div>
    );
  }
  if (columnId === 'status') {
    // A row can carry a single status (StatusLight) or a set of status pills.
    if (Array.isArray(row.statuses)) {
      return (
        <div className="es-status-pills">
          {row.statuses.map((status, index) => (
            <Badge key={index} variant={status.tone} fillStyle="subtle" size="S">
              {status.label}
            </Badge>
          ))}
        </div>
      );
    }
    if (row.status) {
      return <StatusLight variant={row.status.tone}>{row.status.label}</StatusLight>;
    }
    return null;
  }
  return row[columnId];
}

/** Approval table. Columns, rows, header action and status style are data-driven. */
function ApprovalTable({ data, onHeaderAction }) {
  if (!data) return null;
  const columns = data.columns || [];

  let action = null;
  if (data.headerAction) {
    const Icon = getIcon(data.headerAction.icon);
    action = (
      <Button
        variant={data.headerAction.variant || 'secondary'}
        fillStyle={data.headerAction.fillStyle}
        onPress={() => onHeaderAction && onHeaderAction(data.headerAction.id)}
      >
        {Icon && <Icon />}
        {data.headerAction.label}
      </Button>
    );
  } else if (data.status) {
    action = <Badge variant={data.status.tone} fillStyle="subtle">{data.status.label}</Badge>;
  }

  return (
    <SectionCard title={data.title} subtitle={data.summary} action={action}>
      <TableView aria-label={data.title} styles={fullWidth}>
        <TableHeader columns={columns}>
          {(column) => (
            <Column id={column.id} isRowHeader={column.isRowHeader}>
              {column.label}
            </Column>
          )}
        </TableHeader>
        <TableBody items={data.approvers}>
          {(row) => (
            <Row id={row.id} columns={columns}>
              {(column) => <Cell>{renderCell(row, column.id)}</Cell>}
            </Row>
          )}
        </TableBody>
      </TableView>
    </SectionCard>
  );
}

export default ApprovalTable;
