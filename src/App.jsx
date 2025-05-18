import { useState } from 'react';
import './App.css';
import FillLevel from './components/FillLevel.jsx';
import LastRefill from './components/LastRefill.jsx';
import Temperature from './components/Temperature.jsx';
import CalibrationPopup from './components/CalibrationPopup.jsx';

function App() {

  const [filled, setFilled] = useState(false);
  const [fill, setFill] = useState(71);
  const [last, setLast] = useState(12);
  const [temperature, setTemperature] = useState(61);
  const [connection, setConnection] = useState("disconnected");

  const SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
  const FILL_UUID = '12345678-1234-5678-1234-56789abcdef1';
  const FILLED_UUID = '12345678-1234-5678-1234-56789abcdef2';
  const LAST_FILLED_UUID = '12345678-1234-5678-1234-56789abcdef3';
  const TEMPERATURE_UUID = '12345678-1234-5678-1234-56789abcdef4';

  const connectBLE = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'smugConnector' }],
        optionalServices: [SERVICE_UUID],
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);

      const fillLevel = await service.getCharacteristic(FILL_UUID);
      await fillLevel.startNotifications();
      fillLevel.addEventListener('characteristicvaluechanged', (event) => {
        const fillLevelValue = event.target.value.getUint8(0); // here match Arduino write type that is defined in the arduino code.
        setFill(fillLevelValue);
      });

      const isFilled = await service.getCharacteristic(FILLED_UUID);
      await isFilled.startNotifications();
      isFilled.addEventListener('characteristicvaluechanged', (event) => {
        const isFilledValue = event.target.value.getUint8(0); // here match Arduino write type that is defined in the arduino code.
        setFilled(isFilledValue);
      });

      const lastFill = await service.getCharacteristic(LAST_FILLED_UUID);
      await lastFill.startNotifications();
      lastFill.addEventListener('characteristicvaluechanged', (event) => {
        const lastFillValue = event.target.value.getUint8(0); // here match Arduino write type that is defined in the arduino code.
        setLast(lastFillValue);
      });

      const temperatureLevel = await service.getCharacteristic(TEMPERATURE_UUID);
      await temperatureLevel.startNotifications();
      temperatureLevel.addEventListener('characteristicvaluechanged', (event) => {
        const temperatureLevelValue = event.target.value.getUint8(0); // here match Arduino write type that is defined in the arduino code.
        setTemperature(temperatureLevelValue);
      });

      setConnection("connected");
      console.log("Connected.");
    } catch (error) {
      console.error('Error connecting:', error);
    }
  };
  
  const [showPopup, setShowPopup] = useState(false);

  return (
      <div className="mt-15">
      <div className="font-bold mt-4 text-left">[{connection}]</div>
      <h1 className="mt-1 text-7xl font-bold text-left mb-10">Smug.</h1>
      <div className='flex flex-row gap-5 mb-10'>
        <FillLevel value={fill}/>
        <LastRefill value={last}/>
      </div>
      <Temperature value={temperature}/>
      <CalibrationPopup isOpen={showPopup} onClose={() => setShowPopup(false)} />
      <div className='flex flex-row gap-5 mb-10'>
        <button onClick={connectBLE} className="cursor-pointer mt-30  px-15 py-3 bg-black text-white rounded flex items-start hover:bg-white hover:text-black hover:border-1 border-1 duration-100 ease-in-out">
          Connect
        </button>
        <button onClick={() => setShowPopup(true)} className="cursor-pointer mt-30  px-15 py-3 bg-black text-white rounded flex items-start hover:bg-white hover:text-black hover:border-1 border-1 duration-100 ease-in-out">
          Calibrate
        </button>
      </div>
    </div>
  )
}

export default App
