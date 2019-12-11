import { Controller, Get, Route } from 'tsoa'
import { getAllCompleteSymbolDetails } from '../core'
import { SymbolPairApiResponse } from '@abx-types/reference-data'

@Route('symbols')
export class SymbolsController extends Controller {
  @Get()
  public async getSymbols(): Promise<SymbolPairApiResponse[]> {
    const symbols = await getAllCompleteSymbolDetails()
    return symbols.map(({ id, base, quote, fee }) => ({
      id,
      base: base.code,
      quote: quote.code,
      fee: fee.code,
    }))
  }
}
