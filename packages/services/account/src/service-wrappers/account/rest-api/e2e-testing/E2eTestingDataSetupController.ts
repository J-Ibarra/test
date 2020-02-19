import { Route, Body, Patch } from 'tsoa'
import { e2eTestingEnvironments, getEnvironment } from '@abx-types/reference-data'
import { findUserByEmail, updateAccount, updateUser } from '../../../../core'
import { AccountTypeUpdateRequest, AccountStatusUpdateRequest } from './model'
import { getModel, getEpicurusInstance } from '@abx-utils/db-connection-utils'
import { AccountStatus, SalesforceReferenceTable, KycStatusChange } from '@abx-types/account'
import { AccountPubSubTopics } from '@abx-service-clients/account'

@Route('test-automation')
export class E2eTestingDataSetupController {
  @Patch('/accounts/type')
  public async updateAccountType(@Body() { email, type }: AccountTypeUpdateRequest): Promise<void> {
    if (e2eTestingEnvironments.includes(getEnvironment())) {
      const user = await findUserByEmail(email.toLocaleLowerCase())
      await updateAccount(user!.accountId, { type })
    }
  }

  @Patch('/accounts/account-status')
  public async updateAccountStatus(@Body() { email, status, enableMfa, hasTriggeredKycCheck }: AccountStatusUpdateRequest): Promise<void> {
    if (e2eTestingEnvironments.includes(getEnvironment())) {
      const user = await findUserByEmail(email.toLocaleLowerCase())
      await getModel<Partial<Account>>('account').update(
        {
          status,
          hasTriggeredKycCheck,
        } as any,
        {
          where: { id: user!.accountId },
          returning: true,
        },
      )

      if (status === AccountStatus.kycVerified) {
        await getModel<SalesforceReferenceTable>('salesforce').create({
          accountId: user!.accountId,
          salesforceAccountId: '1',
          salesforcePlatformCredentialId: '1',
        })
        getEpicurusInstance().publish(AccountPubSubTopics.accountKycStatusChange, { accountId: user!.accountId, event: KycStatusChange.approved })
      }

      if (enableMfa) {
        // The actual secret is dummy because we actually skip the MFA validation in e2e tests
        // It is only used to disable MFA prompts on the UI
        await updateUser({ mfaSecret: 'fooBard', id: user!.id })
      }
    }
  }
}
