/** Defines a container used for a response received from the contis API. */
export class ContisResponse<T> {
  private constructor(
    public errorCode?: number | null,
    public responseBody?: T,
  ) {}

  // Success response static factory
  public static success<T>(body: T) {
    return new ContisResponse<T>(null, body)
  }

  // Error response static factory
  public static error(errorCode: number) {
    return new ContisResponse(errorCode)
  }
}
