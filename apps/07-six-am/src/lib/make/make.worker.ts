/// <reference lib="webworker" />
// Make's worker (S3): reading the looped part, rendering "Mine" and "Suggest settings" run here so
// the page never stalls (the shortcut in match.ts). A mailbox for jobs.ts; nothing is kept between
// messages, nothing is stored or sent anywhere (L143, L161).
import { runMakeJob, type MakeRequest } from "./jobs";

self.onmessage = (e: MessageEvent<MakeRequest>) => {
  const { res, transfer } = runMakeJob(e.data);
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(res, transfer);
};
