import { DepositRequest, DepositRequestStatus, DepositAddress } from '@abx-types/deposit'
import { isAccountSuspended } from '@abx-service-clients/account'
import { createPendingDeposit } from '@abx-service-clients/balance'
import { SourceEventType } from '@abx-types/balance'
import { BlockchainFacade } from '@abx-utils/blockchain-currency-gateway'
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
  public async transferTransactionAmountToHoldingsWallet(
    currency: CurrencyCode,
    transactionHash: string,
    { amount, id, depositAddress }: DepositRequest,
  ) {
    const accountIsSuspended = await isAccountSuspended(depositAddress.accountId)

    if (!accountIsSuspended) {
      await createPendingDeposit({
        accountId: depositAddress.accountId,
        amount,
        currencyId: depositAddress.currencyId,
        sourceEventId: id!,
        sourceEventType: SourceEventType.currencyDepositRequest,
      })
      this.logger.debug(`Created pending deposit balance for deposit request${id}`)

      await this.createHoldingsTransaction(depositAddress, currency, amount)
      this.logger.debug(`Created holdings transaction for request ${id}`)

      await updateDepositRequest(id!, {
        holdingsTxHash: transactionHash,
        status: DepositRequestStatus.pendingCompletion,
        holdingsTxFee: Number(),
      })
    }
  }

  private async createHoldingsTransaction(depositAddress: DepositAddress, currency: CurrencyCode, amount: number) {
    const [decryptedPrivateKey, decryptedWif] = await Promise.all([
      decryptValue(depositAddress.encryptedPrivateKey),
      decryptValue(depositAddress.encryptedWif!),
    ])

    const providerFacade = BlockchainFacade.getInstance(currency)
    await providerFacade.createTransaction({
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
}
