import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BsArrowLeftRight } from "react-icons/bs";
import CurrencyDropdown from './CurrencyDropdown';

const CurrencyConverter = () => {
  const [currencies, setCurrencies] = useState([]);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [amount, setAmount] = useState("1");
  const [from, setFrom] = useState("USD");
  const [tocurr, setTocurr] = useState("INR");

  const [convertedAmount, setConvertedAmount] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState("");

  const conversionCacheRef = useRef(new Map());

  const amountNumber = useMemo(() => Number(amount), [amount]);
  const isAmountValid = useMemo(() => {
    if (amount === "") return false;
    if (!Number.isFinite(amountNumber)) return false;
    return amountNumber >= 0;
  }, [amount, amountNumber]);


  const fetchCurrencies = useCallback(async (signal) => {
    setIsLoadingCurrencies(true);
    setError("");
    try {
      const cached = sessionStorage.getItem("cc_currencies_v1");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) setCurrencies(parsed);
      }

      const res = await fetch("/frankfurter/currencies", { signal });
      if (!res.ok) throw new Error(`Failed to load currencies (${res.status})`);
      const data = await res.json();
      const list = Object.keys(data);
      setCurrencies(list);
      sessionStorage.setItem("cc_currencies_v1", JSON.stringify(list));
    } catch (err) {
      if (err?.name === "AbortError") return;
      setError("Could not load currencies. Please try again.");
      console.error("Error fetching currencies", err);
    } finally {
      setIsLoadingCurrencies(false);
    }
  }, []);

  const convertCurrency = useCallback(async ({ silent = false } = {}) => {
    if (!isAmountValid) {
      setConvertedAmount(null);
      if (!silent) setError("Enter a valid amount.");
      return;
    }

    if (!from || !tocurr) return;
    setError("");

    if (from === tocurr) {
      setConvertedAmount(amountNumber);
      setLastUpdated(null);
      return;
    }

    const cacheKey = `${amountNumber}|${from}|${tocurr}`;
    const cached = conversionCacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 30_000) {
      setConvertedAmount(cached.value);
      setLastUpdated(cached.date ?? null);
      return;
    }

    setConverting(true);
    try {
      const url = `/frankfurter/latest?amount=${encodeURIComponent(
        amountNumber
      )}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(tocurr)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Conversion failed (${res.status})`);
      const data = await res.json();
      const value = data?.rates?.[tocurr];
      if (!Number.isFinite(value)) throw new Error("Invalid conversion response");

      conversionCacheRef.current.set(cacheKey, {
        value,
        date: data?.date ?? null,
        timestamp: Date.now(),
      });

      setConvertedAmount(value);
      setLastUpdated(data?.date ?? null);
    } catch (err) {
      setConvertedAmount(null);
      if (!silent) setError("Could not convert right now. Please try again.");
      console.error("Error converting currency", err);
    } finally {
      setConverting(false);
    }
  }, [amountNumber, from, isAmountValid, tocurr]);

  const swapCurrencies = useCallback(() => {
    setFrom(tocurr);
    setTocurr(from);
  }, [from, tocurr]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCurrencies(controller.signal);
    return () => controller.abort();
  }, [fetchCurrencies]);

  useEffect(() => {
    // Only convert on explicit user action (Convert button)
    setConvertedAmount(null);
    setLastUpdated(null);
    setError("");
  }, [amount, from, tocurr]);

  const formattedConverted = useMemo(() => {
    if (convertedAmount === null) return null;
    const formatter = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 6,
    });
    return formatter.format(convertedAmount);
  }, [convertedAmount]);

  const unitRate = useMemo(() => {
    if (convertedAmount === null) return null;
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) return null;
    if (from === tocurr) return null;
    const rate = convertedAmount / amountNumber;
    return Number.isFinite(rate) ? rate : null;
  }, [amountNumber, convertedAmount, from, tocurr]);

  const formattedUnitRate = useMemo(() => {
    if (unitRate === null) return null;
    const formatter = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 6,
    });
    return formatter.format(unitRate);
  }, [unitRate]);

  const formattedReverseRate = useMemo(() => {
    if (unitRate === null || unitRate === 0) return null;
    const reverse = 1 / unitRate;
    if (!Number.isFinite(reverse)) return null;
    const formatter = new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 6,
    });
    return formatter.format(reverse);
  }, [unitRate]);

  const canConvert = currencies.length > 0 && isAmountValid && !converting;
  
  return (
    <div className='w-full max-w-xl mx-auto my-10 p-6 bg-white rounded-xl shadow-md'>
      <div className='flex items-start justify-between gap-4 mb-6'>
        <div>
          <h1 className='text-2xl font-semibold text-gray-800'>Currency Converter</h1>
          <p className='text-sm text-gray-500'>Live rates via frankfurter.dev</p>
        </div>
        {isLoadingCurrencies && (
          <div className='text-sm text-gray-500'>Loading currencies…</div>
        )}
      </div>

      <div className='space-y-4'>
        <div>
          <label htmlFor="amount" className='block text-sm font-medium text-gray-700'>Amount</label>
          <input
            id="amount"
            type="number"
            min={0}
            step="any"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className='w-full mt-1 p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
            placeholder="0.00"
          />
          {!isAmountValid && (
            <div className='mt-1 text-sm text-red-600'>Enter a number ≥ 0.</div>
          )}
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-3 gap-4 items-end'>
          <CurrencyDropdown
            id="from-currency"
            currencies={currencies}
            from={from}
            setCurrency={setFrom}
            currency={from}
            title='From'
          />

          <div className='flex justify-center sm:pb-1'>
            <button
              type="button"
              onClick={swapCurrencies}
              disabled={converting || !currencies.length}
              className='bg-gray-100 p-2 rounded-full cursor-pointer hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
              aria-label="Swap currencies"
              title="Swap"
            >
              <BsArrowLeftRight className='text-xl text-gray-700' />
            </button>
          </div>

          <CurrencyDropdown
            id="to-currency"
            currencies={currencies}
            from={tocurr}
            setCurrency={setTocurr}
            currency={tocurr}
            title='To'
          />
        </div>

        {error && (
          <div className='p-3 rounded-md bg-red-50 text-red-700 text-sm'>{error}</div>
        )}

        <div className='flex items-center justify-between gap-4'>
          <div className='text-xs text-gray-500'>
            {lastUpdated ? `Rate date: ${lastUpdated}` : ""}
          </div>
          <button
            type="button"
            onClick={() => convertCurrency({ silent: false })}
            disabled={!canConvert}
            className={
              `inline-flex items-center justify-center bg-indigo-600 text-white px-5 py-2 rounded-md hover:bg-indigo-700 ` +
              `focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed ` +
              (converting ? "animate-pulse" : "")
            }
          >
            {converting ? "Converting…" : "Convert"}
          </button>
        </div>

        <div className='pt-2 border-t border-gray-100'>
          <div className='text-sm text-gray-500'>Converted Amount</div>
          <div className='mt-1 text-2xl font-semibold text-gray-900'>
            {formattedConverted !== null ? (
              <>
                {formattedConverted} <span className='text-gray-500 text-lg font-medium'>{tocurr}</span>
              </>
            ) : (
              <span className='text-gray-400'>—</span>
            )}
          </div>

          {formattedUnitRate !== null && formattedReverseRate !== null && (
            <div className='mt-2 text-sm text-gray-600 space-y-0.5'>
              <div>
                1 {from} = <span className='font-medium text-gray-800'>{formattedUnitRate}</span> {tocurr}
              </div>
              <div>
                1 {tocurr} = <span className='font-medium text-gray-800'>{formattedReverseRate}</span> {from}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CurrencyConverter;
