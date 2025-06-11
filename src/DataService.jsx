const SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0';
const FILL_UUID = '12345678-1234-5678-1234-56789abcdef1';
const TEMPERATURE_UUID = '12345678-1234-5678-1234-56789abcdef2';

const DONE = 0;
const EMPTY = 1;
const FULL = 2;

const CALIBRATION_TIME = 1000;

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
  }

  async connect() {
    try {
      const device = await navigator.bluetooth.requestDevice({acceptAllDevices: true, optionalServices: [SERVICE_UUID]});
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      this.connected = true;

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
  }

  handleFillValue(distance) {
    if (this.profile) {
      if (this.calibrationStatus == DONE) {
        const ratio = (this.profile.data.full - distance) / (this.profile.data.full - this.profile.data.empty);
        this.fillLevel = this.profile.data.ml * ratio;
        this.fillPercentage = 100 * ratio;
      } else if (this.calibrationStatus == EMPTY) {
        this.profile.data.empty = distance;
      } else if (this.calibrationStatus == FULL) {
        this.profile.data.full = distance;
      }
    }
  }

  setSize(ml) {
    this.profile.data.ml = ml;
  }

  async calibrate(full) {
    this.calibrationStatus = full ? FULL : EMPTY;
    await new Promise(resolve => setTimeout(resolve, CALIBRATION_TIME));
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
    this.saveData();
  }

  deleteProfile(name) {
    this.profiles = this.profiles.filter(x => x.name != name);
    if (this.profile && this.profile.name == name) {
      this.profile = null;
    }
    this.saveData();
  }

  selectProfile(name) {
    this.profile = this.profiles.find(x => x.name == name);
    this.saveData();
  }
}

const instance = new DataService();
export default instance;