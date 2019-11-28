import { FindOptionsAttributesArray, IncludeOptions, Transaction, WhereOptions } from 'sequelize'

/** Used for defining symbol search params. */
export interface FindSymbolsRequestParams {
  where?: WhereOptions
  includeOptions?: IncludeOptions[]
  attributeOptions?: FindOptionsAttributesArray
  transaction?: Transaction
}
