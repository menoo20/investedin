"use client";

import { useState } from "react";
import { TrendingUp, TrendingDown, Clock, DollarSign, Activity, ArrowRight, Loader2, ArrowUpDown, Calculator, Search, Trophy } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Home() {
  const t = useTranslations("Index");
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<'investment' | 'converter' | 'calculator' | 'tracker'>('investment');

  // --- Investment Calculator State ---
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [submittedData, setSubmittedData] = useState<{ amount: string; currency: string; asset: string; date: string } | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [formData, setFormData] = useState({
    amount: "500",
    currency: "SAR",
    asset: "bitcoin",
    date: "2020-01-01"
  });

  // --- Currency Converter State ---
  const [converterLoading, setConverterLoading] = useState(false);
  const [converterResult, setConverterResult] = useState<any>(null);
  const [converterError, setConverterError] = useState("");
  
  const [converterData, setConverterData] = useState({
    amount: "100",
    fromCurrency: "USD",
    toCurrency: "SAR"
  });

  // --- Calculator State ---
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcMemory, setCalcMemory] = useState<number | null>(null);
  const [calcOperator, setCalcOperator] = useState<string | null>(null);
  const [calcNewNumber, setCalcNewNumber] = useState(true);

  // --- Rate Tracker State ---
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [trackerResult, setTrackerResult] = useState<any>(null);
  const [trackerError, setTrackerError] = useState("");
  const [trackerData, setTrackerData] = useState({
    asset: "bitcoin",
    currency: "USD",
    date1: "2020-01-01",
    date2: ""
  });

  const currencies = ["USD", "SAR", "EGP", "EUR", "GBP"];
  const assetGroups = [
    {
      label: t("form.categories.stocks"),
      assets: [
        { id: "sp500", name: t("form.assets.sp500") },
      ],
    },
    {
      label: t("form.categories.crypto"),
      assets: [
        { id: "bitcoin", name: t("form.assets.bitcoin") },
        { id: "ethereum", name: t("form.assets.ethereum") },
        { id: "solana", name: t("form.assets.solana") },
      ],
    },
    {
      label: t("form.categories.commodities"),
      assets: [
        { id: "gold", name: t("form.assets.gold") },
      ],
    },
    {
      label: t("form.categories.currencies"),
      assets: [
        { id: "currency_usd", name: t("form.assets.currency_usd") },
        { id: "currency_eur", name: t("form.assets.currency_eur") },
        { id: "currency_gbp", name: t("form.assets.currency_gbp") },
        { id: "currency_sar", name: t("form.assets.currency_sar") },
        { id: "currency_egp", name: t("form.assets.currency_egp") },
      ],
    },
  ];

  // --- Handlers ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    setIsDirty(false);

    try {
      const response = await fetch("/api/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setResult(data.data);
      setSubmittedData({ ...formData });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    setConverterLoading(true);
    setConverterError("");
    setConverterResult(null);

    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(converterData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setConverterResult(data.data);
    } catch (err: any) {
      setConverterError(err.message);
    } finally {
      setConverterLoading(false);
    }
  };

  const handleSwapCurrencies = () => {
    setConverterData(prev => ({
      ...prev,
      fromCurrency: prev.toCurrency,
      toCurrency: prev.fromCurrency
    }));
    // Clear result so they have to click convert again
    setConverterResult(null);
  };

  const handleCalcNumber = (num: string) => {
    if (calcNewNumber) {
      setCalcDisplay(num);
      setCalcNewNumber(false);
    } else {
      setCalcDisplay(calcDisplay === '0' ? num : calcDisplay + num);
    }
  };

  const handleCalcDecimal = () => {
    if (calcNewNumber) {
      setCalcDisplay('0.');
      setCalcNewNumber(false);
    } else if (!calcDisplay.includes('.')) {
      setCalcDisplay(calcDisplay + '.');
    }
  };

  const calculateCurrent = () => {
    const current = parseFloat(calcDisplay);
    if (calcMemory === null || calcOperator === null) return current;
    
    switch(calcOperator) {
      case '+': return calcMemory + current;
      case '-': return calcMemory - current;
      case '×': return calcMemory * current;
      case '÷': return current === 0 ? 0 : calcMemory / current;
      default: return current;
    }
  };

  const handleCalcOperator = (op: string) => {
    if (calcOperator !== null && !calcNewNumber) {
      const result = calculateCurrent();
      setCalcDisplay(result.toString());
      setCalcMemory(result);
    } else {
      setCalcMemory(parseFloat(calcDisplay));
    }
    setCalcOperator(op);
    setCalcNewNumber(true);
  };

  const handleCalcEquals = () => {
    if (calcOperator !== null) {
      const result = calculateCurrent();
      setCalcDisplay(result.toString());
      setCalcMemory(null);
      setCalcOperator(null);
      setCalcNewNumber(true);
    }
  };

  const handleCalcClear = () => {
    setCalcDisplay('0');
    setCalcMemory(null);
    setCalcOperator(null);
    setCalcNewNumber(true);
  };



  const handleCalcPercentage = () => {
    setCalcDisplay((parseFloat(calcDisplay) / 100).toString());
    setCalcNewNumber(true);
  };

  const handleTracker = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackerLoading(true);
    setTrackerError("");
    setTrackerResult(null);

    try {
      const payload: any = { asset: trackerData.asset, currency: trackerData.currency, date1: trackerData.date1 };
      if (trackerData.date2) payload.date2 = trackerData.date2;

      const response = await fetch("/api/rate-tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Something went wrong.");
      setTrackerResult(data.data);
    } catch (err: any) {
      setTrackerError(err.message);
    } finally {
      setTrackerLoading(false);
    }
  };

  const handleChange = (changes: Partial<typeof formData>) => {
    setFormData({ ...formData, ...changes });
    if (result) setIsDirty(true);
  };

  // Get the display name for the current asset based on what was *submitted*
  const getAssetDisplayName = (assetId: string) => {
    return t(`form.assets.${assetId}` as any);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans selection:bg-emerald-500/30">
      
      {/* Background Glow */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-emerald-500/20 to-transparent blur-3xl -z-10 opacity-70"></div>
      
      <main className="max-w-5xl mx-auto px-6 py-12 md:py-24 space-y-12 relative z-10">
        
        {/* Header Section */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20 mb-4 animate-fade-in relative">
            <Activity className="w-4 h-4" />
            <span>{t("title")}</span>
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 md:top-0 md:left-auto md:right-[-120px] md:translate-x-0">
              <LanguageSwitcher />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-neutral-200 to-neutral-500 drop-shadow-sm">
            {activeTab === 'investment' && <>{t("headers.investment")}</>}
            {activeTab === 'converter' && <>{t("headers.converter")}</>}
            {activeTab === 'calculator' && <>{t("headers.calculator")}</>}
            {activeTab === 'tracker' && <>{t("headers.tracker")}</>}
          </h1>
          <p className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto font-light">
            {activeTab === 'investment' && t("descriptions.investment")}
            {activeTab === 'converter' && t("descriptions.converter")}
            {activeTab === 'calculator' && t("descriptions.calculator")}
            {activeTab === 'tracker' && t("descriptions.tracker")}
          </p>
        </header>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-neutral-900 border border-neutral-800 p-1 rounded-2xl inline-flex relative overflow-hidden">
            {/* Tab pill background */}
            <div 
              className={`absolute top-1 bottom-1 w-[calc(25%-4px)] bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all duration-300 ease-out`}
              style={{ insetInlineStart: activeTab === 'investment' ? '4px' : activeTab === 'converter' ? 'calc(25% + 2px)' : activeTab === 'calculator' ? 'calc(50% + 0px)' : 'calc(75% - 2px)' }}
            ></div>
            
            <button 
              onClick={() => setActiveTab('investment')}
              className={`relative z-10 px-4 py-3 rounded-xl font-medium transition-all duration-300 w-28 sm:w-36 ${activeTab === 'investment' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              {t("tabs.investment")}
            </button>
            <button 
              onClick={() => setActiveTab('converter')}
              className={`relative z-10 px-4 py-3 rounded-xl font-medium transition-all duration-300 w-28 sm:w-36 ${activeTab === 'converter' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              {t("tabs.converter")}
            </button>
            <button 
              onClick={() => setActiveTab('calculator')}
              className={`relative z-10 px-4 py-3 rounded-xl font-medium transition-all duration-300 w-28 sm:w-36 ${activeTab === 'calculator' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              {t("tabs.calculator")}
            </button>
            <button 
              onClick={() => setActiveTab('tracker')}
              className={`relative z-10 px-4 py-3 rounded-xl font-medium transition-all duration-300 w-28 sm:w-36 ${activeTab === 'tracker' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
            >
              {t("tabs.tracker")}
            </button>
          </div>
        </div>

        {activeTab === 'investment' ? (
          <div className="grid md:grid-cols-12 gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Input Form Column (Investment) */}
          <div className="md:col-span-5 relative group">
            {/* Glassmorphic border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-br from-emerald-500/30 to-purple-600/30 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
            
            <div className="relative bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-400" /> {t("form.amount")}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium text-lg"
                      value={formData.amount}
                      onChange={(e) => handleChange({ amount: e.target.value })}
                    />
                    <select
                      className="bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none font-medium cursor-pointer"
                      value={formData.currency}
                      onChange={(e) => handleChange({ currency: e.target.value })}
                    >
                      {currencies.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" /> {t("form.investIn")}
                  </label>
                  <select
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none font-medium cursor-pointer"
                    value={formData.asset}
                    onChange={(e) => handleChange({ asset: e.target.value })}
                  >
                    <option value="ALL" className="font-bold text-amber-400">{t("form.compareAll")}</option>
                    {assetGroups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.assets.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" /> {t("form.date")}
                  </label>
                  <input
                    type="date"
                    required
                    max={new Date().toISOString().split("T")[0]} // cannot be in future
                    className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium appearance-none [color-scheme:dark]"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-lg rounded-xl px-4 py-4 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      {t("buttons.calculating")}
                    </>
                  ) : (
                    <>
                      {t("buttons.travel")} <ArrowRight className="w-5 h-5 mx-2 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Results Column */}
          <div className="md:col-span-7">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-6 py-4 rounded-2xl mb-8 flex items-start gap-4">
                <div className="p-2 bg-red-500/20 rounded-full">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{t("results.error")}</h3>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
              </div>
            )}

            {!result && !loading && !error && (
              <div className="h-full min-h-[400px] border border-neutral-800 border-dashed rounded-3xl flex flex-col items-center justify-center text-neutral-500 bg-neutral-900/20">
                <Clock className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg">{t("results.placeholder")}</p>
              </div>
            )}

            {result && !loading && submittedData && (
              <div className={`space-y-6 transition-all duration-500 ${isDirty ? 'opacity-50 saturate-50' : 'animate-in slide-in-from-bottom-8 fade-in duration-700'}`}>
                {Array.isArray(result) ? (
                  <>
                    <div className="flex flex-col gap-2 mb-6">
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-amber-400" /> {t("results.leaderboard")}
                      </h2>
                      <p className="text-neutral-400">{t("results.worth", { amount: submittedData.amount, currency: submittedData.currency })}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {[...result].sort((a, b) => b.roiPercentage - a.roiPercentage).map((item, index) => {
                        const isUp = item.roiPercentage >= 0;
                        const assetObj = assetGroups.flatMap(g => g.assets).find(a => a.id === item.assetId);
                        const name = assetObj ? assetObj.name : item.assetId;
                        
                        return (
                          <div key={item.assetId} className="relative overflow-hidden bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl hover:border-neutral-700 transition-all group">
                            <div className={`absolute -right-10 -top-10 w-24 h-24 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition duration-500 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                            
                            <div className="relative z-10 flex flex-col gap-3">
                              <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-neutral-800 font-bold text-neutral-400 text-xs border border-neutral-700">
                                    #{index + 1}
                                  </div>
                                  <h3 className="font-bold text-white text-sm sm:text-base break-words leading-tight">{name}</h3>
                                </div>
                                <div className={`px-2 py-1 rounded-full text-xs font-bold ${isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                  {isUp ? '+' : ''}{item.roiPercentage.toFixed(2)}%
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-[10px] text-neutral-500 mb-1">Current Value</p>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-neutral-400 mb-1">{submittedData.currency}</span>
                                  <span className="text-xl sm:text-2xl font-black text-white leading-none tracking-tighter break-words" title={`${submittedData.currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(item.currentValueLocal)}`}>
                                    {new Intl.NumberFormat('en-US', { maximumFractionDigits: item.currentValueLocal > 1000 ? 2 : 6 }).format(item.currentValueLocal)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                {/* Hero Result Card */}
                <div className="relative overflow-hidden bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
                  {/* Glowing blobs inside card */}
                  <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${result.roiPercentage >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                  
                  <div className="relative z-10 flex flex-col items-start gap-2">
                    <p className="text-neutral-400 font-medium h-6">
                      {isDirty ? t("results.outdated") : t("results.worth", { amount: submittedData.amount, currency: submittedData.currency })}
                    </p>
                    <div className="flex items-end gap-3 flex-wrap">
                      <h2 className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-400">
                        {new Intl.NumberFormat(locale, { style: 'currency', currency: submittedData.currency, maximumFractionDigits: 0 }).format(result.currentValueLocal)} 
                      </h2>
                    </div>
                    
                    <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${result.roiPercentage >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {result.roiPercentage >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      {result.roiPercentage > 0 ? '+' : ''}{result.roiPercentage.toFixed(2)}% {t("results.roi")}
                    </div>
                  </div>
                </div>

                {/* Grid Stats */}
                {submittedData.asset.startsWith('currency_') ? (
                  /* Currency-specific results */
                  (() => {
                    const targetCurrency = submittedData.asset.replace('currency_', '').toUpperCase();
                    return (
                      <div className="space-y-4">
                        {/* Exchange Rate Comparison */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
                            <p className="text-neutral-400 text-sm mb-1 font-medium">💰 {t("results.pastExchangeRate")}</p>
                            <p className="text-2xl font-bold text-white">
                              1 {targetCurrency} = {(result.pastAssetPriceUsd * result.pastExchangeRate).toFixed(2)} {submittedData.currency}
                            </p>
                            <p className="text-neutral-500 text-xs mt-1">{t("results.pastPrice", { date: submittedData.date })}</p>
                          </div>
                          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 relative">
                            <p className="text-neutral-400 text-sm mb-1 font-medium">📈 {t("results.currentExchangeRate")}</p>
                            <p className="text-2xl font-bold text-white">
                              1 {targetCurrency} = {(result.currentAssetPriceUsd * result.currentExchangeRate).toFixed(2)} {submittedData.currency}
                            </p>
                            <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <p className="text-neutral-500 text-xs mt-1">{t("results.liveRate")}</p>
                          </div>
                        </div>

                        {/* What you got */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
                            <p className="text-neutral-400 text-sm mb-1 font-medium">{t("results.unitsBoughtAlternative")}</p>
                            <p className="text-2xl font-bold text-white">
                              {result.unitsBought.toFixed(2)} {targetCurrency}
                            </p>
                            <p className="text-neutral-500 text-xs mt-1">{t("results.worth", { amount: submittedData.amount, currency: submittedData.currency })}</p>
                          </div>
                          <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
                            <p className="text-neutral-400 text-sm mb-1 font-medium">{t("results.worthAlternative", { currency: targetCurrency })}</p>
                            <p className="text-2xl font-bold text-white">
                              {new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(result.currentValueLocal)} {submittedData.currency}
                            </p>
                            <p className={`text-xs mt-1 ${result.roiPercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {result.roiPercentage > 0 ? '↑' : '↓'} {Math.abs(result.roiPercentage).toFixed(1)}% {result.roiPercentage >= 0 ? t("results.gain") : t("results.loss")}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* Standard asset results (crypto, gold, etc.) */
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
                      <p className="text-neutral-400 text-sm mb-1 font-medium">🛒 {t("results.unitsBought")}</p>
                      <p className="text-2xl font-bold text-white">
                        {result.unitsBought < 0.01 ? result.unitsBought.toExponential(4) : result.unitsBought.toFixed(4)} {submittedData.asset === 'gold' ? 'oz' : getAssetDisplayName(submittedData.asset).split('(')[1]?.replace(')', '') || submittedData.asset.toUpperCase()}
                      </p>
                    </div>
                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
                      <p className="text-neutral-400 text-sm mb-1 font-medium">📅 {t("results.pastPrice", { date: submittedData.date })}</p>
                      <p className="text-2xl font-bold text-white">
                        {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(result.pastAssetPriceUsd)}
                      </p>
                    </div>
                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 relative">
                      <p className="text-neutral-400 text-sm mb-1 font-medium">💹 {t("results.currentPrice")}</p>
                      <p className="text-2xl font-bold text-white">
                        {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(result.currentAssetPriceUsd)}
                      </p>
                      <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
                      <p className="text-neutral-400 text-sm mb-1 font-medium">💵 {t("results.initialValueUsd")}</p>
                      <p className="text-2xl font-bold text-white">
                        {new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(result.initialInvestmentUsd)}
                      </p>
                    </div>
                  </div>
                )}
                </>
                )}
              </div>
            )}
          </div>
          </div>
        ) : activeTab === 'converter' ? (
          <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Converter Form */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-600/30 to-emerald-500/30 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              
              <div className="relative bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl">
                <form onSubmit={handleConvert} className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-4 items-end">
                    
                    <div className="space-y-2 flex-grow">
                      <label className="text-sm font-medium text-neutral-300">{t("form.amount")}</label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="any"
                        className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all font-medium text-xl"
                        value={converterData.amount}
                        onChange={(e) => setConverterData({ ...converterData, amount: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2 w-full md:w-32">
                      <label className="text-sm font-medium text-neutral-300 text-center block">{t("form.from")}</label>
                      <select
                        className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none font-medium text-center cursor-pointer"
                        value={converterData.fromCurrency}
                        onChange={(e) => setConverterData({ ...converterData, fromCurrency: e.target.value })}
                      >
                        {currencies.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex justify-center md:pb-2">
                      <button 
                        type="button" 
                        onClick={handleSwapCurrencies}
                        className="p-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-full transition-all border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        title={t("buttons.swap")}
                      >
                        <ArrowUpDown className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-2 w-full md:w-32">
                      <label className="text-sm font-medium text-neutral-300 text-center block">{t("form.to")}</label>
                      <select
                        className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none font-medium text-center cursor-pointer"
                        value={converterData.toCurrency}
                        onChange={(e) => setConverterData({ ...converterData, toCurrency: e.target.value })}
                      >
                        {currencies.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {converterError && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {converterError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={converterLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-emerald-500 hover:from-purple-400 hover:to-emerald-400 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 group"
                  >
                    {converterLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {t("buttons.convert")} <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 rtl:rotate-180" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Converter Result */}
            {converterResult && !converterLoading && (
              <div className="relative overflow-hidden bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl text-center space-y-4 animate-in slide-in-from-bottom-8 fade-in duration-700">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-md max-h-md rounded-full blur-3xl opacity-20 bg-purple-500 pointer-events-none"></div>
                
                <div className="relative z-10">
                  <p className="text-neutral-400 font-medium text-lg">
                    {new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(converterResult.originalAmount)} {converterData.fromCurrency} =
                  </p>
                  <h2 className="text-6xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-200 py-4">
                    {new Intl.NumberFormat(locale, { maximumFractionDigits: 4 }).format(converterResult.convertedAmount)} {converterData.toCurrency}
                  </h2>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-950/50 border border-neutral-800/80">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-neutral-400 text-sm font-mono">
                      1 {converterData.fromCurrency} = {converterResult.rate.toFixed(4)} {converterData.toCurrency}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'calculator' ? (
          <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Calculator UI */}
            <div className="relative group p-1">
              {/* Outer Glow */}
              <div className="absolute -inset-0 bg-gradient-to-br from-blue-500/30 via-emerald-500/30 to-purple-600/30 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-700 pointer-events-none"></div>
              
              <div className="relative bg-neutral-900 border border-neutral-800 rounded-[2.5rem] p-6 shadow-2xl flex flex-col gap-6">
                
                {/* Display */}
                <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-6 flex flex-col items-end gap-2 overflow-hidden relative shadow-inner">
                  {/* Subtle inner reflection */}
                  <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white-[0.02] to-transparent pointer-events-none"></div>
                  
                  <div className="text-neutral-500 h-6 font-mono tracking-widest text-sm w-full text-right overflow-hidden break-normal whitespace-nowrap overflow-ellipsis">
                    {calcMemory !== null && calcOperator !== null ? `${calcMemory} ${calcOperator}` : ''}
                  </div>
                  <div className="text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white to-neutral-300 w-full text-right overflow-x-auto no-scrollbar" style={{fontVariantNumeric: 'tabular-nums'}}>
                    {calcDisplay}
                  </div>
                </div>

                {/* Buttons Grid */}
                <div className="grid grid-cols-4 gap-3">
                  <button onClick={handleCalcClear} className="col-span-2 py-4 rounded-full bg-red-500/10 text-red-500 font-bold text-xl hover:bg-red-500/20 transition-all border border-red-500/20">C</button>
                  <button onClick={handleCalcPercentage} className="py-4 rounded-full bg-neutral-800 text-emerald-400 font-medium text-xl hover:bg-neutral-700 transition-all">%</button>
                  <button onClick={() => handleCalcOperator('÷')} className={`py-4 rounded-full font-bold text-2xl transition-all border ${calcOperator === '÷' ? 'bg-blue-500 text-white border-blue-400' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'}`}>÷</button>

                  <button onClick={() => handleCalcNumber('7')} className="py-4 rounded-full bg-neutral-800 text-white font-semibold text-2xl hover:bg-neutral-700 transition-all">7</button>
                  <button onClick={() => handleCalcNumber('8')} className="py-4 rounded-full bg-neutral-800 text-white font-semibold text-2xl hover:bg-neutral-700 transition-all">8</button>
                  <button onClick={() => handleCalcNumber('9')} className="py-4 rounded-full bg-neutral-800 text-white font-semibold text-2xl hover:bg-neutral-700 transition-all">9</button>
                  <button onClick={() => handleCalcOperator('×')} className={`py-4 rounded-full font-bold text-2xl transition-all border ${calcOperator === '×' ? 'bg-blue-500 text-white border-blue-400' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'}`}>×</button>

                  <button onClick={() => handleCalcNumber('4')} className="py-4 rounded-full bg-neutral-800 text-white font-semibold text-2xl hover:bg-neutral-700 transition-all">4</button>
                  <button onClick={() => handleCalcNumber('5')} className="py-4 rounded-full bg-neutral-800 text-white font-semibold text-2xl hover:bg-neutral-700 transition-all">5</button>
                  <button onClick={() => handleCalcNumber('6')} className="py-4 rounded-full bg-neutral-800 text-white font-semibold text-2xl hover:bg-neutral-700 transition-all">6</button>
                  <button onClick={() => handleCalcOperator('-')} className={`py-4 rounded-full font-bold text-3xl transition-all border ${calcOperator === '-' ? 'bg-blue-500 text-white border-blue-400' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'}`}>-</button>

                  <button onClick={() => handleCalcNumber('1')} className="py-4 rounded-full bg-neutral-800 text-white font-semibold text-2xl hover:bg-neutral-700 transition-all">1</button>
                  <button onClick={() => handleCalcNumber('2')} className="py-4 rounded-full bg-neutral-800 text-white font-semibold text-2xl hover:bg-neutral-700 transition-all">2</button>
                  <button onClick={() => handleCalcNumber('3')} className="py-4 rounded-full bg-neutral-800 text-white font-semibold text-2xl hover:bg-neutral-700 transition-all">3</button>
                  <button onClick={() => handleCalcOperator('+')} className={`py-4 rounded-full font-bold text-2xl transition-all border ${calcOperator === '+' ? 'bg-blue-500 text-white border-blue-400' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20'}`}>+</button>

                  <button onClick={() => handleCalcNumber('0')} className="col-span-2 py-4 rounded-full bg-neutral-800 text-white font-semibold text-2xl hover:bg-neutral-700 transition-all">0</button>
                  <button onClick={handleCalcDecimal} className="py-4 rounded-full bg-neutral-800 text-white font-semibold text-2xl hover:bg-neutral-700 transition-all">.</button>
                  <button onClick={handleCalcEquals} className="py-4 rounded-full bg-gradient-to-b from-emerald-400 to-blue-500 text-white font-bold text-4xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:brightness-110 transition-all">=</button>
                </div>

              </div>
            </div>

            <div className="mt-8 flex justify-center items-center gap-2 opacity-30 pointer-events-none">
              <Calculator className="w-4 h-4" />
              <span className="text-xs tracking-widest uppercase font-semibold">{t("calculatorFooter")}</span>
            </div>
          </div>
        ) : (
          /* Rate Tracker Tab */
          <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Tracker Form */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/30 to-rose-500/30 rounded-3xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
              
              <div className="relative bg-neutral-900/80 backdrop-blur-xl border border-neutral-800 rounded-3xl p-8 shadow-2xl">
                <form onSubmit={handleTracker} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-amber-400" /> {t("form.asset")}
                      </label>
                      <select
                        className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none font-medium cursor-pointer"
                        value={trackerData.asset}
                        onChange={(e) => setTrackerData({ ...trackerData, asset: e.target.value })}
                      >
                        {assetGroups.map((group) => (
                          <optgroup key={group.label} label={group.label}>
                            {group.assets.map((a) => (
                              <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-amber-400" /> {t("form.targetCurrency")}
                      </label>
                      <select
                        className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 appearance-none font-medium cursor-pointer"
                        value={trackerData.currency}
                        onChange={(e) => setTrackerData({ ...trackerData, currency: e.target.value })}
                      >
                        {currencies.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" /> {t("form.date1")} <span className="text-neutral-500 text-xs">{t("form.required")}</span>
                      </label>
                      <input
                        type="date"
                        required
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium [color-scheme:dark]"
                        value={trackerData.date1}
                        onChange={(e) => setTrackerData({ ...trackerData, date1: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-neutral-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" /> {t("form.date2")} <span className="text-neutral-500 text-xs">{t("form.optional")}</span>
                      </label>
                      <input
                        type="date"
                        max={new Date().toISOString().split("T")[0]}
                        className="w-full bg-neutral-950 border border-neutral-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium [color-scheme:dark]"
                        value={trackerData.date2}
                        onChange={(e) => setTrackerData({ ...trackerData, date2: e.target.value })}
                      />
                    </div>
                  </div>

                  {trackerError && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {trackerError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={trackerLoading}
                    className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 group"
                  >
                    {trackerLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {t("buttons.lookup")} <Search className="w-5 h-5 transition-transform group-hover:scale-110" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Tracker Results */}
            {trackerResult && !trackerLoading && (
              <div className="space-y-6 animate-in slide-in-from-bottom-8 fade-in duration-700">
                {/* Price Cards */}
                <div className={`grid ${trackerResult.comparison ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
                  {/* Date 1 Price */}
                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
                    <p className="text-neutral-400 text-sm mb-1 font-medium">📅 {t("results.pastPrice", { date: trackerResult.date1 })}</p>
                    <p 
                      className="text-2xl xl:text-3xl font-bold text-white truncate"
                      title={new Intl.NumberFormat(locale, { style: 'currency', currency: trackerResult.currency || 'USD', maximumFractionDigits: 6 }).format(trackerResult.price1)}
                    >
                      {new Intl.NumberFormat(locale, { style: 'currency', currency: trackerResult.currency || 'USD', maximumFractionDigits: trackerResult.price1 > 1000 ? 2 : 6 }).format(trackerResult.price1)}
                    </p>
                    <p className="text-neutral-500 text-xs mt-1">{t("results.perUnit", { unit: trackerResult.unit })}</p>
                  </div>

                  {/* Date 2 Price (if comparison) */}
                  {trackerResult.comparison && (
                    <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6">
                      <p className="text-neutral-400 text-sm mb-1 font-medium">📅 {t("results.pastPrice", { date: trackerResult.comparison.date2 })}</p>
                      <p 
                        className="text-2xl xl:text-3xl font-bold text-white truncate"
                        title={new Intl.NumberFormat(locale, { style: 'currency', currency: trackerResult.currency || 'USD', maximumFractionDigits: 6 }).format(trackerResult.comparison.price2)}
                      >
                        {new Intl.NumberFormat(locale, { style: 'currency', currency: trackerResult.currency || 'USD', maximumFractionDigits: trackerResult.comparison.price2 > 1000 ? 2 : 6 }).format(trackerResult.comparison.price2)}
                      </p>
                      <p className="text-neutral-500 text-xs mt-1">{t("results.perUnit", { unit: trackerResult.unit })}</p>
                    </div>
                  )}

                  {/* Current Price */}
                  <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 relative">
                    <p className="text-neutral-400 text-sm mb-1 font-medium">💹 {t("results.livePrice")}</p>
                    <p 
                      className="text-2xl xl:text-3xl font-bold text-white truncate"
                      title={new Intl.NumberFormat(locale, { style: 'currency', currency: trackerResult.currency || 'USD', maximumFractionDigits: 6 }).format(trackerResult.currentPrice)}
                    >
                      {new Intl.NumberFormat(locale, { style: 'currency', currency: trackerResult.currency || 'USD', maximumFractionDigits: trackerResult.currentPrice > 1000 ? 2 : 6 }).format(trackerResult.currentPrice)}
                    </p>
                    <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-neutral-500 text-xs mt-1">{t("results.perUnit", { unit: trackerResult.unit })}</p>
                  </div>
                </div>

                {/* Change from Date 1 to Now */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                  <p className="text-neutral-400 text-sm mb-3 font-medium">📊 {t("results.changeFromDate", { date: trackerResult.date1 })}</p>
                  <div className="flex items-center gap-4 flex-wrap">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold text-lg ${trackerResult.changeFromDate1 >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {trackerResult.changeFromDate1 >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      {trackerResult.changePercentFromDate1 > 0 ? '+' : ''}{trackerResult.changePercentFromDate1.toFixed(2)}%
                    </div>
                    <span 
                      className="text-neutral-400 text-sm truncate block"
                      title={`${trackerResult.changeFromDate1 >= 0 ? '+' : '-'}${new Intl.NumberFormat(locale, { style: 'currency', currency: trackerResult.currency || 'USD', maximumFractionDigits: 6 }).format(Math.abs(trackerResult.changeFromDate1))} per ${trackerResult.unit}`}
                    >
                      {trackerResult.changeFromDate1 >= 0 ? '+' : '-'}{new Intl.NumberFormat(locale, { style: 'currency', currency: trackerResult.currency || 'USD', maximumFractionDigits: Math.abs(trackerResult.changeFromDate1) > 1000 ? 2 : 6 }).format(Math.abs(trackerResult.changeFromDate1))} {t("results.perUnit", { unit: trackerResult.unit })}
                    </span>
                  </div>
                </div>

                {/* Visual Comparison (only when two dates are provided) */}
                {trackerResult.comparison && (() => {
                  const p1 = trackerResult.price1;
                  const p2 = trackerResult.comparison.price2;
                  const maxPrice = Math.max(p1, p2);
                  const bar1Pct = maxPrice > 0 ? (p1 / maxPrice) * 100 : 0;
                  const bar2Pct = maxPrice > 0 ? (p2 / maxPrice) * 100 : 0;
                  const changePct = trackerResult.comparison.changePercentBetween;
                  const isUp = changePct >= 0;

                  return (
                    <div className="relative overflow-hidden bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
                      <div className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl opacity-20 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                      
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-bold text-white">🔍 {t("results.visualComparison")}</h3>
                          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold ${isUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {changePct > 0 ? '+' : ''}{changePct.toFixed(2)}%
                          </div>
                        </div>

                        {/* Bar 1 — Date 1 */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-neutral-400 text-sm font-medium">{trackerResult.date1}</span>
                            <span className="text-white font-bold">{new Intl.NumberFormat(locale, { style: 'currency', currency: trackerResult.currency || 'USD', maximumFractionDigits: 2 }).format(p1)}</span>
                          </div>
                          <div className="w-full bg-neutral-800 rounded-full h-8 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000 ease-out flex items-center justify-end pr-3"
                              style={{ width: `${Math.max(bar1Pct, 5)}%` }}
                            >
                              <span className="text-xs font-bold text-white/80 whitespace-nowrap">{bar1Pct.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Bar 2 — Date 2 */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-baseline">
                            <span className="text-neutral-400 text-sm font-medium">{trackerResult.comparison.date2}</span>
                            <span className="text-white font-bold">{new Intl.NumberFormat(locale, { style: 'currency', currency: trackerResult.currency || 'USD', maximumFractionDigits: 2 }).format(p2)}</span>
                          </div>
                          <div className="w-full bg-neutral-800 rounded-full h-8 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3 ${isUp ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}
                              style={{ width: `${Math.max(bar2Pct, 5)}%` }}
                            >
                              <span className="text-xs font-bold text-white/80 whitespace-nowrap">{bar2Pct.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Difference Summary */}
                        <div className="text-center pt-4 border-t border-neutral-800">
                          <p className="text-neutral-400 text-sm">{t("results.visualComparison")}</p>
                          <p 
                            className={`text-2xl xl:text-3xl font-black mt-1 truncate block ${isUp ? 'text-emerald-400' : 'text-red-400'}`}
                            title={`${isUp ? '+' : '-'}${new Intl.NumberFormat(locale, { style: 'currency', currency: trackerResult.currency || 'USD', maximumFractionDigits: 6 }).format(Math.abs(trackerResult.comparison.changeBetween))}`}
                          >
                            {isUp ? '+' : '-'}{new Intl.NumberFormat(locale, { style: 'currency', currency: trackerResult.currency || 'USD', maximumFractionDigits: Math.abs(trackerResult.comparison.changeBetween) > 1000 ? 2 : 6 }).format(Math.abs(trackerResult.comparison.changeBetween))}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </main>

    </div>
  );
}
