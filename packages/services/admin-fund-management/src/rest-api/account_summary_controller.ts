import { Controller, Get, Route, Security, Tags, Hidden } from 'tsoa'
import { getAccountSummary } from '../core'

@Tags('admin-funds-management')
@Route('admin/fund-management/account-summary')
export class AccountSummaryController extends Controller {
  @Security('adminAuth')
  @Get('{accountHin}')
  @Hidden()
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
