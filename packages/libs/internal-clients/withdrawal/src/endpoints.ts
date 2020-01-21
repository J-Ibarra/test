export enum WithdrawalEndpoints {
  findWithdrawalRequestForTransactionHash = 'exchange:withdrawal:findWithdrawalRequestForTransactionHash',
  findWithdrawalRequestsForTransactionHashes = 'exchange:withdrawal:findWithdrawalRequestsForTransactionHashes',
  findWithdrawalRequestById = 'exchange:withdrawal:findWithdrawalRequestById',
  findWithdrawalRequestsByIds = 'exchange:withdrawal:findWithdrawalRequestsByIds',

  getWithdrawalFee = 'exchange:withdrawal:getWithdrawalFee',
  getWithdrawalFees = 'exchange:withdrawal:getWithdrawalFees',

  completeFiatWithdrawal = 'exchange:withdrawal:completeFiatWithdrawal',
}
