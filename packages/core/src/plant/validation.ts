/**
 * Input validation for plant forms. Rules and error codes follow
 * docs/design/domain.md "植物名稱、澆水間隔".
 */

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
