// The heart is optimistic: it flips the moment it's pressed and flips back if the request fails.
import { test, expect } from "vitest";
import { fork, allSettled } from "effector";
import type { RecordModel } from "pocketbase";
import { marketModel } from "../src/lib/modules/market/model";
import * as marketApi from "../src/lib/modules/market/model/market.api";

const wf = { id: "wf1", collectionId: "", collectionName: "watchfaces" } as RecordModel;
const mine = { id: "l1", collectionId: "", collectionName: "likes", watchface: "wf1", user: "u1" };
const liked = (likes: RecordModel[]) => likes.some((l) => l.watchface === "wf1" && l.user === "u1");

test("a like shows at once, before the server answers", async () => {
  let release = () => {};
  const scope = fork({
    handlers: [[marketApi.toggleLikeFx, () => new Promise((r) => (release = () => r([mine])))]],
  });
  const settled = allSettled(marketModel.likeToggleRequested, {
    scope,
    params: { wf, userId: "u1" },
  });

  expect(liked(scope.getState(marketModel.$likes))).toBe(true);
  expect(scope.getState(marketModel.$likePending)).toBe(true);
  release();
  await settled;
  expect(scope.getState(marketModel.$likes)).toEqual([mine]);
});

test("a failed like is taken back, and a failed unlike puts the like back", async () => {
  const scope = fork({
    handlers: [[marketApi.toggleLikeFx, () => Promise.reject(new Error("offline"))]],
  });

  await allSettled(marketModel.likeToggleRequested, { scope, params: { wf, userId: "u1" } });
  expect(liked(scope.getState(marketModel.$likes))).toBe(false);

  const withMine = fork({
    values: [[marketModel.$likes, [mine]]],
    handlers: [[marketApi.toggleLikeFx, () => Promise.reject(new Error("offline"))]],
  });

  await allSettled(marketModel.likeToggleRequested, {
    scope: withMine,
    params: { wf, userId: "u1" },
  });
  expect(withMine.getState(marketModel.$likes)).toEqual([mine]);
});
