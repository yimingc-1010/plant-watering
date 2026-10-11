/**
 * Input validation for plant forms. Rules and error codes follow
 * docs/design/domain.md "植物名稱、澆水間隔".
 */

import { type LocalDate, parseLocalDate } from '../date/local-date';

/** Maximum name length in Unicode code points, after trimming. */
export const NAME_MAX_LENGTH = 30;
export const INTERVAL_MIN = 1;
export const INTERVAL_MAX = 365;

/** Raw form input for adding a plant; every field is the text as typed. */
export interface NewPlantInput {
  name: string;
  interval: string;
  lastWateredOn: string;
}

/** Raw form input for editing a plant; the last watered date is not editable. */
export interface PlantEditInput {
  name: string;
  interval: string;
}

export type PlantNameError = 'required' | 'tooLong' | 'duplicate';
export type PlantIntervalError = 'required' | 'notInteger' | 'outOfRange';
export type LastWateredOnError = 'invalidDate' | 'inFuture';

/** Every failing field at once, so the screen can mark them all. */
export interface PlantFieldErrors {
  name?: PlantNameError;
  interval?: PlantIntervalError;
  lastWateredOn?: LastWateredOnError;
}

/** Normalized values ready to store: trimmed name, integer interval. */
export interface ValidPlantEdit {
  name: string;
  intervalDays: number;
}

export interface ValidNewPlant extends ValidPlantEdit {
  lastWateredOn: LocalDate;
}

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; errors: PlantFieldErrors };

export interface PlantEditContext {
  /** Names of every other plant; when editing, exclude the plant being edited. */
  otherNames: readonly string[];
}

export interface NewPlantContext extends PlantEditContext {
  today: LocalDate;
}

type FieldResult<V, E> = { value: V; error?: never } | { value?: never; error: E };

const INTEGER_PATTERN = /^[0-9]+$/;

function checkName(
  input: string,
  otherNames: readonly string[],
): FieldResult<string, PlantNameError> {
  const name = input.trim();
  if (name === '') return { error: 'required' };
  if ([...name].length > NAME_MAX_LENGTH) return { error: 'tooLong' };
  if (otherNames.includes(name)) return { error: 'duplicate' };
  return { value: name };
}

function checkInterval(input: string): FieldResult<number, PlantIntervalError> {
  const text = input.trim();
  if (text === '') return { error: 'required' };
  if (!INTEGER_PATTERN.test(text)) return { error: 'notInteger' };
  const days = Number(text);
  if (days < INTERVAL_MIN || days > INTERVAL_MAX) return { error: 'outOfRange' };
  return { value: days };
}

function checkLastWateredOn(
  input: string,
  today: LocalDate,
): FieldResult<LocalDate, LastWateredOnError> {
  const date = parseLocalDate(input);
  if (date === null) return { error: 'invalidDate' };
  // LocalDate's lexicographic order is chronological order.
  if (date > today) return { error: 'inFuture' };
  return { value: date };
}

export function validatePlantEdit(
  input: PlantEditInput,
  context: PlantEditContext,
): ValidationResult<ValidPlantEdit> {
  const name = checkName(input.name, context.otherNames);
  const interval = checkInterval(input.interval);
  if (name.error !== undefined || interval.error !== undefined) {
    const errors: PlantFieldErrors = {};
    if (name.error !== undefined) errors.name = name.error;
    if (interval.error !== undefined) errors.interval = interval.error;
    return { ok: false, errors };
  }
  return { ok: true, value: { name: name.value, intervalDays: interval.value } };
}

export function validateNewPlant(
  input: NewPlantInput,
  context: NewPlantContext,
): ValidationResult<ValidNewPlant> {
  const edit = validatePlantEdit(input, context);
  const lastWateredOn = checkLastWateredOn(input.lastWateredOn, context.today);
  if (!edit.ok || lastWateredOn.error !== undefined) {
    const errors: PlantFieldErrors = edit.ok ? {} : { ...edit.errors };
    if (lastWateredOn.error !== undefined) errors.lastWateredOn = lastWateredOn.error;
    return { ok: false, errors };
  }
  return { ok: true, value: { ...edit.value, lastWateredOn: lastWateredOn.value } };
}
