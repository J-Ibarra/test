import { Body, Controller, Get, Post, Request, Route, Security } from 'tsoa'

import { CurrencyCode } from '@abx-types/reference-data'
import { OverloadedRequest } from '@abx-types/account'
import { findContactsForAccountByCurrency, createContactForAccount } from '../core/contacts/contacts_data_retriever'

export interface ContactCreateRequest {
  currency: CurrencyCode
  name: string
  publicKey: string
}

@Route('/contacts')
export class ContactsController extends Controller {
  @Security('cookieAuth')
  @Security('tokenAuth')
  @Get('{currencyCode}')
  public async retrieveContactsForCurrencyForAccount(currencyCode: CurrencyCode, @Request() request: OverloadedRequest) {
    return findContactsForAccountByCurrency({ accountId: request.account!.id!, currencyCode })
  }

  @Security('cookieAuth')
  @Security('tokenAuth')
  @Post()
  public async createContactForCurrencyForAccount(@Request() request: OverloadedRequest, @Body() contactCreateRequest: ContactCreateRequest) {
    return createContactForAccount({
      accountId: request.account!.id,
      ...contactCreateRequest,
    })
  }
}
