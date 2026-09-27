import recording from './recording.json';
export const data = recording;
export const timeOptions = [10, 40, 80] as const;
export type NoiseTime = (typeof timeOptions)[number];
export const steps = [
  {
    name: 'Add noise',
    id: 'noise-schedule',
    question: 'What does it mean to turn an image into noise?',
    cue: 'Follow one pixel as the signal fades and the noise contribution grows.',
    takeaway: 'The noise level is known during training.',
    text: 'We choose a timestep and draw Gaussian noise. A known formula mixes the clean image with that noise, creating both the input and its training target.',
    code: 't = sample_timestep()\nepsilon = gaussian_noise_like(clean)\nnoisy = sqrt(alpha_bar[t]) * clean\n      + sqrt(1 - alpha_bar[t]) * epsilon',
  },
  {
    name: 'Inside the U-Net',
    id: 'unet',
    question: 'How does the denoiser combine context and detail?',
    cue: 'Shrink a feature map, expand it, then reconnect the earlier high-resolution features.',
    takeaway: 'A smaller view for context. A shortcut for detail.',
    text: 'This small encoder–decoder combines a downsampled path with an 8 × 8 skip connection. It predicts one noise value per input pixel. The timestep tells it which noise level it is handling.',
    code: 'encoded = encoder(concat(noisy, time_plane))\nsmall = average_pool(encoded)\ncontext = bottleneck(small)\nlarge = nearest_upsample(context)\njoined = concat(large, encoded, channels)\npredicted_noise = output(decoder(joined))',
  },
  {
    name: 'Measure the error',
    id: 'noise-prediction',
    question: 'What should the U-Net learn to predict?',
    cue: 'Compare the predicted noise with the noise we deliberately added—not with a digit label.',
    takeaway: 'The sampled noise is the target.',
    text: 'The loss averages squared prediction errors over all pixels and examples in a training batch. A digit label is never supplied to this unconditional model.',
    code: 'predicted_noise = unet(noisy, t)\nloss = mean((predicted_noise - epsilon) ** 2)\n# The target is epsilon, not the clean image or its label.',
  },
  {
    name: 'Learn the denoiser',
    id: 'training',
    question: 'What changes while the model learns?',
    cue: 'Weights change across optimizer updates. Timesteps are resampled inside each training batch.',
    takeaway: 'Training updates and diffusion timesteps are different.',
    text: 'An optimizer update learns from a batch of noisy examples. A diffusion timestep specifies a noise level. This recorded run trained one network across many noise levels, rather than training a separate network for each step.',
    code: 'for update in range(4000):\n    clean = sample_training_batch(128)\n    t, epsilon = sample_timesteps_and_noise()\n    loss = noise_prediction_loss(clean, t, epsilon)\n    loss.backward()\n    adam.step()\n    adam.zero_grad()',
  },
  {
    name: 'Take a reverse step',
    id: 'reverse-step',
    question: 'How does one noise prediction move a sample forward?',
    cue: 'Use the predicted noise to estimate the clean image, form a reverse-step mean, then add the scheduled randomness.',
    takeaway: 'One prediction informs one sampling step.',
    text: 'The denoiser predicts noise; the sampler calculates the next image. This DDPM sampler uses a clipped clean estimate and a posterior variance. At the last step, no fresh noise is added.',
    code: 'noise_hat = unet(x_t, t)\nclean_hat = clip((x_t - sqrt(1-a_bar[t])*noise_hat)\n                 / sqrt(a_bar[t]), -1, 1)\nmean = c1[t]*clean_hat + c2[t]*x_t\nx_previous = mean + sqrt(variance[t])*z\n# z = 0 at t = 1; weights stay fixed',
  },
  {
    name: 'Generate from noise',
    id: 'generation',
    question: 'Can the same network make a new sample?',
    cue: 'Start from fresh Gaussian noise and reuse the trained U-Net at every reverse step.',
    takeaway: 'Generation starts without a reference image.',
    text: 'The selected seed controls the initial noise and later random draws. This is a recorded 100-step sampling run, not a reversal of one of the training images. The tiny model produces imperfect digit-like samples.',
    code: 'x = gaussian_noise(seed)\nfor t in reversed(range(1, 101)):\n    x = ddpm_step(x, unet(x, t), t)\n# No target, loss, gradient or weight update during sampling.',
  },
];
export function noisyImage(example: number, t: number) {
  const e = data.examples[example],
    signal = Math.sqrt(data.alphaBar[t]),
    noise = Math.sqrt(1 - data.alphaBar[t]);
  return e.clean.map((x, i) => signal * x + noise * e.noise[i]);
}
export function errors(example: number, t: number) {
  const e = data.examples[example];
  return e.noise.map((x, i) => (e.predictions[t - 1][i] - x) ** 2);
}
export function average(xs: number[]) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
export function reverseTerms(seed: number, t: number, pixel: number) {
  const s = data.samples[seed],
    k = 100 - t,
    x = s.frames[k][pixel],
    pred = s.predictions[k][pixel];
  const a = data.alphaBar[t],
    previous = data.alphaBar[t - 1],
    beta = data.beta[t];
  const estimate = (x - Math.sqrt(1 - a) * pred) / Math.sqrt(a);
  const clean = Math.max(-1, Math.min(1, estimate));
  const c1 = (Math.sqrt(previous) * beta) / (1 - a),
    c2 = (Math.sqrt(1 - beta) * (1 - previous)) / (1 - a);
  const variance = (beta * (1 - previous)) / (1 - a),
    mean = c1 * clean + c2 * x,
    z = s.innovations[k][pixel];
  return {
    x,
    pred,
    estimate,
    clean,
    c1,
    c2,
    variance,
    mean,
    z,
    next: mean + Math.sqrt(variance) * z,
  };
}
export const unetStages = [
  {
    name: 'Encode',
    shape: '16 × 8 × 8',
    side: 8,
    channels: 16,
    detail:
      'Two 3 × 3 convolutions turn the noisy image and timestep plane into 16 feature maps. Keep these maps for the skip connection.',
  },
  {
    name: 'Downsample',
    shape: '16 × 4 × 4',
    side: 4,
    channels: 16,
    detail:
      'Average each 2 × 2 window. The spatial dimensions halve; the 16 channels remain.',
  },
  {
    name: 'Bottleneck',
    shape: '32 × 4 × 4',
    side: 4,
    channels: 32,
    detail:
      'Two more convolutions process the smaller spatial grid, producing 32 channels of context.',
  },
  {
    name: 'Upsample',
    shape: '32 × 8 × 8',
    side: 8,
    channels: 32,
    detail:
      'Nearest-neighbor upsampling repeats each value over a 2 × 2 area. It enlarges the map without inventing new fine detail.',
  },
  {
    name: 'Join the skip',
    shape: '48 × 8 × 8',
    side: 8,
    channels: 48,
    detail:
      'Concatenate 32 upsampled channels with the 16 encoder channels. Channels 0–31 come from the bottleneck path; 32–47 come from the skip. This is not addition.',
  },
  {
    name: 'Decode',
    shape: '16 × 8 × 8',
    side: 8,
    channels: 16,
    detail:
      'Convolutions mix the joined features. A final 1 × 1 convolution then maps these 16 channels to one 8 × 8 noise prediction.',
  },
];
