import { Route, Body, Patch } from 'tsoa'
import { e2eTestingEnvironments, getEnvironment } from '@abx-types/reference-data'
import { findUsersByEmail } from '@abx-service-clients/account'
import { BalanceRepository } from '../../core'

@Route('test-automation')
export class E2eTestingDataSetupController {
  private balanceRepository = BalanceRepository.getInstance()

  @Patch('/balances')
  public async updateBalancesForAccount(@Body() { email, balances }): Promise<void> {
    if (e2eTestingEnvironments.includes(getEnvironment())) {
      const users = await findUsersByEmail([email.toLocaleLowerCase()])

      await this.balanceRepository.setupAccountBalances(users[0].accountId, balances)
    }
  }
}
