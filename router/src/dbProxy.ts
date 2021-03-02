import {
  MySqlProxy,
  OnConn,
  OnProxyConn,
  OnQuery,
} from "dev-in-prod-db-proxy/src/mysqlProxy";
import { Connection } from "mysql2/promise";
import { prisma } from "./prisma";
import { sha256 } from "./utils";
import * as z from "zod";
import mysql2 from "mysql2";
import { ConnectionOptions } from "mysql2/typings/mysql";
import { PrismaClient } from "@prisma/client";

export class DbProxy {
  prisma: PrismaClient;
  mysqlProxy: MySqlProxy;

  constructor(port: number, remoteConnectionOptions: ConnectionOptions) {
    this.mysqlProxy = new MySqlProxy(
      port,
      remoteConnectionOptions,
      onConn,
      onProxyConn,
      onQuery
    );
    this.prisma = new PrismaClient();
  }

  async listen() {
    await this.mysqlProxy.listen();
  }

  async close(): Promise<void> {
    await Promise.all([this.prisma.$disconnect(), this.mysqlProxy.close()]);
  }
}

export const schema = z.object({
  type: z.literal("authenticate"),
  params: z.object({
    authToken: z.string(),
  }),
});

const onConn: OnConn = async (conn: mysql2.Connection): Promise<string> => {
  (conn as any).devInProdData = new DevInProdConnData();
  return "default";
};

type DevInProdConn = Connection & { devInProdData: DevInProdConnData };

const onProxyConn: OnProxyConn = async (conn) => {
  await conn.query("BEGIN");
};

class DevInProdConnData {
  authenticated = false;
  inTransaction = false;
}

const onQuery: OnQuery = async (conn, query) => {
  const devInProdConn = (conn as unknown) as DevInProdConn;
  const devInProdData = devInProdConn.devInProdData;
  if (!devInProdData.authenticated) {
    let jsonObj;
    try {
      jsonObj = JSON.parse(query);
    } catch (e) {
      throw new Error(
        "First query should be a JSON encoded authentication packet."
      );
    }
    const packet = schema.parse(jsonObj);
    const { authToken } = packet.params;
    const tokenObj = await prisma.authToken.findUnique({
      where: { tokenHash: sha256(authToken) },
    });
    if (!tokenObj) {
      throw new Error("Invalid authToken");
    }
    devInProdData.authenticated = true;
    return [];
  }

  await checkCrudQuery(conn, query);

  if (/^(BEGIN|START TRANSACTION)/i.test(query)) {
    if (devInProdData.inTransaction) {
      return ["RELEASE SAVEPOINT s1", "SAVEPOINT s1"];
    }
    devInProdData.inTransaction = true;
    return ["SAVEPOINT s1"];
  }
  if (/^COMMIT/i.test(query)) {
    if (devInProdData.inTransaction) {
      return ["RELEASE SAVEPOINT s1"];
    }
    // Ignore COMMIT statements
    return [];
  }
  if (/^ROLLBACK/i.test(query)) {
    if (devInProdData.inTransaction) {
      devInProdData.inTransaction = false;
      return ["ROLLBACK TO SAVEPOINT s1"];
    }
    // Ignore ROLLBACK statements
    return [];
  }
  return [query];
};

const crudQueryRe = /^(SELECT|INSERT|UPDATE|DELETE|BEGIN|START TRANSACTION|COMMIT|ROLLBACK)/i;
const checkCrudQuery: OnQuery = async (
  conn: mysql2.Connection,
  query: string
): Promise<string[]> => {
  if (!crudQueryRe.test(query)) {
    throw new Error("Invalid query: " + query);
  }
  return [query];
};
