import { EventEmitter } from "events";

export const messageEmitter = new EventEmitter({
  captureRejections: true,
});
