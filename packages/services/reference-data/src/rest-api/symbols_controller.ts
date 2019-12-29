import { Controller, Get, Route, Query } from 'tsoa'
import { getAllCompleteSymbolDetails } from '../core'
import { SymbolPairApiResponse, SymbolPair } from '@abx-types/reference-data'

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
}
