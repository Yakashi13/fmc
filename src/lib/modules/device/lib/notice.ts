// The BLE status line as the watch panel shows it. The line keeps its "error: " prefix (and,
// for a thrown Error, "Error: " or "NetworkError: " after it) because it also goes to the log;
// the panel says the error once, in its own red tile, so neither prefix is worth reading there.
// A message written as "what happened — what to do" is shown as two lines: the first as the
// tile's heading, the rest under it, starting with a capital.
export type Notice = { tone: "info" | "error"; text: string; detail?: string };

export function noticeOf(status: string): Notice | null {
  if (!status) return null;
  const error = status.startsWith("error:");
  const said = error ? status.replace(/^error:\s*/, "").replace(/^\w*Error:\s*/, "") : status;
  const [text, ...rest] = said.split(" — ");
  const detail = rest.join(" — ");

  return {
    tone: error ? "error" : "info",
    text,
    ...(detail && { detail: detail[0].toUpperCase() + detail.slice(1) }),
  };
}

/** Bluefy in the App Store: the iPhone's way to Web Bluetooth (see pages/troubleshooting.md). */
export const BLUEFY = "https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055";
