import { DepositRequest, DepositRequestStatus, DepositAddress } from '@abx-types/deposit'
import { isAccountSuspended, findOrCreateKinesisRevenueAccount } from '@abx-service-clients/account'
import { createPendingDeposit, createPendingWithdrawal } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import { BlockchainFacade, TransactionResponse } from '@abx-utils/blockchain-currency-gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { decryptValue } from '@abx-utils/encryption'
import { updateDepositRequest } from '../../../../core'
import { Logger } from '@abx-utils/logging'

export class HoldingsTransactionDispatcher {
  private readonly logger = Logger.getInstance('public-coin-deposit-processor', 'HoldingsTransactionDispatcher')

  /**
   * Creates a holdings transaction, transferring the deposited funds to the Kinesis
   * holdings wallet. A pending deposit balance is also allocated (confirmed after the transaction gets confirmed).
   * The logic is only executed for active accounts.
   *
   * @param currency the deposited coin
   * @param transactionHash the transaction hash
   * @param param the deposit request
   */
  public async transferTransactionAmountToHoldingsWallet(currency: CurrencyCode, { amount, id, depositAddress }: DepositRequest) {
    const accountIsSuspended = await isAccountSuspended(depositAddress.accountId)

    if (!accountIsSuspended) {
      const { txHash: holdingsTransactionHash, transactionFee: holdingsTransactionFee } = await this.createHoldingsTransaction(
        depositAddress,
        currency,
        amount,
      )
      this.logger.debug(`Created holdings transaction for request ${id}`)

      await createPendingDeposit({
        accountId: depositAddress.accountId,
        amount,
        currencyId: depositAddress.currencyId,
        sourceEventId: id!,
        sourceEventType: SourceEventType.currencyDepositRequest,
      })

      await this.coverFeeByKinesisRevenueAccount(Number(holdingsTransactionFee), id!, depositAddress.currencyId)
      this.logger.debug(`Created pending deposit balance for deposit request${id}`)

      await updateDepositRequest(id!, {
        holdingsTxHash: holdingsTransactionHash,
        holdingsTxFee: Number(holdingsTransactionFee),
        status: DepositRequestStatus.pendingHoldingsTransactionConfirmation,
      })
    }
  }

  private async createHoldingsTransaction(depositAddress: DepositAddress, currency: CurrencyCode, amount: number): Promise<TransactionResponse> {
    const [decryptedPrivateKey, decryptedWif] = await Promise.all([
      decryptValue(depositAddress.encryptedPrivateKey),
      decryptValue(depositAddress.encryptedWif!),
    ])

    const providerFacade = BlockchainFacade.getInstance(currency)
    return providerFacade.createTransaction({
      senderAddress: {
        privateKey: decryptedPrivateKey!,
        wif: decryptedWif!,
        address: depositAddress.address!,
      },
      receiverAddress: process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!,
      amount,
      webhookCallbackUrl: process.env.DEPOSIT_HOLDINGS_TRANSACTION_CONFIRMATION_CALLBACK_URL!,
    })
  }

  private async coverFeeByKinesisRevenueAccount(transactionFee: number, depositRequestId: number, currencyId: number) {
    const kinesisRevenueAccount = await findOrCreateKinesisRevenueAccount()

    await createPendingWithdrawal({
      pendingWithdrawalParams: {
        accountId: kinesisRevenueAccount.id,
        amount: transactionFee,
        currencyId,
        sourceEventId: depositRequestId!,
        sourceEventType: SourceEventType.currencyDeposit,
      },
    })

    this.logger.info(
      `A ${transactionFee} on chain fee has been paid for deposit request ${depositRequestId} and deducted from revenue balance for currency ${currencyId}`,
    )
  }
}
