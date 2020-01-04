import { CurrencyCode } from '@abx-types/reference-data'
import { EmailRequiredTemplateContent } from '@abx-types/notification'

/** The template content sent on fiat currency withdrawal requests. */
export interface WithdrawalRequestEmailTemplateContent extends EmailRequiredTemplateContent {
  /** The requesting user first name. */
  firstName: string
  /** The requesting user last name. */
  lastName: string
  /** The requesting user account hin. */
  hin: string
  /** The withdrawal currency symbol. */
  currencySymbol: CurrencyCode
  /** The withdrawal currency amount. */
  withdrawalAmount: string
}
