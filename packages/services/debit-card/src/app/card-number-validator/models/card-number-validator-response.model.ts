import { CardView } from '../../card-details/models/public-card-view'

export class CardActivationAttemptValidationFailure {
  allowedAttempts: number
  lastAttempt: Date | null
}

export class CardNumberValidatorResponse {
  valid: boolean
  activationAttemptValidationFailure?: CardActivationAttemptValidationFailure
  card?: CardView
}
