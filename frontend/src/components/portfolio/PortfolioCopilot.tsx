import React from 'react';
import { MessageSquare, Send } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

interface PortfolioCopilotProps {
  handleAskCopilot: (e: React.FormEvent) => void;
  copilotQuery: string;
  setCopilotQuery: (query: string) => void;
  copilotResponse: string;
  isAskingCopilot: boolean;
}

const PortfolioCopilot: React.FC<PortfolioCopilotProps> = ({
  handleAskCopilot,
  copilotQuery,
  setCopilotQuery,
  copilotResponse,
  isAskingCopilot
}) => {
  return (
    <div className="glass dark:glass p-6 rounded-3xl space-y-6">
      <h3 className="text-lg font-bold flex items-center gap-2"><MessageSquare size={20} className="text-amber-500"/> AI Copilot</h3>
      <div className="h-[200px] overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
        {copilotResponse ? (
          <div className="prose dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: copilotResponse.replace(/\n/g, '<br />') }} />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-sm">
            <p>Ask anything about your portfolio's performance, risk, or sector allocation.</p>
          </div>
        )}
      </div>
      <form onSubmit={handleAskCopilot} className="flex gap-2">
        <input
          type="text"
          value={copilotQuery}
          onChange={e => setCopilotQuery(e.target.value)}
          placeholder="Why is my portfolio underperforming?"
          className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <button type="submit" disabled={isAskingCopilot || !copilotQuery} className="bg-indigo-600 hover:bg-indigo-700 text-white p-2.5 rounded-xl transition disabled:opacity-50 flex-shrink-0">
          {isAskingCopilot ? <LoadingSpinner message="" /> : <Send size={18} />}
        </button>
      </form>
    </div>
  );
};

export default PortfolioCopilot;
