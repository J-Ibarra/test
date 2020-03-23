import { QueueGateway } from './QueueGateway'

export const TEST_CONTIS_QUEUE_URL = 'https://foob.bar/queue'

export class QueueGatewayStub implements QueueGateway<any> {
  private inMemoryQueue: Record<string, any[]> = {} as any

  public addMessageToQueue(queueUrl: string, payload: any) {
    this.inMemoryQueue[queueUrl] = (this.inMemoryQueue[queueUrl] || []).concat(payload)
  }

  public async subscribeToQueueMessages(url: string, handler: (message: any) => Promise<void>) {
    await new Promise(resolve => setTimeout(() => resolve(), 1_000))

    if (!!this.inMemoryQueue[url] && this.inMemoryQueue[url].length > 0) {
      handler(this.inMemoryQueue[url][0])
      this.inMemoryQueue[url].shift()
    }

    return this.subscribeToQueueMessages(url, handler)
  }
}
