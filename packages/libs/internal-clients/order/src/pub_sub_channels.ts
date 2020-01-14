export enum OrderPubSubChannels {
  orderPlacedOnQueue = 'exchange:pub-sub:order:orderPlacedOnQueue',
  exchangeOrderEvents = 'exchange:pub-sub:order:exchangeOrderEvents',
  bidDepthUpdated = 'exchange:pub-sub:order:bidDepthUpdated',
  askDepthUpdated = 'exchange:pub-sub:order:askDepthUpdated',
  orderExecutionResultDispatched = 'exchange:pub-sub:order:orderExecutionResultDispatched',

  orderCancelled = 'exchange:pub-sub:order:orderCancelled',
  orderFilled = 'exchange:pub-sub:order:orderFilled',
  orderPartiallyFilled = 'exchange:pub-sub:order:orderPartiallyFilled',
}
