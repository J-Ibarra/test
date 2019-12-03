export enum AccountType {
  individual = 'individual',
  corporate = 'corporate',
  operator = 'operator',
  admin = 'administrator',
  // Defines the type used for the kinesis revenue account
  // which stores all the fees not to be included in the yield calculation
  // i.e. all the fees not pushed to the operator account (e.g. withdrawals/deposits)
  kinesisRevenue = 'kinesisRevenue',
}
