import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownViewerProps {
  content: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content }) => {
  return (
    <div className="text-sm leading-relaxed space-y-2.5 text-slate-700 dark:text-slate-200">
      <ReactMarkdown
        components={{
          strong: ({ node, ...props }) => <strong className="font-black text-indigo-500 dark:text-indigo-400 font-semibold" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-amber-500 dark:text-amber-300 font-medium" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-inside my-2 space-y-1.5 ml-2 marker:text-indigo-500" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-inside my-2 space-y-1.5 ml-2 marker:text-indigo-500 font-semibold" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed text-slate-700 dark:text-slate-300 font-normal inline-block w-full" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-base font-black my-3 text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700/60 pb-1.5" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-sm font-extrabold my-2.5 text-indigo-600 dark:text-indigo-400 uppercase tracking-wide" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-xs font-bold my-2 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider" {...props} />,
          p: ({ node, ...props }) => <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-300" {...props} />,
          code: ({ node, ...props }) => <code className="bg-slate-200 dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded text-xs font-mono font-bold" {...props} />,
          blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-500 pl-3.5 italic my-3 text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/40 py-2 rounded-r-lg" {...props} />,
          a: ({ node, ...props }) => <a className="text-indigo-500 underline hover:text-indigo-400 font-semibold" target="_blank" rel="noopener noreferrer" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default React.memo(MarkdownViewer);
