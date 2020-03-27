import { Route, Body, Post, Delete } from 'tsoa'
import { Logger } from '@abx-utils/logging'
import { CreateAdminRequestParams, AdminRequest } from '@abx-service-clients/admin-fund-management'
import { saveAdminRequest, deleteAllRequestsByEmail } from '../core'

@Route('test-automation/admin/fund-management')
export class E2eTestingController {
  private logger = Logger.getInstance('api', 'E2eTestingController')

  @Post('/admin-request')
  public async saveAdminRequest(@Body() adminRequest: CreateAdminRequestParams): Promise<AdminRequest> {
    this.logger.info('Creating new admin request.')

    return saveAdminRequest(adminRequest)
  }

  @Delete('/admin-request/{email}')
  public async deleteAllAdminRequest(email: string): Promise<void> {
    this.logger.info('Creating new admin request.')

    return deleteAllRequestsByEmail(email)
  }
}
