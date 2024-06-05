export type Listener = (message: string) => void;

export class ClientSocketMock {
  listeners: Listener[];

  constructor() {
    this.listeners = [];
  }

  onMessage(listener: Listener) {
    this.listeners.push(listener);
  }

  sendMessage(message: string) {
    for (const listener of this.listeners) {
      listener(message);
    }
  }
}
