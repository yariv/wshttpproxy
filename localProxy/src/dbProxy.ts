import net from "net";

import mysql from "mysql2";

export class DbProxy {
  server: net.Server | undefined;

  async listen(
    port: number,
    remoteHost: string,
    remotePort: number,
    oauthToken: string
  ) {
    this.server = net.createServer((socket) => {
      let conn = net.connect({ host: remoteHost, port: remotePort });
      conn.on("connect", () => {
        console.log("connected to server");
        const buf = Buffer.from(oauthToken);
        //conn.write(buf.length);
      });
      conn.on("data", (data) => {
        console.log("data from server", data);
        socket.write(data);
      });

      socket.on("close", (hadError) =>
        console.log("client disconnected", hadError)
      );
      socket.on("connect", () => console.log("client connected"));
      socket.on("data", (data) => {
        console.log("data from client", data);
        conn.write(data);
      });
    });

    this.server.on("error", (err) => {
      console.log("error", err);
    });

    return new Promise((resolve) => {
      this.server!.listen(port, "localhost", 0, () => {
        resolve(null);
      });
    });
  }

  async close() {
    if (!this.server) {
      return;
    }
    return new Promise((resolve, reject) => {
      this.server?.close((err) => {
        if (err) {
          reject();
        } else {
          resolve(null);
        }
      });
    });
  }
}
