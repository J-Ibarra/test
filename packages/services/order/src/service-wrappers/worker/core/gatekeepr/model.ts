export interface Gate {
  symbolId: string
  processing: boolean
  lastProcessed: Date
}

export type GateKeeper = Gate[]

export interface QueueInfo {
  symbolId: string
  length: number
}
