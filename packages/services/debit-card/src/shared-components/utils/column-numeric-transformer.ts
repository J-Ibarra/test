/** A value transformer used to transform numeric Postgres records ,returned as strings, into floating point number. */
export class ColumnNumericTransformer {
  to(data: number): number {
    return data
  }
  from(data: string): number {
    return parseFloat(data)
  }
}
