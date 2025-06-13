import { useEffect, useState } from "react";
import CalibrationPopup from "./CalibrationPopup";
import DataService from "../DataService.jsx";

const ProfilesPopup = ({ isOpen, onClose }) => {
  const [profiles, setProfiles] = useState([]);
  const [newProfile, setNewProfile] = useState("");
  const [calibrate, setCalibrate] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setNewProfile("");
      return;
    }
    setProfiles(DataService.profiles);
  }, [isOpen]);

  const calibrateProfile = (name) => {
    DataService.selectProfile(name);
    setCalibrate(true);
  };

  const handleSelectProfile = (name) => {
    DataService.selectProfile(name);
    onClose();
  };

  const handleAddProfile = () => {
    const name = newProfile.trim();
    if (name) {
      DataService.createProfile(name);
      setProfiles(DataService.profiles);
      setNewProfile("");
      setCalibrate(true);
    }
  };

  const handleDelete = (name) => {
    DataService.deleteProfile(name);
    setProfiles(DataService.profiles);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4 shadow-xl">
          <div className="flex justify-center items-center">
            <h2 className="text-xl font-semibold text-center">Select a Mug</h2>
            <button onClick={onClose} className="text-gray-700 hover:text-gray-700 absolute ml-100">&times;</button>
          </div>
          <div className="space-y-2 mt-5">
            {profiles.map((profile) => (
              <div key={profile.name} className={`border rounded p-2 border-gray-300 flex justify-between items-center ${DataService.profile?.name === profile.name ? "border border-black bg-gradient-to-bl from-gray-200 to-gray-300 text-black" : ""} transform transition-transform duration-200 hover:scale-105`}>
                <button className="text-left flex-1" onClick={() => handleSelectProfile(profile.name)}>
                <p className={`${DataService.profile?.name === profile.name ? "font-bold" : ""}`}>
                  {profile.name} {profile.data?.ml ? `(${profile.data.ml }ml)` : "(Uncalibrated)"}
                </p>
                </button>
                <div className="flex space-x-1">
                  <button onClick={() => calibrateProfile(profile.name)} className="text-blue-500 text-sm mr-3">Recalibrate</button>
                  <button onClick={() => handleDelete(profile.name)} className="text-red-500 text-sm">Delete</button>
                </div>
              </div>
            ))}
          </div>
            <hr className="w-50 border-t border-gray-300 my-5 mx-auto" />

          <div className="space-y-2">
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="Name of your new mug ..."
              value={newProfile}
              onChange={(e) => setNewProfile(e.target.value)}
            />
            <button className="w-full h-10 mt-5 rounded-lg border border-black bg-gradient-to-bl from-gray-700 to-black text-white tracking-wide transform transition-transform duration-200 hover:scale-105" onClick={handleAddProfile}>
              Calibrate new Mug
            </button>
          </div>
        </div>
      </div>
      <CalibrationPopup isOpen={calibrate} onClose={() => setCalibrate(false)}/>
    </>
  );
};

export default ProfilesPopup;
