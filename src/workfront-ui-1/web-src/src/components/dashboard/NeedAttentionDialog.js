/*
 * <license header>
 */

import { CustomDialog, CloseButton, Button } from '@react-spectrum/s2';
import { dialogTitle, attentionText, dashboardBase } from './styles';

/**
 * "Need Attention" modal — Figma "Standard dialog (M)" with BOTH a dismiss X and
 * a footer action. S2's opinionated `Dialog` hides footer buttons when
 * dismissible, so we use `CustomDialog` (padding handled in CSS) to lay out the
 * title, item list, close button and secondary action exactly per the design.
 */
function NeedAttentionDialog({ data, onPrimaryAction }) {
  if (!data) return null;
  return (
    <CustomDialog size="M" isDismissible padding="none">
      {/* Dialog renders in a portal outside .es-dashboard, so re-apply the sans
          (Adobe Clean) font here — otherwise custom text falls back to serif. */}
      <div className={`es-attention ${dashboardBase}`}>
        <div className="es-attention__close">
          <CloseButton />
        </div>
        <div className="es-attention__head">
          <h2 className={`es-attention__title ${dialogTitle}`}>{data.title}</h2>
          <ol className={`es-attention-list ${attentionText}`}>
            {(data.items || []).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>
        </div>
        {data.primaryAction && (
          <div className="es-attention__footer">
            <Button
              variant="secondary"
              fillStyle="outline"
              onPress={() => onPrimaryAction && onPrimaryAction(data.primaryAction.id)}
            >
              {data.primaryAction.label}
            </Button>
          </div>
        )}
      </div>
    </CustomDialog>
  );
}

export default NeedAttentionDialog;
