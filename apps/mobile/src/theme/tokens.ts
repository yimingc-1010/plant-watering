/**
 * Design tokens. Values follow docs/design/tokens.md; screens and components
 * reference these instead of hard-coding numbers or colors. Light theme only.
 */
export const tokens = {
  color: {
    background: '#F6F8F4',
    surface: '#FFFFFF',
    text: '#1B1F1A',
    textSecondary: '#5A6357',
    primary: '#2E7D32',
    onPrimary: '#FFFFFF',
    dueTodayText: '#1E5E22',
    dueTodayBg: '#E3F1E3',
    overdueText: '#8A4B00',
    overdueBg: '#FFF1DD',
    danger: '#B3261E',
    border: '#7A8476',
    divider: '#C5CCC1',
    snackbarBg: '#2B312A',
    snackbarText: '#FFFFFF',
    snackbarAction: '#A5D6A7',
    scrim: 'rgba(0, 0, 0, 0.4)',
  },
  /** Unscaled pt; text still scales with the system font size. */
  font: {
    title: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
    heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' },
    body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
    caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  size: { minTouch: 44, inputHeight: 48 },
  radius: { sm: 6, md: 10, lg: 16 },
  /** Input border; `errorWidth` when the field has an error. */
  border: { width: 1, errorWidth: 2 },
  /** Milliseconds. */
  duration: { undoSnackbar: 5000, errorSnackbar: 5000, fast: 150 },
} as const;
