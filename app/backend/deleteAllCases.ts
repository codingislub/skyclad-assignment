import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

(async () => {
  await prisma.case.deleteMany({});
  console.log("All cases deleted");
  await prisma.$disconnect();
})();