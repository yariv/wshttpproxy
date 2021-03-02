import {
  MySqlProxy,
  OnProxyConn,
  OnQuery,
  checkCrudQuery,
} from "dev-in-prod-db-proxy/src/mysqlProxy";
import { Connection } from "mysql2/promise";
import { prisma } from "./prisma";
import { sha256 } from "./utils";
import * as z from "zod";
import mysql2 from "mysql2";
import { ConnectionOptions } from "mysql2/typings/mysql";

export const initDbProxy = (
  port: number,
  remoteConnectionOptions: ConnectionOptions
) => {
  const dbProxy = new MySqlProxy(
    port,
    remoteConnectionOptions,
    onConn,
    onProxyConn,
    onQuery
  );
  return dbProxy;
};

export const schema = z.object({
  type: z.literal("authenticate"),
  params: z.object({
    oauthToken: z.string(),
  }),
});

const onConn = async (conn: mysql2.Connection) => {
  (conn as any).devInProdData = new DevInProdConnData();
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
    const { oauthToken } = packet.params;
    const tokenObj = await prisma.authToken.findUnique({
      where: { tokenHash: sha256(oauthToken) },
    });
    if (!tokenObj) {
      throw new Error("Invalid oauthToken");
    }
    devInProdData.authenticated = true;
    return;
  }

  await checkCrudQuery(conn, query);

  if (/^(BEGIN|START TRANSACTION)/i.test(query)) {
    if (devInProdData.inTransaction) {
      throw new Error("Nested transactions aren't supported.");
    }
    devInProdData.inTransaction = true;
    return "SAVEPOINT s1";
  }
  if (/^COMMIT/i.test(query)) {
    if (devInProdData.inTransaction) {
      return "RELEASE SAVEPOINT s1";
    }
    // Ignore COMMIT statements
    return;
  }
  if (/^ROLLBACK/i.test(query)) {
    if (devInProdData.inTransaction) {
      devInProdData.inTransaction = false;
      return "ROLLBACK TO SAVEPOINT s1";
    }
    // Ignore ROLLBACK statements
    return;
  }
  return query;
};
