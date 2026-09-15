# Prototype handoff

Question: does following a token through named tensor axes and real calculations make a transformer easier to learn?

Implemented: twelve connected steps, three sentence lengths, Q/K/V selection, MLP substeps, causal masking, selectable values, numerical inspector, code, replay, automatic playback, keyboard navigation, diagram zoom, and expandable architecture. Mobile diagrams scroll horizontally to keep values legible. Reduced-motion settings are respected.

Verified: TypeScript, deployment build, hand-calculated matrix multiply and transpose; tensor dimensions, head-value preservation, causal masking, softmax row sums, finite probabilities, and independence from future tokens for all example lengths.

Limitations: deterministic untrained weights, simplified word tokenisation, no imported model or training simulation. Dropout is labelled at its actual positions and disabled in inference. This is the first transformer lesson; image/video/CNN/VAE lessons remain future scope. WebMCP navigation is feature-detected; no supported WebMCP validation context was available, so that optional integration is unverified. Browser interaction and visual QA were not performed.
