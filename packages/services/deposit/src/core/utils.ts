import { CurrencyCode, Currency } from '@abx-types/reference-data'
import { findCurrencyForCode, erc20Tokens } from '@abx-service-clients/reference-data'
import { ECR20_TOKENS_WITH_ETH_FEE } from './constants'
import { BitcoinOnChainCurrencyGatewayAdapter } from '@abx-utils/blockchain-currency-gateway'
import { ERC20TokenCurrencyGatewaySkeleton } from '@abx-utils/blockchain-currency-gateway'

let ethCurrency: Currency

/**
 * Retrieves the currency id to use when covering the transaction fee, for
 * a deposit transaction, by the kinesis revenue account.
 *
 * @param depositTransactionCurrencyId the id of the deposited currency
 * @param depositTransactionCurrencyCode the code of the deposited currency
 * @returns the id of the fee currency
 */
export async function getDepositTransactionFeeCurrencyId(
  depositTransactionCurrencyId: number,
  depositTransactionCurrencyCode: CurrencyCode,
): Promise<number> {
  let transactionFeeCurrencyId = depositTransactionCurrencyId

  if (ECR20_TOKENS_WITH_ETH_FEE.includes(depositTransactionCurrencyCode)) {
    const feeCurrency = ethCurrency || (await findCurrencyForCode(CurrencyCode.ethereum))
    ethCurrency = feeCurrency

    transactionFeeCurrencyId = feeCurrency.id
  }

  return transactionFeeCurrencyId
}

const DEFAULT_REQUIRED_DEPOSIT_TRANSACTION_CONFIRMATIONS = 1

export function getRequiredConfirmationsForDepositTransaction(currency: CurrencyCode) {
  if (currency === CurrencyCode.bitcoin) {
    return BitcoinOnChainCurrencyGatewayAdapter.CONFIRMATION_BLOCKS_TO_WAIT_FOR
  } else if (erc20Tokens.includes(currency)) {
    return ERC20TokenCurrencyGatewaySkeleton.CONFIRMATION_BLOCKS_TO_WAIT_FOR
  }

  return DEFAULT_REQUIRED_DEPOSIT_TRANSACTION_CONFIRMATIONS
}
