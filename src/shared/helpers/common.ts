export function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.floor(value) === value;
}

export function isNumber(value: unknown): value is number {
  return !Number.isNaN(toInteger(value));
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && !isArray(value) && !isEmpty(value);
}

export function isBool(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isArray<T>(value: unknown): value is T[] {
  return value instanceof Array;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function isCallable(value: unknown): value is Function {
  return typeof value === 'function';
}

export function isScalar(value: unknown): boolean {
  return isNumber(value) || isString(value) || isBool(value);
}

export function toInteger(value: unknown): number {
  return parseInt(`${value}`, 10);
}

export function isEmpty(value: unknown): boolean {
  return (isString(value) && 0 === value?.length) || null === value || undefined === value;
}

export function isValue(value: number | string | null | undefined): value is number | string {
  return !(value == null || value === '' || value !== value);
}
