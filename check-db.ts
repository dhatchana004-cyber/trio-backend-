import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const orgs = await prisma.organization.count();
  const attendance = await prisma.attendance.count();
  const leaves = await prisma.leaveRequest.count();
  
  console.log(`DATABASE STATUS:
  - Users: ${users}
  - Organizations: ${orgs}
  - Attendance Records: ${attendance}
  - Leave Requests: ${leaves}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
