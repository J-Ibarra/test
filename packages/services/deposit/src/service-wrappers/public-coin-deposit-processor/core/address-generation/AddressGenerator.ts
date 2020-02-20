import { CurrencyCode, Currency } from '@abx-types/reference-data'
import { DepositAddress } from '@abx-types/deposit'
import { Logger } from '@abx-utils/logging'
import { findDepositAddressesForAccount, storeDepositAddress, findDepositAddress } from '../../../../core'
import { BlockchainFacade, CryptoAddress, IAddressTransaction } from '@abx-utils/blockchain-currency-gateway'
import { findCurrencyForCode } from '@abx-service-clients/reference-data'
import { encryptValue } from '@abx-utils/encryption'
import { ValidationError } from '@abx-types/error'

export class AddressGenerator {
  private logger = Logger.getInstance('public-coin-deposit-processor', 'AddressGenerator')

  async addAddressTransactionListener(accountId: string, { id, code }: Currency): Promise<IAddressTransaction> {
    const addressDetails = await findDepositAddress({ currencyId: id, accountId })

    if (!addressDetails) {
      this.logger.debug(`Attempted to create address transaction subscription for account ${accountId} and code ${code}`)

      throw new ValidationError(`Currency address not not found: ${code}`)
    } else if (!addressDetails.address) {
      this.logger.debug(`Attempted to create address transaction subscription for currency ${code}`)

      throw new ValidationError(`Address transaction subscriptions no supported for ${code}`)
    }

    this.logger.debug(`Found address id to listen on : ${addressDetails.id}`)

    const blockchainFacade = BlockchainFacade.getInstance(code)
    return blockchainFacade.subscribeToAddressTransactionEvents(addressDetails.address!, 1)
  }

  async generateDepositAddress(accountId: string, currencyTicker: CurrencyCode): Promise<DepositAddress> {
    const [depositAddresses, currency] = await Promise.all([findDepositAddressesForAccount(accountId), findCurrencyForCode(currencyTicker)])

    const currencyAddress = depositAddresses.find(({ currencyId }) => currencyId === currency.id)

    if (!!currencyAddress) {
      return currencyAddress
    }

    this.logger.debug(`Generating crypto address for ${currencyTicker} and account ${accountId}`)

    const generatedAddress = await this.generateAddress(currencyTicker)
    return this.storeAddress(accountId, generatedAddress, currencyTicker)
  }

  private generateAddress(currencyTicker: CurrencyCode): Promise<CryptoAddress> {
    const blockchainFacade = BlockchainFacade.getInstance(currencyTicker)

    return blockchainFacade.generateAddress()
  }

  private async storeAddress(accountId: string, generatedAddress: CryptoAddress, currencyTicker: CurrencyCode): Promise<DepositAddress> {
    const encryptedAddress = await this.encryptAddressDetails(generatedAddress)

    const currency = await findCurrencyForCode(currencyTicker)

    return storeDepositAddress({
      accountId,
      currencyId: currency.id,
      address: encryptedAddress.address,
      encryptedWif: encryptedAddress.wif!,
      publicKey: encryptedAddress.publicKey,
      encryptedPrivateKey: encryptedAddress.privateKey,
      activated: false,
    })
  }

  private async encryptAddressDetails(address: CryptoAddress): Promise<CryptoAddress> {
    const [encryptedWif, encryptedPrivateKey] = await Promise.all([encryptValue(address.wif!), encryptValue(address.privateKey!)])

    return {
      ...address,
      wif: encryptedWif,
      privateKey: encryptedPrivateKey,
    }
  }
}
