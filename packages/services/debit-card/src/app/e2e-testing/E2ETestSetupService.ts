import { Injectable, Logger } from '@nestjs/common'
import util from 'util'

import { CardRepository, TransactionRepository, CardOrderRequestRepository } from '../../shared-components/repositories'
import {
  CurrencyCode,
  DebitCardProvider,
  DebitCardStatus,
  CardOrderRequestStatus,
  ContisAccountDetails,
} from '../../shared-components/models'
import { CardSetupRequestTransaction } from './requests'
import { AccountRetrievalService } from './AccountRetrievalService'

@Injectable()
export class E2ETestSetupService {
  private logger = new Logger('E2ETestSetupService')

  constructor(
    private cardRepository: CardRepository,
    private transactionRepository: TransactionRepository,
    private cardOrderRequestRepository: CardOrderRequestRepository,
    private accountRetrievalService: AccountRetrievalService,
  ) {}

  async resetData(): Promise<any> {
    try {
      await this.transactionRepository.deleteAll()
      await this.cardOrderRequestRepository.deleteAll()
      await this.cardRepository.deleteAll()
    } catch (e) {
      this.logger.error('Error occured trying to reset the data')
      this.logger.error(JSON.stringify(util.inspect(e)))
      throw e
    }
  }

  async setupCard(
    accountEmail: string,
    currency: CurrencyCode,
    provider: DebitCardProvider,
    balance: number,
    transactions: CardSetupRequestTransaction[],

    status?: DebitCardStatus,
  ): Promise<void> {
    const accountId = await this.accountRetrievalService.findAccountIdForEmail(accountEmail)
    await this.cardOrderRequestRepository.saveCardOrderRequest(accountId, currency, CardOrderRequestStatus.completed, {
      addressLine1: 'Floor 1',
      addressLine2: 'Lane 23',
      addressLine3: 'London',
      postCode: 'E11 23F',
      country: 'United Kingdom',
    })
    const debitCard = await this.cardRepository.createNewCard({
      accountId,
      provider,
      providerAccountDetails: {
        cardId: 1,
        consumerId: 1,
        accountId: 1,
      } as ContisAccountDetails,
      currency,
      balance,
    })

    if (status !== DebitCardStatus.underReview) {
      await this.cardRepository.update({ id: debitCard.id }, { status })
    }

    if (transactions.length > 0) {
      await this.transactionRepository.insert(
        transactions.map((transaction, idx) => ({
          ...transaction,
          debitCard,
          providerTransactionIdentifier: idx,
        })),
      )
    }
  }

  async setupCardRequest(
    accountEmail: string,
    currency: CurrencyCode,
    status: CardOrderRequestStatus = CardOrderRequestStatus.completed,
  ) {
    const accountId = await this.accountRetrievalService.findAccountIdForEmail(accountEmail)

    await this.cardOrderRequestRepository.saveCardOrderRequest(accountId, currency, status, {
      addressLine1: 'Floor 1',
      addressLine2: 'Lane 23',
      addressLine3: 'London',
      postCode: 'E11 23F',
      country: 'United Kingdom',
    })
  }

  async updateCardStatus(accountEmail: string, status: DebitCardStatus): Promise<any> {
    const accountId = await this.accountRetrievalService.findAccountIdForEmail(accountEmail)
    return this.cardRepository.update({ accountId }, { status })
  }

  async insertTransactions(accountEmail: string, transactions: CardSetupRequestTransaction[]): Promise<any> {
    const accountId = await this.accountRetrievalService.findAccountIdForEmail(accountEmail)
    const debitCard = await this.cardRepository.getDebitCardForAccount(accountId)

    return this.transactionRepository.insert(
      transactions.map((transaction, idx) => ({
        ...transaction,
        debitCard,
        providerTransactionIdentifier: idx,
      })),
    )
  }
}
