import { Body, Controller, Get, Patch, Post, Request, Route, Security } from 'tsoa'

import { AdminRequest, AdminRequestStatus, AdminRequestType } from '@abx-service-clients/admin-fund-management'
import { Logger } from '@abx/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import { findAllAdminRequests, findAllAdminRequestsForAccountHin, rejectAdminRequest, approveAdminRequest, createAdminRequest } from '../core'
import { OverloadedRequest } from '@abx-types/account'
import { ApiErrorPayload } from '@abx-types/error'

interface AdminRequestStatusUpdateParams {
  status: AdminRequestStatus
  updatedAt: Date
}

interface AdminRequestParams {
  hin: string
  type: AdminRequestType
  description?: string
  asset: CurrencyCode
  amount: number
  fee?: number
}

const logger = Logger.getInstance('api', 'AdminRequestsController')

@Route('admin/fund-management/admin-requests')
export class AdminRequestsController extends Controller {
  @Security('adminAuth')
  @Get()
  public async retrieveAllAdminRequests(): Promise<AdminRequest[]> {
    return findAllAdminRequests()
  }

  @Security('adminAuth')
  @Get('{accountHin}')
  public async getAdminRequestsForAccountHin(accountHin: string): Promise<AdminRequest[]> {
    return findAllAdminRequestsForAccountHin(Number(accountHin))
  }

  @Security('adminAuth')
  @Patch('{id}')
  public async updateAdminRequestStatus(
    id: number,
    @Body() { status, updatedAt }: AdminRequestStatusUpdateParams,
    @Request() request: OverloadedRequest,
  ): Promise<AdminRequest | ApiErrorPayload> {
    const { account } = request

    logger.debug(`Changing status for admin request ${id} to ${status}`)
    try {
      let adminRequest
      if (status === AdminRequestStatus.rejected) {
        adminRequest = await rejectAdminRequest({
          id,
          adminId: account!.id!,
          approvedAt: updatedAt,
        })
      } else {
        adminRequest = await approveAdminRequest({
          id,
          adminId: account!.id,
          approvedAt: updatedAt,
        })
      }

      return adminRequest
    } catch (err) {
      this.setStatus(err.status || 400)

      return {
        message: err.message,
      }
    }
  }

  @Security('adminAuth')
  @Post()
  public async createAdminRequest(
    @Body() requestBody: AdminRequestParams,
    @Request() request: OverloadedRequest,
  ): Promise<AdminRequest | ApiErrorPayload> {
    const { account } = request

    try {
      const adminRequest = await createAdminRequest({
        ...requestBody,
        adminAccountId: account!.id,
      } as any)

      return adminRequest
    } catch (err) {
      this.setStatus(err.status || 400)

      return {
        message: err.message,
      }
    }
  }
}
