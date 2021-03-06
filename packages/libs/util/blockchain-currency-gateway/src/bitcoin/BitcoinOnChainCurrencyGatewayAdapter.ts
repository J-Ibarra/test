import { OnChainCurrencyGateway, DepositTransaction, TransactionResponse, ExchangeHoldingsTransfer } from '../currency_gateway'
import { CurrencyCode, SymbolPairStateFilter } from '@abx-types/reference-data'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { RuntimeError } from '@abx-types/error'
import { BitcoinApiProviderFacade } from './BitcoinApiProviderFacade'
import { CryptoAddress, Transaction, MultiTargetCreateTransactionPayload, MultiTargetTransactionCreationResult } from '../model'
import { DepositAddress } from '@abx-types/deposit'
import { Logger } from '@abx-utils/logging'
import { decryptValue } from '@abx-utils/encryption'

/** Adapting the {@link BitcoinApiProviderFacade} to {@link OnChainCurrencyGateway} for backwards-compatibility. */
export class BitcoinOnChainCurrencyGatewayAdapter implements OnChainCurrencyGateway {
  public static readonly CONFIRMATION_BLOCKS_TO_WAIT_FOR = parseInt(process.env.BITCOIN_TRANSACTION_CONFIRMATION_BLOCKS || '1')

  ticker = CurrencyCode.bitcoin
  logger = Logger.getInstance('blockchain-currency-gateway', 'BitcoinOnChainCurrencyGatewayAdapter')

  private bitcoinBlockchainFacade: BitcoinApiProviderFacade

  constructor() {
    this.bitcoinBlockchainFacade = new BitcoinApiProviderFacade()
  }

  getId(): Promise<number> {
    return getCurrencyId(this.ticker, SymbolPairStateFilter.all)
  }

  generateAddress(): Promise<CryptoAddress> {
    return this.bitcoinBlockchainFacade.generateAddress()
  }

  async createAddressTransactionSubscription(depositAddressDetails: DepositAddress): Promise<boolean> {
    try {
      if (!depositAddressDetails.address) {
        this.logger.warn('Received deposit address details have no address field. Please consider that you are passing in the wrong currency asset.')
        return false
      } else if (depositAddressDetails.transactionTrackingActivated) {
        this.logger.warn(`We have already activated transaction events for this address: ${depositAddressDetails.address}`)
        return true
      }

      await this.bitcoinBlockchainFacade.subscribeToAddressTransactionEvents(
        depositAddressDetails.address,
        BitcoinOnChainCurrencyGatewayAdapter.CONFIRMATION_BLOCKS_TO_WAIT_FOR,
      )
      this.logger.info(`Activated transaction events for this address: ${depositAddressDetails.address}`)
      return true
    } catch (e) {
      this.logger.error(
        `unexpected error thrown -  createAddressTransactionSubscription for address : ${depositAddressDetails.address}, err: ${e.message}`,
      )
      return false
    }
  }

  getTransaction(transactionHash: string, targetAddress: string): Promise<Transaction | null> {
    return this.bitcoinBlockchainFacade.getTransaction(transactionHash, targetAddress)
  }

  subscribeToTransactionConfirmationEvents(transactionHash: string, callbackUrl: string) {
    return this.bitcoinBlockchainFacade.subscribeToTransactionConfirmationEvents(transactionHash, callbackUrl)
  }

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

  transferToExchangeHoldingsFrom(fromAddress: CryptoAddress | Pick<CryptoAddress, 'privateKey'>, amount: number): Promise<TransactionResponse> {
    return this.bitcoinBlockchainFacade.createTransaction({
      senderAddress: fromAddress as CryptoAddress,
      receiverAddress: process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!,
      amount,
    })
  }

  async transferFromExchangeHoldingsTo({ toAddress, amount, memo, feeLimit }: ExchangeHoldingsTransfer): Promise<TransactionResponse> {
    const [holdingsPrivateKey, holdingsWif] = await Promise.all([
      decryptValue(process.env.KINESIS_BITCOIN_HOLDINGS_PRIVATE_KEY!),
      decryptValue(process.env.KINESIS_BITCOIN_HOLDINGS_WIF!),
    ])

    return this.bitcoinBlockchainFacade.createTransaction({
      senderAddress: {
        privateKey: holdingsPrivateKey!,
        address: process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!,
        wif: holdingsWif,
      },
      receiverAddress: toAddress,
      amount,
      memo,
      feeLimit,
      subtractFeeFromAmountSent: false,
    })
  }

  async transferFromExchangeHoldingsToMultipleReceivers({
    receivers,
    memo,
  }: Pick<MultiTargetCreateTransactionPayload, 'receivers' | 'memo'>): Promise<MultiTargetTransactionCreationResult> {
    const [holdingsPrivateKey, holdingsWif] = await Promise.all([
      decryptValue(process.env.KINESIS_BITCOIN_HOLDINGS_PRIVATE_KEY!),
      decryptValue(process.env.KINESIS_BITCOIN_HOLDINGS_WIF!),
    ])

    return this.bitcoinBlockchainFacade.createMultiReceiverTransaction({
      senderAddress: {
        privateKey: holdingsPrivateKey!,
        address: process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!,
        wif: holdingsWif,
      },
      receivers,
      memo,
      subtractFeeFromAmountSent: false,
    })
  }

  transferTo(): Promise<TransactionResponse> {
    throw new RuntimeError(`Unsupported operation transferTo`)
  }

  validateAddress(address: string): Promise<boolean> {
    return this.bitcoinBlockchainFacade.validateAddress(address)
  }

  async validateAddressIsNotContractAddress(_address: string): Promise<boolean> {
    return true
  }

  getDecryptedHoldingsSecret(): Promise<string> {
    throw new RuntimeError(`Unsupported operation getDecryptedHoldingsSecret`)
  }
}
