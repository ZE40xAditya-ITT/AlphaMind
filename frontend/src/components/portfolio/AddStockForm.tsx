import React, { useMemo, useState } from 'react';
import { Plus, Check, Loader2, TrendingUp } from 'lucide-react';
import { NSE_STOCKS } from '../../utils/nseStocks';

interface AddStockFormProps {
  handleAddStock: (e: React.FormEvent) => void;
  newSymbol: string;
  setNewSymbol: (symbol: string) => void;
  setPriceFetched: (fetched: boolean) => void;
  handleCheckSymbol: () => void;
  isFetchingPrice: boolean;
  priceFetched: boolean;
  newQuantity: string;
  setNewQuantity: (qty: string) => void;
  newPrice: string;
  setNewPrice: (price: string) => void;
  liveMarketPrice?: number | null;
}

const AddStockForm: React.FC<AddStockFormProps> = ({
  handleAddStock,
  newSymbol,
  setNewSymbol,
  setPriceFetched,
  handleCheckSymbol,
  isFetchingPrice,
  priceFetched,
  newQuantity,
  setNewQuantity,
  newPrice,
  setNewPrice,
  liveMarketPrice
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const matchingStocks = useMemo(() => {
    if (!newSymbol.trim()) return NSE_STOCKS.slice(0, 30);
    const q = newSymbol.toLowerCase().replace('.ns', '').replace('.bo', '').trim();
    return NSE_STOCKS.filter(s => 
      s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
    ).slice(0, 60);
  }, [newSymbol]);

  return (
    <form onSubmit={handleAddStock} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 bg-[#111827] p-4 rounded-2xl border border-slate-800 items-end relative">
      <div className="col-span-1 md:col-span-2 relative">
        <input 
          required 
          type="text" 
          placeholder="Search Symbol or Name (e.g. RELIANCE, TCS)..." 
          value={newSymbol} 
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onChange={e => {
            setNewSymbol(e.target.value);
            setPriceFetched(false);
            setShowSuggestions(true);
          }}
          className="w-full bg-[#1f2937] text-white px-4 py-2 rounded-xl border border-slate-700 outline-none pr-24 focus:border-indigo-500 transition font-medium" 
        />
        {showSuggestions && matchingStocks.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-800">
            {matchingStocks.map(s => (
              <div
                key={s.symbol}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setNewSymbol(`${s.symbol}.NS`);
                  setShowSuggestions(false);
                  setPriceFetched(false);
                }}
                className="px-4 py-2.5 hover:bg-indigo-600/20 hover:text-white cursor-pointer flex items-center justify-between text-xs transition"
              >
                <div>
                  <span className="font-bold text-white">{s.symbol}.NS</span>
                  <span className="text-slate-400 ml-2 block sm:inline text-[11px]">{s.name}</span>
                </div>
                <TrendingUp size={14} className="text-indigo-400 shrink-0" />
              </div>
            ))}
          </div>
        )}
        <button 
          type="button" 
          onClick={handleCheckSymbol} 
          disabled={!newSymbol || isFetchingPrice} 
          className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-900/40 text-indigo-400 font-semibold rounded-lg hover:bg-indigo-800/60 transition text-sm disabled:opacity-50 flex items-center justify-center min-w-[70px]"
          title="Check Live Market Price"
        >
          {isFetchingPrice ? <Loader2 size={16} className="animate-spin" /> : (priceFetched ? <Check size={16}/> : 'Live Price')}
        </button>
        {liveMarketPrice && (
          <div className="absolute -bottom-6 left-1 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5 z-10">
            <span>Live Market: ₹{liveMarketPrice.toLocaleString()}</span>
            <button 
              type="button" 
              onClick={() => setNewPrice(liveMarketPrice.toString())} 
              className="text-indigo-400 underline hover:text-indigo-300 ml-1 font-bold"
            >
              (Use as Buy Price)
            </button>
          </div>
        )}
      </div>
      <div className="col-span-1">
        <input type="number" step="0.01" min="0.01" placeholder="Qty (def: 1)" value={newQuantity} onChange={e => setNewQuantity(e.target.value)} className="w-full bg-[#1f2937] text-white border border-slate-700 px-4 py-2 rounded-xl outline-none font-medium" />
      </div>
      <div className="col-span-1">
        <input required type="number" step="0.01" min="0.01" placeholder="Avg Buy Price" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full bg-[#1f2937] text-white border border-slate-700 px-4 py-2 rounded-xl outline-none font-medium" />
      </div>
      <button 
        type="submit" 
        disabled={!newSymbol || !newPrice} 
        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed h-[40px] shadow-lg shadow-indigo-600/25"
      >
        <Plus size={18} /> Add
      </button>
    </form>
  );
};

export default AddStockForm;
