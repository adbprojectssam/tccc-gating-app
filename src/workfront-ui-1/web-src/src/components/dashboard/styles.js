/*
 * <license header>
 */

/**
 * Spectrum 2 `style()` macro output (build-time design tokens).
 *
 * S2 does not expose its tokens as CSS custom properties — the only OOTB way to
 * consume tokens (typography, color, spacing) is this macro. So token-driven
 * styling lives here as reusable class names, and dashboard.css is left to do
 * pure layout (grid/flex/position/gap/size). Our plain CSS is unlayered and
 * therefore wins over these (layered) macro styles, so any property set here is
 * intentionally NOT also set in dashboard.css.
 */
import { style } from '@react-spectrum/s2/style' with { type: 'macro' };

/* Stretch a Spectrum component to its container width. */
export const fullWidth = style({ width: 'full' });

/* Root: Spectrum font family + base neutral text color, inherited by every
   custom text element (fixes the missing Adobe Clean font family). */
export const dashboardBase = style({ fontFamily: 'sans', color: 'neutral' });

/* ---------------- Typography ---------------- */
export const pageTitle = style({ font: 'heading-lg' });
export const sectionTitle = style({ font: 'heading-xs' });
export const cardTitle = style({ font: 'heading-xs' });
export const metricValue = style({ font: 'title-lg' });
export const subtitleText = style({ font: 'body-xs', color: 'neutral-subdued' });
export const labelText = style({ font: 'body-sm', color: 'neutral-subdued' });
export const bodyText = style({ font: 'body-sm' });
export const detailText = style({ font: 'body-xs', color: 'neutral-subdued' });
export const overlineText = style({ font: 'detail-sm', color: 'neutral-subdued' });
export const negativeStatus = style({ font: 'body-xs', color: 'negative' });
export const dialogTitle = style({ fontSize: 'ui-3xl', fontWeight: 'bold', color: 'heading' }); // Figma Title/XXL = 22px

/* ---------------- Card surface (color + spacing tokens) ---------------- */
export const cardSurface = style({ backgroundColor: 'layer-2', borderColor: 'gray-200', borderWidth: 1, borderStyle: 'solid', borderRadius: 'lg', padding: 20 });
export const metricSurface = style({ backgroundColor: 'layer-2', borderColor: 'gray-200', borderWidth: 1, borderStyle: 'solid', borderRadius: 'lg', padding: 16 });

/* ---------------- Gate markers (color tokens; shape stays in CSS) --------
 * Per Figma: completed = green fill; the viewed (current) non-completed gate =
 * dark neutral fill (#292929); all other non-completed gates = gray outline
 * (attention differs only by its red status TEXT, not the marker). */
export const markerCompleted = style({ backgroundColor: 'positive', color: 'white' });
export const markerCurrent = style({ backgroundColor: 'neutral', color: 'white' });
export const markerAttention = style({ backgroundColor: 'white', color: 'neutral', borderColor: 'gray-300', borderWidth: 2, borderStyle: 'solid' });
export const markerNotStarted = style({ backgroundColor: 'white', color: 'disabled', borderColor: 'gray-300', borderWidth: 2, borderStyle: 'solid' });
