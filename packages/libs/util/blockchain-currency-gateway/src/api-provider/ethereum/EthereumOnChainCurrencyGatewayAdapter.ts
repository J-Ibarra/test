import { OnChainCurrencyGateway, DepositTransaction, TransactionResponse } from '../../currency_gateway'
import { CurrencyCode } from '@abx-types/reference-data'
import { getCurrencyId } from '@abx-service-clients/reference-data'
import { RuntimeError } from '@abx-types/error'
import { EthereumBlockchainFacade, ERC_20BlockchainFacade } from './EthereumBlockchainFacade'
import { CryptoAddress } from '../model'
import { DepositAddress } from '@abx-types/deposit'
import { Logger } from '@abx-utils/logging'
import { IAddressTransactionEth } from '../providers/crypto-apis'
​
​
/** Adapting the {@linkEthereumBlockchainFacade} to {@link OnChainCurrencyGateway} for backwards-compatibility. */
export class EthereumOnChainCurrencyGatewayAdapter implements OnChainCurrencyGateway {
    ticker: CurrencyCode.ethereum
    logger = Logger.getInstance('blockchain-currency-gateway', 'EthereumOnChainCurrencyGatewayAdapter')
  
    private ethereumBlockchainFacade: EthereumBlockchainFacade
  
    constructor() {
      this.ethereumBlockchainFacade = new EthereumBlockchainFacade()
    }
  
    getId(): Promise<number> {
      return getCurrencyId(this.ticker)
    }
​
    generateAddress(): Promise<CryptoAddress> {
        return this.ethereumBlockchainFacade.generateAddress()
      }
​
      async addressEventListener(publicKey: string): Promise<IAddressTransactionEth> {
        return this.ethereumBlockchainFacade.addressEventListener(publicKey)
      }
​
        // This returns a string due to JS floats
  balanceAt(address: string): Promise<number> {
    return this.ethereumBlockchainFacade.balanceAt(address)
  }
​
  getDepositTransactions(): Promise<DepositTransaction[]> {
    throw new RuntimeError('Unsupported operation getDepositTransactions')
  }
​
  getLatestTransactions(): Promise<DepositTransaction[]> {
    throw new RuntimeError('Unsupported operation getLatestTransactions')
  }
​
  getHoldingBalance(): Promise<number> {
    return this.ethereumBlockchainFacade.balanceAt(process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!)
  }
​
  getHoldingPublicAddress(): Promise<string> {
    return Promise.resolve(process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!)
  }
​
  checkConfirmationOfTransaction(): Promise<boolean> {
    throw new RuntimeError('Unsupported operation checkConfirmationOfTransaction')
  }
​
  transferToExchangeHoldingsFrom(): Promise<TransactionResponse> {
    throw new RuntimeError('Unsupported operation transferToExchangeHoldingsFrom')
  }
​
  transferFromExchangeHoldingsTo(toAddress: string, value: number, transactionConfirmationWebhookUrl: string): Promise<TransactionResponse> {
    return this.ethereumBlockchainFacade.createTransaction({
        fromAddress: {
        privateKey: process.env.KINESIS_BITCOIN_HOLDINGS_SECRET!,
        address: process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!,
        wif: process.env.KINESIS_BITCOIN_HOLDINGS_WIF!,
      },
      toAddress: toAddress,
      value,
      webhookCallbackUrl: transactionConfirmationWebhookUrl,
    })
  }
​
  transferTo(): Promise<TransactionResponse> {
    throw new RuntimeError(`Unsupported operation transferTo`)
  }
​
  validateAddress(address: string): Promise<boolean> {
    return this.ethereumBlockchainFacade.validateAddress(address)
  }
​
  validateAddressIsNotContractAddress(address: string): Promise<boolean> {
    return this.ethereumBlockchainFacade.validateAddressIsNotContractAddress(address)
  }
​
  getDecryptedHoldingsSecret(): Promise<string> {
    throw new RuntimeError(`Unsupported operation getDecryptedHoldingsSecret`)
  }
    
​
}

/** Adapting the {@linkEthereumBlockchainFacade} to {@link OnChainCurrencyGateway} for backwards-compatibility. */
export class Erc_20OnChainCurrencyGatewayAdapter implements OnChainCurrencyGateway {
  ticker: CurrencyCode.ethereum
  logger = Logger.getInstance('blockchain-currency-gateway', 'EthereumOnChainCurrencyGatewayAdapter')

  private ERC_20BlockchainFacade: ERC_20BlockchainFacade

  constructor() {
    this.ERC_20BlockchainFacade = new ERC_20BlockchainFacade()
  }

  getId(): Promise<number> {
    return getCurrencyId(this.ticker)
  }
​
  generateAddress(): Promise<CryptoAddress> {
      return this.ethereumBlockchainFacade.generateAddress()
    }
​
    async addressEventListener(publicKey: string): Promise<IAddressTransactionEth> {
      return this.ERC_20BlockchainFacade.addressEventListener(publicKey)
    }
​
      // This returns a string due to JS floats
balanceAt(address: string, contract: string): Promise<number> {
  return this.ERC_20BlockchainFacade.balanceAt(address, contract!)
}
​
getDepositTransactions(): Promise<DepositTransaction[]> {
  throw new RuntimeError('Unsupported operation getDepositTransactions')
}
​
getLatestTransactions(): Promise<DepositTransaction[]> {
  throw new RuntimeError('Unsupported operation getLatestTransactions')
}
​
getHoldingBalance(): Promise<number> {
  return this.ERC_20BlockchainFacade.balanceAt(process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!, contract) // Revisar
}
​
getHoldingPublicAddress(): Promise<string> {
  return Promise.resolve(process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!)
}
​
checkConfirmationOfTransaction(): Promise<boolean> {
  throw new RuntimeError('Unsupported operation checkConfirmationOfTransaction')
}
​
transferToExchangeHoldingsFrom(): Promise<TransactionResponse> {
  throw new RuntimeError('Unsupported operation transferToExchangeHoldingsFrom')
}
​
transferFromExchangeHoldingsTo(toAddress: string, value: number, transactionConfirmationWebhookUrl: string): Promise<TransactionResponse> {
  return this.ethereumBlockchainFacade.createTransaction({
      fromAddress: {
      privateKey: process.env.KINESIS_BITCOIN_HOLDINGS_SECRET!,
      address: process.env.KINESIS_BITCOIN_HOLDINGS_ADDRESS!,
      wif: process.env.KINESIS_BITCOIN_HOLDINGS_WIF!,
    },
    toAddress: toAddress,
    value,
    webhookCallbackUrl: transactionConfirmationWebhookUrl,
  })
}
​
transferTo(): Promise<TransactionResponse> {
  throw new RuntimeError(`Unsupported operation transferTo`)
}
​
validateAddress(address: string): Promise<boolean> {
  return this.ethereumBlockchainFacade.validateAddress(address)
}
​
validateAddressIsNotContractAddress(address: string): Promise<boolean> {
  return this.ethereumBlockchainFacade.validateAddressIsNotContractAddress(address)
}
​
getDecryptedHoldingsSecret(): Promise<string> {
  throw new RuntimeError(`Unsupported operation getDecryptedHoldingsSecret`)
}
  
​
}