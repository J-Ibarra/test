import { Route, Body, Post } from 'tsoa'
import { Logger } from '@abx-utils/logging'
import { CreateAdminRequestParams, AdminRequest } from '@abx-service-clients/admin-fund-management'
import { saveAdminRequest } from '../core'

@Route('test-automation/admin/fund-management')
export class E2eTestingController {
  private logger = Logger.getInstance('api', 'E2eTestingController')

  @Post('/admin-request')
  public async saveAdminRequest(@Body() adminRequest: CreateAdminRequestParams): Promise<AdminRequest> {
    this.logger.info('Creating new admin request.')

    return saveAdminRequest(adminRequest)
  }
}
