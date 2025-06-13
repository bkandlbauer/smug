const SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const FILL_UUID = '12345678-1234-5678-1234-56789abcdef1';
const TEMPERATURE_UUID = '12345678-1234-5678-1234-56789abcdef2';

const DONE = 0;
const EMPTY = 1;
const FULL = 2;

const CALIBRATION_TIME = 3000;

class DataService {
  constructor() {
    this.connected = false;
    this.profiles = JSON.parse(localStorage.getItem("profiles"));
    if (this.profiles) {
      let name = localStorage.getItem("selected-profile");
      this.profile = name ? this.profiles.find(x => x.name == name) : null;
    } else {
      this.profiles = [];
      this.profile = null;
    }
    this.fillLevel = 0;
    this.fillPercentage = 0;
    this.temperature = 0;
    this.calibrationStatus = DONE;
    this.calibrationValues = [];
    this.emitter = new EventTarget();
  }

  async connect() {
    try {
      const device = await navigator.bluetooth.requestDevice({acceptAllDevices: true, optionalServices: [SERVICE_UUID]});
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      this.connected = true;
      this.emitter.dispatchEvent(new CustomEvent("connection", {detail: this.connected}));

      const fillLevel = await service.getCharacteristic(FILL_UUID);
      await fillLevel.startNotifications();
      fillLevel.addEventListener('characteristicvaluechanged', (event) => {
        this.handleFillValue(event.target.value.getUint16(0, true));
      });

      const temperatureLevel = await service.getCharacteristic(TEMPERATURE_UUID);
      await temperatureLevel.startNotifications();
      temperatureLevel.addEventListener('characteristicvaluechanged', (event) => {
        this.handleTemperatureValue(event.target.value.getUint16(0, true));
      });
    } catch (error) {
      console.error('Error connecting:', error);
    }
  }

  handleTemperatureValue(temperature) {
    this.temperature = temperature;
    this.emitter.dispatchEvent(new CustomEvent("temperature", {detail: this.temperature}));
  }

  handleFillValue(distance) {
    if (this.profile) {
      if (this.calibrationStatus == DONE) {
        const ratio = (this.profile.data.full - distance) / (this.profile.data.full - this.profile.data.empty);
        this.fillLevel = Math.round(this.profile.data.ml * ratio * 100) / 100;
        this.fillPercentage = Math.min(Math.max(Math.round(100 * ratio), 0), 100);
        this.emitter.dispatchEvent(new CustomEvent("fill", {detail: [this.fillPercentage, this.fillLevel]}));
      } else {
        this.calibrationValues(distance);
      }
    }
  }

  setSize(ml) {
    this.profile.data.ml = ml;
  }

  async calibrate(full) {
    this.calibrationStatus = full ? FULL : EMPTY;
    this.calibrationValues = [];
    await new Promise(resolve => setTimeout(resolve, CALIBRATION_TIME));
    let value = median(filterOutliers(this.calibrationValues));
    this.calibrationValues = [];
    if (this.calibrationStatus == FULL) {
      this.profile.data.full = value;
    } else if (this.calibrationStatus == EMPTY) {
      this.profile.data.empty = value;
    }
  }

  async finishCalibration() {
    this.calibrationStatus = DONE;
    this.saveData();
  }

  saveData() {
    localStorage.setItem("profiles", JSON.stringify(this.profiles));
    localStorage.setItem("selected-profile", this.profile ? this.profile.name : "");
  }

  createProfile(name) {
    let profile = {name: name, data: {full: 0, empty: 0, ml: 0}};
    this.profiles.push(profile);
    this.profile = profile;
    this.emitter.dispatchEvent(new CustomEvent("select-profile", {detail: this.profile.name}));
    this.saveData();
  }

  deleteProfile(name) {
    this.profiles = this.profiles.filter(x => x.name != name);
    if (this.profile && this.profile.name == name) {
      this.profile = null;
      this.emitter.dispatchEvent(new CustomEvent("select-profile", {detail: "-"}));
    }
    this.saveData();
  }

  selectProfile(name) {
    this.profile = this.profiles.find(x => x.name == name);
    this.emitter.dispatchEvent(new CustomEvent("select-profile", {detail: this.profile ? this.profile.name : "-"}));
    this.saveData();
  }

  onSignal(signal, callback) {
    this.emitter.addEventListener(signal, callback);
  }
}

function median(array) {
  const mid = Math.floor(array.length / 2);
  return array.length % 2 !== 0 ? array[mid] : (array[mid - 1] + array[mid]) / 2;
}

function filterOutliers(array) {
  if (array.length < 4) return array;

  let sorted = [...array].sort((a, b) => a - b);

  const q1 = median(sorted.slice(0, Math.floor(sorted.length / 2)));
  const q3 = median(sorted.slice(Math.ceil(sorted.length / 2)));
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return array.filter(x => x >= lowerBound && x <= upperBound);
}

const instance = new DataService();
export default instance;