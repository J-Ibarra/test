export enum AccountEndpoints {
  findAccountWithUserDetails = 'exchange:accounts:findAccountWithUserDetails',
  findAccountsByIdWithUserDetails = 'exchange:accounts:findAccountsByIdWithUserDetails',
  findUserByAccountId = 'exchange:accounts:findUserByAccountId',
  findUsersByAccountId = 'exchange:accounts:findUsersByAccountId',
  findUser = 'exchange:accounts:findUser',
  findAccountById = 'exchange:accounts:findAccountById',
  findOrCreateKinesisRevenueAccount = 'exchange:accounts:findOrCreateKinesisRevenueAccount',
  findOrCreateOperatorAccount = 'exchange:accounts:findOrCreateOperatorAccount',
  getNamesAndEmailsOfUsers = 'exchange:accounts:getNamesAndEmailsOfUsers',
  isAccountSuspended = 'exchange:accounts:isAccountSuspended',
}
