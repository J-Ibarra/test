export const reduceSymbolsToMappedObject = <T extends { symbolId }>(arrayOfInterest: T[]) => {
  return arrayOfInterest.reduce((prev: Map<string, T[]>, next: T) => {
    const accumulatedPricesForSymbol = prev.get(next.symbolId) || []

    return prev.set(next.symbolId, accumulatedPricesForSymbol.concat(next))
  }, new Map<string, T[]>())
}
