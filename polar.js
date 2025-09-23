import { ScrollingPlot } from "./plotting.js";

export async function connectToDevice() {
    try {
        const device = await navigator.bluetooth.requestDevice({
            filters: [{
                namePrefix: "Polar",
                manufacturerData: [{ companyIdentifier: 0x006b }]
            }],
            optionalServices: [0x180d, 0x180f]  // HR and Battery services
        });

        return device;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

export class BluetoothScanner {
    constructor() {
        this.deviceCallbacks = new Set();
        this.scanning = false;
    }
    
    async startScanning(options = {}) {
        if (!this.scanning) {
            this.scanning = true;
            
            try {
                const device = await navigator.bluetooth.requestDevice({
                    // acceptAllDevices: true,
                    ...options
                });
                
                this.deviceCallbacks.forEach(async (callback) => await callback(device));
            } catch (error) {
                console.error('Scanning error:', error);
                this.stopScanning();
            }
        }
    }
    
    onDeviceFound(callback) {
        this.deviceCallbacks.add(callback);
        return () => this.deviceCallbacks.delete(callback);
    }
    
    stopScanning() {
        this.scanning = false;
    }
}

export async function connectAndReadHr(device) {
  try {
    // Connect to GATT server
    const server = await device.gatt.connect();
    
    // Get Heart Rate Service and Characteristic
    const service = await server.getPrimaryService(0x180d);
    const characteristic = await service.getCharacteristic(0x2a37);
    
    // Set up notification handler
    characteristic.addEventListener('characteristicvaluechanged', 
      handleHeartRateData);
    
    // Start notifications
    await characteristic.startNotifications();
    
    return { server, service, characteristic };
  } catch (error) {
    console.error('Error connecting to H10:', error);
    throw error;
  }
}

const plot = new ScrollingPlot('plot');
const start_time = Date.now();
const bpmOutputDiv = document.getElementById("bpm_output");
const cooldownOutputDiv = document.getElementById("cooldown_output");

class CooldownMeasurement {
  #isStarted = false;
  #startValue = null;
  #startTime = null;
  #durationSeconds = 60;
  #callback = null;

  constructor(durationSeconds = 60, callback = null) {
    this.#durationSeconds = durationSeconds;
    this.#callback = callback;
  }

  start(value) {
    this.#isStarted = true;
    this.#startValue = null;
  }

  reset() {
    this.#startValue = null;
    this.#startTime = null;
    this.#isStarted = false;
  }

  update(value) {
    console.log("CooldownMeasurement update:", value, this.#isStarted, this.#startValue, this.#startTime);
    if (!this.#isStarted) {
      // Not started yet
      return null;
    }
    const time = Date.now();
    if (this.#startValue === null) {
      console.log("Starting cooldown measurement at", value, time);
      this.#startValue = value;
      this.#startTime = time;
      return null;
    }
    const time_elapsed = (time - this.#startTime) / 1000;
    if (time_elapsed >= this.#durationSeconds) {
      if (this.#callback) {
        this.#callback(this.#startValue, value, time_elapsed);
      }
      this.reset();
    } else {
      console.log("Cooldown measurement in progress:", value, time);
    }
    return null;
  }
}

const cooldownMeasurement = new CooldownMeasurement(60, (startValue, endValue, durationSeconds) => {
  const cooldown = endValue - startValue;
  console.log(`Cooldown: ${cooldown} bpm (from ${startValue} to ${endValue}) over ${durationSeconds} seconds`);
  cooldownOutputDiv.innerText = `Cooldown: ${cooldown} bpm (from ${startValue} to ${endValue}) over ${durationSeconds} seconds`;
});


function decodeHRValue(dataView) {
  // Parse heart rate data according to specification
  const flags = dataView.getUint8(0);
  let heartRate;
  
  if (flags & 0x01) { // RR-Interval bit set
    heartRate = dataView.getUint16(1); // 16-bit heart rate value
  } else {
    heartRate = dataView.getUint8(1); // 8-bit heart rate value
  }
  return heartRate;
}

function handleHeartRateData(event) {
  const value = event.target.value;
  const dataView = new DataView(value.buffer);
  const heartRate = decodeHRValue(dataView);
  
  const time = (Date.now() - start_time) / 1000.0;
  // console.log(`Current heart rate: ${heartRate} bpm, ${time}`);
  bpmOutputDiv.innerText = `${heartRate} (bpm)`;
  cooldownMeasurement.update(heartRate);
  plot.add_point(time, heartRate);
}

// Cleanup function when done
export async function disconnect(device) {
  try {
    if (device.gatt.connected) {
      await device.gatt.disconnect();
    }
  } catch (error) {
    console.error('Error disconnecting:', error);
  }
}



export async function measureCooldown() {
  console.log("Starting cooldown measurement...");
  cooldownMeasurement.start();
}
