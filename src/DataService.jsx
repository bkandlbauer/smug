const SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const FILL_UUID = '12345678-1234-5678-1234-56789abcdef1';
const TEMPERATURE_UUID = '12345678-1234-5678-1234-56789abcdef2';

const DONE = 0;
const EMPTY = 1;
const FULL = 2;

const CALIBRATION_TIME = 3000;
const THRESHOLD_FILL = 5;
const THRESHOLD_DRINK = 5;

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
    this.calibrationStatus = DONE;
    this.calibrationValues = [];
    this.day = new Date(Date.now()).toISOString().split('T')[0];
    const state = JSON.parse(localStorage.getItem("state"));
    if (state) {
      this.lastRefill = state.lastRefill;
      this.distance = state.distance;
      this.temperature = state.temperature;
      if (this.profile) {
        const ratio = (this.profile.data.empty - this.distance) / (this.profile.data.empty - this.profile.data.full);
        this.fillLevel = round(this.profile.data.ml * ratio);
        this.fillPercentage = clamp(round(100 * ratio), 0, 100);
      }
    } else {
      this.lastRefill = Date.now();
      this.distance = this.profile ? this.profile.data.empty : 0;
      this.temperature = 0;
    }
    const history = JSON.parse(localStorage.getItem("history:" + this.day));
    this.history = history ? history : {sum: 0, refills: 0, data: []};
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
    this.saveData();
  }

  handleFillValue(distance) {
    if (this.profile) {
      if (this.calibrationStatus == DONE) {
        if (this.distance - distance >= THRESHOLD_FILL || distance - this.distance >= THRESHOLD_DRINK) {
          const ratio = (this.profile.data.empty - distance) / (this.profile.data.empty - this.profile.data.full);
          this.fillLevel = round(this.profile.data.ml * ratio);
          this.fillPercentage = clamp(round(100 * ratio), 0, 100);
          const change = this.profile.data.ml * round(Math.abs(this.distance - distance) / (this.profile.data.full - this.profile.data.empty));
          const timestamp = Date.now();
          const day = new Date(timestamp).toISOString().split('T')[0];
          if (day != this.day) {
            this.day = day;
            this.history = {sum: 0, refills: 0, data: []};
          }
          this.history.data.push({timestamp: timestamp, change: change, refill: distance < this.distance});
          if (distance < this.distance) {
            this.lastRefill = timestamp;
            this.history.refills = this.history.refills + 1;
          } else {
            this.history.sum = this.history.sum + change;
          }
          this.distance = distance;
          this.emitter.dispatchEvent(new CustomEvent("fill", {detail: [this.fillPercentage, this.fillLevel, this.lastRefill]}));
          this.saveData();
        }
      } else {
        this.calibrationValues.push(distance);
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
      this.lastRefill = Date.now();
    } else if (this.calibrationStatus == EMPTY) {
      this.profile.data.empty = value;
    }
    this.distance = value;
    this.saveData();
  }

  async finishCalibration() {
    this.calibrationStatus = DONE;
    this.saveData();
  }

  saveData() {
    localStorage.setItem("profiles", JSON.stringify(this.profiles));
    localStorage.setItem("selected-profile", this.profile ? this.profile.name : "");
    localStorage.setItem("state", JSON.stringify({lastRefill: this.lastRefill, distance: this.distance, temperature: this.temperature}));
    localStorage.setItem("history:" + this.day, JSON.stringify(this.history));
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
      this.emitter.dispatchEvent(new CustomEvent("select-profile", {detail: "no mug selected"}));
    }
    this.saveData();
  }

  selectProfile(name) {
    this.profile = this.profiles.find(x => x.name == name);
    this.emitter.dispatchEvent(new CustomEvent("select-profile", {detail: this.profile ? this.profile.name : "no mug selected"}));
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

function round(value) {
  return Math.round(value * 100) / 100;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const instance = new DataService();
export default instance;