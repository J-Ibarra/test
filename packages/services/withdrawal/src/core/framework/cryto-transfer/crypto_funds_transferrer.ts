import { Transaction } from 'sequelize'
import { OnChainCurrencyGateway, Kinesis } from '@abx-utils/blockchain-currency-gateway'
import { FatalError } from '@abx-types/error'
import { CurrencyCode } from '@abx-types/reference-data'
import { WithdrawalRequest } from '@abx-types/withdrawal'
import { transferWithdrawalFundsForKinesisCurrency } from './kinesis_currency_transferrer'

export async function withdrawFundsFromHoldingsAccountToTargetAddress(
  { accountId, address, amount, id, memo = '' }: WithdrawalRequest,
  currencyGateway: OnChainCurrencyGateway,
  transaction: Transaction,
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

  const { txHash, transactionFee } = await transferFunds(id!, currencyGateway, address!, memo, amount, transaction)

  return {
    txHash,
    transactionFee: +transactionFee!,
  }
}

const kinesisCoins = [CurrencyCode.kau, CurrencyCode.kag]

function transferFunds(
  withdrawalRequestId: number,
  currencyGateway: OnChainCurrencyGateway,
  address: string,
  memo: string,
  amount: number,
  transaction: Transaction,
) {
  if (kinesisCoins.includes(currencyGateway.ticker!)) {
    return transferWithdrawalFundsForKinesisCurrency(
      {
        withdrawalRequestId,
        kinesisCurrencyGateway: currencyGateway as Kinesis,
        targetAddress: address,
        amount,
        memo,
      },
      transaction,
    )
  }

  return currencyGateway.transferFromExchangeHoldingsTo(address, amount)
}
