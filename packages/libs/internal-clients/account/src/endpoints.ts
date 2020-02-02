export enum AccountEndpoints {
  findAccountWithUserDetails = 'accounts/findAccountWithUserDetails',
  findAccountsByIdWithUserDetails = 'accounts/findAccountsByIdWithUserDetails',
  findUserByAccountId = 'accounts/findUserByAccountId',
  findUsersByAccountId = 'accounts/findUsersByAccountId',
  findAccountById = 'accounts/findAccountById',
  findOrCreateKinesisRevenueAccount = 'accounts/findOrCreateKinesisRevenueAccount',
  findOrCreateOperatorAccount = 'accounts/findOrCreateOperatorAccount',
  isAccountSuspended = 'accounts/isAccountSuspended',
  getAllKycVerifiedAccountIds = 'accounts/getAllKycVerifiedAccountIds',
}
