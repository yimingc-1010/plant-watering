import { testIds } from '../test-ids';

/** Every testID, with list ids expanded for the first two rows. */
function allIds(): string[] {
  return Object.values(testIds).flatMap((value) =>
    typeof value === 'function' ? [value(0), value(1)] : [value],
  );
}

describe('testIds', () => {
  it('builds list row ids from the display index', () => {
    expect(testIds.todayItem(0)).toBe('today-item-0');
    expect(testIds.todayItemName(0)).toBe('today-item-0-name');
    expect(testIds.todayItemStatus(2)).toBe('today-item-2-status');
    expect(testIds.todayItemWater(1)).toBe('today-item-1-water');
    expect(testIds.plantItem(0)).toBe('plant-item-0');
    expect(testIds.plantItemName(0)).toBe('plant-item-0-name');
    expect(testIds.plantItemInterval(0)).toBe('plant-item-0-interval');
    expect(testIds.plantItemLastWatered(0)).toBe('plant-item-0-last-watered');
    expect(testIds.plantItemNextWatering(0)).toBe('plant-item-0-next-watering');
    expect(testIds.plantItemWater(3)).toBe('plant-item-3-water');
  });

  it('has the fixed ids from docs/design/screens.md', () => {
    const fixed = Object.values(testIds).filter((value) => typeof value === 'string');
    expect(fixed.sort()).toEqual(
      [
        'today-screen',
        'today-empty',
        'today-empty-add',
        'tab-today',
        'tab-plants',
        'plants-screen',
        'plants-add',
        'plants-empty',
        'plants-empty-add',
        'app-version',
        'plant-form-screen',
        'plant-name-input',
        'plant-interval-input',
        'plant-last-watered-input',
        'plant-name-error',
        'plant-interval-error',
        'plant-last-watered-error',
        'plant-save',
        'plant-cancel',
        'plant-last-watered-value',
        'plant-delete',
        'confirm-dialog',
        'confirm-dialog-confirm',
        'confirm-dialog-cancel',
        'undo-snackbar',
        'undo-button',
        'error-snackbar',
        'load-error',
      ].sort(),
    );
  });

  it('keeps every id unique', () => {
    const ids = allIds();
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses lowercase words joined by "-"', () => {
    for (const id of allIds()) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});
