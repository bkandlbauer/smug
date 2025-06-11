import { useEffect, useState } from "react";
import CalibrationPopup from "./CalibrationPopup";

const LOCAL_STORAGE_KEY = "mugs";

const ProfilesPopup = ({ isOpen, onClose }) => {
  const [profiles, setProfiles] = useState([]);
  const [newProfile, setNewProfile] = useState("");
  const [calibratingProfileId, setCalibratingProfileId] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setNewProfile("");
      return;
    }
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      setProfiles(JSON.parse(stored));
    }
  }, [isOpen]);

  const handleSelectProfile = (profile) => {
    alert(`Selected profile: ${profile.name}`);
    onClose();
  };

  const handleAddProfile = () => {
    if (!newProfile.trim()) return;
    const newEntry = { id: Date.now(), name: newProfile.trim(), mugData: {} };
    const updatedProfiles = [...profiles, newEntry];
    setProfiles(updatedProfiles);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfiles));
    setNewProfile("");
    setCalibratingProfileId(newEntry.id);
  };

  const handleCalibrationFinish = (mugData) => {
    const updatedProfiles = profiles.map(p =>
      p.id === calibratingProfileId ? { ...p, mugData } : p
    );
    setProfiles(updatedProfiles);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfiles));
    setCalibratingProfileId(null);
  };

  const handleDelete = (id) => {
    const updatedProfiles = profiles.filter(p => p.id !== id);
    setProfiles(updatedProfiles);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedProfiles));
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Select a Mug</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
          </div>
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="border rounded p-2 flex justify-between items-center">
                <button
                  className="text-left flex-1"
                  onClick={() => handleSelectProfile(profile)}
                >
                  {profile.name} {profile.mugData?.liquid ? `(${profile.mugData.liquid }ml)` : "(Uncalibrated)"}
                </button>
                <div className="flex space-x-1">
                  <button onClick={() => setCalibratingProfileId(profile.id)} className="text-blue-500 text-sm mr-2">Recalibrate</button>
                  <button onClick={() => handleDelete(profile.id)} className="text-red-500 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <input
              type="text"
              className="w-full border rounded px-3 py-2"
              placeholder="Enter new mug name"
              value={newProfile}
              onChange={(e) => setNewProfile(e.target.value)}
            />
            <button
              className="w-full bg-blue-500 text-white rounded px-4 py-2 hover:bg-blue-600"
              onClick={handleAddProfile}
            >
              Calibrate new Mug
            </button>
          </div>
        </div>
      </div>
      <CalibrationPopup
        isOpen={calibratingProfileId !== null}
        onClose={() => setCalibratingProfileId(null)}
        onFinish={handleCalibrationFinish}
      />
    </>
  );
};

export default ProfilesPopup;
