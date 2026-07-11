import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { readReplicas } from '@prisma/extension-read-replicas';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private primaryPool!: Pool;
  private replicaPool?: Pool;
  private extendedClient: any;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is missing.');
    }

    // 1. Initialize PgBouncer primary pool and adapter
    const primaryPool = new Pool({ connectionString: databaseUrl });
    const primaryAdapter = new PrismaPg(primaryPool);

    // Call super with the primary adapter
    super({ adapter: primaryAdapter });
    this.primaryPool = primaryPool;

    // 2. Initialize read replica client if REPLICA_URL is provided
    const replicaUrl = process.env.REPLICA_URL;
    if (replicaUrl) {
      this.replicaPool = new Pool({ connectionString: replicaUrl });
      const replicaAdapter = new PrismaPg(this.replicaPool);
      const replicaClient = new PrismaClient({ adapter: replicaAdapter });

      this.extendedClient = this.$extends(
        readReplicas({
          replicas: [replicaClient],
        })
      );
    } else {
      this.extendedClient = this;
    }

    // Proxy property access to extendedClient
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        const clientToUse = target.extendedClient || target;
        const val = Reflect.get(clientToUse, prop, receiver);
        if (typeof val === 'function') {
          return val.bind(clientToUse);
        }
        return val;
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$queryRaw`SELECT 1`;
    } catch (err) {
      console.error('Failed to connect to database in onModuleInit:', err);
      throw err;
    }
  }

  async onModuleDestroy() {
    try {
      await this.primaryPool.end();
      if (this.replicaPool) {
        await this.replicaPool.end();
      }
    } catch (err) {
      console.error('Failed to close database pools onModuleDestroy:', err);
    }
  }
}
