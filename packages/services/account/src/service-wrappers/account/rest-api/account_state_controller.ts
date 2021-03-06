import { Body, Controller, Patch, Route, Security, Tags, Hidden } from 'tsoa'

import { AccountStatus } from '@abx-types/account'
import { updateAccountStatus, updateSuspensionStatus } from '../../../core'

interface StatusChangeRequest {
  status: AccountStatus
}

interface AccountSuspensionChangeRequest {
  suspended: boolean
}

@Tags('accounts')
@Route('/admin/accounts')
@Hidden()
export class AccountStateController extends Controller {
  @Security({
    cookieAuth: [],
    adminAuth: [],
  })
  @Patch('{accountId}/status')
  public async changeAccountStatus(accountId: string, @Body() { status }: StatusChangeRequest): Promise<{ message: string } | void> {
    try {
      await updateAccountStatus(accountId, status)
    } catch (e) {
      this.setStatus(400)
      return { message: e.message }
    }
  }

  @Security({
    cookieAuth: [],
    adminAuth: [],
  })
  @Patch('{accountId}/suspension')
  @Hidden()
  public async suspendAccount(accountId: string, @Body() { suspended }: AccountSuspensionChangeRequest): Promise<{ message: string } | void> {
    try {
      await updateSuspensionStatus({ id: accountId, suspended })
    } catch (e) {
      this.setStatus(400)
      return { message: e.message }
    }
  }
}
