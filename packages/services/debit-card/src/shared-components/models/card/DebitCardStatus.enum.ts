export enum DebitCardStatus {
  active = 'active',

  inactive = 'inactive',
  lockedOut = 'locked_out',
  suspended = 'suspended',
  declined = 'declined',

  damaged = 'damaged',
  lost = 'lost',

  underReview = 'under_review',
  awaitingSetup = 'awaiting_setup',

  kycCheckFailure = 'kyc_check_failure',
  hoscCheckFailure = 'hosc_check_failure',
  greylistCheckFailure = 'greylist_check_failure',
}
