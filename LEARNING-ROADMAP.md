# Layerwise: from model walkthroughs to a reusable learning skill

Status: exploration plan, updated 26 September 2026. This records the product direction discussed with the user; it does not implement new lessons or establish a universal teaching template.

## Direction and current decisions

The eventual aim is a skill that helps a learner understand an unfamiliar AI/ML model or paper through grounded, interactive explanations. Architecture is one part of that explanation; learning objectives, training procedures and inference behaviour may be equally important.

Agreed direction:

- Test examples with different teaching requirements before extracting the skill. Do not assume a transformer/CNN forward-pass template covers every method.
- Start with CLIP / contrastive learning as the next example.
- Account for prerequisites and explain how a method builds on earlier ideas.
- Explain how a shared architecture or backbone supports different tasks, including changes to heads, targets, losses and inference procedures.
- Preserve Layerwise’s guided, inspectable experience, using DESIGN.md and project-local Incline feedback as references.

Proposals to validate, rather than settled requirements:

- Connected computation, training and inference journeys.
- Optional prerequisite detours with a return to the original step.
- Optional prediction checks rather than a mandatory placement quiz.
- A small, executable training example accompanying the first CLIP lesson.

The target fields and representative papers should be refined with the user. CLIP, DINO, diffusion and a vision-language model are candidate coverage experiments, not an exhaustive taxonomy or a commitment to build everything immediately.

## What the learner needs to understand

For a paper that extends a known method, structure the story around:

1. The problem and the relevant starting point.
2. What the authors kept, replaced or added.
3. Why that change was proposed.
4. How it changes computation, learning or use.
5. What the paper actually demonstrates, including limitations.

Do not force every paper into a baseline-comparison story. Some contributions concern a loss, dataset, training recipe, evaluation or efficiency rather than a new architecture. Attribute claims to the source and separate reported results from explanatory intuition.

## Three connected views

| View | Main question | What to follow |
| --- | --- | --- |
| Computation / architecture | What happens to the input? | A concrete example, tensors, intermediate values and outputs |
| Training | How does the model learn? | A batch, supervision, loss, gradients, parameter updates and the next forward pass |
| Inference / use | What does the trained model do with a new input? | The actual deployment procedure, predictions or generation, with parameters fixed in ordinary inference |

These are related views of the same model, not necessarily three identical chapter lists. Share the selected example where meaningful and make the current parameter snapshot explicit. Existing CNN and transformer lessons use untrained illustrative weights: describe them as computations in an inference-style forward pass, not demonstrations of trained capability.

A standard gradient-based training loop should make these distinctions visible:

- Activations depend on the current input and parameter values.
- The loss scores the current objective; it does not update weights by itself.
- Backpropagation computes gradients of the loss with respect to trainable parameters.
- The optimiser uses gradients, a learning rate and possibly stored state to update parameters.
- A new forward pass recomputes activations using the updated parameters.

Not every learning method follows exactly this loop. Each lesson must explicitly identify trainable parameters, frozen components, teacher updates, running statistics and other state relevant to its method.

## Task is a separate dimension

A model family is not tied to one task. Each lesson should specify both the architecture and what it is being trained or used to do. Cross the task with the computation, training and inference views above; do not treat task choice as another name for training/inference mode.

For each task variant, explicitly identify:

- What the input represents and what answer the learner wants.
- Which backbone components are reused and which are changed.
- How representations are selected, pooled or passed into an output head.
- Output shape and meaning, including units or vocabulary where relevant.
- Training targets, loss and which parameters are trained or frozen.
- How raw outputs become a usable answer at inference time.
- What evaluation measures success for that task.

Illustrative comparisons, not universal prescriptions:

| Task | Possible output arrangement | Training signal | How the output is used |
| --- | --- | --- | --- |
| Single-label classification | Pool a representation and produce one logit per class | Class label; cross-entropy is a common choice | Compare class scores or probabilities and choose a class |
| Regression | Produce one or more continuous values, with appropriate constraints if needed | Numeric targets; squared or absolute error are common choices | Read values in their stated units, undoing target scaling where applicable |
| Autoregressive text generation | Produce vocabulary logits at token positions with causal information flow | Shifted next-token targets; token cross-entropy is common | Select a next token, append it and repeat until a stopping condition |

Classification itself has variants: mutually exclusive classes and multiple simultaneous labels need different target/output interpretations. Regression can also model distributions rather than only point estimates. Generation includes approaches such as diffusion whose objective and sampling procedure differ from next-token prediction. Introduce these distinctions only when relevant to the chosen lesson.

