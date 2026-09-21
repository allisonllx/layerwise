import type { CnnModel } from './model';
import { describeStage } from './stages';
/** Derive both ends of the highlighted operation from the scrubber, not playback state. */
export function stageFocus(
  model: CnnModel,
  step: number,
  channel: number,
  selected: number,
  classIndex: number,
  feature: number,
  progress: number,
) {
  const initial = describeStage(model, step, channel, selected);
  const count =
    step === 0
      ? 36
      : step === 2
        ? model.activated[channel].flat().length
        : step === 3
          ? model.pooled[channel].flat().length
          : step === 4
            ? model.flattened.length
            : 2;
  const chosen =
    step === 0 || step === 2
      ? selected
      : step === 3
        ? initial.pooledIndex
        : step === 4
          ? initial.featureIndex
          : classIndex;
  const order = [
    chosen,
    ...Array.from({ length: count }, (_, i) => i).filter((i) => i !== chosen),
  ];
  const visible =
    progress < 45
      ? 0
      : Math.min(count, 1 + Math.floor(((progress - 45) / 55) * count));
  const output = order[Math.max(0, visible - 1)];
  const poolSide = model.pooled[0].length,
    convSide = model.convolution[0].length;
  const displayChannel =
    step === 4 ? Math.floor(output / (poolSide * poolSide)) : channel;
  const local = step === 4 ? output % (poolSide * poolSide) : output;
  const location =
    step === 3 || step === 4
      ? Math.floor(local / poolSide) * 2 * convSide + (local % poolSide) * 2
      : step === 0 || step === 2
        ? output
        : selected;
  const detail = describeStage(model, step, displayChannel, location);
  const featureOrder = [
    feature,
    ...model.flattened.map((_, i) => i).filter((i) => i !== feature),
  ];
  const products = Math.min(
    featureOrder.length,
    Math.floor((progress / 45) * featureOrder.length),
  );
  const activeFeature = featureOrder[Math.max(0, products - 1)];
  const sources =
    step === 3
      ? [
          detail.pr * 2 * convSide + detail.pc * 2,
          detail.pr * 2 * convSide + detail.pc * 2 + 1,
          (detail.pr * 2 + 1) * convSide + detail.pc * 2,
          (detail.pr * 2 + 1) * convSide + detail.pc * 2 + 1,
        ]
      : step === 4
        ? [local]
        : step === 5
          ? progress >= 45
            ? featureOrder
            : [activeFeature]
          : [output];
  return {
    order,
    visible,
    output,
    displayChannel,
    detail,
    sources,
    activeFeature,
    featureOrder,
    products,
  };
}
