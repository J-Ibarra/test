import { findDepositRequestsWithInsufficientAmount } from '.'
import { DepositRequest } from '@abx-types/deposit'
import Decimal from 'decimal.js'
import { Logger } from '@abx-utils/logging'

export class DepositAmountCalculator {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'DepositAmountCalculator')

  /**
   * We want to add up the amount of all the deposit requests which are recorded in `insufficientBalance` status.
   * The result amount can then be added to the amount fo the current deposit request.
   */
  public async computeTotalAmountToTransfer(
    depositRequests: DepositRequest[],
  ): Promise<{ totalAmount: number; depositsRequestsWithInsufficientStatus: DepositRequest[] }> {
    const firstDepositAddressId = depositRequests[0].depositAddressId
    const depositsRequestsWithInsufficientStatus = await findDepositRequestsWithInsufficientAmount(firstDepositAddressId!)

    const totalAmounOfDepositsWithInsufficientBalance = depositsRequestsWithInsufficientStatus.reduce(
      (acc, { amount }) => new Decimal(acc).plus(amount),
      new Decimal(0),
    )

    this.logger.info(
      `Found ${depositsRequestsWithInsufficientStatus.length} pre existing deposits for deposit address ${firstDepositAddressId}, total amount of pre existing deposit requests ${totalAmounOfDepositsWithInsufficientBalance}`,
    )

    const totalRequestsAmount = depositRequests.reduce((acc, { amount }) => new Decimal(acc).plus(amount), new Decimal(0))

    this.logger.info(`Total amount ${totalRequestsAmount}`)

    return {
      totalAmount: new Decimal(totalRequestsAmount).plus(totalAmounOfDepositsWithInsufficientBalance).toNumber(),
      depositsRequestsWithInsufficientStatus,
    }
  }
}
