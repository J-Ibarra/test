import { Controller, Get, Route, Query, Security, Request } from 'tsoa'
import { getAllCompleteSymbolDetails, getExcludedAccountTypesFromOrderRangeValidations } from '../core'
import { SymbolPairApiResponse, SymbolPair } from '@abx-types/reference-data'
import { OverloadedRequest } from '@abx-types/account'
import { ApiErrorPayload } from '@abx-types/error'

@Route()
export class SymbolsController extends Controller {
  @Get('/symbols')
  public async getSymbols(@Query() includeOrderRange?: boolean) {
    const symbols = await getAllCompleteSymbolDetails()

    const sortableSymbols = symbols.map(
      ({ id, base, quote, fee, orderRange, sortOrder }: SymbolPair): SymbolPairApiResponse => {
        const result: SymbolPairApiResponse = {
          id,
          base: base.code,
          quote: quote.code,
          fee: fee.code,
          sortOrder: sortOrder || null,
        }
        return includeOrderRange ? { ...result, orderRange } : result
      },
    )

    const sortSymbols = sortableSymbols.some(({ sortOrder }) => !!sortOrder)
    return sortSymbols ? sortableSymbols.sort((symbol1, symbol2) => symbol1.sortOrder! - symbol2.sortOrder!) : sortableSymbols
  }

  /**
   * This will find out if your account is bound to the symbols order ranges or not.
   * Returns true if you are bound and false if you aren't
   */
  @Security('tokenAuth')
  @Security('cookieAuth')
  @Get('/symbols/apply-threshold')
  public async getApplySymbolsThresholdStatus(@Request() { account }: OverloadedRequest): Promise<boolean | ApiErrorPayload> {
    const accountTypesExcludedFromValidation = await getExcludedAccountTypesFromOrderRangeValidations()

    try {
      return !accountTypesExcludedFromValidation.includes(account!.type!)
    } catch (e) {
      this.setStatus(400)
      return { message: `Failed to find symbols threshold details for your account` }
    }
  }
}
