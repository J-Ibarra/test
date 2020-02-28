import { EntityManager } from 'typeorm'
import { Logger, Injectable, HttpStatus } from '@nestjs/common'
import Decimal from 'decimal.js'

import { CardRepository, TransactionRepository } from '../../shared-components/repositories'
import { WithdrawalResponse } from './models/withdrawal-response.model'
import { DebitCard, Transaction, CardConstraintName } from '../../shared-components/models'
import { ValidationError } from '../../shared-components/utils/ValidationError'
import { WithdrawalExternalGateway } from './WithdrawalExternalGateway'
import { CardConstraintService } from '../../shared-components/providers'
import { BalanceSourceOfTruthComparator } from '../../shared-components/providers/balance/BalanceSourceOfTruthComparator'

@Injectable()
export class WithdrawalOrchestrator {
  private logger = new Logger('WithdrawalOrchestrator')

  constructor(
    private cardRepository: CardRepository,
    private balanceSourceOfTruthComparator: BalanceSourceOfTruthComparator,
    private transactionRepository: TransactionRepository,
    private withdrawalExternalGateway: WithdrawalExternalGateway,
    private cardConstraintService: CardConstraintService,
  ) {}

  /**
   * Handles the workflow of withdrawing a certain amount of money from an account.
   *
   * @param accountId the id of the account from which the withdrawal is going to be made
   * @param amount the amount to be withdrawn
   * @param entityManager allows for a parent entityManager to be passed in, propagating a parent transaction
   */
  async withdrawFundsToExchange(accountId: string, amount: number, entityManager?: EntityManager): Promise<WithdrawalResponse> {
    this.logger.warn(`Processing attempt to withdraw ${amount} from debit card for account ${accountId}`)
    const debitCard = await this.retrieveDebitCardWithUpToDateBalance(accountId, entityManager)
    const withdrawalFee = await this.cardConstraintService.getCardConstraintValue<number>(CardConstraintName.withdrawalFee)

    const amountPlusFee = new Decimal(amount).plus(withdrawalFee).toNumber()
    await this.validateAvailableBalance(debitCard, amountPlusFee, accountId)

    this.logger.debug(`Withdrawing ${amount} ${debitCard.currency} for account ${accountId}`)

    const providerTransactionId = await this.withdrawalExternalGateway.executeWithdrawal(debitCard, amount, Number(withdrawalFee))
    const [withdrawalTransaction] = await Promise.all([
      this.transactionRepository.createWithdrawalTransaction(
        debitCard,
        amount,
        Number(withdrawalFee),
        providerTransactionId,
        entityManager,
      ),
      this.cardRepository.decreaseAvailableBalance(debitCard.id, amountPlusFee, entityManager),
    ])

    return {
      withdrawalTransaction: withdrawalTransaction as Transaction,
    }
  }

  private async validateAvailableBalance(debitCard: DebitCard, amountPlusFee: number, accountId: string) {
    if (new Decimal(debitCard.balance).lessThan(amountPlusFee)) {
      this.logger.warn(
        `Card available balance for account ${accountId}(${debitCard.balance})
        is insufficient for a withdrawal of ${amountPlusFee} (including fee)`,
      )
      throw new ValidationError('Insufficient available balance', HttpStatus.BAD_REQUEST)
    }
  }

  private async retrieveDebitCardWithUpToDateBalance(accountId: string, entityManager?: EntityManager): Promise<DebitCard> {
    const debitCard = await this.cardRepository.getDebitCardForAccount(accountId, entityManager)
    const balance = await this.balanceSourceOfTruthComparator.syncCardBalanceWithSourceOfTruth(debitCard, entityManager)

    debitCard.balance = balance
    return debitCard
  }
}
