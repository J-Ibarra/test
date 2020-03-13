export enum WithdrawalApiEndpoints {
  findWithdrawalRequestForTransactionHash = 'withdrawals/findWithdrawalRequestForTransactionHash',
  findWithdrawalRequestsForTransactionHashes = 'withdrawals/findWithdrawalRequestsForTransactionHashes',
  findWithdrawalRequestById = 'withdrawals/findWithdrawalRequestById',
  findWithdrawalRequestsByIds = 'withdrawals/findWithdrawalRequestsByIds',
  findAllWithdrawalRequestsForAccountAndCurrency = 'withdrawals/findAllWithdrawalRequestsForAccountAndCurrency',

  getWithdrawalFee = 'withdrawals/getWithdrawalFee',
  getWithdrawalFees = 'withdrawals/getWithdrawalFees',
}
