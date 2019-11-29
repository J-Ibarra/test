/** The account status. */
export enum AccountStatus {
  /** The initial status used when an account is created. */
  registered = 'registered',
  /** Used when the email for the account has been verified. */
  emailVerified = 'emailVerified',
  /** Used when the account has been KYC verified. */
  kycVerified = 'kycVerified',
  superUser = 'superUser',
}
