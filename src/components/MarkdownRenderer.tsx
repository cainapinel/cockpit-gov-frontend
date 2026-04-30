import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MermaidBlock } from './MermaidBlock';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Intercept code blocks with language-mermaid
          code({ className: codeClassName, children, ...props }) {
            const match = /language-mermaid/.exec(codeClassName || '');
            if (match) {
              return <MermaidBlock chart={String(children).replace(/\n$/, '')} />;
            }
            return (
              <code className={codeClassName} {...props}>
                {children}
              </code>
            );
          },
          // Style tables for GFM
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full text-sm border-collapse border border-gray-200">
                  {children}
                </table>
              </div>
            );
          },
          th({ children }) {
            return (
              <th className="border border-gray-200 bg-gray-50 px-3 py-2 text-left font-semibold text-gray-700">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="border border-gray-200 px-3 py-2 text-gray-600">
                {children}
              </td>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
