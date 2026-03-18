/**
 * PrintForgePro — Design Tokens
 *
 * Importar en cada pantalla:
 *   import { C, R, S } from './theme';
 *
 * C = Colors, R = Border Radius, S = Shadows
 */

// ─── Colors ──────────────────────────────────────────────────────────────────
export const C = {
  // Navigation / Header
  header:        '#1E293B',  // slate-800
  headerBorder:  '#334155',  // slate-700
  headerText:    '#F8FAFC',  // slate-50

  // Backgrounds
  bg:            '#EEF2F8',  // crema cálido claro  (app background)
  surface:       '#FFFFFF',  // white               (cards, modals, panels)
  surfaceAlt:    '#F1F5F9',  // slate-100           (alternate rows, input bg)

  // Borders
  border:        '#E2E8F0',  // borde cálido claro  (cards, sections)
  borderStrong:  '#CBD5E1',  // borde cálido medio  (inputs default)
  borderFocus:   '#475569',  // primary focus ring

  // Brand / Action
  action:        '#1E293B',  // slate-800 — minimal dark action
  actionDark:    '#0F172A',  // pressed / hover
  actionBg:      '#EEF2F8',  // fondo claro para chips/badges de acción
  actionText:    '#F8FAFC',

  // Brand / Primary (navegación, encabezados secundarios)
  primary:       '#475569',  // slate-600
  primaryDark:   '#334155',  // slate-700
  primaryLight:  '#EEF2F8',  // crema claro
  primaryText:   '#FFFFFF',

  // Secondary action
  secondary:     '#475569',  // slate-600  (secondary buttons, icon buttons)
  secondaryBg:   '#EEF2F8',  // crema claro (cancel bg)
  secondaryText: '#374151',  // gray-700

  // Danger / Destructive
  danger:        '#DC2626',  // red-600
  dangerBg:      '#FEF2F2',  // red-50
  dangerText:    '#FFFFFF',

  // Text
  text:          '#0F172A',  // slate-900
  textSec:       '#475569',  // slate-600
  textMuted:     '#94A3B8',  // slate-400
  textInverted:  '#F8FAFC',  // slate-50

  // Status — kept intentionally consistent with existing system
  successText:   '#16A34A',  successBg: '#F0FDF4',
  warningText:   '#D97706',  warningBg: '#FFFBEB',
  errorText:     '#DC2626',  errorBg:   '#FEF2F2',
  infoText:      '#475569',  infoBg:    '#EEF2F8',
  purpleText:    '#7C3AED',  purpleBg:  '#F5F3FF',
  tealText:      '#0D9488',  tealBg:    '#F0FDFA',
};

// ─── Border Radius ────────────────────────────────────────────────────────────
export const R = {
  sm:   6,    // small tags, chips, tiny elements
  md:   10,   // inputs, small cards, row items
  lg:   14,   // section containers, modals, main cards
  xl:   18,   // large card sections, floating panels
  full: 999,  // pill / fully-rounded badges
};

// ─── Shadows ──────────────────────────────────────────────────────────────────
export const S = {
  none: {},

  // Subtle shadow for cards and list items
  card: {
    shadowColor:  '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius:  6,
    shadowOffset:  { width: 0, height: 2 },
    elevation:     2,
  },

  // Slightly stronger shadow for headers and floating panels
  header: {
    shadowColor:  '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius:  8,
    shadowOffset:  { width: 0, height: 3 },
    elevation:     3,
  },

  // For modals / overlaid panels
  modal: {
    shadowColor:  '#0F172A',
    shadowOpacity: 0.18,
    shadowRadius:  16,
    shadowOffset:  { width: 0, height: 6 },
    elevation:     8,
  },
};

// ─── Typography helpers ───────────────────────────────────────────────────────
export const F = {
  xs:   { fontSize: 11, lineHeight: 16 },
  sm:   { fontSize: 12, lineHeight: 18 },
  base: { fontSize: 13, lineHeight: 20 },
  md:   { fontSize: 14, lineHeight: 20 },
  lg:   { fontSize: 16, lineHeight: 24 },
  xl:   { fontSize: 20, lineHeight: 28 },
  h2:   { fontSize: 24, lineHeight: 30 },
};

// ─── Paper theme config (for PaperProvider in App.js) ────────────────────────
export const paperThemeColors = {
  primary:          C.action,
  onPrimary:        C.actionText,
  primaryContainer: C.actionBg,
  secondary:        C.secondary,
  background:       C.bg,
  surface:          C.surface,
  error:            C.danger,
  onBackground:     C.text,
  onSurface:        C.text,
};
