import { Injectable, Inject } from '@nestjs/common'

import { CurrencyCode } from '../../models'
import { getEpicurusInstance } from '../redis/EpicurusClient'
import { ConfigSource, CONFIG_SOURCE_TOKEN } from '../config'

export const reserveBalanceChannel = 'datasetRetrieval:reserveDebitCardTopUpBalance'
export const confirmBalanceChannel = 'datasetRetrieval:confirmDebitCardTopUp'
export const recordCardToExchangeWithdrawalChannel = 'datasetRetrieval:recordDebitCardToExchangeWithdrawal'

export const BALANCE_RESERVE_FACADE_TOKEN = 'balance_reserve_facade'

@Injectable()
export class BalanceReserveFacade {
  constructor(@Inject(CONFIG_SOURCE_TOKEN) private configSource: ConfigSource) {}

  public reserveTopUpBalance(topUpRequestId: number, accountId: string, amount: number, currency: CurrencyCode): Promise<any> {
    const epicurus = getEpicurusInstance(this.configSource.getRedisConfig())

    return epicurus.request(reserveBalanceChannel, {
      topUpRequestId,
      accountId,
      amount,
      currency,
    })
  }

  public confirmTopUpBalance(topUpRequestId: number, accountId: string, amount: number, currency: CurrencyCode): Promise<any> {
    const epicurus = getEpicurusInstance(this.configSource.getRedisConfig())

    return epicurus.request(confirmBalanceChannel, {
      topUpRequestId,
      accountId,
      amount,
      currency,
    })
  }

  public recordCardToExchangeWithdrawal(
    accountId: string,
    currency: CurrencyCode,
    amount: number,
    transactionId: number,
  ): Promise<any> {
    const epicurus = getEpicurusInstance(this.configSource.getRedisConfig())

    return epicurus.request(recordCardToExchangeWithdrawalChannel, {
      accountId,
      currency,
      amount,
      transactionId,
    })
  }
}
