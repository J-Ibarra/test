import { Controller, Get, Route, Security } from 'tsoa'
import { getAccountSummary } from '../core'

@Route('admin/fund-management/account-summary')
export class AccountSummaryController extends Controller {
  @Security('adminAuth')
  @Get('{accountHin}')
  public async getAccountSummaryForHin(accountHin: string) {
    try {
      this.setStatus(200)
      return await getAccountSummary(accountHin)
    } catch (err) {
      this.setStatus(err.status || 400)
      return {
        message: err.message,
      }
    }
  }
}
