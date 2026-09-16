import { PrismaClient } from '@prisma/client';

// Re-exporting the client instance
const prisma = new PrismaClient();

export default prisma;

