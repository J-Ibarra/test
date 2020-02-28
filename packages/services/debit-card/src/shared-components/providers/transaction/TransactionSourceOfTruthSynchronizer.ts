import { Injectable, Inject } from '@nestjs/common'
import { TransactionRepository, CardRepository } from '../../repositories'
import { Transaction, DebitCard, CoreTransactionDetails } from '../../models'
import { CardProviderFacadeFactory, CARD_PROVIDER_FACADE_FACTORY } from '../../providers'

@Injectable()
export class TransactionSourceOfTruthSynchronizer {
  constructor(
    private cardRepository: CardRepository,
    private transactionRepository: TransactionRepository,
    @Inject(CARD_PROVIDER_FACADE_FACTORY) private cardProviderFacadeFactory: CardProviderFacadeFactory,
  ) {}

  public async synchronizeTransactionsWithSource(accountId: string): Promise<Transaction[]> {
    const debitCard = await this.cardRepository.getDebitCardForAccount(accountId)
    const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(debitCard.currency)

    const [persistedTransactions, contisTransactions] = await Promise.all([
      this.transactionRepository.getAllForCard(debitCard.id),
      cardProviderFacade.getTransactions(debitCard.providerAccountDetails, debitCard.createdAt, new Date()),
    ])

    return this.recordTransactionsNotRecorded(persistedTransactions as any, contisTransactions, debitCard)
  }

  private async recordTransactionsNotRecorded(
    persistedTransactions: Transaction[],
    contisTransactions: CoreTransactionDetails[],
    debitCard: DebitCard,
  ): Promise<Transaction[]> {
    const providerTxIdentifierToTransaction = persistedTransactions.reduce(
      (acc, transaction) => {
        acc[transaction.providerTransactionIdentifier] = transaction
        return acc
      },
      {} as Record<string, Transaction>,
    )

    const transactionsNotRecorded = contisTransactions.filter(({ id }) => !providerTxIdentifierToTransaction[id!])

    const results = await this.transactionRepository.insert(
      transactionsNotRecorded.map(coreTransactionDetails => ({
        ...coreTransactionDetails,
        debitCard,
      })),
    )

    return transactionsNotRecorded.map((transaction, idx) => ({ ...transaction, id: results.raw[idx].id })) as any
  }
}
