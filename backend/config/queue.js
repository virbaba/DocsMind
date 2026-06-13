import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.REDIS_URL) {
  console.error('CRITICAL: REDIS_URL environment variable is missing.');
}

const connection = new IORedis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null, // Critical requirement for BullMQ
});

connection.on('error', (err) => {
  console.error('[-] Redis Connection Error:', err.message);
});

connection.on('connect', () => {
  console.log('[+] Redis Connected successfully');
});

export const pdfQueue = new Queue('pdf-processing', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});
