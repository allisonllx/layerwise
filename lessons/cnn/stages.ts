import { type CnnModel, format } from './model';
export const steps = [
  {
    short: 'Image input',
    title: 'An image becomes numbers',
    question: 'What does the network actually receive?',
    watch: 'Brightness becomes a value from 0 to 1 at each pixel.',
    takeaway: 'One image, one channel.',
    idea: 'A grayscale image has one value per location. Batch and channel axes stay explicit even when their sizes are one.',
  },
  {
    short: 'Convolution',
    title: 'Small window. Shared weights',
    question: 'How do nine image values become one feature?',
    watch:
      'Two filters look at the same image. Each produces its own feature map.',
    takeaway: 'Shared weights, different features.',
    idea: 'Each kernel is reused across space. Both output channels continue into the next layer.',
  },
  {
    short: 'ReLU',
    title: 'Keep the positive response',
    question: 'What happens to a negative filter response?',
    watch:
      'Negative values become zero. Positive values keep their value and location.',
    takeaway: 'Change the values, keep the shape.',
    idea: 'ReLU is an activation: max(0, x). It introduces a nonlinear operation between learned layers. It does not combine channels or move cells.',
  },
  {
    short: 'Max pooling',
    title: 'Keep the strongest nearby response',
    question: 'How can four nearby values become one?',
    watch:
      'Each non-overlapping 2 × 2 window contributes its largest value, separately in each channel.',
    takeaway: 'A smaller map, with local evidence.',
    idea: 'Pooling reduces spatial detail. It keeps one maximum per window, not the position of that maximum or the other three values. No weights are learned here.',
  },
  {
    short: 'Flatten',
    title: 'Same values. One ordered list',
    question: 'How do spatial maps connect to a classifier?',
    watch:
      'Read channel 0 row by row, then channel 1. No numbers are added or changed.',
    takeaway: 'Rearrangement is not computation.',
    idea: 'Flatten preserves every pooled value in a fixed order. The batch dimension stays; the channel and spatial dimensions become one feature dimension.',
  },
  {
    short: 'Class scores',
    title: 'Combine evidence into scores',
    question: 'How does each feature contribute to a class?',
    watch:
      'Multiply every feature by its class-specific weight, sum, then add a bias.',
    takeaway: 'Every class gets a weighted sum.',
    idea: 'The dense layer mixes features from both channels. Its outputs are logits: unrestricted scores, not probabilities. These demonstration weights are untrained.',
  },
  {
    short: 'Softmax',
    title: 'Turn scores into a distribution',
    question: 'How do scores become probabilities that sum to one?',
    watch:
      'Subtract the largest score, exponentiate, then divide by the shared total.',
    takeaway: 'Relative scores become probabilities.',
    idea: 'Softmax preserves the ordering of the logits and normalises their exponentials. A large probability from this untrained model is not evidence of an accurate prediction.',
  },
];
export function describeStage(
  model: CnnModel,
  step: number,
  channel: number,
  index: number,
) {
  const side = model.convolution[0].length,
    poolSide = model.pooled[0].length,
    features = model.flattened.length;
  const safeIndex = Math.min(index, side * side - 1);
  const r = Math.floor(safeIndex / side),
    c = safeIndex % side;
  const pr = Math.floor(r / 2),
    pc = Math.floor(c / 2),
    pooledIndex = pr * poolSide + pc;
  const featureIndex = channel * poolSide * poolSide + pooledIndex;
  const patch = model.activated[channel]
    .slice(pr * 2, pr * 2 + 2)
    .flatMap((row) => row.slice(pc * 2, pc * 2 + 2));
  const shapes = [
    '[1, 1, 6, 6]',
    `[1, 2, ${side}, ${side}]`,
    `[1, 2, ${side}, ${side}]`,
    `[1, 2, ${poolSide}, ${poolSide}]`,
    `[1, ${features}]`,
    '[1, 2]',
    '[1, 2]',
  ];
  const origins = [
    'A hand-made grayscale example, already scaled to [0, 1]. The alternate examples transpose or invert the same pixel values.',
    '',
    'The signed feature maps from convolution. Both filters are processed; the channel selector only changes which map you inspect.',
    'The nonnegative feature maps produced by ReLU. Pooling operates independently within each channel.',
    'The two smaller maps from max pooling. Channel order is 0, then 1; row order is top to bottom, column order left to right.',
    'The complete flattened vector from pooling. Each feature has a separate weight for Class A and Class B; the two biases are fixed illustrative parameters.',
    'The two logits from the dense layer. Both logits participate in the same normalisation; these classes are illustrative labels, not learned image categories.',
  ];
  const codes = [
    'X = grayscale_pixels / maximum_pixel_value\nX = X.reshape(batch=1, channels=1, height=6, width=6)',
    '',
    'activated = maximum(0, convolution)',
    'for channel, row, col in pooled_positions:\n    window = activated[channel, 2*row:2*row+2, 2*col:2*col+2]\n    pooled[channel, row, col] = max(window)',
    'features = pooled.reshape(batch=1, features=-1)\n# channel first, then rows, then columns',
    'for class_id in [0, 1]:\n    logits[class_id] = sum(features * weights[:, class_id]) + bias[class_id]',
    'shifted = logits - max(logits)\nexponentials = exp(shifted)\nprobabilities = exponentials / sum(exponentials)',
  ];
  const calculations = [
    `Pixel [${Math.floor(index / 6)}, ${index % 6}] = ${format(model.input[Math.floor(index / 6)][index % 6])}. A value of 0 is dark; 1 is bright. No learned computation has happened yet.`,
    '',
    `ReLU(${format(model.convolution[channel][r][c])}) = max(0, ${format(model.convolution[channel][r][c])}) = ${format(model.activated[channel][r][c])}`,
    `max(${patch.map(format).join(', ')}) = ${format(model.pooled[channel][pr][pc])}`,
    `Channel ${channel}, row ${pr}, column ${pc} → feature ${featureIndex}. Value ${format(model.pooled[channel][pr][pc])} stays ${format(model.flattened[featureIndex])}.`,
    model.logits
      .map(
        (v, cl) =>
          `Class ${cl === 0 ? 'A' : 'B'}: ${model.flattened.map((x, i) => `${format(x)} × (${format(model.weights[i][cl])})`).join(' + ')} + bias (${format(model.bias[cl])}) = ${format(v)}`,
      )
      .join('\n\n'),
    model.logits
      .map(
        (v, cl) =>
          `Class ${cl === 0 ? 'A' : 'B'}: exp(${format(v)} − ${format(Math.max(...model.logits))}) / ${format(model.denominator)} = ${format(model.probabilities[cl])}`,
      )
      .join('\n\n'),
  ];
  return {
    inputShape: step === 0 ? '6 × 6 pixels' : shapes[step - 1],
    outputShape: shapes[step],
    origin: origins[step],
    code: codes[step],
    calculation: calculations[step],
    r: step === 0 ? Math.floor(index / 6) : r,
    c: step === 0 ? index % 6 : c,
    pr,
    pc,
    featureIndex,
    pooledIndex,
    patch,
  };
}
