import moment from 'moment'

import { Logger } from '@abx-utils/logging'
import { CurrencyCode, Currency } from '@abx-types/reference-data'
import {
  LockableWithdrawalRequest,
  WithdrawalRequest,
  WithdrawalRequestType,
  WithdrawalState,
  WithdrawalWithFeeRequestPair,
  CurrencyEnrichedWithdrawalRequest,
} from '@abx-types/withdrawal'
import { findWithdrawalRequests } from '../lib'
import { findAllCurrencies } from '@abx-service-clients/reference-data'

const logger = Logger.getInstance('withdrawals', 'CryptoWithdrawalGatekeeper')
export const PENDING_WITHDRAWAL_GATEKEEPER_NAME = 'pending withdrawal transfer'

export class CryptoWithdrawalGatekeeper {
  private static gatekeeperNameToGatekeeper: Record<string, CryptoWithdrawalGatekeeper | null>
  private currencyToWithdrawalRequests: Map<CurrencyCode, LockableWithdrawalRequest[]> = new Map()

  constructor(private gatekeeperName: string) {}

  public static getSingletonInstance(gatekeeperName: string): CryptoWithdrawalGatekeeper {
    if (!CryptoWithdrawalGatekeeper.gatekeeperNameToGatekeeper[gatekeeperName]) {
      CryptoWithdrawalGatekeeper.gatekeeperNameToGatekeeper[gatekeeperName] = new CryptoWithdrawalGatekeeper(gatekeeperName)
      return CryptoWithdrawalGatekeeper.gatekeeperNameToGatekeeper[gatekeeperName]!
    }

    return CryptoWithdrawalGatekeeper.gatekeeperNameToGatekeeper[gatekeeperName]!
  }

  public getLatestWithdrawalForCurrency(currencyCode: CurrencyCode): WithdrawalWithFeeRequestPair | null {
    const latestWithdrawalNotBeingProcessed = (this.currencyToWithdrawalRequests.get(currencyCode) || []).find(
      ({ isLocked, lockedUntil }) => !isLocked && (!lockedUntil || moment().isAfter(lockedUntil)),
    )

    if (!!latestWithdrawalNotBeingProcessed) {
      logger.info(
        `Locking request ${latestWithdrawalNotBeingProcessed.withdrawalRequest.id} for currency ${currencyCode} in ${this.gatekeeperName} gatekeeper`,
      )
      latestWithdrawalNotBeingProcessed.isLocked = true

      return {
        withdrawalRequest: latestWithdrawalNotBeingProcessed.withdrawalRequest,
        feeRequest: latestWithdrawalNotBeingProcessed.feeRequest,
      }
    }

    return null
  }

  public addNewWithdrawalRequestForCurrency(
    currencyCode: CurrencyCode,
    { withdrawalRequest, feeRequest }: WithdrawalWithFeeRequestPair,
    initialLockSeconds?: number,
  ) {
    logger.info(
      `Adding withdrawal request for currency ${withdrawalRequest.currency.code} ${currencyCode} for account ${withdrawalRequest.accountId} in ${this.gatekeeperName} gatekeeper`,
    )
    const currentWithdrawalRequestsForCurrency = this.currencyToWithdrawalRequests.get(currencyCode) || []

    this.currencyToWithdrawalRequests.set(
      currencyCode,
      currentWithdrawalRequestsForCurrency.concat({
        withdrawalRequest,
        feeRequest: feeRequest || undefined,
        isLocked: false,
        lockedUntil: initialLockSeconds
          ? moment()
              .add(initialLockSeconds, 'seconds')
              .toDate()
          : undefined,
      }),
    )
  }

