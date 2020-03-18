import { Injectable } from '@nestjs/common'

import { CurrencyCode } from '../../models'
import { confirmPendingDebitCardTopUp, createPendingDebitCardTopUp, recordDebitCardToExchangeWithdrawal } from '@abx-service-clients/balance'
import { findCurrencyForCode } from '@abx-service-clients/reference-data'
import { Currency, CurrencyCode as ReferenceDataCurrencyCode } from '@abx-types/reference-data'
import { SourceEventType } from '@abx-types/balance'

export const reserveBalanceChannel = 'datasetRetrieval:reserveDebitCardTopUpBalance'
export const confirmBalanceChannel = 'datasetRetrieval:confirmDebitCardTopUp'
export const recordCardToExchangeWithdrawalChannel = 'datasetRetrieval:recordDebitCardToExchangeWithdrawal'

export const BALANCE_RESERVE_FACADE_TOKEN = 'balance_reserve_facade'

@Injectable()
export class BalanceReserveFacade {
  private cachedCurrencies: Currency[] = []

  public async reserveTopUpBalance(topUpRequestId: number, accountId: string, amount: number, currencyCode: CurrencyCode): Promise<any> {
    const currency = await this.getCurrencyForCode(currencyCode as any)

    return createPendingDebitCardTopUp({
      sourceEventType: SourceEventType.debitCardTopUp,
      sourceEventId: topUpRequestId,
      accountId,
      amount,
      currencyId: currency.id,
    })
  }

  public async confirmTopUpBalance(topUpRequestId: number, accountId: string, amount: number, currencyCode: CurrencyCode): Promise<any> {
    const currency = await this.getCurrencyForCode(currencyCode as any)

    return confirmPendingDebitCardTopUp({
      sourceEventType: SourceEventType.debitCardTopUp,
      sourceEventId: topUpRequestId,
      accountId,
      amount,
      currencyId: currency.id,
    })
  }

  public async recordCardToExchangeWithdrawal(accountId: string, currencyCode: CurrencyCode, amount: number, transactionId: number): Promise<any> {
    const currency = await this.getCurrencyForCode(currencyCode as any)

    return recordDebitCardToExchangeWithdrawal({
      sourceEventType: SourceEventType.debitCardTopUp,
      sourceEventId: transactionId,
      accountId,
      amount,
      currencyId: currency.id,
    })
  }

  private async getCurrencyForCode(currencyCode: ReferenceDataCurrencyCode): Promise<Currency> {
    let currency = this.cachedCurrencies.find(({ code }) => code === currencyCode)

    if (!!currency) {
      return currency
    }

    currency = await findCurrencyForCode(currencyCode)
    this.cachedCurrencies.push(currency)

    return currency
  }
}
