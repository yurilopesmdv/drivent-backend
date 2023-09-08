import { PrismaClient } from '@prisma/client';
import { RedisClientType, createClient } from 'redis';

export let redis: RedisClientType;
export let prisma: PrismaClient;

export function connectDb(): void {
  prisma = new PrismaClient();
}

export async function disconnectDB(): Promise<void> {
  await prisma?.$disconnect();
}
/*
export async function connectRedis() {
  // redis = createClient({ url: "redis://redis:6379" });
  redis = createClient();
  await redis.connect();
  return redis;
}

export async function disconnectRedis() {
  redis.disconnect();
}
*/