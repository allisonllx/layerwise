# Layerwise

**Understand a neural network by following the data through it.**

Layerwise is an interactive learning tool for exploring neural network architectures, tensor dimensions, and the calculations behind each layer. The first prototype walks through a small decoder transformer, from word embeddings to next-token probabilities.

It grew out of a practical learning problem: architecture diagrams show the blocks, but it can still be hard to understand what a tensor represents, why its shape changes, or how a reshape differs from a permutation.

[Open the hosted demo](https://layerwise.allisonlixuan.chatgpt.site/) — currently private; access is restricted to the owner. You can run the app locally using the instructions below.

## Explore the transformer

- **An expandable architecture map:** jump between embeddings, attention, residual connections, the feed-forward network, and output.
- **Twelve connected steps:** move forward and backward at your own pace. Split heads, permute, and attention scores include an explicit transformation player with pause, replay, and a scrubber; playback never advances the lesson.
- **Numeric and symbolic shapes:** see `[1, 3, 6, 4]` alongside `[B, H, Tq, F]`, with a nearby key explaining each axis.
- **Token tracking:** select a word or matrix cell to inspect its values and calculations.
- **Comparable heatmaps:** All tokens preserves a shared colour scale across rows and heads. Focus token explicitly dims other rows.
- **Attention internals:** explore queries, keys, values, head splitting, axis permutation, scores, causal masking, and weighted value mixtures.
- **Feed-forward stages:** inspect normalisation, expansion from 12 to 48 features, GELU activation, and compression back to 12.
- **Contextual explanations:** named rows and columns, symbol definitions, worked dimension examples, and clearly labelled pseudocode.
- **A quick orientation:** a skippable guide introduces the architecture, grids, dimensions, and heatmap controls.

Choose among sentences containing 4, 6, or 8 tokens to see how the token dimensions change throughout the model. Diagrams support zoom and horizontal scrolling on smaller screens.

## About the model

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
  page.tsx                  Lesson navigation and interaction state
  globals.css               Layout, visual styling, and responsive behaviour
components/
  tensor-canvas.tsx         Tensor grids and calculation inspection
  tensor-shape.tsx          Numeric shapes, symbolic axes, and legend
  operation-guide.tsx       Dimension examples and symbol explanations
  orientation.tsx           Introductory walkthrough
lib/
  transformer.ts            Numeric model and lesson content
  heatmap.ts                Shared heatmap colour mapping
```

## Current scope

This is an exploratory learning prototype focused on one small transformer. It does not yet import model files or papers, simulate training, or provide CNN, VAE, image, or video lessons. The current visualisations use interactive 2D grids and animations.

Future directions include additional architectures, richer input examples, and connecting a paper’s architecture to its implementation. Feedback on what remains confusing is especially useful for shaping those lessons.
