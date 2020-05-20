import { Controller, Get, Request, Route, Tags, Query } from 'tsoa'
import { OverloadedRequest } from '@abx-types/account'
import { findCurrenciesByAccountId } from '../core'
import { Currency, CurrencyPublicView } from '@abx-types/reference-data'
import { isFiatCurrency } from '@abx-service-clients/reference-data'

@Tags('reference-data')
@Route('currencies')
export class CurrenciesController extends Controller {
  @Get()
  public async getCurrencies(@Request() request: OverloadedRequest, @Query() includeExtendedDetails?: boolean) {
    const currencies: Currency[] = await findCurrenciesByAccountId(request.account!.id)

    if (includeExtendedDetails) {
      const currenciesWithIconUrl: CurrencyPublicView[] = enrichWithIconUrl(currencies)
  
      return enrichWithCurrencyIndicatior(currenciesWithIconUrl)
    }

    return currencies;
  }
}

function enrichWithIconUrl(currencies: Currency[]): CurrencyPublicView[] {
  return currencies.map((currency) => ({ ...currency, iconUrl: `${process.env.KBE_STATIC_ASSETS_BUCKET}/icons/${currency.code}.svg}`}))
}

function enrichWithCurrencyIndicatior(currencies: Currency[]): CurrencyPublicView[] {
  return currencies.map((currency) => ({ ...currency, isFiat: isFiatCurrency(currency.code) }))
}
