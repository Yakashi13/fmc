// The watch panel's status tile: an error loses the prefixes the log line carries, anything else
// is shown as it is. Runs in the "unit" (node) vitest project.
import { test, expect } from "vitest";
import { noticeOf } from "$lib/modules/device/lib/notice";

test("an error drops its prefixes", () => {
  expect(noticeOf("error: Error: Web Bluetooth unavailable")).toEqual({
    tone: "error",
    text: "Web Bluetooth unavailable",
  });
  expect(noticeOf("error: NotFoundError: User cancelled")).toEqual({
    tone: "error",
    text: "User cancelled",
  });
  expect(noticeOf("error: the watch hung up")).toEqual({
    tone: "error",
    text: "the watch hung up",
  });
});

test("what happened — what to do: two lines", () => {
  expect(noticeOf("error: Error: Web Bluetooth isn't available — open it in Chrome")).toEqual({
    tone: "error",
    text: "Web Bluetooth isn't available",
    detail: "Open it in Chrome",
  });
});

test("anything else is info, and nothing is nothing", () => {
  expect(noticeOf("connected")).toEqual({ tone: "info", text: "connected" });
  expect(noticeOf("")).toBeNull();
});