Do not imply that swapping the final layer always suffices. A task may require changes to masking, conditioning, spatial resolution, pooling, decoder structure or the whole inference loop. A shared architecture also does not mean the same learned weights work for every task without training or adaptation. A generative model can perform some classification tasks through prompting; the task alone does not dictate a unique head.

### Proposed comparison experience

Offer an optional “Use this backbone for another task” branch. Keep the shared computation visibly anchored, highlight the changed components, then follow the changed output into its target, loss and inference interpretation. Reuse the same input when that makes the comparison meaningful. Name parameter snapshots and avoid presenting separately trained variants as a single checkpoint that magically changes abilities.

First test a small classification-versus-regression comparison using a shared toy CNN backbone: predict a discrete image category versus a continuous image property. Use explicit toy labels and numeric targets. Show what stays the same, what the head changes, and why the loss and output interpretation change. This is a later coverage experiment; CLIP remains the next main lesson.

Use a separate, precisely specified transformer comparison for classification versus autoregressive generation if needed. Show causal masking and repeated decoding where required instead of illustrating generation as only a different output activation.

Acceptance question: can the learner distinguish the reusable representation from the task-specific prediction, explain the output dimensions and targets, and describe the training and inference changes? Verify each demonstrated variant numerically and label architecture changes separately from parameter changes.

## First training demonstration

Begin with one complete, inspectable update rather than a full training dashboard:

1. Select a tiny deterministic batch and identify its supervision.
2. Run the forward pass using a named parameter snapshot.
3. Calculate the loss from the outputs and targets.
4. Inspect a gradient for one selected weight; offer its derivation on demand.
5. Apply one optimiser step and show the old weight, gradient and new weight.
6. Re-run the same batch and compare outputs and loss.
7. Allow reset and, optionally, a few further steps.

Use simple gradient descent / SGD for the initial teaching example and label it as a simplification, not necessarily the optimiser used in the paper. More advanced optimiser state, momentum, Adam and schedules are later optional explanations. Do not promise that each update decreases loss or that lower training loss establishes generalisation.

Keep the learner’s central question visible: “What changed, and why?” Avoid presenting weights, gradient matrices, losses, optimiser state and training curves at equal prominence.

## First experiment: CLIP

