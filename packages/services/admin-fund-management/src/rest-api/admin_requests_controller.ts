import { Body, Controller, Get, Patch, Post, Request, Route, Security, Tags, Hidden, Query } from 'tsoa'

import { AdminRequest, AdminRequestStatus, AdminRequestType } from '@abx-service-clients/admin-fund-management'
import { Logger } from '@abx-utils/logging'
import { CurrencyCode } from '@abx-types/reference-data'
import {
  countAllAdminRequests,
  findAllAdminRequests,
  findAllAdminRequestsForAccountHin,
  rejectAdminRequest,
  approveAdminRequest,
  createAdminRequest,
} from '../core'
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

@Tags('admin-funds-management')
@Route('admin/fund-management/admin-requests')
export class AdminRequestsController extends Controller {
  @Security('adminAuth')
  @Get('count')
  public async retrieveAdminRequestsCount(@Query() accountHin?: string): Promise<{ total: number }> {
    const total = await countAllAdminRequests(accountHin)

    return {
      total,
    }
  }

  @Security('adminAuth')
  @Get()
  @Hidden()
  public async retrieveAllAdminRequests(@Query() limit?: number, @Query() offset?: number): Promise<AdminRequest[]> {
    return findAllAdminRequests({ limit, offset })
  }

  @Security('adminAuth')
  @Get('{accountHin}')
  @Hidden()
  public async getAdminRequestsForAccountHin(accountHin: string, @Query() limit?: number, @Query() offset?: number): Promise<AdminRequest[]> {
    return findAllAdminRequestsForAccountHin({ accountHin, limit, offset })
  }

  @Security('adminAuth')
  @Patch('{id}')
  @Hidden()
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
  @Hidden()
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
