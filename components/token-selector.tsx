/** Both this selector and the sentence buttons use the page's selected token. */
export default function TokenSelector({
  words,
  token,
  onChange,
  query = false,
}: {
  words: string[];
  token: number;
  onChange: (token: number) => void;
  query?: boolean;
}) {
  return (
    <label>
      {query ? 'Query token' : 'Token'}
      <select
        value={token}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {words.map((word, index) => (
          <option key={index} value={index}>
            {index} · {word}
          </option>
        ))}
      </select>
    </label>
  );
}
