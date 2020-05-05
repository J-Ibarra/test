import Decimal from 'decimal.js'
import {
  Account,
  AccountResponse,
  Asset,
  CollectionPage,
  CreateAccountOperationRecord,
  Keypair,
  Network,
  Operation,
  OperationRecord,
  PaymentOperationRecord,
  Server,
  StrKey,
  Transaction,
  TransactionBuilder,
  Memo,
} from 'js-kinesis-sdk'

import { createHash } from 'crypto'
import { Environment } from '@abx-types/reference-data'
import { Logger } from '@abx-utils/logging'
import { decryptValue } from '@abx-utils/encryption'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { CurrencyCode, KinesisCurrencies } from '@abx-types/reference-data'
import { KINESIS_NETWORK_CONFIG } from './kinesis_network_config'
import { OnChainCurrencyGateway, DepositTransaction, TransactionResponse, ExchangeHoldingsTransfer } from '../currency_gateway'
import { CryptoAddress } from '../model'

const logger = Logger.getInstance('currencies', 'kinesis_coin')

export class Kinesis implements OnChainCurrencyGateway {
  public ticker: CurrencyCode
  private config: { passphrase: string; url: string }
  private decryptedKauHoldingsSecret: string
  private decryptedKagHoldingsSecret: string
  private decryptedKauHoldingsSignerSecret: string
  private decryptedKagHoldingsSignerSecret: string
  private readonly STROOPS_IN_ONE_KINESIS = 1e7
  private readonly BASIS_POINTS_TO_PERCENT = 1e4

  constructor(env: Environment, metal: KinesisCurrencies) {
    this.ticker = metal
    this.config = KINESIS_NETWORK_CONFIG[env][metal]
  }

  public async generateAddress(): Promise<CryptoAddress> {
    const privateKey = this.generatePrivateKey()
    const publicKey = this.getAddressFromPrivateKey(privateKey)
    return {
      privateKey,
      publicKey,
    }
  }

  // Required for non Kinesis coins only, so left unimplemented here
  public async createAddressTransactionSubscription(): Promise<boolean> {
    return true
  }

  // Required for non Kinesis coins only, so left unimplemented here
  public subscribeToTransactionConfirmationEvents(_transactionHash: string) {
    return Promise.resolve()
  }

  // Required for non Kinesis coins only, so left unimplemented here
  getTransaction(_transactionHash: string, _targetAddress: string) {
    return null as any
  }

  private generatePrivateKey() {
    return Keypair.random().secret()
  }

  public async balanceAt(address: string) {
    // If is invalid throw error
    Keypair.fromPublicKey(address)
    try {
      const acc = await this.getServer().loadAccount(address)
      return Number(acc.balances.find(({ asset_type }) => asset_type === 'native')!.balance)
    } catch (e) {
      return 0
    }
  }

  private getAddressFromPrivateKey(key: string) {
    return Keypair.fromSecret(key).publicKey()
  }

  public getId() {
    return getCurrencyId(this.ticker)
  }

  public async getDepositTransactions(address: string) {
    logger.debug(`Getting Deposit Transactions for ${this.ticker} at address: ${address} and `)
    try {
      const acc = await this.getServer().loadAccount(address)
      const allOperations = await this.getOperationsForAccount(acc)
      return allOperations.filter((op) => ['create_account', 'payment'].includes(op.type)).map(this.apiToDepositTransaction)
    } catch (error) {
      // We swallow this error as not to disrupt the deposits flow
      logger.debug(`Error with getting deposit transactions for currency ${this.ticker}. Message: ${error.message}`)
      return []
    }
  }

  /**  
    Recursively traverses the latest payment operations until the paging token 
    of the operations is larger than the paging token which we have previously recorder
  */  
  public async getLatestTransactions(
    lastRecorderPagingToken?: string,
    pagingToken?: string,
    transactionAcc: DepositTransaction[] = [],
  ): Promise<DepositTransaction[]> {
    const payments = await this.getServer()
      .payments()
      .order('desc')
      .limit(100)
      .cursor(pagingToken || '')
      .call()
    const newTransactions: PaymentOperationRecord[] = []

    if (transactionAcc.length > 0 
      && payments.records.length > 0
      && Number(lastRecorderPagingToken) > Number(payments.records[0].paging_token)
    ) {
      return newTransactions.map(this.apiToDepositTransaction)
    }

    for (const payment of payments.records) {
      if (payment.paging_token === lastRecorderPagingToken) {
        return transactionAcc.concat(newTransactions.map(this.apiToDepositTransaction))
      }

      newTransactions.push(payment)
    }

    const newTransactionDepositTransactions = newTransactions.map(this.apiToDepositTransaction)

    if (newTransactionDepositTransactions.length < 100) {
      return transactionAcc.concat(newTransactionDepositTransactions)
    }

    return this.getLatestTransactions(
      lastRecorderPagingToken,
      newTransactions[newTransactions.length - 1].paging_token,
      transactionAcc.concat(newTransactionDepositTransactions),
    )
  }

