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

## Numeric shape follow-up

Each tensor now shows its concrete numeric array directly above the corresponding symbolic array. The nearby legend only explains symbol meanings, without repeating sizes. Compiler and production build passed.

## Guided token journey trial — 2026-09-21

Replaced the multi-page orientation with a short token-journey introduction. Each step now has a token-specific question, a watch-for cue, a concise takeaway, and onward navigation before optional reference material. Inputs/origins, dimensions/glossary, pseudocode, and the cell inspector use question-labelled disclosures. Display controls and the separate full results on reshape/permute/score steps are collapsed initially. Three optional intuition checks provide immediate explanatory feedback. Selected tokens persist through step navigation; reference disclosures reset on a new step. Numerical model unchanged.

Verified: TypeScript and production build; browser checks for welcome dismissal, token selection and continuity, dimension expansion, input-origin navigation, intuition feedback, and narrow-screen layout. Trial is local; hosted site has not been updated.

Lint: the new journey metadata, orientation and intuition-check files pass. Existing lint findings remain in the page (effect state update, internal anchor, group role) and tensor-flow SVG role.
