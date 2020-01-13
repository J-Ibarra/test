import { OnChainCurrencyGateway } from '@abx-query-libs/blockchain-currency-gateway'
import { FatalError } from '@abx-types/error'
import { WithdrawalRequest } from '@abx-types/withdrawal'

export async function withdrawFundsFromHoldingsAccountToTargetAddress(
  { accountId, address, amount, id }: WithdrawalRequest,
  currencyGateway: OnChainCurrencyGateway,
): Promise<{ txHash: string; transactionFee: number }> {
  const holdingBalance = await currencyGateway.getHoldingBalance()

  if (amount > holdingBalance) {
    throw new FatalError('Withdrawal request amount is greater than holding balance for currency', {
      context: {
        accountId,
        amount,
        currency: currencyGateway.ticker,
        withdrawalRequestId: id,
      },
    })
  }

  const { txHash, transactionFee } = await currencyGateway.transferFromExchangeHoldingsTo(address!, amount)

  return {
    txHash,
    transactionFee: +transactionFee!,
  }
}
