export interface Closeable {
  close(): Promise<void>;
}

export class AppServer implements Closeable {
  closeables: Closeable[];

  constructor(closables: Closeable[]) {
    this.closeables = closables;
  }

  async close() {
    await Promise.all(this.closeables.map((closeable) => closeable.close()));
  }
}
