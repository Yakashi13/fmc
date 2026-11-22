import { combine, createEvent, createStore, sample } from "effector";
import { $bleInfo, connected } from "./ble.model";
const configurationPicked = createEvent<{ model: string; color: string }>();
export const automaticChanged = createEvent<boolean>();
export const previewModelPicked = createEvent<string>();
export const previewColorPicked = createEvent<string>();
export const $previewModel = createStore("auto")
  .on(configurationPicked, (_, v) => v.model)
  .on(previewModelPicked, (_, v) =>
    ["auto", "watch_pro_2", "watch_3_pro"].includes(v) ? v : "auto",
  )
  .reset(connected);
export const $previewColor = createStore("auto")
  .on(configurationPicked, (_, v) => v.color)
  .on(previewColorPicked, (_, v) =>
    ["auto", "dark-grey", "light-grey", "orange", "blue", "green"].includes(v) ? v : "auto",
  )
  .reset(previewModelPicked, connected);
export const $watchAppearance = combine(
  $bleInfo,
  $previewModel,
  $previewColor,
  (info, modelOverride, colorOverride) => {
    const detected = info?.identity;
    const nameModel = /watch (3 pro|pro 3)/i.test(info?.name ?? "") ? "watch_3_pro" : "watch_pro_2";
    const model =
      modelOverride === "auto"
        ? detected?.model === "watch_3_pro"
          ? "watch_3_pro"
          : detected?.model === "watch_pro_2"
            ? "watch_pro_2"
            : nameModel
        : modelOverride;
    const colors =
      model === "watch_3_pro"
        ? ["dark-grey", "light-grey", "orange", "green"]
        : ["dark-grey", "light-grey", "orange", "blue"];
    const autoColor =
      detected?.model === model && detected.color && colors.includes(detected.color)
        ? detected.color
        : "dark-grey";
    const color =
      colorOverride !== "auto" && colors.includes(colorOverride) ? colorOverride : autoColor;

    return {
      model,
      color,
      colors,
      frame: `/frames/${model.replaceAll("_", "-")}-${color}.webp`,
      detectedColor: detected?.color ?? null,
    };
  },
);

export const framePanelOpened = createEvent();
export const framePanelClosed = createEvent();
export const $framePanelOpen = createStore(false)
  .on(framePanelOpened, () => true)
  .reset(framePanelClosed);

sample({
  clock: automaticChanged,
  source: $watchAppearance,
  fn: (appearance, automatic) => ({
    model: automatic ? "auto" : appearance.model,
    color: automatic ? "auto" : appearance.color,
  }),
  target: configurationPicked,
});
