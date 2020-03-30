import { Route, Body, Post, Hidden } from 'tsoa'
import { findUsersByEmail } from '@abx-service-clients/account'
import { BalanceRepository } from '../../core'

@Route('test-automation')
export class E2eTestingDataSetupController {
  private balanceRepository = BalanceRepository.getInstance()

  @Post('/balances')
  @Hidden()
  public async updateBalancesForAccount(@Body() { email, balances }): Promise<void> {
    const users = await findUsersByEmail([email.toLocaleLowerCase()])

    await this.balanceRepository.setupAccountBalances(users[0].accountId, balances)
  }
}
