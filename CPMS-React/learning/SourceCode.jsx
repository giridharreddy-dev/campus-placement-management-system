import { useMemo, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-sql';

const languages = {
  html: 'markup',
  jsx: 'jsx',
  js: 'javascript',
  mjs: 'javascript',
  css: 'css',
  sql: 'sql',
  json: 'javascript',
};

function renderTokens(tokens) {
  if (typeof tokens === 'string') return tokens;
  if (Array.isArray(tokens))
    return tokens.map((token, index) => (
      <span key={index}>{renderTokens(token)}</span>
    ));
  const aliases = Array.isArray(tokens.alias)
    ? tokens.alias
    : [tokens.alias || ''];
  return (
    <span className={['code-token', tokens.type, ...aliases].join(' ')}>
      {renderTokens(tokens.content)}
    </span>
  );
}

export default function SourceCode({ code, fileName }) {
  const [feedback, setFeedback] = useState('');
  const extension = fileName.split('.').pop().toLowerCase();
  const language = languages[extension];
  const tokens = useMemo(
    () =>
      language && Prism.languages[language]
        ? Prism.tokenize(code, Prism.languages[language])
        : code,
    [code, language],
  );
  return (
    <div className="lab-source">
      <div className="lab-source-toolbar">
        <span>{extension.toUpperCase()}</span>
        <span role="status">{feedback}</span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code);
              setFeedback('Copied');
            } catch {
              setFeedback('Select the code to copy it.');
            }
          }}
        >
          Copy code
        </button>
      </div>
      <pre aria-label={`Source code: ${fileName}`}>
        <code>{renderTokens(tokens)}</code>
      </pre>
    </div>
  );
}
