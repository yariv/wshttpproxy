import { spawn } from "child_process";
import { parseArgsStringToArgv } from "string-argv";
import { prisma } from "../prisma";
//import { Migrate } from "@prisma/migrate";

export const initTestDb = async () => {
  // await runCmd("dropdb devinprod_test");
  // await runCmd("createdb devinprod_test");
  // return runCmd(
  //   "dotenv -e .env_test -- yarn prisma db push --preview-feature --force"
  // );
  const t1 = Date.now();
  // const query =
  //   "SELECT 'TRUNCATE ' || table_name || ';' FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE';";
  //await prisma.$executeRaw(query);
  await prisma.oAuthToken.deleteMany({});
  await prisma.route.deleteMany({});
  await prisma.verificationRequest.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.user.deleteMany({});
  const t2 = Date.now();
  console.log("db deletes", (t2 - t1) / 1000, "seconds");
};

export const runCmd = async (cmdStr: string): Promise<any> => {
  const t1 = Date.now();
  console.log("run", cmdStr);
  const logFinish = (eventName: string) => {
    const t2 = Date.now();
    console.log(eventName, cmdStr, (t2 - t1) / 1000, "seconds");
  };
  return new Promise((resolve, reject) => {
    const args = parseArgsStringToArgv(cmdStr);
    const cmd = args.shift() as string;
    const proc = spawn(cmd, args, { stdio: "inherit" });
    proc.on("close", (code) => {
      logFinish("close");
      resolve(code);
    });
    proc.on("error", (err) => {
      logFinish("error");
      reject(err);
    });
  });
};
