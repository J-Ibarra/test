import moment from 'moment'
import { Injectable, Inject } from '@nestjs/common'
import { TransactionRepository, CardRepository, TopUpRequestRepository } from '../../repositories'
import { CardTransactionView } from './CardTransactionView'
import {
  TopUpRequest,
  Transaction,
  DebitCard,
  TopUpTransactionMetadata,
  CoreTransactionDetails,
  TopUpRequestStatus,
} from '../../models'
import { CardProviderFacadeFactory, CARD_PROVIDER_FACADE_FACTORY } from '../../providers'

@Injectable()
export class TransactionRetriever {
  constructor(
    private cardRepository: CardRepository,
    private transactionRepository: TransactionRepository,
    private topUpRequestRepository: TopUpRequestRepository,
    @Inject(CARD_PROVIDER_FACADE_FACTORY) private cardProviderFacadeFactory: CardProviderFacadeFactory,
  ) {}

  public async retrieveTransactionsForAccount(accountId: string): Promise<CardTransactionView[]> {
    const debitCard = await this.cardRepository.getDebitCardForAccount(accountId)

    const transactions = await this.transactionRepository.getAllForCard(debitCard.id)

    return this.mapTransactionsAndTopUpRequestsToTransactionView(debitCard.id, transactions)
  }

  public async refreshTransactions(accountId: string): Promise<CardTransactionView[]> {
    const debitCard = await this.cardRepository.getDebitCardForAccount(accountId)
    const cardProviderFacade = this.cardProviderFacadeFactory.getCardProvider(debitCard.currency)

    const [persistedTransactions, contisTransactions] = await Promise.all([
      this.transactionRepository.getAllForCard(debitCard.id),
      cardProviderFacade.getTransactions(debitCard.providerAccountDetails, debitCard.createdAt, new Date()),
    ])

    const transactionsNotRecorded = await this.recordTransactionsNotRecorded(
      persistedTransactions as any,
      contisTransactions,
      debitCard,
    )

    return this.mapTransactionsAndTopUpRequestsToTransactionView(debitCard.id, persistedTransactions.concat(
      transactionsNotRecorded,
    ) as Transaction[])
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

    const transactionsNotRecorded = contisTransactions.filter(
      ({ providerTransactionIdentifier }) => !providerTxIdentifierToTransaction[providerTransactionIdentifier!],
    )

    if (transactionsNotRecorded.length > 0) {
      const results = await this.transactionRepository.insert(
        transactionsNotRecorded.map(coreTransactionDetails => ({
          ...coreTransactionDetails,
          debitCard,
        })),
      )

      return transactionsNotRecorded.map((transaction, idx) => ({ ...transaction, id: results.raw[idx].id })) as any
    }

    return []
  }

  private async mapTransactionsAndTopUpRequestsToTransactionView(
    debitCardId: number,
    transactions: CoreTransactionDetails[],
  ): Promise<CardTransactionView[]> {
    const { topUpRequestIdToTopUpRequest, mergedTransactions } = await this.mergeWithTopUpRequestsPendingOrderExecution(
      debitCardId,
      transactions,
    )

    mergedTransactions.sort((transactionA, transactionB) =>
      moment(transactionA.createdAt).isBefore(transactionB.createdAt) ? 1 : -1,
    )

    return mergedTransactions.map(transaction =>
      !!transaction.metadata && !!(transaction.metadata as TopUpTransactionMetadata).topUpRequestId
        ? CardTransactionView.ofTopUpRequest(
            transaction,
            topUpRequestIdToTopUpRequest[(transaction.metadata as TopUpTransactionMetadata).topUpRequestId],
          )
        : CardTransactionView.ofTransaction(transaction),
    )
  }

  private async mergeWithTopUpRequestsPendingOrderExecution(
    debitCardId: number,
    transactions: CoreTransactionDetails[],
  ): Promise<{ topUpRequestIdToTopUpRequest: Record<number, TopUpRequest>; mergedTransactions: CoreTransactionDetails[] }> {
    const topUpRequestsForDepositTransactions = await this.topUpRequestRepository.getAllTopUpRequestsForDebitCard(debitCardId)
    const topUpRequestIdToTopUpRequest = topUpRequestsForDepositTransactions.reduce(
      (acc, topUpRequest) => ({ ...acc, [topUpRequest.id]: topUpRequest }),
      {} as Record<number, TopUpRequest>,
    )

    const topUpRequestsPendingOrderExecution = topUpRequestsForDepositTransactions.filter(
      ({ status }) => status === TopUpRequestStatus.orderPlaced,
    )

    return {
      topUpRequestIdToTopUpRequest,
      mergedTransactions: transactions.concat(topUpRequestsPendingOrderExecution.map(CoreTransactionDetails.ofTopUpRequest)),
    }
  }
}
