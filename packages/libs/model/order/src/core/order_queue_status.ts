export interface OrderQueueStatus {
  id: number
  symbolId: string
  processing: boolean
  lastProcessed: Date
}
