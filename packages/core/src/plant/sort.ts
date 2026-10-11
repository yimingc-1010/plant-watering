import type { PlantId } from './plant';

/**
 * Name comparison and list ordering (`compareNames`, `compareDue`).
 * See docs/design/domain.md "清單與排序" and ADR-004.
 */

/** CLDR `zh-Hant` default collation: Chinese by stroke count. */
const collator = new Intl.Collator('zh-Hant-TW', {
  usage: 'sort',
  sensitivity: 'variant',
  numeric: true,
});

/** Unicode code point order (not UTF-16 code unit order). */
function compareCodePoints(a: string, b: string): number {
  const left = [...a];
  const right = [...b];
  const length = Math.min(left.length, right.length);
  for (let i = 0; i < length; i++) {
    const diff = left[i]!.codePointAt(0)! - right[i]!.codePointAt(0)!;
    if (diff !== 0) return diff;
  }
  return left.length - right.length;
}

/** Collator order, then code point order on ties: only identical strings compare equal. */
export function compareNames(a: string, b: string): number {
  return collator.compare(a, b) || compareCodePoints(a, b);
}

export interface DueSortable {
  readonly id: PlantId;
  readonly name: string;
  readonly overdueDays: number;
}

/** Today's due list order: most overdue first, then `compareNames`, then id. */
export function compareDue(a: DueSortable, b: DueSortable): number {
  return (
    b.overdueDays - a.overdueDays || compareNames(a.name, b.name) || compareCodePoints(a.id, b.id)
  );
}