  public async getHoldingBalance() {
    const holdingsSecret = await this.getHoldingsSecret(this.ticker)
    const holdingAddress = this.getAddressFromPrivateKey(holdingsSecret)

    return this.balanceAt(holdingAddress)
  }

  public async checkConfirmationOfTransaction(txHash: string) {
    const transaction = await this.getServer().transactions().transaction(txHash).call()

    return !!transaction
  }

  public async createWithdrawalHoldingsTransactionEnvelope(
    amount: number,
    toAddress: string,
    memo: string,
    currentDbEmissionSequence: string,
  ): Promise<{ txEnvelope: string; nextSequenceNumber: string }> {
    logger.debug(`Creating withdrawal transaction envelope to address ${toAddress}`)
    const holdingsSecret = await this.getHoldingsSecret(this.ticker)

    const server = this.getServer()
    const sender = Keypair.fromSecret(holdingsSecret)

    const fee = await this.getFee(amount)
    const holdingsAccount = await server.loadAccount(sender.publicKey())

    logger.debug(`Holdings account sequence number: ${holdingsAccount.sequenceNumber()}. Current db sequence recorded: ${currentDbEmissionSequence}`)
    const nextSequenceNumber = new Decimal(currentDbEmissionSequence).plus(1).lessThanOrEqualTo(holdingsAccount.sequenceNumber())
      ? holdingsAccount.sequenceNumber()
      : new Decimal(currentDbEmissionSequence).plus(1).toString()
    logger.debug(`Next sequence number: ${nextSequenceNumber}`)

    const sequencedHoldingsAccount = new Account(holdingsAccount.accountId(), nextSequenceNumber.toString())

    const transaction = new TransactionBuilder(sequencedHoldingsAccount, {
      fee,
    })
      .addOperation(
        await server
          .loadAccount(toAddress)
          .then(() =>
            Operation.payment({
              amount: String(amount),
              destination: toAddress,
              asset: Asset.native(),
            }),
          )
          .catch(() => Operation.createAccount({ destination: toAddress, startingBalance: String(amount) })),
      )
      .addMemo(Memo.text(memo))
      .build()

    return {
      txEnvelope: transaction.toEnvelope().toXDR().toString('base64'),
      nextSequenceNumber,
    }
  }

  public async transferToExchangeHoldingsFrom({ privateKey }: CryptoAddress): Promise<TransactionResponse> {
    const server = this.getServer()
    const keypair = Keypair.fromSecret(privateKey)
    const toAddress = await this.getHoldingPublicAddress()

    const transaction = new TransactionBuilder(await server.loadAccount(keypair.publicKey()), {
      fee: '100',
    })
      .addOperation(Operation.accountMerge({ destination: toAddress }))
      .build()
    transaction.sign(keypair)

    logger.debug(`Submitting transaction from ${keypair.publicKey} to ${toAddress}`)

    let receipt
    try {
      receipt = await server.submitTransaction(transaction)
    } catch (e) {
      logger.error(`Submitting transaction from ${keypair.publicKey} to exchange holdings ${toAddress}, failed`)
      logger.error(`Error result codes: ${JSON.stringify(e.data.extras.result_codes)}`)

      throw e
    }

    return {
      txHash: receipt.hash as string,
      transactionFee: '0',
    }
  }

  public async transferFromExchangeHoldingsToEmissionsAccount(amount: number) {
    const emissionKeypair = this.getEmissionKeypair()

    return this.transferFromExchangeHoldingsTo({ toAddress: emissionKeypair.publicKey(), amount })
  }

  public async transferFromExchangeHoldingsTo({ toAddress, amount }: ExchangeHoldingsTransfer) {
    const holdingSecret = await this.getHoldingsSecret(this.ticker)
    const holdingSignerSecret = await this.getHoldingsSignerSecret(this.ticker)
    return this.transferTo({
      amount,
      privateKey: holdingSecret,
      toAddress,
      signerKey: holdingSignerSecret,
    })
  }

  public kinesisManagesConfirmations(): boolean {
    return true
  }

  public async transferFromExchangeHoldings(transactionEnvelope: string) {
    const holdingSignerSecret = await this.getHoldingsSignerSecret(this.ticker)

    const transaction = new Transaction(transactionEnvelope)
    const signer = Keypair.fromSecret(holdingSignerSecret)

    transaction.sign(signer)

    try {
      const receipt = await this.getServer().submitTransaction(transaction)

      return {
        txHash: receipt.hash as string,
        transactionFee: transaction.fee,
      }
    } catch (e) {
      logger.error(`An error has occurred while submitting a transaction: ${JSON.stringify(e.data)}`)
      logger.error(`Error result codes: ${JSON.stringify(e.data.extras.result_codes)}`)
      throw e
    }
  }

