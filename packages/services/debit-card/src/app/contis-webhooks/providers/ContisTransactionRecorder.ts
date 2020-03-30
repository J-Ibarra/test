import { Injectable, Logger } from '@nestjs/common'
import { CardRepository } from '../../../shared-components/repositories'
import { TransactionRepository } from '../../../shared-components/repositories/TransactionRepository'
import { DebitCard, ContisAccountDetails } from '../../../shared-components/models'
/* tslint:disable-next-line:max-line-length */
import { formatContisTransactionType } from '../../../shared-components/providers/debit-card-provider/contis/responses/ListTransactionsResponse'
import { TransactionRequest } from '../models'

@Injectable()
export class ContisTransactionRecorder {
  private logger = new Logger('ContisTransactionRecorder')

  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly cardRepository: CardRepository,
  ) {}

  async recordTransaction({
    CardID: cardId,
    TransactionType: transactionType,
    Description: description,
    AuthoriseAmount: amount,
    TransactionID: contisTransactionId,
  }: TransactionRequest): Promise<boolean> {
    const debitCard: DebitCard = await this.cardRepository.getDebitCardByProviderDetails({
      cardId,
    } as ContisAccountDetails)

    const transactionPreviouslyRecorded = await this.transactionAlreadyRecorded(contisTransactionId)

    if (!debitCard || !!transactionPreviouslyRecorded) {
      return false
    }

    const result = await this.transactionRepository.recordTransaction({
      debitCard,
      type: formatContisTransactionType(transactionType),
      description,
      amount,
      providerTransactionIdentifier: contisTransactionId,
    })

    this.logger.debug(`Recorded a ${transactionType} transaction for contis card ${cardId}`)

    return !!(result && result.id)
  }

  private async transactionAlreadyRecorded(contisTransactionId: number) {
    const recordedTransaction = await this.transactionRepository.findOne({
      providerTransactionIdentifier: contisTransactionId,
    })

    return !!recordedTransaction
  }
}
