const SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const FILL_UUID = '12345678-1234-5678-1234-56789abcdef1';
const TEMPERATURE_UUID = '12345678-1234-5678-1234-56789abcdef2';

const DONE = 0;
const EMPTY = 1;
const FULL = 2;

const CALIBRATION_TIME = 3000;
const THRESHOLD_FILL = 5;

const MEASUREMENTS = 6;

class DataService {
  constructor() {
    this.beepsis = 0;
    this.fillSignal = false;
    this.audio = new Audio('/beep.mp3');
    this.horn = new Audio('/horn.mp3');
    this.connected = false;
    this.profiles = JSON.parse(localStorage.getItem("profiles"));
    if (this.profiles) {
      let name = localStorage.getItem("selected-profile");
      this.profile = name ? this.profiles.find(x => x.name == name) : null;
    } else {
      this.profiles = [];
      this.profile = null;
    }
    this.values = [];
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
        const ratio = clamp((this.profile.data.empty - this.distance) / (this.profile.data.empty - this.profile.data.full), 0, 1);
        this.fillLevel = Math.round(this.profile.data.ml * ratio);
        this.fillPercentage = Math.round(100 * ratio);
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
    if (this.temperature == temperature) {return;}
    this.temperature = temperature;
    this.emitter.dispatchEvent(new CustomEvent("temperature", {detail: this.temperature}));
    this.saveData();
  }

  filterFillValue(distance) {
    this.values.push(distance);
    if (this.values.length == MEASUREMENTS) {
      const avg = average(this.values);
      let valid = true;
      for (let i = 0; i < MEASUREMENTS && valid; i++) {
        if (Math.abs(avg - this.values[i]) >= THRESHOLD_FILL) {
          valid = false;
        }
      }
      this.values.shift();
      if (valid) {
        return avg;
      }
      return false;
    }
    return false;
  }

  handleFillValue(distance) {
    console.log(distance); 
    if (!this.profile) {
      return;
    }

    if (this.calibrationStatus != DONE) {
      this.calibrationValues.push(distance);
      return;
    }

    if (distance < 20 && !this.fillSignal) {
      this.beepsis++;
      console.warn('beep');

      if (this.beepsis >= 4) {
        this.horn?.play(); // TODO: Airhorn
        this.fillSignal = true;
      } else {
        this.audio?.play();
      }
    } else {
      this.beepsis = 0;
    }

    const avgResult = this.filterFillValue(distance);
    if (avgResult === false) {
      return;
    }

    const changeMm = this.distance - distance; // If positiv => refill
    const refill = changeMm > 0;

    if (Math.abs(changeMm) < THRESHOLD_FILL) {
      return;
    }


    const ratio = clamp((this.profile.data.empty - distance) / (this.profile.data.empty - this.profile.data.full), 0, 2);
    this.fillLevel = Math.round(this.profile.data.ml * ratio);
    this.fillPercentage = Math.round(100 * ratio);
    const change = Math.round(this.profile.data.ml * Math.abs(changeMm) / (this.profile.data.empty - this.profile.data.full));
    const timestamp = Date.now();
    const day = new Date(timestamp).toISOString().split('T')[0];
    if (day != this.day) {
      this.day = day;
      this.history = {sum: 0, refills: 0, data: []};
    }
    this.history.data.push({timestamp: timestamp, change: change, refill });
    if (refill) {
      this.lastRefill = timestamp;
      this.history.refills = this.history.refills + 1;
    } else {
      this.history.sum = this.history.sum + change;
      this.fillSignal = false;
    }
    this.distance = distance;
    this.emitter.dispatchEvent(new CustomEvent("fill", {detail: [this.fillPercentage, this.fillLevel, this.profile ? this.profile.data.ml : 0, this.lastRefill]}));
    this.saveData();
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
    this.fillPercentage = 100;
    this.fillLevel = this.profile.data.ml;
    this.lastRefill = Date.now();
    this.emitter.dispatchEvent(new CustomEvent("fill", {detail: [this.fillPercentage, this.fillLevel, this.profile ? this.profile.data.ml : 0, this.lastRefill]}));
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

  getHistoryData() {
    let data = [];
    const date = new Date(Date.now());
    
    for (let i = 6; i >= 0; i--) {
      let day = new Date();
      day.setDate(date.getDate() - i);
      const dateString = day.toISOString().split('T')[0];
      const history = JSON.parse(localStorage.getItem("history:" + dateString));
      data.push({date: dateString, amount: history ? Math.round(history.sum / 10) / 100 : 0});
    }

    return data;
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

function average(array) {
  if (array.length === 0) return 0;
  const sum = array.reduce((acc, val) => acc + val, 0);
  return sum / array.length;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const instance = new DataService();
export default instance;