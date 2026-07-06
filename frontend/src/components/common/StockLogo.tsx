import React, { useState, useEffect } from 'react';

interface StockLogoProps {
  symbol: string;
  name?: string | null;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Dictionary mapping top Indian NSE symbols to their official domains
const DOMAIN_MAP: Record<string, string> = {
  'HDFCBANK': 'hdfcbank.com',
  'BAJFINANCE': 'bajajfinserv.in',
  'BAJAJFINSV': 'bajajfinserv.in',
  'TCS': 'tcs.com',
  'RELIANCE': 'ril.com',
  'INFY': 'infosys.com',
  'ICICIBANK': 'icicibank.com',
  'SBIN': 'sbi.co.in',
  'BHARTIARTL': 'airtel.in',
  'ITC': 'itcportal.com',
  'LT': 'larsentoubro.com',
  'KOTAKBANK': 'kotak.com',
  'HINDUNILVR': 'hul.co.in',
  'AXISBANK': 'axisbank.com',
  'MARUTI': 'marutisuzuki.com',
  'SUNPHARMA': 'sunpharma.com',
  'TATAMOTORS': 'tatamotors.com',
  'TATASTEEL': 'tatasteel.com',
  'WIPRO': 'wipro.com',
  'MM': 'mahindra.com',
  'NTPC': 'ntpc.co.in',
  'ONGC': 'ongcindia.com',
  'POWERGRID': 'powergrid.in',
  'TITAN': 'titan.co.in',
  'ULTRACEMCO': 'ultratechcement.com',
  'ASIANPAINT': 'asianpaints.com',
  'ADANIENT': 'adani.com',
  'ADANIPORTS': 'adaniports.com',
  'BAJAJ-AUTO': 'bajajauto.com',
  'BPCL': 'bharatpetroleum.in',
  'BRITANNIA': 'britannia.co.in',
  'CIPLA': 'cipla.com',
  'COALINDIA': 'coalindia.in',
  'DIVISLAB': 'divislabs.com',
  'DRREDDY': 'drreddys.com',
  'EICHERMOT': 'eichermotors.com',
  'GRASIM': 'grasim.com',
  'HCLTECH': 'hcltech.com',
  'HDFCLIFE': 'hdfclife.com',
  'HEROMOTOCO': 'heromotocorp.com',
  'HINDALCO': 'hindalco.com',
  'INDUSINDBK': 'indusind.com',
  'JSWSTEEL': 'jsw.in',
  'NESTLEIND': 'nestle.in',
  'SBILIFE': 'sbilife.co.in',
  'TECHM': 'techmahindra.com',
  'TATACONSUM': 'tataconsumer.com',
  'APOLLOHOSP': 'apollohospitals.com',
  'UPL': 'upl-ltd.com',
  'SHREECEM': 'shreecement.com',
  'ABCAPITAL': 'adityabirlacapital.com',
  'ABB': 'abb.com',
  'AMBUJACEM': 'ambujacement.com',
  'BANKBARODA': 'bankofbaroda.in',
  'BEL': 'bel-india.in',
  'BHEL': 'bhel.com',
  'BOSCHLTD': 'bosch.in',
  'CHOLAFIN': 'cholamandalam.com',
  'DABUR': 'dabur.com',
  'DLF': 'dlf.in',
  'GAIL': 'gailonline.com',
  'GODREJCP': 'godrejcp.com',
  'HAVELLS': 'havells.com',
  'IDFCFIRSTB': 'idfcfirstbank.com',
  'INDIGO': 'goindigo.in',
  'IRCTC': 'irctc.co.in',
  'JINDALSTEL': 'jindalsteelpower.com',
  'LICHSGFIN': 'lichousing.com',
  'LTIM': 'ltimindtree.com',
  'LUPIN': 'lupin.com',
  'MUTHOOTFIN': 'muthootfinance.com',
  'NAUKRI': 'infoedge.in',
  'PIDILITIND': 'pidilite.com',
  'PNB': 'pnbindia.in',
  'SIEMENS': 'siemens.co.in',
  'SRF': 'srf.com',
  'TRENT': 'trentlimited.com',
  'TVSMOTOR': 'tvsmotor.com',
  'VBL': 'varunbeverages.com',
  'VEDL': 'vedantalimited.com',
  'VOLTAS': 'voltas.com',
  'ZOMATO': 'zomato.com',
  'PAYTM': 'paytm.com',
  'NYKAA': 'nykaa.com',
};

const getDomain = (cleanSym: string, companyName?: string | null): string => {
  if (DOMAIN_MAP[cleanSym]) {
    return DOMAIN_MAP[cleanSym];
  }
  if (companyName) {
    const cleanedName = companyName
      .replace(/limited|ltd|inc|corp|corporation|india|industries|company|co|\.|,/gi, '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
    if (cleanedName.length >= 3) {
      return `${cleanedName}.com`;
    }
  }
  return `${cleanSym.toLowerCase()}.com`;
};

const StockLogo: React.FC<StockLogoProps> = ({ symbol, name, className = '', size = 'md' }) => {
  const cleanSym = symbol.replace('.NS', '').replace('.BO', '').replace('^', '').trim().toUpperCase();
  const domain = getDomain(cleanSym, name);

  // 0 = try clearbit, 1 = try google favicon, 2 = fallback letter
  const [errorLevel, setErrorLevel] = useState<number>(0);

  useEffect(() => {
    setErrorLevel(0);
  }, [symbol]);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-lg',
  };

  const logoUrl =
    errorLevel === 0
      ? `https://logo.clearbit.com/${domain}`
      : `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

  if (errorLevel >= 2) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 font-black text-primary shadow-inner shrink-0 uppercase select-none ${sizeClasses[size]} ${className}`}
        title={name || cleanSym}
      >
        {cleanSym.charAt(0)}
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 p-1.5 shadow-inner shrink-0 overflow-hidden ${sizeClasses[size]} ${className}`}
      title={name || cleanSym}
    >
      <img
        src={logoUrl}
        alt={`${cleanSym} logo`}
        className="h-full w-full object-contain filter drop-shadow-sm transition-opacity duration-300"
        onError={() => setErrorLevel((prev) => prev + 1)}
      />
    </div>
  );
};

export default StockLogo;
