export interface CardDetails {
  id: number
  /** The obscured PAN number */
  obscuredCardNumber: string
  /** The name printed on the card */
  cardDisplayName: string
}

export interface LastFourDigitValidationResponse {
  valid: boolean
}

export interface NewCardDetails {
  newCardId: number
}
