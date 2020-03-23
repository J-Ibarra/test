import { Logger, Injectable, Inject } from '@nestjs/common'
import util from 'util'
import Decimal from 'decimal.js'

import {
  CardProviderFacadeFactory,
  BALANCE_RESERVE_FACADE_TOKEN,
  BalanceReserveFacade,
  CARD_PROVIDER_FACADE_FACTORY,
} from '../../shared-components/providers'
import { DebitCard } from '../../shared-components/models'

@Injectable()
export class WithdrawalExternalGateway {
  private logger = new Logger('WithdrawalExternalGateway')

  constructor(
    @Inject(CARD_PROVIDER_FACADE_FACTORY) private cardProviderFacadeFactory: CardProviderFacadeFactory,
    @Inject(BALANCE_RESERVE_FACADE_TOKEN)
    private readonly balanceReserveFacade: BalanceReserveFacade,
  ) {}

  async executeWithdrawal(debitCard: DebitCard, amount: number, fee: number): Promise<number> {
    const providerTransactionId = await this.recordBalanceChangeInCardProvider(
      debitCard,
      new Decimal(amount).plus(fee).toNumber(),
    )
    await this.recordDebitCardWithdrawalInExchange(debitCard, amount, providerTransactionId)

    return providerTransactionId
  }

  private async recordBalanceChangeInCardProvider(debitCard: DebitCard, amount: number) {
    try {
      const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(debitCard.currency)

      this.logger.log(`Attempting withdrawal from ${debitCard.accountId} using ${cardProviderFacade.getProvider()}`)

      return cardProviderFacade.unloadBalance(debitCard.providerAccountDetails, amount)
    } catch (e) {
      this.logger.error(`An error ocurred using ${debitCard.provider} to withdraw ${amount} ${debitCard.currency}`)
      this.logger.error(JSON.stringify(util.inspect(e)))
      throw e
    }
  }

  private async recordDebitCardWithdrawalInExchange({ accountId, currency }: DebitCard, amount: number, transactionId: number) {
    try {
      await this.balanceReserveFacade.recordCardToExchangeWithdrawal(accountId, currency, amount, transactionId)
      this.logger.debug(`Recording withdrawal of ${amount} ${currency} for account ${accountId} on the exchange`)
    } catch (e) {
      this.logger.error(`An error ocurred trying to record debit card withdrawal in exchange balance for account ${accountId}`)
      this.logger.error(JSON.stringify(util.inspect(e)))
      throw e
    }
  }
}
