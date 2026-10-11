/**
 * testIDs from docs/design/screens.md, shared by screens and component tests.
 * List rows are numbered by display index starting at 0. Maestro flows use the
 * resulting strings directly.
 */
export const testIds = {
  // Tabs
  tabToday: 'tab-today',
  tabPlants: 'tab-plants',

  // Today (`/`)
  todayScreen: 'today-screen',
  todayItem: (i: number) => `today-item-${i}`,
  todayItemName: (i: number) => `today-item-${i}-name`,
  todayItemStatus: (i: number) => `today-item-${i}-status`,
  todayItemWater: (i: number) => `today-item-${i}-water`,
  todayEmpty: 'today-empty',
  todayEmptyAdd: 'today-empty-add',

  // Plants (`/plants`)
  plantsScreen: 'plants-screen',
  plantsAdd: 'plants-add',
  plantItem: (i: number) => `plant-item-${i}`,
  plantItemName: (i: number) => `plant-item-${i}-name`,
  plantItemInterval: (i: number) => `plant-item-${i}-interval`,
  plantItemLastWatered: (i: number) => `plant-item-${i}-last-watered`,
  plantItemNextWatering: (i: number) => `plant-item-${i}-next-watering`,
  plantItemWater: (i: number) => `plant-item-${i}-water`,
  plantsEmpty: 'plants-empty',
  plantsEmptyAdd: 'plants-empty-add',
  appVersion: 'app-version',

  // Plant form (`/plant/new`, `/plant/[id]`)
  plantFormScreen: 'plant-form-screen',
  plantNameInput: 'plant-name-input',
  plantIntervalInput: 'plant-interval-input',
  plantLastWateredInput: 'plant-last-watered-input',
  plantNameError: 'plant-name-error',
  plantIntervalError: 'plant-interval-error',
  plantLastWateredError: 'plant-last-watered-error',
  plantSave: 'plant-save',
  plantCancel: 'plant-cancel',
  plantLastWateredValue: 'plant-last-watered-value',
  plantDelete: 'plant-delete',

  // Delete confirmation dialog
  confirmDialog: 'confirm-dialog',
  confirmDialogConfirm: 'confirm-dialog-confirm',
  confirmDialogCancel: 'confirm-dialog-cancel',

  // Snackbars
  undoSnackbar: 'undo-snackbar',
  undoButton: 'undo-button',
  errorSnackbar: 'error-snackbar',

  // Root layout
  loadError: 'load-error',
} as const;
