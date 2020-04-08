import { Body, Controller, Get, Post, Query, Request, Route, Security, SuccessResponse, Tags } from 'tsoa'

import { AccountFeeTier, FeeTier } from '@abx-types/order'
import {
  getAllDefaultFeeTiers,
  getAccountFeeTiersForAllSymbols,
  getFeeRateForAccount,
  setDefaultFeeTiers,
  getDefaultFeeTiersForSymbol,
  setAccountFeeTiers,
  getAccountFeeTiersForSymbol,
} from '../../../core'
import { OverloadedRequest } from '@abx-types/account'

@Tags('order')
@Route()
export class FeesController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/fees/trade')
  public async getAllDefaultTiers(): Promise<Record<string, FeeTier[]>> {
    return getAllDefaultFeeTiers()
  }

  @Security('cookieAuth')
  @Get('/fees/account')
  public async getAllAccountTiers(@Request() request: OverloadedRequest): Promise<any> {
    return getAccountFeeTiersForAllSymbols(request.account!.id)
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('/fees/{symbolId}')
  public async getFees(@Request() request: OverloadedRequest, symbolId: string): Promise<{ rate: number }> {
    const query = {
      accountId: request.account!.id,
      symbolId,
    }

    const feeRate = await getFeeRateForAccount(query)
    return {
      rate: feeRate!,
    }
  }

  @Security({
    cookieAuth: [],
    adminAuth: [],
  })
  @SuccessResponse('201', 'Created')
  @Post('/admin/fees/default')
  public async addDefaultTiers(@Body() requestBody: FeeTier[]): Promise<any> {
    this.setStatus(201)
    return setDefaultFeeTiers(requestBody)
  }

  @Security({
    cookieAuth: [],
    adminAuth: [],
  })
  @Get('/admin/fees/default')
  public async getDefaultTiers(@Query('symbolId') symbolId: string): Promise<FeeTier[]> {
    return getDefaultFeeTiersForSymbol(symbolId)
  }

  @Security({
    cookieAuth: [],
    adminAuth: [],
  })
  @SuccessResponse('201', 'Created')
  @Post('/admin/fees/account')
  public async addAccountTiers(@Body() requestBody: AccountFeeTier[]): Promise<any> {
    this.setStatus(201)
    return setAccountFeeTiers(requestBody)
  }

  @Security({
    cookieAuth: [],
    adminAuth: [],
  })
  @Get('/admin/fees/account')
  public async getAccountSymbolTiers(@Query('accountId') accountId: string, @Query('symbolId') symbolId: string): Promise<any> {
    return getAccountFeeTiersForSymbol(accountId, symbolId)
  }
}
