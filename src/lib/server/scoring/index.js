// src/lib/server/scoring/index.js
import { scoreDaytonaEntry } from "./daytona.js";

export function scoreEntryByEventType(eventType, entryPayload, resultsPayload) {
  if (eventType === "daytona") {
    return scoreDaytonaEntry(entryPayload, resultsPayload);
  }

  return { total: 0, breakdown: { error: `No scorer for event type: ${eventType}` } };
}
