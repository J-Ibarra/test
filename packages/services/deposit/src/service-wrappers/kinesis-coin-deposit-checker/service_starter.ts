import { getEnvironment, CurrencyCode } from '@abx-types/reference-data'
import { checkForNewDeposits } from './core/kinesis_coin_deposit_checker'
import { killProcessOnSignal } from '@abx-utils/internal-api-tools'

export async function bootstrapKinesisCoinDepositCheckerProcessor() {
  killProcessOnSignal()

  checkForNewDeposits(getEnvironment(), CurrencyCode.kau)
  checkForNewDeposits(getEnvironment(), CurrencyCode.kag)
}
