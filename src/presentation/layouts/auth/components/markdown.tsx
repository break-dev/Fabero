import { memo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  content: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-zinc-100 mt-2 mb-1 first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-sm font-bold text-zinc-100 mt-2 mb-1 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-zinc-100 mt-2 mb-1 first:mt-0">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-zinc-200 mt-2 mb-1 first:mt-0">
      {children}
    </h4>
  ),
  h5: ({ children }) => (
    <h5 className="text-xs font-semibold text-zinc-200 mt-2 mb-1 first:mt-0 uppercase tracking-wide">
      {children}
    </h5>
  ),
  h6: ({ children }) => (
    <h6 className="text-xs font-semibold text-zinc-300 mt-2 mb-1 first:mt-0 uppercase tracking-wide">
      {children}
    </h6>
  ),
  p: ({ children }) => (
    <p className="text-sm text-zinc-200 leading-relaxed my-1 first:mt-0 last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-bold text-zinc-50">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-zinc-200">{children}</em>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-outside text-sm text-zinc-200 my-1 ml-5 [&_p]:my-0 first:mt-0 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-outside text-sm text-zinc-200 my-1 ml-5 [&_p]:my-0 first:mt-0 last:mb-0">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="leading-relaxed [&_p]:my-0">{children}</li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-violet-500/60 pl-3 my-1 text-sm text-zinc-300 italic [&_p]:my-0 first:mt-0 last:mb-0">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = Boolean(className && className.startsWith("language-"));
    if (isBlock) {
      return (
        <code className="block bg-zinc-950 border border-zinc-800 rounded-lg p-3 my-1 text-xs font-mono text-zinc-200 overflow-x-auto first:mt-0 last:mb-0">
          {children}
        </code>
      );
    }
    return (
      <code className="bg-zinc-950/80 border border-zinc-800 rounded px-1.5 py-0.5 text-xs font-mono text-violet-200">
        {children}
      </code>
    );
  },
  pre: ({ children }) => <>{children}</>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-indigo-300 hover:text-indigo-200 underline underline-offset-2 wrap-break-word"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="border-zinc-700/60 my-2" />,
  table: ({ children }) => (
    <div className=" overflow-x-auto first:mt-0 last:mb-0">
      <table className="text-xs border-collapse border border-zinc-800 rounded-lg">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-zinc-900/80">{children}</thead>
  ),
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => (
    <tr className="border-b border-zinc-800 last:border-b-0">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="px-2 py-1 text-left font-bold text-zinc-100 border border-zinc-800">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-2 py-1 text-zinc-200 border border-zinc-800 [&_p]:my-0">
      {children}
    </td>
  ),
};

export const Markdown = memo(({ content }: MarkdownProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={components}
      skipHtml
    >
      {content}
    </ReactMarkdown>
  );
});

Markdown.displayName = "Markdown";