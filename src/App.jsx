import './App.css'
import CurrencyConverter from './components/CurrencyConverter'

function App() {

  return (
    <div className='min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4 py-10'>
      <div className='w-full'>
        <CurrencyConverter />
      </div>
    </div>
  )
}

export default App
