export enum CardOrderRequestStatus {
  /** Used when the order request was successfully received and is currently being forwarded to a provider. */
  orderPending = 'order_pending',
  /** Used when an error has occured when trying to order a card using the a specific provider */
  orderFailed = 'order_failed',
  /** Set when the kyc verification for a user is still pending. */
  kycPending = 'kyc_pending',
  /** Set when the kyc check for the account has been rejected by a member of the operations team. */
  kycRejected = 'kyc_rejected',
  /** Set when the kyc check for the account has been successfully verified by a member of the operations team. */
  kycVerified = 'kyc_verified',
  /** Used when an admin user allows a specific account to reapply for debit card. */
  adminApplicationAllowed = 'admin_application_allowed',
  /** Set after the order si successful */
  completed = 'completed',
}
