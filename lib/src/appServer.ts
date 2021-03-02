import { Server } from "http";
import util from "util";
import { getHttpUrl, globalConfig } from "./utils";
const logger = require("koa-logger");

export class AppServer {
  server: Server;
  private onCloseFuncs: (() => Promise<void>)[] = [];

  constructor(server: Server) {
    this.server = server;
    this.onCloseFuncs.push(util.promisify(server.close.bind(server)));
  }

  async onClose(func: () => Promise<void>) {
    this.onCloseFuncs.push(func);
  }

  async close() {
    await Promise.all(this.onCloseFuncs.map((func) => func()));
  }

  get url(): string {
    return getHttpUrl(this.port);
  }

  get port(): number {
    return (this.server.address() as any).port;
  }

  get apiUrl(): string {
    return getHttpUrl(this.port) + globalConfig.apiPathPrefix;
  }

  get wsUrl(): string {
    return `ws://localhost:${this.port}/ws`;
  }
}

interface CanListen {
  listen(port: number): Server;
}
export const listenOnPort = (app: CanListen, port: number): Promise<Server> => {
  return new Promise((resolve, reject) => {
    const server = app.listen(port);
    server.addListener("listening", () => {
      console.log("Listening on port ", port);
      resolve(server);
    });
    server.addListener("error", () => {
      reject("Error listening on port " + port);
    });
  });
};
