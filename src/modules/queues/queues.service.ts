import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class QueuesService implements OnModuleInit, OnModuleDestroy {
  private notificationsQueue!: Queue;
  private imageProcessingQueue!: Queue;
  private workers: Worker[] = [];

  constructor(@Inject(RedisService) private readonly redisService: RedisService) {}

  onModuleInit() {
    const connection = this.redisService.getClient();


    // Initialize Queues
    this.notificationsQueue = new Queue('notifications', { connection: connection as any });
    this.imageProcessingQueue = new Queue('image-processing', { connection: connection as any });

    // Initialize Workers
    const notificationsWorker = new Worker(
      'notifications',
      async (job: Job) => {
        const { type, actorId, targetId, entityId } = job.data;
        console.log(`[Queue notifications] Processing job ${job.id}: Actor ${actorId} triggered ${type} on target ${targetId}`);
        // Background notification processing placeholder.
      },
      { connection: connection as any }
    );

    const imageProcessingWorker = new Worker(
      'image-processing',
      async (job: Job) => {
        const { post_id, image_url } = job.data;
        console.log(`[Queue image-processing] Processing job ${job.id} for post ${post_id}: Compressing ${image_url}`);
        // Background image optimization placeholder.
      },
      { connection: connection as any }
    );

    this.workers.push(notificationsWorker, imageProcessingWorker);
  }

  async onModuleDestroy() {
    try {
      await this.notificationsQueue.close();
      await this.imageProcessingQueue.close();
      for (const worker of this.workers) {
        await worker.close();
      }
    } catch (error) {
      console.error('Error during queues graceful shutdown:', error);
    }
  }

  async addNotificationJob(data: { type: string; actorId: number; targetId: number; entityId?: number }) {
    try {
      await this.notificationsQueue.add('dispatch', data, { removeOnComplete: true, removeOnFail: 100 });
    } catch (error) {
      console.error('Failed to add notification job to queue:', error);
    }
  }

  async addImageProcessingJob(data: { post_id: number; image_url: string }) {
    try {
      await this.imageProcessingQueue.add('optimize', data, { removeOnComplete: true, removeOnFail: 100 });
    } catch (error) {
      console.error('Failed to add image-processing job to queue:', error);
    }
  }
}
