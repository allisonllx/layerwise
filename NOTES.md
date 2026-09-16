# Prototype handoff

Question: does following a token through named tensor axes and real calculations make a transformer easier to learn?

Implemented: twelve connected steps, three sentence lengths, Q/K/V selection, MLP substeps, causal masking, selectable values, numerical inspector, code, replay, automatic playback, keyboard navigation, diagram zoom, and expandable architecture. Mobile diagrams scroll horizontally to keep values legible. Reduced-motion settings are respected.

Verified: TypeScript, deployment build, hand-calculated matrix multiply and transpose; tensor dimensions, head-value preservation, causal masking, softmax row sums, finite probabilities, and independence from future tokens for all example lengths.

Limitations: deterministic untrained weights, simplified word tokenisation, no imported model or training simulation. Dropout is labelled at its actual positions and disabled in inference. This is the first transformer lesson; image/video/CNN/VAE lessons remain future scope. WebMCP navigation is feature-detected; no supported WebMCP validation context was available, so that optional integration is unverified. Browser interaction and visual QA were not performed.

## Feedback update — 2026-09-16

Added always-visible axis labels and per-step symbol explanations, including named Q × Kᵀ and A × V dimension examples. Code panels explicitly contain Python-like pseudocode, not runnable PyTorch.

All tokens is the default heatmap view. Selection only changes the outline; Focus token explicitly dims other rows. A signed colour scale is shared across every row/head in a step, with a fixed 0–1 scale for probabilities. The output supports a full token × vocabulary heatmap as well as the focused bar chart.

A skippable, replayable four-part orientation moves through embedding, head layout, attention dimensions, and masked attention. The ordinary lesson now starts at step one.

Verified via server-rendered component checks for every step and example length: full-view selection leaves all cell fills/opacities unchanged, all steps render with named axes and glossary entries, signed values differ, explicit focus dims, and all four orientation cards render. TypeScript passes. No browser interaction or visual QA was performed in this update.

## Browser comment follow-up — 2026-09-16

Define 4 as query/key features per head beside the attention scaling factor. Replace grid direction arrows with explicit Rows / Columns labels. Render compact symbolic input/output shapes and a shared visible key with current sizes; distinguish Tq query positions from Tk key positions even when their counts match. Checks cover all steps and all sentence lengths, including Q/K-transpose axis order and F = 4. Compiler and production build passed.
