import { useEffect, useState } from 'react';
import './App.css';
import FillLevel from './components/FillLevel.jsx';
import LastRefill from './components/LastRefill.jsx';
import Temperature from './components/Temperature.jsx';
import ProfilesPopup from './components/ProfilesPopup.jsx';
import DataService from './DataService.jsx';
import HistoryChart from './components/HistoryChart.jsx';

function App() {
  const [fill, setFill] = useState(DataService.fillPercentage);
  const [fillML, setFillML] = useState(DataService.fillLevel);
  const [fillMax, setFillMax] = useState(DataService.profile ? DataService.profile.data.ml : 0);
  const [history, setHistory] = useState(DataService.getHistoryData());
  const [last, setLast] = useState(getTimeSince(DataService.lastRefill));
  const [temperature, setTemperature] = useState(0);
  const [connection, setConnection] = useState("disconnected");
  const [profile, setProfile] = useState(DataService.profile ? DataService.profile.name : "no mug selected");

  const [showProfiles, setShowProfiles] = useState(false);

  useEffect(() => {
    DataService.onSignal("fill", (event) => {
      setFill(event.detail[0]);
      setFillML(event.detail[1]);
      setFillMax(event.detail[2]);
      setLast(event.detail[3]);
      setHistory(DataService.getHistoryData());
      setLast(getTimeSince(DataService.lastRefill));
    });
    DataService.onSignal("temperature", (event) => setTemperature(event.detail));
    DataService.onSignal("connection", (event) => setConnection(event.detail ? "connected" : "disconnected"));
    DataService.onSignal("select-profile", (event) => setProfile(event.detail));
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (connection == "connected") {
        setLast(getTimeSince(DataService.lastRefill));
      }
    }, 10000);
    return () => clearInterval(interval);
  });

  return (
    <div className="mt-15">
      <div className="font-bold mt-4 text-left"> [{connection}] {connection === 'connected' && ` - ${profile}`}</div>
      <h1 className="mt-1 text-7xl font-bold text-left mb-10">Smug.</h1>
      <div className="flex flex-row gap-20">
        <div>
      <div className='flex flex-row gap-5 mb-10'>
        <FillLevel percentage={fill} ml={fillML} mlMax={fillMax}/>
        <LastRefill value={last}/>
      </div>
      <Temperature value={temperature}/>
      </div>
      <ProfilesPopup isOpen={showProfiles} onClose={() => setShowProfiles(false)} />
      <HistoryChart data={history}/>
      </div>
      <div className='flex flex-row gap-5 mb-10'>
        <button onClick={() => DataService.connect()} className="mt-30 px-15 py-3 rounded-lg border border-black bg-gradient-to-bl from-gray-700 to-black text-white tracking-wide transform transition-transform duration-200 hover:scale-110">
        Connect
        </button>

        <button onClick={() => setShowProfiles(true)} className="ml-2 mt-30 px-15 py-3 rounded-lg border border-black bg-gradient-to-bl from-gray-700 to-black text-white tracking-wide transform transition-transform duration-200 hover:scale-110 disabled:opacity-50" disabled={connection == "disconnected"}>
          My Mugs
        </button>
      </div>
    </div>
  )
}

function getTimeSince(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '<1 min';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;

  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours} hr${hours !== 1 ? 's' : ''}${mins > 0 ? ` ${mins} min${mins !== 1 ? 's' : ''}` : ''}`;
}

export default App
