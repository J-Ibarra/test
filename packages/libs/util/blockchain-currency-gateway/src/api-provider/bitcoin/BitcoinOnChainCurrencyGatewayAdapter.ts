import { OnChainCurrencyGateway, DepositTransaction, TransactionResponse } from '../../currency_gateway'
import { CurrencyCode, Environment } from '@abx-types/reference-data'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { RuntimeError } from '@abx-types/error'
import { CryptoAddress } from '../model/CryptoAddress'
import { BitcoinBlockchainFacade } from './BitcoinBlockchainFacade'

/** Adapting the {@link BitcoinBlockchainFacade} to {@link OnChainCurrencyGateway} for backwards-compatibility. */
export class BitcoinOnChainCurrencyGatewayAdapter implements OnChainCurrencyGateway {
  ticker: CurrencyCode.bitcoin
  private bitcoinBlockchainFacade: BitcoinBlockchainFacade

  constructor(env: Environment) {
    this.bitcoinBlockchainFacade = new BitcoinBlockchainFacade(env)
  }

  getId(): Promise<number> {
    return getCurrencyId(this.ticker)
  }

  generatePrivateKey(): string {
    throw new RuntimeError(`Unsupported operation generatePrivateKey`)
  }

  // This returns a string due to JS floats
  balanceAt(address: string): Promise<number> {
    return this.bitcoinBlockchainFacade.balanceAt(address)
  }

  getAddressFromPrivateKey(): string {
    throw new RuntimeError('Unsupported operation getAddressFromPrivateKey')
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
    throw new RuntimeError('Unsupported operation checkConfirmationOfTransaction')
  }

  transferToExchangeHoldingsFrom(fromAddress: CryptoAddress, amount: number): Promise<TransactionResponse> {
    return this.bitcoinBlockchainFacade.createTransaction(fromAddress, process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!, amount)
  }

  transferFromExchangeHoldingsTo(toAddress: string, amount: number): Promise<TransactionResponse> {
    return this.bitcoinBlockchainFacade.createTransaction(
      {
        privateKey: process.env.KINESIS_BITCOIN_HOLDINGS_SECRET!,
        address: process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!,
        wif: process.env.KINESIS_BITCOIN_HOLDINGS_WIF!,
      },
      toAddress,
      amount,
    )
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
