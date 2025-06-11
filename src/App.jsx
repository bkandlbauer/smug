import { useState } from 'react';
import './App.css';
import FillLevel from './components/FillLevel.jsx';
import LastRefill from './components/LastRefill.jsx';
import Temperature from './components/Temperature.jsx';
import CalibrationPopup from './components/CalibrationPopup.jsx';
import ProfilesPopup from './components/ProfilesPopup.jsx';
import DataService from './DataService.jsx';

function App() {

const [filled, setFilled] = useState(false);
const [fill, setFill] = useState(71);
const [last, setLast] = useState(12);
const [temperature, setTemperature] = useState(61);
const [connection, setConnection] = useState("disconnected");

const [showCalibration, setShowCalibration] = useState(false);
const [showProfiles, setShowProfiles] = useState(false);

  return (
      <div className="mt-15">
      <div className="font-bold mt-4 text-left">[{connection}]</div>
      <h1 className="mt-1 text-7xl font-bold text-left mb-10">Smug.</h1>
      <div className='flex flex-row gap-5 mb-10'>
        <FillLevel value={fill}/>
        <LastRefill value={last}/>
      </div>
      <Temperature value={temperature}/>
      <CalibrationPopup isOpen={showCalibration} onClose={() => setShowCalibration(false)} />
      <ProfilesPopup isOpen={showProfiles} onClose={() => setShowProfiles(false)} />
      <div className='flex flex-row gap-5 mb-10'>
        <button onClick={() => DataService.connect()} className="cursor-pointer mt-30  px-15 py-3 bg-black text-white rounded flex items-start hover:bg-white hover:text-black hover:border-1 border-1 duration-100 ease-in-out">
          Connect
        </button>
        <button onClick={() => setShowProfiles(true)} className="cursor-pointer mt-30  px-15 py-3 bg-black text-white rounded flex items-start hover:bg-white hover:text-black hover:border-1 border-1 duration-100 ease-in-out">
          Mugs
        </button>
      </div>
    </div>
  )
}

export default App
