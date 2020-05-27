import { findCurrencyForCode } from '@abx-service-clients/reference-data'
import { findDepositAddress, countERC20AddressesWithTransactionTracking } from './data-access/deposit_address_query_handler'
import { SymbolPairStateFilter, CurrencyCode, Environment } from '@abx-types/reference-data'
import { ValidationError } from '@abx-types/error'
import { getOnChainCurrencyManagerForEnvironment } from '@abx-utils/blockchain-currency-gateway'
import { updateDepositAddress } from './data-access/deposit_address_update_handler'
import { DepositAddress } from '@abx-types/deposit'
import { Logger } from '@abx-utils/logging'
import { Account } from '@abx-types/account'
import { isERC20Token } from '@abx-service-clients/reference-data'
import { wrapInTransaction, sequelize } from '@abx-utils/db-connection-utils'

const logger = Logger.getInstance('deposit', 'deposit_address_notifications')

export const registerForDepositAddressTransactionNotifications = async ({ id }: Account, currencyCode: CurrencyCode): Promise<DepositAddress> => {
  const { id: currencyId } = await findCurrencyForCode(currencyCode, SymbolPairStateFilter.all)

  return wrapInTransaction(sequelize, null, async (transaction) => {
    const depositAddress = await findDepositAddress({ query: { accountId: id, currencyId }, transaction, usePessimisticLock: true })

    if (!depositAddress) {
      throw new ValidationError(`Deposit address does not exist for currency id: ${currencyId} and account id: ${id}`)
    }

    if (depositAddress.transactionTrackingActivated) {
      logger.debug(`Deposit address transaction tracking already activated for currency id: ${currencyId} and account id: ${id}`)
      return depositAddress
    }

    const shouldCreateAddressSubscription = await checkIfAddressListenerShouldBeGenerated(id, currencyCode)
    if (!shouldCreateAddressSubscription) {
      const updatedDepositAddress = await updateDepositAddress({ ...depositAddress, transactionTrackingActivated: true })

      return updatedDepositAddress
    }

    const manager = getOnChainCurrencyManagerForEnvironment(process.env.NODE_ENV as Environment)

    const successfulEventCreation = await manager.getCurrencyFromTicker(currencyCode).createAddressTransactionSubscription(depositAddress)
    const updatedDepositAddress = await updateDepositAddress(
      { ...depositAddress, transactionTrackingActivated: successfulEventCreation },
      transaction,
    )

    return updatedDepositAddress
  })
}

async function checkIfAddressListenerShouldBeGenerated(accountId: string, currency: CurrencyCode) {
  if (isERC20Token(currency)) {
    const erc20TokenDepositAddressesWithSubscription = await countERC20AddressesWithTransactionTracking(accountId)

    return erc20TokenDepositAddressesWithSubscription === 0
  }

  return true
}
