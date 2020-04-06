import { getWithdrawalConfigForCurrency, isFiatCurrency, findCurrencyForCodes } from '@abx-service-clients/reference-data'
import { Logger } from '@abx-utils/logging'
import { CurrencyManager } from '@abx-utils/blockchain-currency-gateway'
import { InitialiseWithdrawalParams } from '@abx-types/withdrawal'
import { validateWithdrawal, initialiseCryptoWithdrawalRequest } from '../../../core'
import { Currency } from '@abx-types/reference-data'
import { findCurrencyAvailableBalances } from '@abx-service-clients/balance'
import { getEnvironment } from '@abx-types/reference-data'
import { findAccountWithUserDetails } from '@abx-service-clients/account'
import { pushNewCryptoWithdrawalRequestForProcessing } from '@abx-service-clients/withdrawal'
import { handleFiatCurrencyWithdrawalRequest } from './fiat_new_withdrawal_request_handler'

const logger = Logger.getInstance('withdrawals_gateway', 'initialiseWithdrawal')
const onChainCurrencyManager = new CurrencyManager(getEnvironment())

export async function initialiseWithdrawal(params: InitialiseWithdrawalParams): Promise<void> {
  const { amount, currencyCode } = params

  const { withdrawalRequestCurrency } = await validateRequest(params, onChainCurrencyManager)

  logger.debug(`Validated Withdrawal Request for ${amount}: ${currencyCode}, for account: ${params.accountId}`)

  if (isFiatCurrency(currencyCode)) {
    await handleFiatCurrencyWithdrawalRequest({ params, currency: withdrawalRequestCurrency })
  } else {
    const { amountRequest } = await initialiseCryptoWithdrawalRequest({
      accountId: params.accountId!,
      address: params.address,
      amount: amount!,
      currencyCode: currencyCode!,
      memo: params.memo,
    })
    await pushNewCryptoWithdrawalRequestForProcessing(amountRequest.id!)
  }
}

async function validateRequest(
  { accountId, address, amount, currencyCode, memo }: InitialiseWithdrawalParams,
  manager: CurrencyManager,
): Promise<{ withdrawalRequestCurrency: Currency; feeCurrency: Currency }> {
  const configForCurrency = await getWithdrawalConfigForCurrency({ currencyCode })
  const feeCurrencyCode = configForCurrency.feeCurrency

  const [currencies, account, availableBalances] = await Promise.all([
    findCurrencyForCodes([currencyCode, feeCurrencyCode]),
    findAccountWithUserDetails({ id: accountId }),
    findCurrencyAvailableBalances([currencyCode, feeCurrencyCode], accountId),
  ])
  const [withdrawalRequestCurrency, feeCurrency] = currencies!
  const availableBalance = availableBalances![currencyCode] || 0
  const feeCurrencyAvailableBalance = availableBalances![feeCurrency.code] || 0

  await validateWithdrawal({
    currency: withdrawalRequestCurrency,
    currencyCode,
    amount,
    availableBalance,
    account: account!,
    manager,
    memo,
    address,
    feeCurrency,
    feeCurrencyAvailableBalance,
    feeAmount: !!configForCurrency ? configForCurrency.feeAmount : 0,
  })

  return { withdrawalRequestCurrency, feeCurrency }
}