Primary reference: Radford et al., [Learning Transferable Visual Models From Natural Language Supervision](https://proceedings.mlr.press/v139/radford21a.html). Verify the exact method and implementation details against the paper and official implementation during lesson development.

Proposed journey:

1. Begin with a small batch of paired images and captions.
2. Trace the two encoders into a shared embedding space.
3. Inspect pairwise similarities in an image–text grid.
4. Identify the matching pairs and the learning objective.
5. Follow one illustrative parameter update and recompute the grid.
6. Switch to using fixed parameters to compare a new image with candidate descriptions.

This tests paired inputs, relationships across examples and a learning objective—not just a single tensor flowing through blocks. CLIP is a representation-learning example, not a generative chat model.

Keep paper fidelity and the numerical demonstration distinct:

- The model-level explanation identifies the actual components and training objective.
- The small executable demonstration may train tiny projection layers on explicitly supplied features. State which components are frozen or abstracted and that this is not full CLIP training.
- Do not move embedding points artistically and imply that this is a computed optimisation step. Recompute displayed results from the updated toy parameters.
- Treat any 2D embedding drawing as an illustration or declared projection; do not imply it faithfully preserves all high-dimensional similarities.
- Show actual candidate comparisons during inference. Explain that scores depend on the supplied candidates; do not imply universal calibrated confidence.

Start with the encoder outputs as a sufficient abstraction. CNN/transformer prerequisites are optional detours, not compulsory lessons before understanding the contrastive idea.

## Prerequisites without an endless course

Represent dependencies between concepts rather than requiring every learner to complete a fixed chapter sequence. Distinguish essential prerequisites from helpful background and optional mathematical detail.

At an unfamiliar concept, offer:

- Continue: I know this.
- Quick refresher.
- Walk me through it.

Every detour should state why the concept matters here and return the learner to the same example and step. Bound prerequisite depth: enough to understand the current mechanism, with further background available separately.

Start with self-selected depth. Optional prediction checks can expose a specific misunderstanding and offer a relevant refresher. They must not gate progress, label someone an expert after one answer or silently infer mastery from clicks and playback.

## Coverage experiments before skill extraction

| Candidate | Teaching challenge to test |
| --- | --- |
| Existing CNN / transformer | Forward computation, shapes and persistent selection |
| CLIP / contrastive learning | Paired modalities, cross-example comparisons, objective and training versus use |
| A specified DINO variant | Explaining a self-supervised training setup and the source of its learning signal |
| A specified diffusion formulation | Repeated state changes and the relationship between training and sampling |
| A specified vision-language model | Connecting pretrained components and explaining cross-modal information flow |
| One backbone, multiple tasks | Classification versus regression first; distinguish shared features from heads, objectives and output interpretation |
| A modification of a familiar baseline | Showing precisely what changed and why, with prerequisite detours |

Choose the next example based on the unresolved teaching challenge. One lesson can cover several challenges. Select the actual paper/version before designing its lesson; family names alone are not precise specifications.

## Design principles to preserve

Follow DESIGN.md: one question, a watch-for cue, one dominant operation, a short takeaway and optional detail. Preserve stable controls, adequate spacing, real numerical provenance and rounding explanations.

Recent CNN feedback adds a concrete requirement for these trials: keep the computed object visually continuous as it becomes part of the overview. Carry a map into its channel card or a vector into its final position rather than dissolving the whole scene. Make channel/head/example selection visible and keep identity consistent across steps.

Training needs equivalent continuity: the selected weight should remain identifiable through its gradient, update and use in the next pass. Label parameter updates separately from ordinary data movement.

## Delivery sequence and review gates

1. Write a short CLIP lesson brief grounded in the source: learning outcome, essential prerequisites, exact abstractions and numerical scope.
2. Build the computation and use journeys with an inspectable similarity grid.
3. Add one executable training update, reusing the same example where appropriate.
4. Add one prerequisite detour and one optional prediction check.
5. Review whether a learner can explain what changed, what was learned and what stays fixed during use. Record direct user feedback separately from agent hypotheses.
6. Try the next distinct teaching challenge, including a shared-backbone task comparison, and compare which design rules transferred.
7. Extract a draft skill once those comparisons support reusable guidance; continue revising it with later examples.

Acceptance checks for the training trial: deterministic reset, finite values, correct parameter updates, recomputed outputs, meaningful gradient checks, consistent selected identities, and explicit toy-versus-paper boundaries. Playback and scrubbing must not accidentally apply extra training updates. A training step is a state change; replaying its explanation is not another optimisation step.

## What the eventual skill would encode

Inputs: source paper or implementation, target task(s), learner background, learning goal, desired depth and available runtime/resources.

Outputs: a source-grounded explanation plan, prerequisite paths, a suitable numerical or conceptual demonstration, implementation, verification evidence and clear limits.

Reusable guidance should govern what to explain and in which order—not merely colours and components. Keep specialised guidance for contrastive objectives, teacher/student training, iterative generation and other mechanisms. Include cases where static diagrams or prose explain the idea better than animation.

For each prototype, record what transferred unchanged, what required a new approach, what confused the learner and which explanations were source-backed. Do not turn one approved lesson into a claim that the skill can explain any architecture reliably.

## Library and concept discovery — September 27 update

A library now replaces the top-level model switcher. Lessons can represent a model, method, reusable concept or training mechanism; the organising unit is a learnable question. The current library only advertises the three implemented model/method lessons.

Teach shared concepts in concrete model contexts first, with stable links to those steps. Separate taught concepts from prerequisites and passing mentions. Extract a standalone concept lesson when it needs a substantial detour or a comparison across models; do not duplicate explanations merely to populate a category. Encoder–decoder, Adam and KL divergence are future coverage, not current library tags.

Implemented: library cards, search by lesson/concept, covered-concept links, helpful-prerequisite labels, All lessons navigation, and stable step URLs. Future: standalone concept lessons, reusable prerequisite detours, richer task and training/inference browsing as coverage grows.


## DDPM trial — implemented

The next generative-method example is `/diffusion`: an unconditional, trained 8 × 8 digit DDPM with a small U-Net. Six paced steps separate forward noising, backbone inspection, noise-prediction loss, recorded training, a reverse sampling calculation, and full generation. This tests how Layerwise teaches a reusable encoder–decoder concept inside a method, and distinguishes optimizer updates from sampling timesteps.

Gather feedback on this trial before expanding to latent diffusion, text conditioning or DiT. Mamba remains a later architecture experiment. See `lessons/diffusion/NOTES.md` for exact scope, data and simplifications.
