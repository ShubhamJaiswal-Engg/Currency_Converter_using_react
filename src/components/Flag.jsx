import data from "./countrycode.json"

const Flag = ({from}) => {
  const countrycode = data?.[from];
  if (!countrycode) return null;

  return (
    <img
      className='h-8 w-8 rounded-sm'
      src={`https://flagsapi.com/${countrycode}/flat/64.png`}
      alt={`${from} flag`}
      loading="lazy"
    />
  )
}

export default Flag;
