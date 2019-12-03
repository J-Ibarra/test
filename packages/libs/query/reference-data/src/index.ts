import { setupModel } from '@abx/db-connection-utils'

import setupSymbolModel from './model/symbol'
import setupCurrencyModel from './model/currency'


setupModel(setupSymbolModel)
setupModel(setupCurrencyModel)


export * from './lib/symbols/'
