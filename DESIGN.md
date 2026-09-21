# Layerwise design guide

A reusable starting point for transformer, CNN, VAE and other model walkthroughs.

## Scope and evidence

This guide synthesises the Layerwise transformer experience approved for publication in this conversation (source commit `7a17b1fc8b6e6a330479f2eda904c59640734ca9`, Sites version 20). The user explicitly requested transferring its style to other models. It is a project design reference, not permission to implement or publish a new lesson.

Evidence lives in `.incline/feedback/`. Primary records:

- `layerwise-guided-journey-feedback-20260921`: comprehensiveness without overwhelm, guided token journey, spacing corrections, stable playback, rounding disclaimer and publication approval. Contains the two user screenshots.
- `layerwise-tensor-origins-20260920`: name inputs and their origins; explain residual shortcuts.
- `layerwise-plain-language-20260920` and `layerwise-formula-trial-20260920`: clarify unfamiliar notation while keeping animation explanations concise. Named formulas and worked values are complementary to plain language.
- `layerwise-catchup-20260920`: earlier learning goals and interactions; several entries are historical summaries rather than verbatim quotes.

**Evidence distinction:** explicit feedback governs its stated context. Palette, typography and numeric spacing below are observed implementation choices within the accepted composition, not separately confirmed universal preferences. CNN/VAE adaptations are proposed directions awaiting a rendered trial and user feedback. Earlier records remain intact; this guide does not rewrite the taste profile or personal library.

## Design thesis

Make an unfamiliar computation legible by following a concrete piece of data, showing what changes and why, and keeping deeper explanations available on demand. Preserve a calm, dark mathematical canvas with one dominant visual operation. The main learning path should be understandable without opening every disclosure.

Transfer the teaching relationships as well as the appearance: persistent selection, named inputs, visible transformation, explained output and a clear next action.

## The lesson contract

1. **Orient briefly.** State what the learner will follow and what they will understand. Explain the repeated rhythm; avoid a tour of every control before it is useful.
2. **Ask one question.** Use the selected example in the question. Add one short “Watch for” cue directing attention to the important change.
3. **Show the operation.** Start paused. Let the learner play, pause, replay or scrub; keep selection consistent across the diagram and local controls.
4. **Give one takeaway.** State the essential idea in a short heading and one or two sentences.
5. **Offer continuation.** Put Back / Next step before optional reference material. Navigation should bring the new lesson heading into view. Playback must not advance the lesson automatically.
6. **Allow deeper inspection.** Retain the full explanation behind purposeful questions:
   - Where did these inputs come from? Names, origins and links to earlier steps.
   - How do the dimensions fit? Numeric shapes, symbolic axes, definitions and a worked example.
   - How would I write this? Clearly labelled pseudocode linked to the visual operation.
   - How was this number calculated? Operands, selected coordinates and arithmetic.

Include occasional optional prediction checks at a conceptual boundary. Explain the answer; do not gate progress or treat clicking through as evidence of mastery.

## Visual baseline

Reuse the current CSS and components when working inside Layerwise. These values describe the current baseline; adjust only when the new content or responsive layout requires it.

| Role | Current treatment |
| --- | --- |
| Page | Dark background `#0d1318` |
| Panels | Subtle surface `#111a21`, borders `#25313a` |
| Text | Primary `#e5eaf0`, secondary `#98a6af` |
| Emphasis | Mint `#7cdbcf`; gold `#e7b978` and purple `#b8a7ef` for selected categorical distinctions |
| Typography | Geist for interface/body; Georgia for prominent lesson and takeaway headings; monospace for code/shapes |
| Layout | Architecture navigation beside one main lesson on desktop; adapt navigation and stack content on narrow screens |
| Detail sections | Restrained borders, approximately 8px corners, descriptive summary and visible expand/collapse sign |
| Takeaway | Thin mint left rule, short heading and supporting sentence |

Avoid making every paragraph, control or panel equally prominent. Keep the primary focus on the current operation; reveal display controls and technical detail when requested. Do not add a 3D scene purely to imitate another project. Use it when a spatial relationship becomes easier to understand.

## Spacing and control stability

The user explicitly called out crowding and movement in controls. Preserve these relationships:

- Leave breathing room between explanatory text and the divider that starts a new region. Current paragraph-to-Inputs & Output gap: **24px**.
- Separate playback controls from the instruction underneath. Current gap: **18px**.
- Use **Play / Pause / Replay** with a stable control footprint. Current width: **108px**. The slider must not jump when the label changes.
- Keep labels close to their own selectors, with enough separation to distinguish adjacent controls.
- Avoid large unexplained gaps between a computed row and its expansion into the complete result. Group by meaning, not by adding whitespace everywhere.

