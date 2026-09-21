# Layerwise

**Understand a neural network by following the data through it.**

Layerwise is an interactive learning tool for exploring neural network architectures, tensor dimensions, and the calculations behind each layer. The transformer lesson walks through a small decoder transformer, from word embeddings to next-token probabilities. A separate CNN walkthrough follows a complete small classifier from pixels to probabilities.

It grew out of a practical learning problem: architecture diagrams show the blocks, but it can still be hard to understand what a tensor represents, why its shape changes, or how a reshape differs from a permutation.

[Open the hosted demo](https://layerwise.allisonlixuan.chatgpt.site/) — currently private; access is restricted to the owner. You can run the app locally using the instructions below.

## Follow a token through the transformer

Start with a short introduction, then choose a token to follow through twelve connected steps. Its word stays the same while its numerical representation changes. The selected token stays with you as you navigate.

Each step follows the same rhythm:

1. **Read the question** and the short “Watch for” cue.
2. **Explore the animation** using Play, Pause, Replay, or the scrubber. Playback never advances the lesson; multi-operation steps also let you select individual stages.
3. **Read the takeaway**, then move to the next step when you are ready.

The full explanations remain available under **Go a little deeper**:

- **Where did these inputs come from?** names the tensors and links to the steps that produced them, including residual shortcuts.
- **How do the dimensions fit?** shows numeric and symbolic shapes, axis meanings, and worked dimension examples.
- **How would I write this?** connects the operation to Python-like pseudocode.
- **How was this number calculated?** lets you inspect individual results using a cell selection or coordinates.

Optional intuition checks at head splitting, causal masking, and weighted value mixing give immediate explanatory feedback. They are not required to continue.

### What you can explore

- **Architecture:** jump between embeddings, attention, residual connections, the feed-forward network, and output using the expandable map.
- **Attention:** inspect queries, keys, values, head splitting, axis permutation, scores, masking, softmax, and weighted value mixtures.
- **Feed-forward stages:** explore normalisation, expansion from 12 to 48 features, GELU activation, and compression back to 12.
- **Complete results:** use Skip to result in guided players, or expand Explore the complete result beneath the reshape, permutation, and attention-score animations.
- **Display options:** reveal numeric values, zoom, or choose between All tokens and Focus token. All tokens preserves a shared colour scale across rows and heads; Focus token explicitly dims other rows.

Choose among sentences containing 4, 6, or 8 tokens to see how sequence length changes the tensor dimensions. Use the Back and Next step buttons or the left/right arrow keys to navigate. Diagrams support horizontal scrolling on smaller screens, and animations respect reduced-motion settings.

Displayed numbers are rounded, while calculations use full precision. The rounded operands may therefore appear not to add up to the displayed result—for example, −1.05 + (−0.05) may show a result of −1.09.

## Follow an image through a CNN

Open `/cnn`, or use the model switcher. Seven connected stages follow **image input → convolution → ReLU → max pooling → flatten → class scores → softmax**. Each stage uses the actual numerical output of the previous one.

The example has a 6 × 6 grayscale input, two hand-chosen 3 × 3 contrast filters, no convolution padding, zero convolution bias, 2 × 2 max pooling with stride 2, and a fixed dense layer with two illustrative classes. Three input examples and convolution stride 1/2 let you see how the whole forward pass changes. Stride 1 produces eight flattened features; stride 2 produces two. The illustrative dense weights follow the same per-channel rule for either size; this is a teaching setup, not resizing a trained classifier.

Inspect either channel, follow a convolution cell through ReLU and its pooling window, then locate its value in the flattened vector. Select a class or feature in the dense stage to inspect its contribution. Softmax shows shifting, exponentiation and normalisation. Class A/B are demonstration labels and the untrained model’s probabilities are not meaningful predictions.

Playback starts paused, supports scrubbing and complete-result shortcuts, and pauses when the canvas leaves view or the tab is hidden. Each step retains optional origins, coloured dimensions, pseudocode and arithmetic. Prediction checks ask about ReLU, flattening and confidence without blocking navigation.

## About the transformer model

All numerical calculations run in the browser using deterministic, **untrained illustrative weights**.

| Setting | Value |
| --- | --- |
| Architecture | Pre-normalisation decoder transformer |
| Transformer blocks | 1 |
| Batch size | 1 sequence |
| Model features | 12 per token |
| Attention heads | 3 |
| Features per head | 4 |
| Feed-forward hidden features | 48 |
| Toy vocabulary | 12 entries |
| Tokenisation | Simplified word-level tokens |
| Dropout | Shown at its locations; disabled during inference |

The model demonstrates computations, not learned language understanding. Its next-token probabilities are not meaningful predictions. The displayed code is Python-like pseudocode, not a runnable PyTorch implementation.

## Run locally

Requires **Node.js 22.13.0 or newer** and npm.

```sh
git clone https://github.com/allisonllx/layerwise.git
cd layerwise
npm ci
npm run dev
```

Open the local URL printed in the terminal, normally `http://localhost:3000`.

No model download or inference API key is needed.

### Development commands

```sh
npm run build     # Create the production build
npm run start     # Serve the built Worker locally with Wrangler
npm run lint      # Run the configured linter
npm run format    # Format the project
npx tsc --noEmit  # Check TypeScript types
```

Run `npm run build` before `npm run start`.

## Built with

React, TypeScript, Vinext/Vite, Tailwind CSS, SVG visualisations, and Lucide icons. The project includes shadcn/Base UI components and Cloudflare Workers tooling. The hosted version uses Sites; its configuration is in `.openai/hosting.json`.

## Project structure

```text
app/
  page.tsx                  Transformer route (/)
  cnn/page.tsx              CNN walkthrough route (/cnn)
  globals.css               Shared visual language and existing lesson styles
lessons/
  transformer/
    lesson.tsx              Transformer navigation and interaction state
    components/             Tensor diagrams, players, guides and inspection
    lib/                    Transformer computation, transitions and journey copy
  cnn/
    full-lesson.tsx         Seven-stage CNN navigation and shared model state
    lesson.tsx              Preserved convolution animation and explanations
    stage-player.tsx        Other forward-pass operations
    stages.ts               Questions, shape explanations and arithmetic
    model.ts                Images, kernels and complete numerical forward pass
    styles.css              CNN-specific layout
    NOTES.md                Trial question, scope and verification
components/
  lesson-switcher.tsx       Shared model navigation
  ui/                       General UI primitives
lib/
  heatmap.ts                Shared heatmap colour mapping
  utils.ts                  General utilities
DESIGN.md                   Reusable design guide backed by local Incline feedback
```

## Current scope

This is an exploratory learning prototype with a twelve-step transformer lesson and a seven-step CNN walkthrough. It does not yet import model files or papers, simulate training, or provide training, deeper CNN architectures, VAE, or video lessons. The current visualisations use interactive 2D grids and animations.

Future directions include additional architectures, richer input examples, and connecting a paper’s architecture to its implementation. Feedback on what remains confusing is especially useful for shaping those lessons.

### Validate guided calculations

Run `node scripts/check-transitions.cjs` to check every new transition against the model across all examples, tokens, heads, projection choices and MLP stages.

Run `node scripts/check-cnn.cjs` for independent convolution fixtures covering both kernel orientations, the complete feature map, stride and boundary patches.
