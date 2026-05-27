import React from 'react';
import Flag from "./Flag"

const CurrencyDropdown = ({
    id,
    from,
    currencies,
    currency,
    setCurrency,
    title="",
}) => {
  const selectId = id ?? `${title}`.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const flagCurrency = from ?? currency;

  return (
    <div className='mt-1 relative w-full'>
      <label className='block text-sm text-gray-700 font-medium' htmlFor={selectId}>{title}</label>
      <div className='relative'>
      <select
        id={selectId}
        value={currency}
        onChange={(e)=> setCurrency(e.target.value)}
        className='w-full mt-1 h-12 px-3 pr-14 bg-white border rounded-md border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
      >
        {currencies?.map((currency)=>(
          <option value={currency} key={currency}>{currency}</option>
        ))}
      </select>
      <span
        className='pointer-events-none absolute inset-y-0 right-3 flex items-center'
        aria-hidden="true"
      >
        <Flag from={flagCurrency} />
      </span>
      </div>
    </div>
  )
}

export default CurrencyDropdown
