import React from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';

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
  setNewPrice
}) => {
  return (
    <form onSubmit={handleAddStock} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 items-end">
      <div className="col-span-1 md:col-span-2 relative">
        <input 
          list="popular-stocks" 
          required 
          type="text" 
          placeholder="Symbol (e.g., INFY.NS)" 
          value={newSymbol} 
          onChange={e => { setNewSymbol(e.target.value); setPriceFetched(false); }} 
          className="w-full bg-white dark:bg-slate-900 px-4 py-2 rounded-xl outline-none pr-24" 
        />
        <datalist id="popular-stocks">
          <option value="RELIANCE.NS">Reliance Industries</option>
          <option value="TCS.NS">Tata Consultancy Services</option>
          <option value="HDFCBANK.NS">HDFC Bank</option>
          <option value="INFY.NS">Infosys</option>
          <option value="ICICIBANK.NS">ICICI Bank</option>
          <option value="HINDUNILVR.NS">Hindustan Unilever</option>
          <option value="ITC.NS">ITC Limited</option>
          <option value="SBIN.NS">State Bank of India</option>
          <option value="BHARTIARTL.NS">Bharti Airtel</option>
          <option value="BAJFINANCE.NS">Bajaj Finance</option>
        </datalist>
        <button 
          type="button" 
          onClick={handleCheckSymbol} 
          disabled={!newSymbol || isFetchingPrice} 
          className="absolute right-1 top-1 bottom-1 px-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 font-semibold rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-800/60 transition text-sm disabled:opacity-50 flex items-center justify-center min-w-[70px]"
        >
          {isFetchingPrice ? <Loader2 size={16} className="animate-spin" /> : (priceFetched ? <Check size={16}/> : 'Fetch')}
        </button>
      </div>
      <input 
        required 
        type="number" 
        step="0.01" 
        placeholder="Quantity" 
        value={newQuantity} 
        onChange={e => setNewQuantity(e.target.value)} 
        className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl outline-none" 
      />
      <input 
        required 
        type="number" 
        step="0.01" 
        placeholder="Avg Buy Price" 
        value={newPrice} 
        onChange={e => setNewPrice(e.target.value)} 
        className="bg-white dark:bg-slate-900 px-4 py-2 rounded-xl outline-none" 
        title="Your entry price" 
      />
      <button 
        type="submit" 
        disabled={!priceFetched} 
        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-indigo-700 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed h-[40px]"
      >
        <Plus size={18} /> Add
      </button>
    </form>
  );
};

export default AddStockForm;