These pixel values are implementation baselines chosen by the agent in response to feedback, not universal user preferences.

## Animation and numerical honesty

- Distinguish rearrangement from computation: keep cell identity and values intact for reshape/permute; show the operands and resulting values for arithmetic.
- Demonstrate one manageable operation before extending it to the full tensor. Preserve a visual connection during that expansion rather than abruptly replacing the scene.
- Keep animations seekable. Scrubbing should show the correct state at any point; replay should return to a coherent beginning.
- Label complete-result shortcuts explicitly. Skipping an animation is different from advancing a lesson.
- Show a consistent colour scale for comparable values. Selection adds emphasis without silently changing the scale. Explicit focus mode may dim surrounding values.
- Do not rely on colour alone: retain axis names, coordinates, labels and selection outlines.
- Explain each input’s contents and origin; identify learned parameters separately from activations produced by an earlier step.
- Define symbols near their use. Prefer a named formula and selected numerical example over unexplained shorthand or a long paragraph inside the animation.
- State that displayed values are rounded and calculations use full precision. Apparent discrepancies such as −1.05 + (−0.05) displaying −1.09 should not look like bugs.
- Identify toy or untrained weights, simplified inputs, fixed seeds and other teaching assumptions. Never imply that an illustrative result is a trained model’s learned behaviour.

## Adapting to another model

Preserve the lesson contract; choose a truthful unit of attention for the architecture. A transformer token is not a universal metaphor, and twelve steps is not a required lesson length.

| Design decision | Transformer baseline | CNN proposal | VAE proposal |
| --- | --- | --- | --- |
| What to follow | A token’s representation | A selected output location and the input patch that contributes to it | An example’s encoding, latent sample and reconstruction |
| Main visual | Feature rows, heads and attention matrices | Image patches, kernels and feature maps | Encoder features, latent distribution, sample and decoder output |
| First local operation | Selected row or feature | One kernel placement producing one output value | One latent coordinate and its sampling calculation |
| Expansion | Other tokens and heads | Other spatial positions and output channels | Other latent coordinates and the complete reconstruction |
| Shape vocabulary | Batch, tokens, heads, features | Batch, channels, height, width; state the actual axis order | Batch, feature/latent dimensions and image axes where relevant |
| Useful prediction | Does reshaping change values? | What changes in the output grid when stride increases? | Does using the same encoded distribution require the same sample? |

**CNN boundaries:** follow contributions and receptive fields; do not suggest one input pixel remains an identifiable pixel through every layer. Make kernel weights distinct from image values. Explain padding, stride, channels and aggregation when introduced. Expand one demonstrated output calculation across the feature map before adding more channels. Describe pooling only if the chosen architecture includes it.

**VAE boundaries:** distinguish the distribution parameters from the sampled latent vector and from the reconstruction. State the parameterisation used by the implementation (for example, standard deviation versus log variance) before showing arithmetic. Make randomness visible and reproducible for inspection. Separate the inference walkthrough from an optional training explanation; do not imply that reconstruction and regularisation losses are sequential inference layers. Label untrained reconstructions honestly.

These are design proposals. The `/cnn` lesson now extends the accepted convolution trial into a complete small CNN forward pass; the extended journey awaits user evaluation. VAE remains unimplemented. Verify model-specific calculations against the chosen implementation when building them.

## Reuse and evaluation

Start each new model with one representative, difficult operation. Adapt the current lesson shell and reference disclosures; create model-specific diagrams and calculation data. Show the user that operation before expanding to a full curriculum.

Review whether a learner can tell what is being followed, identify each input’s origin, distinguish changed values from changed arrangement, explain one output, and find the next action without reading everything. Check longer text, narrow screens, keyboard access, reduced motion and stable playback controls. Horizontal scrolling is preferable to shrinking numerical labels until unreadable.

Use real feedback to revise this guide. Capture exact user reactions and before/after evidence in Incline; keep inferred explanations provisional. Passing a build is not evidence of learning effectiveness.

## Starting prompt for a future lesson

> Use Layerwise’s DESIGN.md and its relevant local Incline feedback as the design reference. Preserve the question → transformation → takeaway flow, optional depth, numerical honesty and stable controls. Adapt the followed data and diagrams to the selected model. Start with one representative operation, and distinguish inherited design decisions from new proposals.

## Verification and limits

The current transformer layout and several interactions were inspected in this conversation at desktop and narrow widths before publication. This guide also uses current CSS/source and the local journal. The local CNN convolution trial was subsequently built and inspected at desktop and narrow widths; user feedback on that transfer is still pending. No VAE interface has been built. This document is an agent synthesis requested by the user; it has not received separate line-by-line approval.
