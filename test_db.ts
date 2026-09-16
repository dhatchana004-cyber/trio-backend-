import prisma from './src/utils/prisma';

async function test() {
    const users = await prisma.user.findMany();
    console.log(users);
}
test();
