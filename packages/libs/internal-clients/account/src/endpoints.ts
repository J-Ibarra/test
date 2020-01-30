export enum AccountEndpoints {
  findAccountWithUserDetails = 'exchange:accounts:findAccountWithUserDetails',
  findAccountsByIdWithUserDetails = 'exchange:accounts:findAccountsByIdWithUserDetails',
  findUserByAccountId = 'exchange:accounts:findUserByAccountId',
  findUsersByAccountId = 'exchange:accounts:findUsersByAccountId',
  findAccountById = 'exchange:accounts:findAccountById',
  findOrCreateKinesisRevenueAccount = 'exchange:accounts:findOrCreateKinesisRevenueAccount',
  findOrCreateOperatorAccount = 'exchange:accounts:findOrCreateOperatorAccount',
  isAccountSuspended = 'exchange:accounts:isAccountSuspended',
  getAllKycVerifiedAccountIds = 'exchange:accounts:getAllKycVerifiedAccountIds',
}
