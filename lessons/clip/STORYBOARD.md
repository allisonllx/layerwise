# CLIP paced lesson trial

The earlier 32-second Watch/Explore split is superseded. User feedback found the two modes redundant and contrastive learning insufficiently visualized. The approved revision preserves the examples and palette but adopts the CNN/Transformer lesson rhythm.

## Six steps

1. Supplied image/text features → separate linear encoders → unit vectors.
2. Inspect coordinate products for one cosine similarity, then the batch matrix.
3. Identify known pairs in either direction. Reordering captions moves the targets with their identities.
4. Similarities → fixed scaled logits → row/column softmax → negative log target probability → mean of six penalties.
5. Backpropagate through the symmetric objective and normalization into both weight matrices. Inspect a selected gradient, the SGD update and recomputed loss/matrix. Scrubbing reverses the demonstration; “Inspect next update” moves to the next computed snapshot.
6. Fixed encoders after 40 updates compare a held-out toy feature vector with candidate descriptions. Removing a candidate renormalizes the probabilities without changing weights.

Every step starts paused. Play/Pause/Replay and the slider control only that step. Back/Next precede optional origins, dimensions, arithmetic and pseudocode. Mobile uses a step selector. Selection is retained across the training steps.

## Numerical boundaries

Features are hand-picked inputs, not outputs of image decoding or text tokenization. Both 3×3 encoder matrices are actually trained on three pairs with analytic gradients, a fixed scale of 5 and plain SGD with learning rate 0.1. Real CLIP uses richer encoders/projections and learns a temperature. This is a CLIP-style objective, not a reproduction of its complete training recipe or a pretrained checkpoint. No narrated video is generated.

## Checks

`node scripts/check-clip.cjs` independently checks all 18 gradients at two training snapshots using central differences, checks the uniform-score loss equals ln(3), verifies unit vectors and normalized probabilities, descent across 40 updates, and candidate subset/reordering behavior.

## References

- [Original CLIP paper](https://arxiv.org/abs/2103.00020): paired image/text training and transfer through candidate descriptions.
- [Official implementation](https://github.com/openai/CLIP): encoder representations, normalization and similarity-based inference.

The interface is a trial awaiting feedback; numerical and browser checks do not establish learning effectiveness.
