import { describe, expect, it } from 'vitest';

import type { LocalDate } from '../date/local-date';
import {
  type NewPlantInput,
  type PlantEditInput,
  validateNewPlant,
  validatePlantEdit,
} from './validation';

const today = '2026-03-10' as LocalDate;
const validNew: NewPlantInput = { name: '龜背芋', interval: '7', lastWateredOn: '2026-03-01' };
const validEdit: PlantEditInput = { name: '龜背芋', interval: '7' };

const newErrors = (input: Partial<NewPlantInput>, otherNames: readonly string[] = []) => {
  const result = validateNewPlant({ ...validNew, ...input }, { today, otherNames });
  return result.ok ? {} : result.errors;
};

describe('validateNewPlant', () => {
  it('returns normalized values on success', () => {
    expect(
      validateNewPlant(
        { name: '  龜背芋 ', interval: ' 7 ', lastWateredOn: ' 2026-03-01 ' },
        { today, otherNames: ['Aloe'] },
      ),
    ).toEqual({
      ok: true,
      value: { name: '龜背芋', intervalDays: 7, lastWateredOn: '2026-03-01' },
    });
  });

  describe('name', () => {
    it.each(['', '   ', '\t\n'])('rejects empty or whitespace-only %j as required', (name) => {
      expect(newErrors({ name }).name).toBe('required');
    });

    it.each([
      ['30 ASCII letters', 'a'.repeat(30)],
      ['30 Chinese characters', '龜'.repeat(30)],
      ['30 emoji (one code point each)', '🌵'.repeat(30)],
      ['29 Chinese characters plus one emoji', `${'文'.repeat(29)}🌵`],
      ['30 characters with surrounding spaces', `  ${'a'.repeat(30)}  `],
    ])('accepts %s', (_label, name) => {
      expect(newErrors({ name }).name).toBeUndefined();
    });

    it.each([
      ['31 ASCII letters', 'a'.repeat(31)],
      ['31 Chinese characters', '龜'.repeat(31)],
      ['31 emoji', '🌵'.repeat(31)],
      ['30 Chinese characters plus one emoji', `${'文'.repeat(30)}🌵`],
    ])('rejects %s as tooLong', (_label, name) => {
      expect(newErrors({ name }).name).toBe('tooLong');
    });

    it('rejects a name matching another plant after trimming as duplicate (US-01 #5)', () => {
      expect(newErrors({ name: ' 龜背芋 ' }, ['龜背芋']).name).toBe('duplicate');
    });

    it('treats names differing only in case as distinct', () => {
      expect(newErrors({ name: 'aloe' }, ['Aloe']).name).toBeUndefined();
    });

    it('does not normalize full-width characters', () => {
      expect(newErrors({ name: 'Ａｌｏｅ' }, ['Aloe']).name).toBeUndefined();
    });
  });

  describe('interval', () => {
    it('rejects an empty string as required', () => {
      expect(newErrors({ interval: '' }).interval).toBe('required');
      expect(newErrors({ interval: '   ' }).interval).toBe('required');
    });

    it.each(['0', '366', '000', '9999999999999999999999'])(
      'rejects %j as outOfRange',
      (interval) => {
        expect(newErrors({ interval }).interval).toBe('outOfRange');
      },
    );

    it.each(['1.5', '-3', 'abc', '+3', '1e2', '7 天', '７'])(
      'rejects %j as notInteger',
      (interval) => {
        expect(newErrors({ interval }).interval).toBe('notInteger');
      },
    );

    it.each([
      ['1', 1],
      ['365', 365],
      [' 7 ', 7],
      ['007', 7],
    ])('accepts %j as %i', (interval, intervalDays) => {
      const result = validateNewPlant({ ...validNew, interval }, { today, otherNames: [] });
      expect(result).toEqual({ ok: true, value: expect.objectContaining({ intervalDays }) });
    });
  });

  describe('lastWateredOn', () => {
    it.each(['2026-3-5', '2026-02-29', '', 'abc', '2026/03/05'])(
      'rejects %j as invalidDate',
      (lastWateredOn) => {
        expect(newErrors({ lastWateredOn }).lastWateredOn).toBe('invalidDate');
      },
    );

    it('rejects a date after today as inFuture (US-01 #3)', () => {
      expect(newErrors({ lastWateredOn: '2026-03-11' }).lastWateredOn).toBe('inFuture');
    });

    it('accepts today', () => {
      expect(
        validateNewPlant({ ...validNew, lastWateredOn: '2026-03-10' }, { today, otherNames: [] }),
      ).toEqual({
        ok: true,
        value: expect.objectContaining({ lastWateredOn: '2026-03-10' }),
      });
    });
  });

  it('reports every failing field at once', () => {
    expect(
      validateNewPlant(
        { name: ' 龜背芋 ', interval: '0', lastWateredOn: '2026-03-11' },
        { today, otherNames: ['龜背芋'] },
      ),
    ).toEqual({
      ok: false,
      errors: { name: 'duplicate', interval: 'outOfRange', lastWateredOn: 'inFuture' },
    });
  });

  it('omits fields that pass from the errors', () => {
    expect(validateNewPlant({ ...validNew, name: '' }, { today, otherNames: [] })).toEqual({
      ok: false,
      errors: { name: 'required' },
    });
  });
});

describe('validatePlantEdit', () => {
  it('returns normalized values on success', () => {
    expect(validatePlantEdit({ name: ' Aloe ', interval: ' 14 ' }, { otherNames: [] })).toEqual({
      ok: true,
      value: { name: 'Aloe', intervalDays: 14 },
    });
  });

  it('accepts keeping the plant own name when otherNames excludes it (US-05 #4)', () => {
    expect(validatePlantEdit(validEdit, { otherNames: ['Aloe'] }).ok).toBe(true);
  });

  it("rejects another plant's name as duplicate", () => {
    expect(validatePlantEdit({ ...validEdit, name: 'Aloe ' }, { otherNames: ['Aloe'] })).toEqual({
      ok: false,
      errors: { name: 'duplicate' },
    });
  });

  it('applies the same name and interval rules as adding', () => {
    expect(
      validatePlantEdit({ name: '🌵'.repeat(31), interval: '1.5' }, { otherNames: [] }),
    ).toEqual({ ok: false, errors: { name: 'tooLong', interval: 'notInteger' } });
    expect(validatePlantEdit({ name: ' ', interval: '' }, { otherNames: [] })).toEqual({
      ok: false,
      errors: { name: 'required', interval: 'required' },
    });
    expect(validatePlantEdit({ ...validEdit, interval: '366' }, { otherNames: [] })).toEqual({
      ok: false,
      errors: { interval: 'outOfRange' },
    });
  });
});
