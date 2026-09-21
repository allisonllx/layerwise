# CNN design-transfer trial

Question: does Layerwise’s guided question → transformation → takeaway approach make convolution legible without exposing every detail at once?

Scope: one 6 × 6 grayscale image, two alternative hand-chosen 3 × 3 contrast kernels (one active output filter), stride 1 or 2, zero bias and no padding. Follow one output location and its receptive field, calculate nine products and their sum, then repeat across the feature map. No training, activation, pooling, multi-channel computation or classifier is implied.

Run from the repository root with `npm run dev`; visit `/cnn`. The transformer stays at `/`. Model-specific code lives under `lessons/<model>/`; navigation, heatmap helpers and visual baseline remain shared. This deliberately avoids a generic lesson engine before a second full curriculum has established the right abstraction.

Design reference: `DESIGN.md` and local Incline feedback, particularly guided orientation, optional depth, comparable colours, stable Play/Pause/Replay widths, paragraph/divider spacing, and rounding disclosure. New CNN choices are proposals, not user-approved preferences.

Checks: independent numerical fixtures for kernel orientation, signed results, complete feature map, stride and last valid patch; TypeScript/build; new-code lint; existing 5,184 transformer sequences. Browser checks cover pause/replay, seek to result, selected boundary cell, stride reset, alternative filter, route switching, and 390px layout without page overflow. Manual playback changes discrete numerical states rather than moving geometry; a complete-result shortcut is available.

Review next: whether the input-patch outline and matching-weight highlight establish the relationship clearly; whether the nine-product expansion is the right amount of detail; whether the overview-to-map expansion needs slower staging. Learning effectiveness and full CNN curriculum coverage are not established by these technical checks.
