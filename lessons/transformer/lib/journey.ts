type JourneyStep = { question: (token: string) => string; watch: string };
export const journey: JourneyStep[] = [
  {
    question: (t) => `How does “${t}” become something a model can work with?`,
    watch:
      'The token’s features and its position are added, one matching pair at a time.',
  },
  {
    question: (t) => `How are “${t}”’s features put on a consistent scale?`,
    watch: 'The mean and spread come from this token’s own row of numbers.',
  },
  {
    question: (t) => `How does “${t}” prepare to exchange information?`,
    watch:
      'Three different sets of weights turn the same input into queries, keys and values.',
  },
  {
    question: (t) => `How can three attention heads each work on “${t}”?`,
    watch:
      'The same twelve numbers separate into three groups of four. Their values do not change.',
  },
  {
    question: (t) => `How do we arrange “${t}”’s features for each head?`,
    watch:
      'The cells move into head-first groups. Only their arrangement changes.',
  },
  {
    question: (t) => `How does “${t}” compare itself with other tokens?`,
    watch:
      'Its query is compared with each key, producing one score per token in each head.',
  },
  {
    question: (t) => `Which tokens is “${t}” allowed to take information from?`,
    watch:
      'Future positions are blocked, then the allowed weights are made to add up to one.',
  },
  {
    question: (t) => `How does “${t}” gather information from the values?`,
    watch:
      'Each attention weight scales a value vector. The weighted vectors add into one new row.',
  },
  {
    question: (t) =>
      `How do the heads bring their information back together for “${t}”?`,
    watch:
      'Three groups rejoin, then a projection mixes their twelve features.',
  },
  {
    question: (t) =>
      `How does “${t}” keep its earlier features while adding new information?`,
    watch:
      'A saved copy of the earlier features is added to the attention contribution.',
  },
  {
    question: (t) => `What happens to “${t}”’s features after attention?`,
    watch:
      'The MLP normalises, expands, applies GELU and compresses each token’s features independently.',
  },
  {
    question: (t) =>
      `How does the model turn “${t}”’s features into next-token probabilities?`,
    watch:
      'The MLP contribution is added back, then normalisation, projection and softmax produce vocabulary probabilities.',
  },
];

export const takeaways = [
  'Each token starts with a row of features. Adding position information gives that row a sense of where the token appears.',
  'Normalisation adjusts the scale within each token’s row. It does not mix information between tokens.',
  'The same input produces three different representations: queries for comparing, keys to compare against, and values to gather.',
  'Splitting heads reorganises twelve features into three groups of four. Every number is preserved.',
  'Permuting axes groups the data by head so each head can work independently. The numbers are unchanged.',
  'Each query–key comparison produces one score. A row of scores describes one query’s comparisons with all key tokens.',
  'A token can attend to itself and earlier positions. Future positions receive zero weight; the allowed weights sum to one.',
  'Attention weights determine how much of each value vector to take. Their weighted sum gives the query new features.',
  'Joining the heads restores one row of twelve features. The output projection then mixes information across those features.',
  'A residual connection adds the new attention contribution to the earlier features, keeping the same shape.',
  'The feed-forward network transforms each token’s features independently. It expands them, applies a nonlinear function, then compresses them.',
  'The updated features become a probability for each vocabulary entry. The last position predicts what comes next; this untrained model illustrates the calculation, not meaningful language.',
];
