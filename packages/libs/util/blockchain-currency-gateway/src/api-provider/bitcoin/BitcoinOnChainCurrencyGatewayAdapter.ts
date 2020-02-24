import { OnChainCurrencyGateway, DepositTransaction, TransactionResponse } from '../../currency_gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { RuntimeError } from '@abx-types/error'
import { BitcoinBlockchainFacade } from './BitcoinBlockchainFacade'
import { CryptoAddress } from '../model'
import { DepositAddress } from '@abx-types/deposit'

/** Adapting the {@link BitcoinBlockchainFacade} to {@link OnChainCurrencyGateway} for backwards-compatibility. */
export class BitcoinOnChainCurrencyGatewayAdapter implements OnChainCurrencyGateway {
  ticker: CurrencyCode.bitcoin
  private bitcoinBlockchainFacade: BitcoinBlockchainFacade

  constructor() {
    this.bitcoinBlockchainFacade = new BitcoinBlockchainFacade()
  }

  getId(): Promise<number> {
    return getCurrencyId(this.ticker)
  }

  generateAddress(): Promise<CryptoAddress> {
    return this.bitcoinBlockchainFacade.generateAddress()
  }

  async listenToAddressEvents(depositAddressDetails: DepositAddress): Promise<boolean> {
    try {
      if (depositAddressDetails.address) {
        return false
      }
      await this.bitcoinBlockchainFacade.subscribeToAddressTransactionEvents(depositAddressDetails.address!, 1) // listen for new transactions
      await this.bitcoinBlockchainFacade.subscribeToAddressTransactionEvents(depositAddressDetails.address!, 3) // listen for confirmed transactions
      return true
    } catch (e) {
      return false
    }
  }
  // This returns a string due to JS floats
  balanceAt(address: string): Promise<number> {
    return this.bitcoinBlockchainFacade.balanceAt(address)
  }

  getDepositTransactions(): Promise<DepositTransaction[]> {
    throw new RuntimeError('Unsupported operation getDepositTransactions')
  }

  getLatestTransactions(): Promise<DepositTransaction[]> {
    throw new RuntimeError('Unsupported operation getLatestTransactions')
  }

  getHoldingBalance(): Promise<number> {
    return this.bitcoinBlockchainFacade.balanceAt(process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!)
  }

  getHoldingPublicAddress(): Promise<string> {
    return Promise.resolve(process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!)
  }

  checkConfirmationOfTransaction(): Promise<boolean> {
    /**
     * We trust the third party api's so we can just return true
     */
    return Promise.resolve(true)
  }

  kinesisManagesConfirmations(): boolean {
    return false
  }

  transferToExchangeHoldingsFrom(
    fromAddress: CryptoAddress | Pick<CryptoAddress, 'privateKey'>,
    amount: number,
    transactionConfirmationWebhookUrl: string,
  ): Promise<TransactionResponse> {
    return this.bitcoinBlockchainFacade.createTransaction({
      senderAddress: fromAddress as CryptoAddress,
      receiverAddress: process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!,
      amount,
      webhookCallbackUrl: transactionConfirmationWebhookUrl,
    })
  }

  transferFromExchangeHoldingsTo(toAddress: string, amount: number, transactionConfirmationWebhookUrl: string): Promise<TransactionResponse> {
    return this.bitcoinBlockchainFacade.createTransaction({
      senderAddress: {
        privateKey: process.env.KINESIS_BITCOIN_HOLDINGS_SECRET!,
        address: process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!,
        wif: process.env.KINESIS_BITCOIN_HOLDINGS_WIF!,
      },
      receiverAddress: toAddress,
      amount,
      webhookCallbackUrl: transactionConfirmationWebhookUrl,
    })
  }

  transferTo(): Promise<TransactionResponse> {
    throw new RuntimeError(`Unsupported operation transferTo`)
  }

  validateAddress(address: string): Promise<boolean> {
    return this.bitcoinBlockchainFacade.validateAddress(address)
  }

  validateAddressIsNotContractAddress(address: string): Promise<boolean> {
    return this.bitcoinBlockchainFacade.validateAddressIsNotContractAddress(address)
  }

  getDecryptedHoldingsSecret(): Promise<string> {
    throw new RuntimeError(`Unsupported operation getDecryptedHoldingsSecret`)
  }
}
