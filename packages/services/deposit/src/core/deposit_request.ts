import { flatMap } from 'lodash'
import { Transaction } from 'sequelize'
import { getModel } from '@abx-utils/db-connection-utils'
import { CurrencyCode, CryptoCurrency, Currency } from '@abx-types/reference-data'
import { findCurrencyForCodes } from '@abx-service-clients/reference-data'
import { DepositAddress, DepositRequest, DepositRequestStatus } from '@abx-types/deposit'
import { getMinimumDepositAmountForCurrency } from './deposit_amount_validator'

let cachedCryptoCurrencies: Currency[] = []

export async function storeDepositRequests(deposits: DepositRequest[], transaction?: Transaction): Promise<DepositRequest[]> {
  const depositAddressIdToDepositAddress: Map<number, DepositAddress> = deposits.reduce(
    (idToDepsitAddress, request) => idToDepsitAddress.set(request.depositAddress.id, request.depositAddress),
    new Map(),
  )

  const depositRequestInstances = await getModel<DepositRequest>('depositRequest').bulkCreate(
    deposits.map(depositRequest => ({
      ...depositRequest,
      depositAddressId: depositRequest.depositAddress.id,
    })),
    { transaction, returning: true },
  )

  return depositRequestInstances.map(requestInstance => {
    const persistedDepositRequest = requestInstance.get({ plain: true })

    return {
      ...persistedDepositRequest,
      depositAddress: depositAddressIdToDepositAddress.get(persistedDepositRequest.depositAddressId!)!,
    }
  })
}

export async function getAllDepositRequests(query: Partial<DepositRequest>, parentTransaction?: Transaction): Promise<DepositRequest[]> {
  const depositInstances = await getModel<DepositRequest>('depositRequest').findAll({
    where: query as any,
    include: [
      {
        model: getModel<DepositAddress>('depositAddress'),
      },
    ],
    transaction: parentTransaction,
  })

  return depositInstances.map(req => req.get({ plain: true }))
}

export async function loadAllPendingDepositRequestsAboveMinimumAmount(): Promise<DepositRequest[]> {
  if (cachedCryptoCurrencies.length === 0) {
    cachedCryptoCurrencies = await findCurrencyForCodes(Object.values(CryptoCurrency) as any)
  }

  const depositRequestsForAllCurrenciesPromise = cachedCryptoCurrencies.map(cryptoCurrency =>
    getAllPendingDepositRequestsForCurrencyAboveMinimumAmount(cryptoCurrency),
  )

  const depositRequestsForAllCurrencies = await Promise.all(depositRequestsForAllCurrenciesPromise)

  return flatMap(depositRequestsForAllCurrencies, requests => requests)
}

export async function getAllPendingDepositRequestsForCurrencyAboveMinimumAmount(
  currency: Currency,
  parentTransaction?: Transaction,
): Promise<DepositRequest[]> {
  const depositInstances = await getModel<DepositRequest>('depositRequest').findAll({
    where: {
      amount: { $gte: getMinimumDepositAmountForCurrency(currency.code) },
      status: DepositRequestStatus.pendingHoldingsTransaction,
    },
    include: [
      {
        model: getModel<DepositAddress>('depositAddress'),
        where: { currencyId: currency.id },
      },
    ],
    transaction: parentTransaction,
  })

  return depositInstances.map(req => req.get({ plain: true }))
}

export async function findMostRecentlyUpdatedDepositRequest(
  where: Partial<DepositRequest>,
  parentTransaction?: Transaction,
): Promise<DepositRequest | null> {
  const depositInstance = await getModel<DepositRequest>('depositRequest').findOne({
    where: where as any,
    include: [
      {
        model: getModel<DepositAddress>('depositAddress'),
      },
    ],
    transaction: parentTransaction,
    order: [['updatedAt', 'DESC']],
  })

  return depositInstance ? depositInstance.get({ plain: true }) : null
}

export async function getPendingDepositRequests(currencyId: number, parentTransaction?: Transaction) {
  const depositInstances = await getModel<DepositRequest>('depositRequest').findAll({
    include: [
      {
        model: getModel<DepositAddress>('depositAddress'),
        where: { currencyId },
      },
    ],
    transaction: parentTransaction,
  })

  return depositInstances.map(req => req.get({ plain: true }))
}

export async function getPersistedPendingDepositRequests(ids: number[], parentTransaction?: Transaction) {
  const depositInstances = await getModel<DepositRequest>('depositRequest').findAll({
    where: { isConfirmed: false, id: ids },
    include: [getModel<DepositAddress>('depositAddress')],
    transaction: parentTransaction,
    limit: 100,
  })

  return depositInstances.map(req => req.get({ plain: true }))
}

export async function getDepositRequestsForAccount(accountId: string) {
  const requests = await getModel<DepositRequest>('depositRequest').findAll({
    include: [
      {
        model: getModel<DepositAddress>('depositAddress'),
        where: { accountId },
      },
    ],
  })
  return requests.map(req => req.get())
}

export async function findDepositRequestById(id: number): Promise<DepositRequest | null> {
  const depositRequest = await getModel<DepositRequest>('depositRequest').findOne({
    where: { id },
    include: [getModel<DepositAddress>('depositAddress')],
  })

  return !!depositRequest ? depositRequest.get({ plain: true }) : null
}

export async function findDepositAddressForIds(ids: number[]): Promise<DepositRequest[]> {
  const depositRequests = await getModel<DepositRequest>('depositRequest').findAll({
    where: { id: { $in: ids } },
    include: [getModel<DepositAddress>('depositAddress')],
  })

  return depositRequests.map(depositRequestInstance => depositRequestInstance.get())
}

export async function updateAllDepositRequests(id: number[], update: Partial<DepositRequest>, transaction: Transaction) {
  const [, updatedDepositRequests] = await getModel<DepositRequest>('depositRequest').update({ ...update } as DepositRequest, {
    where: { id },
    returning: true,
    transaction,
  })

  return updatedDepositRequests.map(updatedDepositRequest => updatedDepositRequest.get())
}

export async function updateDepositRequest(id: number, update: Partial<DepositRequest>, transaction?: Transaction) {
  const [, [confirmedDeposit]] = await getModel<DepositRequest>('depositRequest').update({ ...update } as DepositRequest, {
    where: { id },
    returning: true,
    transaction,
  })

  return confirmedDeposit && confirmedDeposit.get()
}

export function getDepositMinimumForCurrency(currency: CurrencyCode): number {
  switch (currency) {
    case CurrencyCode.ethereum:
      return 0.00042 // The max gas price set for 'fast' transaction
    default:
      return 0
  }
}