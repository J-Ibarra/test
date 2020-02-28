export enum AccountQueryEndpoints {
  findAccountWithUserDetails = 'accounts/findAccountWithUserDetails',
  findAccountsByIdWithUserDetails = 'accounts/findAccountsByIdWithUserDetails',
  findUsersByEmail = 'accounts/findUsersByEmail',
  findUserByAccountId = 'accounts/findUserByAccountId',
  findUsersByAccountId = 'accounts/findUsersByAccountId',
  findAccountById = 'accounts/findAccountById',
  findOrCreateKinesisRevenueAccount = 'accounts/findOrCreateKinesisRevenueAccount',
  findOrCreateOperatorAccount = 'accounts/findOrCreateOperatorAccount',
  isAccountSuspended = 'accounts/isAccountSuspended',
  getAllKycVerifiedAccountIds = 'accounts/getAllKycVerifiedAccountIds',
  getKycVerifiedAccountDetails = 'accounts/getKycVerifiedAccountDetails',
}

export enum AccountChangeEndpoints {
  createAccount = 'accounts/createAccount',
}
