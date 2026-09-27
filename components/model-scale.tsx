const comparisons = {
  transformer: {
    name: 'GPT-2 small',
    rows: [
      ['Features per token', '12', '768'],
      ['Transformer blocks', '1', '12'],
      ['Attention heads per block', '3', '12'],
      ['Vocabulary entries', '12', '50,257'],
    ],
    carries:
      'A token is still a vector. Attention combines information across positions, and each block transforms those vectors.',
    changes:
      'Our weights are illustrative and untrained. GPT-2 has learned weights, a real subword tokenizer and many stacked blocks. Increasing the numbers alone would not give this toy model language understanding.',
    source:
      'https://huggingface.co/openai-community/gpt2/blob/main/config.json',
    sourceLabel: 'GPT-2 configuration',
  },
  cnn: {
    name: 'ResNet-18 (ImageNet weights)',
    rows: [
      ['Input image', '6 × 6 · grayscale', '224 × 224 crop · RGB'],
      [
        'Classifier outputs',
        '2 illustrative classes',
        '1,000 ImageNet classes',
      ],
      [
        'Network depth',
        '1 convolution stage + dense layer',
        '18-layer residual network',
      ],
    ],
    carries:
      'Filters still scan local patches. Channels carry learned features, spatial resolution changes through the network, and the classifier produces a score per class.',
    changes:
      'ResNet-18 adds many learned filters and residual connections. Its published model has 11,689,512 parameters. Our hand-chosen filters and class scores demonstrate arithmetic; they are not a trained image recognizer.',
    source:
      'https://docs.pytorch.org/vision/2.0/models/generated/torchvision.models.resnet18.html',
    sourceLabel: 'Torchvision ResNet-18 weights and preprocessing',
  },
  clip: {
    name: 'CLIP ViT-B/32',
    rows: [
      ['Shared embedding width', '3 values', '512 values'],
      [
        'Image input',
        '3 supplied features',
        '224 × 224 image · 32 × 32 patches',
      ],
      [
        'Encoder depth',
        '1 linear map per modality',
        '12 Transformer layers per modality',
      ],
    ],
    carries:
      'Both encoders produce comparable vectors. Matched pairs are encouraged to score above mismatched pairs, and trained encoders can later be held fixed.',
    changes:
      'Our three pairs make the contrastive calculation inspectable. The published model processes actual pixels and tokenized text with deep encoders; our supplied features and tiny training exercise do not reproduce that capability.',
    source:
      'https://huggingface.co/openai/clip-vit-base-patch32/blob/main/config.json',
    sourceLabel: 'OpenAI CLIP ViT-B/32 configuration',
  },
  diffusion: {
    name: 'Stable Diffusion v1.5 U-Net',
    rows: [
      [
        'Denoised representation',
        '8 × 8 · 1 image channel',
        '64 × 64 · 4 latent channels',
      ],
      [
        'Main feature widths',
        '16 → 32 channels',
        '320 → 640 → 1,280 → 1,280 channels',
      ],
      [
        'Spatial downsampling',
        '1 level · 8 → 4',
        '3 levels · 64 → 32 → 16 → 8',
      ],
    ],
    carries:
      'The denoiser receives a noisy representation and a timestep. Skip connections reconnect features across resolutions; sampling repeatedly uses the trained network.',
    changes:
      'The four latent channels encode an image; they are not RGB pixels. Stable Diffusion also adds an image autoencoder, text conditioning, attention and more residual blocks. Our trained digit model demonstrates unconditional pixel-space diffusion, so this is a scale reference rather than the same architecture enlarged.',
    source:
      'https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5/blob/main/unet/config.json',
    sourceLabel: 'Stable Diffusion v1.5 U-Net configuration',
  },
};
export default function ModelScale({
  lesson,
}: {
  lesson: keyof typeof comparisons;
}) {
  const item = comparisons[lesson];
  return (
    <details className="model-scale">
      <summary>How big is this in a real model?</summary>
      <div className="model-scale-body">
        <p>
          We keep this example small so you can inspect its values.{' '}
          <strong>{item.name}</strong> is one concrete published reference—not a
          universal size or a limit on today’s models.
        </p>
        <div className="model-scale-table">
          <table>
            <caption>This lesson compared with {item.name}</caption>
            <thead>
              <tr>
                <th scope="col">What grows</th>
                <th scope="col">Our example</th>
                <th scope="col">{item.name}</th>
              </tr>
            </thead>
            <tbody>
              {item.rows.map(([label, toy, real]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>{toy}</td>
                  <td>{real}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>What carries over?</h3>
        <p>{item.carries}</p>
        <h3>What else changes?</h3>
        <p>{item.changes}</p>
        <p className="model-scale-source">
          Reference:{' '}
          <a href={item.source} target="_blank" rel="noreferrer">
            {item.sourceLabel}
          </a>
          . Model sizes depend on the task, version and compute budget.
        </p>
      </div>
    </details>
  );
}
