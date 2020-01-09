import { CreateAdminRequestParams } from './create_admin_request_params'

/** Contains the details for a withdrawal, deposit or redemption admin request for a given client. */
export interface AdminRequest extends CreateAdminRequestParams {
  id: number
  globalTransactionId: string
  createdAt: Date
  updatedAt: Date
  tradingPlatformName: string
}

