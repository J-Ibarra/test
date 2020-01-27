import moment from 'moment'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { DepositRequest, DepositRequestStatus, LockableDepositRequest } from '@abx-types/deposit'
import { getAllDepositRequests } from '../../../../core'
import { findAllCurrencies } from '@abx-service-clients/reference-data'

const logger = Logger.getInstance('deposits', 'DepositGatekeeper')

export class DepositGatekeeper {
  private currencyToDepositRequests: Map<CurrencyCode, LockableDepositRequest[]> = new Map()

  constructor(private gatekeeperName: string) {}

  public getNewestDepositForCurrency(currencyCode: CurrencyCode): DepositRequest | null {
    const newestDepositNotBeingProcessed = (this.currencyToDepositRequests.get(currencyCode) || []).find(
      ({ isLocked, lockedUntil }) => !isLocked && (!lockedUntil || moment().isAfter(lockedUntil)),
    )

    if (!!newestDepositNotBeingProcessed) {
      logger.info(
        `Locking request ${JSON.stringify(newestDepositNotBeingProcessed.request)} for currency ${currencyCode} in ${this.gatekeeperName} gatekeeper`,
      )
      newestDepositNotBeingProcessed.isLocked = true

      return newestDepositNotBeingProcessed.request
    }

    return null
  }

  public getAllDepositsForCurrency(currencyCode: CurrencyCode): DepositRequest[] {
    const deposits = this.currencyToDepositRequests.get(currencyCode) || []

    return deposits.map(deposit => deposit.request)
  }

  public addNewDepositsForCurrency(currencyCode: CurrencyCode, depositRequests: DepositRequest[], initialLockSeconds?: number) {
    logger.info(`Adding ${depositRequests.length} new deposits for currency ${currencyCode} in ${this.gatekeeperName} gatekeeper`)
    const currentDepositRequestForCurrency = this.currencyToDepositRequests.get(currencyCode) || []

    this.currencyToDepositRequests.set(
      currencyCode,
      currentDepositRequestForCurrency.concat(
        depositRequests.map(
          newDepositRequest =>
            ({
              request: newDepositRequest,
              isLocked: false,
              lockedUntil: initialLockSeconds
                ? moment()
                    .add(initialLockSeconds, 'seconds')
                    .toDate()
                : null,
            } as LockableDepositRequest),
        ),
      ),
    )
  }

  public unlockRequest(currencyCode: CurrencyCode, requestId: number) {
    logger.info(`Unlocking request ${requestId} for currency ${currencyCode} in ${this.gatekeeperName} gatekeeper`)
    const lockableDepositRequest = (this.currencyToDepositRequests.get(currencyCode) || []).find(({ request }) => request.id === requestId)

    if (lockableDepositRequest) {
      lockableDepositRequest.isLocked = false
    }
  }

  public removeRequest(currencyCode: CurrencyCode, requestId: number) {
    logger.info(`Removing request ${requestId} for currency ${currencyCode} in ${this.gatekeeperName} gatekeeper`)
    const requestsForCurrency = this.currencyToDepositRequests.get(currencyCode) || []

    this.currencyToDepositRequests.set(
      currencyCode,
      requestsForCurrency.filter(({ request }) => request.id !== requestId),
    )
  }

  /** Executed on service startup */
  public async loadGatekeeper(status: DepositRequestStatus, retrieveDeposits = () => getAllDepositRequests({ status })) {
    const pendingDepositRequests = await retrieveDeposits()
    const currencies = await findAllCurrencies()

    const currencyIdToCurrency = currencies.reduce(
      (idToCurrencyCode, currency) => idToCurrencyCode.set(currency.id, currency.code),
      new Map<number, CurrencyCode>(),
    )

    this.currencyToDepositRequests = pendingDepositRequests.reduce((currencyCodeToDepositRequests, pendingDeposit) => {
      const currencyCode = currencyIdToCurrency.get(pendingDeposit.depositAddress.currencyId)!
      const depositsForCurrency = currencyCodeToDepositRequests.get(currencyCode) || []

      const lockableDepositRequest = {
        request: pendingDeposit,
        isLocked: false,
      }

      return currencyCodeToDepositRequests.set(currencyCode, depositsForCurrency.concat(lockableDepositRequest))
    }, new Map<CurrencyCode, LockableDepositRequest[]>())
  }
}
