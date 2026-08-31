/*
 * <license header>
 */

import { Button, Text } from '@react-spectrum/s2';
import { getIcon } from './iconRegistry';
import { pageTitle, subtitleText } from './styles';

/**
 * Top banner: project title, subtitle and the row of action buttons.
 * `onAction` is optional so the header works stand-alone in mock mode.
 */
function ProjectHeader({ header, onAction }) {
  if (!header) return null;
  return (
    <header className="es-header">
      <div className="es-header__info">
        <h1 className={`es-header__title ${pageTitle}`}>{header.title}</h1>
        {header.subtitle && <div className={`es-header__subtitle ${subtitleText}`}>{header.subtitle}</div>}
      </div>
      <div className="es-header__actions">
        {(header.actions || []).map((action) => {
          const Icon = getIcon(action.icon);
          return (
            <Button
              key={action.id}
              variant={action.variant}
              fillStyle={action.fillStyle}
              onPress={() => onAction && onAction(action.id)}
            >
              {Icon && <Icon />}
              <Text>{action.label}</Text>
            </Button>
          );
        })}
      </div>
    </header>
  );
}

export default ProjectHeader;