  public unlockRequest(currencyCode: CurrencyCode, requestId: number) {
    logger.info(`Unlocking request withdrawal ${requestId} for currency ${currencyCode} in ${this.gatekeeperName} gatekeeper`)
    const lockableWithdrawalRequest = (this.currencyToWithdrawalRequests.get(currencyCode) || []).find(
      ({ withdrawalRequest }) => withdrawalRequest.id === requestId,
    )

    if (!!lockableWithdrawalRequest) {
      lockableWithdrawalRequest.isLocked = false
    } else {
      logger.warn(`Request with id ${requestId} not found in ${this.gatekeeperName} gatekeeper`)
    }
  }

  public removeRequest(currencyCode: CurrencyCode, requestId: number) {
    logger.info(`Removing request ${requestId} for currency ${currencyCode} in ${this.gatekeeperName} gatekeeper`)
    const requestsForCurrency = this.currencyToWithdrawalRequests.get(currencyCode) || []

    this.currencyToWithdrawalRequests.set(
      currencyCode,
      requestsForCurrency.filter(({ withdrawalRequest }) => withdrawalRequest.id !== requestId),
    )
  }

  /** Executed on service startup */
  public async loadGatekeeper(state: WithdrawalState) {
    const withdrawalRequests = await findWithdrawalRequests({ state })
    const currencies = await findAllCurrencies()

    const currencyEnrichedWithdrawalRequests = this.addCurrencyDetailsToWithdrawalRequests(withdrawalRequests, currencies)
    logger.info(`${withdrawalRequests.length} requests loaded in ${this.gatekeeperName}`)

    const groupedWithdrawalAndFeeRequests = this.groupWithdrawalAndFeeRequests(currencyEnrichedWithdrawalRequests)
    logger.info(`Grouped requests: ${groupedWithdrawalAndFeeRequests}`)

    this.currencyToWithdrawalRequests = groupedWithdrawalAndFeeRequests.reduce(
      (currencyCodeToWithdrawalRequests, { withdrawalRequest, feeRequest }) => {
        const currencyCode = withdrawalRequest.currency.code
        const withdrawalsForCurrency = currencyCodeToWithdrawalRequests.get(currencyCode) || []

        return currencyCodeToWithdrawalRequests.set(
          currencyCode,
          withdrawalsForCurrency.concat({
            withdrawalRequest,
            feeRequest: feeRequest || undefined,
            isLocked: false,
          }),
        )
      },
      new Map<CurrencyCode, LockableWithdrawalRequest[]>(),
    )
  }

  private groupWithdrawalAndFeeRequests(withdrawalRequests: CurrencyEnrichedWithdrawalRequest[]): WithdrawalWithFeeRequestPair[] {
    const nonFeeWithdrawalRequests = withdrawalRequests.filter(({ type }) => type === WithdrawalRequestType.withdrawal)

    return nonFeeWithdrawalRequests.map(withdrawalRequest => ({
      withdrawalRequest,
      feeRequest: withdrawalRequests.find(
        ({ type, createdAt, currencyId }) =>
          type === WithdrawalRequestType.fee && createdAt === withdrawalRequest.createdAt && currencyId === withdrawalRequest.feeCurrencyId,
      ),
    }))
  }

  private addCurrencyDetailsToWithdrawalRequests(
    withdrawalRequests: WithdrawalRequest[],
    currencies: Currency[],
  ): CurrencyEnrichedWithdrawalRequest[] {
    const idToCurrency = currencies.reduce((acc, currency) => acc.set(currency.id, currency.code), new Map<number, CurrencyCode>())

    return withdrawalRequests.reduce(
      (acc, withdrawalRequest) =>
        acc.concat({
          ...withdrawalRequest,
          currency: { id: withdrawalRequest.currencyId, code: idToCurrency.get(withdrawalRequest.currencyId)! },
          feeCurrency: withdrawalRequest.feeCurrencyId
            ? { id: withdrawalRequest.feeCurrencyId, code: idToCurrency.get(withdrawalRequest.feeCurrencyId)! }
            : undefined,
        }),
      [] as CurrencyEnrichedWithdrawalRequest[],
    )
  }
}
