export function fromSqliteBoolean(value: number): boolean {
  return value === 1;
}

export function toSqliteBoolean(value: boolean): number {
  return value ? 1 : 0;
}
