import { useEffect, useState } from "react";
import DataService from "../DataService.jsx";

const CalibrationPopup = ({ isOpen, onClose, onFinish }) => {
  const [empty, setEmpty] = useState(1);
  const [full, setFull] = useState(0);
  const [size, setSize] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setEmpty(1);
      setFull(0);
      setSize("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const measureEmpty = async () => {
    setEmpty(2);
    await DataService.calibrate(false);
    setEmpty(3);
    setFull(1);
  };

  const measureFull = async () => {
    setFull(2);
    await DataService.calibrate(true);
    setFull(3);
    await DataService.finishCalibration();
    onClose();
  };

  const setLiquid = (ml) => {
    DataService.setSize(ml);
    setSize(ml);
  };

  const loadingSpinner = (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md space-y-6">
        <h2 className="text-xl font-semibold">Calibrate</h2>
        <div className={`space-y-2 p-4 border rounded border-gray-300 ${empty === 3 ? "opacity-20" : "opacity-100"}`}>
          <p>1. Attach the device to an EMPTY mug, place it on a flat surface and press "Next".</p>
          <button className="mt-3 px-10 py-2 rounded-lg border border-black bg-gradient-to-bl from-gray-700 to-black text-white tracking-wide transform transition-transform duration-200 hover:scale-110 disabled:opacity-50" onClick={measureEmpty} disabled={empty !== 1}>
            {empty === 2 ? loadingSpinner : "Next"}
          </button>
        </div>

        <div className={`space-y-2 p-4 border rounded border-gray-300 ${full === 3 ? "opacity-20" : "opacity-100"}`}>
          <p>2. Fill up your mug until it's completely FULL. Enter the amount of liquid that was needed in the input field below and press "Finish Calibration".</p>
          <div className="flex items-center justify-center space-x-2">
            <label className="text-gray-700">Filling capacity in ml:</label>
            <input type="text" className="border border-gray-300 rounded p-2 w-20" value={size} onChange={(e) => setLiquid(e.target.value)} disabled={full !== 1} />
          </div>
          <button className="mt-3 px-10 py-2 rounded-lg border border-black bg-gradient-to-bl from-gray-700 to-black text-white tracking-wide transform transition-transform duration-200 hover:scale-110 disabled:opacity-50" onClick={measureFull} disabled={full !== 1 || !size.trim()}>
            {full === 2 ? loadingSpinner : "Finish Calibration"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CalibrationPopup;
