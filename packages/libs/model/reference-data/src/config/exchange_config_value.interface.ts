import { CurrencyCode } from '../currency_code.enum'
import { AccountType } from '@abx-types/account'
import { 
  FeatureFlag, 
  ExchangeHoldingsWallet, 
  WithdrawalConfig, 
  WithdrawalLimit, 
  DepositPollingFrequency, 
  MobileVersions 
} from '.'

export interface ExchangeConfigValue {
  featureFlags: FeatureFlag[]
  exchangeHoldingsWallets: ExchangeHoldingsWallet[]
  vatRate: number
  withdrawalFees: WithdrawalConfig
  withdrawalLimit: WithdrawalLimit
  depositPollingFrequency: DepositPollingFrequency[]
  transactionFeeCap: Record<CurrencyCode, number>
  operationsEmail: string
  ethereumDepositMaxBlockCheck: number
  excludedAccountTypesFromOrderRanges: AccountType[]
  depositMinimumAmounts: Record<CurrencyCode, number>
  mobileVersions: MobileVersions
}
