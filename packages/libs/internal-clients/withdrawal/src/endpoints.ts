export enum WithdrawalEndpoints {
  findWithdrawalRequestForTransactionHash = 'withdrawals/findWithdrawalRequestForTransactionHash',
  findWithdrawalRequestsForTransactionHashes = 'withdrawals/findWithdrawalRequestsForTransactionHashes',
  findWithdrawalRequestById = 'withdrawals/findWithdrawalRequestById',
  findWithdrawalRequestsByIds = 'withdrawals/findWithdrawalRequestsByIds',

  getWithdrawalFee = 'withdrawals/getWithdrawalFee',
  getWithdrawalFees = 'withdrawals/getWithdrawalFees',

  completeFiatWithdrawal = 'withdrawals/completeFiatWithdrawal',
}
