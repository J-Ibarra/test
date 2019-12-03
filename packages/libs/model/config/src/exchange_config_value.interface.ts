import { CurrencyCode } from '@abx-types/reference-data';
import { FeatureFlag, ExchangeHoldingsWallet, WithdrawalConfig, WithdrawalLimit, DepositPollingFrequency } from '.';

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
  }