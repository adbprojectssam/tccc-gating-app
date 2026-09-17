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
/* Gate Readiness progress bar — fixed 250px per Figma. */
export const progressWidth = style({ width: 250 });
/* Pre-read panel empty-state "Generate Pre-read" button — fixed 240px per Figma. */
export const generateButtonWidth = style({ width: 240 });

/* Root: Spectrum font family + base neutral text color, inherited by every
   custom text element (fixes the missing Adobe Clean font family). */
export const dashboardBase = style({ fontFamily: 'sans', color: 'neutral' });

/* ---------------- Typography ---------------- */
// Sizes pinned to Figma's font-size scale via ui-* tokens (ui-xl = font-size-300
// = 18px = Figma Title/L; ui-3xl = font-size-500 = 22px). Card & section titles
// are 18px Bold in Figma.
export const pageTitle = style({ fontSize: 'heading-lg', fontWeight: 'black', color: 'title' }); // Figma Heading Express/L = 28px Black
export const sectionTitle = style({ fontSize: 'ui-xl', fontWeight: 'bold', color: 'heading' });
export const cardTitle = style({ fontSize: 'ui-xl', fontWeight: 'bold', color: 'heading' });
export const metricValue = style({ fontSize: 'heading-lg', fontWeight: 'bold', color: 'title' }); // 28px
export const subtitleText = style({ font: 'body-xs', color: 'neutral-subdued' });
export const labelText = style({ font: 'body-sm', color: 'neutral-subdued' });
export const bodyText = style({ font: 'body-sm' });
export const detailText = style({ font: 'body-xs', color: 'neutral-subdued' });
export const overlineText = style({ font: 'detail-sm', color: 'neutral-subdued' });
export const negativeStatus = style({ font: 'body-xs', color: 'negative' });
export const dialogTitle = style({ fontSize: 'ui-3xl', fontWeight: 'bold', color: 'heading' }); // Figma Title/XXL = 22px

/* Artifact / Pre-read dialogs */
export const dialogDesc = style({ font: 'body-sm', color: 'neutral-subdued' }); // gray description / subtitles
export const dropzoneTitle = style({ fontSize: 'ui-2xl', fontWeight: 'bold', color: 'heading' }); // "Drag and drop your file" 20px bold

/* Typography for the remaining custom (non-Spectrum) elements — stepper, charts,
   dialog list — via the macro; ui-* fontSize = exact Figma font-size scale. */
export const attentionText = style({ fontSize: 'ui-lg', color: 'body' }); // Body/M 16px
export const stageText = style({ fontSize: 'ui-xl', color: 'neutral' }); // Figma stage line = 18px, #292929 (label bolded inline)
export const bannerTitle = style({ fontSize: 'ui', fontWeight: 'bold', color: 'heading' }); // in-line alert title 14px Bold #131313
export const bannerBody = style({ fontSize: 'ui', color: 'neutral' }); // in-line alert body 14px #292929
export const linkText = style({ fontSize: 'ui', fontWeight: 'medium', color: 'neutral' }); // Figma links = 14px Medium #292929 underline
export const dateCellText = style({ fontSize: 'ui', color: 'neutral-subdued' }); // table date text 14px #505050
export const stepLabel = style({ fontSize: 'ui', fontWeight: 'medium' }); // 14px
export const stepStatus = style({ fontSize: 'ui-sm', color: 'neutral-subdued' }); // 12px
export const chartCaption = style({ fontSize: 'ui-xs', color: 'neutral-subdued' }); // 11px
export const chartValue = style({ fontSize: 'ui-xs', fontWeight: 'bold' }); // 11px bold
export const deltaText = style({ fontSize: 'ui-sm', color: 'neutral' }); // KPI trend delta "+1 pp" 12px #292929
export const markerGlyph = style({ fontSize: 'ui-sm', fontWeight: 'bold' }); // gate marker digit/check

/* ---------------- Card surface (color + spacing tokens) ---------------- */
// Figma content cards (gate detail / IO / approval) use a 1px #e1e1e1 border, no
// shadow; only the KPI metric cards use the emphasized drop-shadow.
export const cardSurface = style({ backgroundColor: 'layer-2', borderRadius: 'lg', padding: 20, borderWidth: 1, borderStyle: 'solid', borderColor: 'gray-200' });
export const metricSurface = style({ backgroundColor: 'layer-2', borderRadius: 'lg', padding: 20, boxShadow: 'emphasized' });

/* ---------------- Gate markers (color tokens; shape stays in CSS) --------
 * Per Figma: completed = green fill; the viewed (current) non-completed gate =
 * dark neutral fill (#292929); all other non-completed gates = gray outline
 * (attention differs only by its red status TEXT, not the marker). */
export const markerCompleted = style({ backgroundColor: 'positive', color: 'white' });
export const markerCurrent = style({ backgroundColor: 'neutral', color: 'white' });
export const markerAttention = style({ backgroundColor: 'white', color: 'neutral', borderColor: 'gray-300', borderWidth: 2, borderStyle: 'solid' });
export const markerNotStarted = style({ backgroundColor: 'white', color: 'disabled', borderColor: 'gray-300', borderWidth: 2, borderStyle: 'solid' });

/* ---------------- Pre-read side panel (Figma 2862-117426) ---------------- */
// This panel's typography doesn't match the shared dialog/card styles used
// elsewhere (different weight/size/color), so it gets its own dedicated
// tokens rather than overloading `dialogTitle`/`cardTitle`/`bodyText`.
export const preReadPanelTitle = style({ fontSize: 'ui-3xl', fontWeight: 'extra-bold', color: 'neutral' }); // Figma Heading/M = 22px ExtraBold #292929
export const preReadPanelSubtitle = style({ fontSize: 'ui-sm', color: 'neutral-subdued' }); // Figma Body/XS = 12px #505050
export const preReadSectionTitle = style({ fontSize: 'ui-lg', fontWeight: 'bold', color: 'heading' }); // Figma Title/M = 16px Bold #131313
export const preReadValueText = style({ fontSize: 'ui', color: 'heading' }); // Business Case body / metric values / source filenames = 14px Regular #131313
export const boldLabelText = style({ fontSize: 'ui', fontWeight: 'bold', color: 'neutral' }); // 14px Bold #292929 — DSFV card labels, "Generated Pre-read" box title, etc.
export const dsfvCardValue = style({ fontSize: 'ui', color: 'neutral' });
// Matches Spectrum's own Modal underlay (Modal.tsx: backgroundColor: 'transparent-black-500').
export const modalScrimBg = style({ backgroundColor: 'transparent-black-500' });
