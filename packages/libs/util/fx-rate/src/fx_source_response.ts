export interface FxPriceSourceResponse {
  cacheRate: boolean
  success: boolean
  price: number
  error?: string
}

export const successFxRateResponse = (price: number, cacheRate = true) => ({
  success: true,
  price,
  cacheRate,
})

export const errorFxRateResponse = (error: string) => ({
  cacheRate: false,
  success: false,
  price: 0,
  error,
})
