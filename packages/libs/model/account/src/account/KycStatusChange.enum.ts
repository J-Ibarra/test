export enum KycStatusChange {
  approved = 'approved',
  rejected = 'rejected',
  // Used if an account has previously been KYC verified
  // but due to account details changes it no longer is
  unverified = 'unverified',
}
