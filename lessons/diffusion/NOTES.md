# Diffusion lesson trial

## Scope and provenance

A self-paced DDPM lesson, using a genuinely trained small U-Net and recorded numerical outputs. The first four steps explain training; the final two explain sampling with frozen weights. This is an unconditional image-generation example, not a classifier, text-to-image system or reproduction of the original DDPM architecture.

- Data: [scikit-learn digits](https://scikit-learn.org/stable/modules/generated/sklearn.datasets.load_digits.html), the UCI optical recognition handwritten-digit dataset. 1,797 images, each 8 × 8; pixel range 0–16 mapped to −1–1. This is not MNIST.
- Split: NumPy generator seed 27 permutes indices; first 1,500 train, remaining 297 held out. Labels select display examples only and never enter training.
- Backbone: 25,777 parameters, SiLU convolutions, average pooling, nearest-neighbor upsampling, one concatenative skip, and a constant timestep plane. No attention, class conditioning or positional/time embeddings.
- Training: PyTorch 2.9.0, CPU, seed 27, batch 128, Adam at 0.001, 4,000 updates, uniformly sampled timesteps 1–100 and standard Gaussian noise. Objective: mean squared noise-prediction error.
- Fixed held-out diagnostic: one fixed timestep and noise draw per held-out image, generator seed 991. MSE fell from 1.01654 to 0.16463. This checks noise prediction, not perceptual sample quality or a claim of generalization.
- Schedule: cosine cumulative signal curve, offset 0.008, individual beta capped at 0.999; based on [Improved DDPM](https://arxiv.org/abs/2102.09672).
- Sampling: three seeds (41, 42, 43), each 100 stochastic DDPM posterior steps. Predicted clean images are clipped to −1–1; posterior variance is fixed by the schedule; no fresh noise at t=1. There is no reference image during generation.

See the [original DDPM paper and project](https://hojonathanho.github.io/diffusion/) for the full method. This smaller architecture and schedule are teaching choices, not a faithful benchmark reproduction.

## Recording contract

`recording.json` contains schedule coefficients, clean/noise examples, trained noise predictions, U-Net activations at t=10/40/80, a recorded diagnostic curve, and generation frames, means, predictions and innovations. Metadata includes the checkpoint SHA256. `scripts/train-diffusion.py` reproduces training and exports this data; the checkpoint stays outside the application.

The noise-level scrubber holds epsilon fixed to compare forward marginals. It is not a sampled forward Markov trajectory. The U-Net view shows actual activations from the trained network; changing channels does not retrain it. The loss plot is a recording. Generation replays actual sampler outputs, not interpolation toward a chosen digit.

Values are exported to seven decimal places; displayed arithmetic uses three. Tiny rounding differences remain. Grayscale images saturate outside −1–1, signed colors outside ±3, error colors above 4; calculations retain the recorded values. Toy samples are intentionally shown without claims of legibility or quality.

## Verification

`node scripts/check-diffusion.cjs` independently checks every recorded reverse step and posterior mean, the zero-noise last step, feature dimensions, average pooling, nearest-neighbor upsampling and exact skip concatenation. Browser checks cover all six routes/states, playback and responsive layouts.

## U-Net overview iteration

Step 2 retains a U-shaped architecture map during inspection. The final 15% of playback reveals channel-0 previews across the complete map and folds away the detail panel. Clicking any stage returns to its channel inspector. The diagram represents the actual single-downsample teaching model, with a concatenative encoder skip, rather than adding untrained levels from a larger U-Net.

The architecture overview now uses proportional feature-map stacks: spatial dimensions determine the face size and channel count determines stack depth. Representative sheets do not enumerate every channel. The encoder skip is a separate lavender connector. Narrow screens can pan the diagram horizontally to preserve readable labels.

During stage inspection, gold marks changed dimension labels and matching stack edges: the front face for height/width changes, the depth edges for channel-count changes. A textual before/after readout provides the same information without relying on color. The encoder comparison starts from the 2-channel image-plus-time input.