  public async transferTo({ privateKey, amount, toAddress, signerKey }) {
    const server = this.getServer()
    const sender = Keypair.fromSecret(privateKey)

    const fee = await this.getFee(amount)

    const transaction = new TransactionBuilder(await server.loadAccount(sender.publicKey()), {
      fee,
    })
      .addOperation(
        await server
          .loadAccount(toAddress)
          .then(() =>
            Operation.payment({
              amount: String(amount),
              destination: toAddress,
              asset: Asset.native(),
            }),
          )
          .catch(() => Operation.createAccount({ destination: toAddress, startingBalance: String(amount) })),
      )
      .build()

    if (signerKey) {
      const signer = Keypair.fromSecret(signerKey)
      transaction.sign(signer)
    } else {
      transaction.sign(sender)
    }

    const receipt = await server.submitTransaction(transaction).catch((e) => {
      console.error(e.data.extras.result_codes)
    })

    return {
      txHash: receipt.hash as string,
      transactionsFee: fee,
    }
  }

  public setNetwork() {
    Network.use(new Network(this.config.passphrase))
  }

  public validateAddress(address: string) {
    return Promise.resolve(StrKey.isValidEd25519PublicKey(address))
  }

  public async validateAddressIsNotContractAddress(_: string): Promise<boolean> {
    return true
  }

  /**
   * Decrypt CMK-encrypted holdings secrets
   * @param {string} privateKey - the private key to decrypt
   * @param {string} currencySecret - the private variable of currency the secret is decrypted of
   */
  public async getDecryptedHoldingsSecret(privateKey: string, currencySecret: string): Promise<string> {
    if (!currencySecret) {
      currencySecret = (await decryptValue(privateKey))!
    }

    return currencySecret
  }

  public async getHoldingPublicAddress(): Promise<string> {
    const holdingsSecret = await this.getHoldingsSecret(this.ticker)

    return Keypair.fromSecret(holdingsSecret).publicKey()
  }

  private async getFee(amount: number): Promise<string> {
    const server = this.getServer()
    const { base_percentage_fee, base_fee_in_stroops } = await server
      .ledgers()
      .order('desc')
      .call()
      .then((res) => res.records[0])

    const fee = new Decimal(amount).mul(base_percentage_fee).mul(this.STROOPS_IN_ONE_KINESIS).div(this.BASIS_POINTS_TO_PERCENT).toNumber()

    return String(Math.ceil(fee + base_fee_in_stroops))
  }

  private getServer() {
    this.setNetwork()
    return new Server(this.config.url)
  }

  public apiToDepositTransaction(operation: PaymentOperationRecord | CreateAccountOperationRecord): DepositTransaction {
    return {
      txHash: operation.transaction_hash,
      amount: operation.type === 'create_account' ? Number(operation.starting_balance) : Number(operation.amount),
      from: operation.type === 'create_account' ? operation.funder : operation.from,
      to: operation.type === 'create_account' ? (operation as CreateAccountOperationRecord).account : operation.to!,
      pagingToken: operation.paging_token,
    }
  }

  private async getOperationsForAccount(acc: AccountResponse) {
    const firstPage = await acc.operations({ order: 'desc', limit: 100 })
    const isLastPageOrLastSeenTransactionHashFound = (ops: CollectionPage<OperationRecord>) => ops.records.some((op) => op.type === 'create_account')

    const getAllOperationsSinceLastWithdrawal = async (
      page: CollectionPage<OperationRecord>,
      allRecords: OperationRecord[] = [],
    ): Promise<OperationRecord[]> =>
      isLastPageOrLastSeenTransactionHashFound(page)
        ? allRecords.concat(page.records)
        : getAllOperationsSinceLastWithdrawal(await page.next(), allRecords.concat(page.records))

    return getAllOperationsSinceLastWithdrawal(firstPage)
  }

  private async getHoldingsSecret(ticker: string): Promise<string> {
    if (ticker === CurrencyCode.kau) {
      return this.getDecryptedHoldingsSecret(process.env.KAU_HOLDINGS_SECRET!, this.decryptedKauHoldingsSecret)
    }

    return this.getDecryptedHoldingsSecret(process.env.KAG_HOLDINGS_SECRET!, this.decryptedKagHoldingsSecret)
  }

  private async getHoldingsSignerSecret(ticker: string): Promise<string> {
    if (ticker === CurrencyCode.kau) {
      return this.getDecryptedHoldingsSecret(process.env.KAU_HOLDINGS_SIGNER_SECRET!, this.decryptedKauHoldingsSignerSecret)
    }

    return this.getDecryptedHoldingsSecret(process.env.KAG_HOLDINGS_SIGNER_SECRET!, this.decryptedKagHoldingsSignerSecret)
  }

  private getEmissionKeypair(): Keypair {
    this.setNetwork()
    const feeSeedString = `${Network.current().networkPassphrase()}emission`
    const hash = createHash('sha256')
    hash.update(feeSeedString)

    return Keypair.fromRawEd25519Seed(hash.digest())
  }
}
