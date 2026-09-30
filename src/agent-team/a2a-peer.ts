import type {
  CancelTaskRequest,
  SendMessageRequest,
  SendMessageResult,
  Task,
} from '@a2a-js/sdk'
import type { Client, RequestOptions } from '@a2a-js/sdk/client'
import type { WebsitePeerClientResolver } from './website-peer-binding.js'

export type WebsiteA2AClient = Pick<Client, 'sendMessage' | 'cancelTask'>

export class WebsiteA2APeer {
  constructor(
    private readonly resolver: WebsitePeerClientResolver<WebsiteA2AClient>,
  ) {}

  async sendMessage(
    memberId: string,
    request: SendMessageRequest,
    options?: RequestOptions,
  ): Promise<SendMessageResult> {
    const { client } = await this.resolver.resolve(memberId)
    return client.sendMessage(request, options)
  }

  async cancelTask(
    memberId: string,
    request: CancelTaskRequest,
    options?: RequestOptions,
  ): Promise<Task> {
    const { client } = await this.resolver.resolve(memberId)
    return client.cancelTask(request, options)
  }
}
