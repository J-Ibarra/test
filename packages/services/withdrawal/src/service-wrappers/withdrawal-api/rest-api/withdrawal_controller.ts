import { Body, Controller, Get, Post, Request, Route, Security, SuccessResponse, Tags } from 'tsoa'

import { prepareWithdrawalRequestEmail, checkForNonCompletedWithdrawalRequests } from '../../../core'
import { Logger } from '@abx-utils/logging'
import { createEmail } from '@abx-service-clients/notification'
import {
  getWithdrawalConfig,
  getWithdrawalConfigForCurrency,
  isFiatCurrency,
  updateWithdrawalConfigForCurrency,
} from '@abx-service-clients/reference-data'
import { OverloadedRequest } from '@abx-types/account'
import { CurrencyCode, CurrencyWithdrawalConfig } from '@abx-types/reference-data'
import { WithdrawalRequestParams } from '@abx-types/withdrawal'
import { initialiseWithdrawal } from '../core/withdrawals_gateway'

@Tags('withdrawal')
@Route('/withdrawals')
export class WithdrawalsController extends Controller {
  private logger = Logger.getInstance('api', 'WithdrawalsController')

  @Security('cookieAuth')
  @Security('tokenAuth')
  @SuccessResponse('201', 'Created')
  @Post()
  public async initialiseWithdrawal(@Request() request: OverloadedRequest, @Body() withdrawalParams: WithdrawalRequestParams) {
    const { user, account } = request

    try {
      await initialiseWithdrawal({
        ...withdrawalParams,
        accountId: account!.id,
      })

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

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Post('/configs/{currency}')
  public async updateWithdrawalConfig(currency: CurrencyCode, @Body() updatedConfig: Partial<CurrencyWithdrawalConfig>) {
    try {
      this.logger.debug(`Updating withdrawal config for ${currency}`)

      const pendingWithdrawalsExist = await checkForNonCompletedWithdrawalRequests(currency)

      if (pendingWithdrawalsExist) {
        this.setStatus(400)
        const errorMessage = `There are withdrawal requests in progress for currency ${currency}. Please try again later`
        this.logger.error(errorMessage)
        return {
          message: errorMessage,
        }
      }

      return updateWithdrawalConfigForCurrency({ currencyCode: currency, config: updatedConfig })
    } catch (error) {
      this.setStatus(error.status || 500)
      this.logger.error(`Updating withdrawal config for ${currency} errors: ${error.status || 400} - ${error.message}`)
      return {
        message: error.message as string,
      }
    }
  }
}
