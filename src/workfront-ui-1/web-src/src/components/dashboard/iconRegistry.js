/*
 * <license header>
 */

/**
 * Maps string icon keys (used in the mock/API data) to Spectrum 2 icon
 * components. Keeping this indirection means the data layer stays serializable
 * (plain strings) and components never import icons directly by name.
 */
import File from '@react-spectrum/s2/icons/File';
import Tutorials from '@react-spectrum/s2/icons/Tutorials';
import Preview from '@react-spectrum/s2/icons/Preview';
import Slideshow from '@react-spectrum/s2/icons/Slideshow';
import AlertTriangle from '@react-spectrum/s2/icons/AlertTriangle';
import Education from '@react-spectrum/s2/icons/Education';
import Checkmark from '@react-spectrum/s2/icons/Checkmark';
import Close from '@react-spectrum/s2/icons/Close';
import Settings from '@react-spectrum/s2/icons/Settings';

// Keys map to the exact Figma icon components used in the design.
const registry = {
  file: File, // Executive Summary tab (Figma: S2_Icon_File)
  tutorials: Tutorials, // Pre-read CTA (Figma: S2_Icon_Tutorials)
  preview: Preview, // "in review" factor chip (Figma: S2_Icon_Preview)
  slideshow: Slideshow, // Pre-read Slides CTA
  alertTriangle: AlertTriangle, // Risk View tab + Need Attention CTA
  education: Education, // Learning Plan tab
  checkmark: Checkmark, // completed factor chip + learning checklist
  close: Close, // blocked factor chip
  settings: Settings, // Configure Approvers
};

export function getIcon(key) {
  return registry[key] || null;
}

export default registry;
