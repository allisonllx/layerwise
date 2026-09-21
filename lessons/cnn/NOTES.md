# Complete CNN walkthrough

Extends the accepted convolution trial into seven connected steps: image input, convolution, ReLU, max pooling, flatten, dense logits and softmax. The local route is `/cnn`.

Architecture: a 6 × 6 grayscale input; two hand-chosen 3 × 3 kernels with zero bias and no padding; elementwise ReLU; 2 × 2 max pooling at stride 2; channel-major flattening; a fixed illustrative dense layer; two-class softmax. The user can select three images and convolution stride 1/2. Dense weights follow a fixed channel-based rule so the 8-feature and 2-feature configurations both work. This is a demonstration architecture, not a trained classifier.

Preserved design: question → manual animation → takeaway → navigation before optional detail, numeric and symbolic coloured dimensions, readable spacing, fixed-width playback and rounding disclosure. The convolution component keeps the accepted visual. Other stages expose real source/output values and selected calculations; Class A/B are explicitly illustrative.

Checks cover independent pooling and constant-image fixtures, channel-major ordering, all example/stride combinations, normalised softmax and all inspectable coordinates. Existing transformer regression checks remain applicable. Browser verification checks stage handoffs and selection, both channels, stride changes, replay/seek and responsive layouts. User evaluation of the complete journey is still pending.

Scope: one small CNN forward pass, not training, backpropagation, arbitrary uploaded images or a deeper architecture. Retain input-pixel contributions rather than implying a pixel keeps its identity after pooling.
