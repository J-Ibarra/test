import { Body, Controller, Get, Post, Request, Route, Security, SuccessResponse } from 'tsoa'

import { initialiseWithdrawal, CryptoWithdrawalGatekeeper, prepareWithdrawalRequestEmail, PENDING_WITHDRAWAL_GATEKEEPER_NAME } from '../core'
import { Logger } from '@abx-utils/logging'
import { createEmail } from '@abx-service-clients/notification'
import { getWithdrawalConfig, getWithdrawalConfigForCurrency, isFiatCurrency } from '@abx-service-clients/reference-data'
import { OverloadedRequest } from '@abx-types/account'
import { CurrencyCode } from '@abx-types/reference-data'
import { WithdrawalRequestParams } from '@abx-types/withdrawal'

@Route('/withdrawals')
export class WithdrawalsController extends Controller {
  private logger = Logger.getInstance('api', 'WithdrawalsController')
  private withdrawalGatekeeper = CryptoWithdrawalGatekeeper.getSingletonInstance(PENDING_WITHDRAWAL_GATEKEEPER_NAME)

  @Security('cookieAuth')
  @Security('tokenAuth')
  @SuccessResponse('201', 'Created')
  @Post()
  public async initialiseWithdrawal(@Request() request: OverloadedRequest, @Body() withdrawalParams: WithdrawalRequestParams) {
    const { user, account } = request

    try {
      await initialiseWithdrawal(
        {
          ...withdrawalParams,
          accountId: account!.id,
        },
        this.withdrawalGatekeeper,
      )

      if (isFiatCurrency(withdrawalParams.currencyCode)) {
        const withdrawalRequestEmailParams = await prepareWithdrawalRequestEmail(user, account!.hin!, {
          currency: withdrawalParams.currencyCode,
          amount: withdrawalParams.amount,
        })

        await createEmail(withdrawalRequestEmailParams)
      }

      return this.setStatus(201)
    } catch (error) {
      if (error.context && error.context.name === 'FatalError') {
        this.setStatus(500)

        return {
          message: error.message,
        }
      }

      this.setStatus(error.status || 400)

      return { message: error.message as string, context: error.context }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/configs')
  public async getWithdrawalConfigs() {
    try {
      this.logger.debug(`Retrieving withdrawal fees for all currencies`)
      return getWithdrawalConfig()
    } catch (error) {
      this.setStatus(error.status || 400)
      this.logger.error(`Retrieving withdrawal fees for all currencies errors: ${error.status || 400} - ${error.message}`)
      return {
        message: error.message as string,
      }
    }
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/configs/{currency}')
  public async getWithdrawalConfigForCurrency(currency: CurrencyCode) {
    try {
      this.logger.debug(`Retrieving withdrawal fees for ${currency}`)
      return getWithdrawalConfigForCurrency({ currencyCode: currency })
    } catch (error) {
      this.setStatus(error.status || 400)
      this.logger.error(`Retrieving withdrawal fees for ${currency} errors: ${error.status || 400} - ${error.message}`)
      return {
        message: error.message as string,
      }
    }
  }
}
