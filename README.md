# Layerwise

**Understand a neural network by following the data through it.**

Layerwise is an interactive learning tool for exploring neural network architectures, tensor dimensions, and the calculations behind each layer. The transformer lesson walks through a small decoder transformer, from word embeddings to next-token probabilities. A separate CNN trial applies the same teaching style to one convolution.

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

## CNN trial

Open `/cnn` locally, or use the model switcher. Follow a selected 3 × 3 input patch through multiplication and summation, then expand to the complete feature map. The trial uses a 6 × 6 grayscale image, one input/output channel, hand-chosen contrast filters, zero bias and no padding.

Choose another output cell, compare the two filters, or change stride from 1 to 2 inside the dimensions disclosure. The displayed patch, arithmetic and shapes update together. Playback starts paused and pauses when the canvas leaves the viewport or the tab is hidden. The main path keeps the transformer’s question → animation → takeaway rhythm, with input origins, dimensions, pseudocode and arithmetic available on demand.

This tests the design transfer with one representative operation. It is not yet a full CNN lesson with activations, pooling, multiple channels and classification.

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
  cnn/page.tsx              CNN trial route (/cnn)
  globals.css               Shared visual language and existing lesson styles
lessons/
  transformer/
    lesson.tsx              Transformer navigation and interaction state
    components/             Tensor diagrams, players, guides and inspection
    lib/                    Transformer computation, transitions and journey copy
  cnn/
    lesson.tsx              Guided convolution trial and interactive diagrams
    model.ts                Teaching image, kernels and numerical convolution
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

This is an exploratory learning prototype with a twelve-step transformer lesson and a focused convolution trial. It does not yet import model files or papers, simulate training, or provide a full CNN pipeline, VAE, or video lesson. The current visualisations use interactive 2D grids and animations.

Future directions include additional architectures, richer input examples, and connecting a paper’s architecture to its implementation. Feedback on what remains confusing is especially useful for shaping those lessons.

### Validate guided calculations

Run `node scripts/check-transitions.cjs` to check every new transition against the model across all examples, tokens, heads, projection choices and MLP stages.

Run `node scripts/check-cnn.cjs` for independent convolution fixtures covering both kernel orientations, the complete feature map, stride and boundary patches.
