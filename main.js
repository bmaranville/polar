import { connectToDevice, BluetoothScanner, connectAndReadHr, disconnect, measureCooldown } from "./polar.js";

let device;

// const connectButton = document.getElementById("connect");

// connectButton.addEventListener("click", async () => {
//     const new_device = connectToDevice();
//     device = new_device;
//     window.device = new_device;
//     console.log({device});
// })

const startScanButton = document.getElementById("connect_btn");
const disconnectButton = document.getElementById("disconnect_btn");
const cooldownButton = document.getElementById("cooldown_btn");
const scanner = new BluetoothScanner();
const devices = {};
let wakeLock = null;
window.devices = devices;
scanner.onDeviceFound(async (device) => {
    console.log('Found device:', device.name);
    devices[device.name] = device;
    const { server, service, characteristic } = await connectAndReadHr(device);
    window.service = service;
    window.device = device;
    window.server = server;
    window.characteristic = characteristic;
    // request wake lock
    try {
      if ('wakeLock' in navigator) {
        wakeLock = await navigator.wakeLock.request('screen');
        console.log('Wake Lock is active:', wakeLock);
        wakeLock.addEventListener('release', () => {
          console.log('Wake Lock was released');
        });
      } else {
        console.warn('Wake Lock API not supported.');
      }
    } catch (err) {
      console.error(`${err.name}, ${err.message}`);
    }
});

startScanButton.addEventListener("click", async () => {
  const options = {
    filters: [
      {
        namePrefix: "Polar H10",
        manufacturerData: [{ companyIdentifier: 0x006b }]
      }
    ],
    acceptAllDevices: false,
    optionalServices: [0x180d, 0x180f],
        // filters: [{
        //     services: [
        //         'battery_service',
        //         // 'heart_rate'
        //     ]
        // }],
        // acceptAllDevices: true,
        // optionalServices: ['battery_service'],
    }
    await scanner.startScanning(options);
});

disconnectButton?.addEventListener("click", async () => {
  console.log("Disconnecting...", !!window.device);
  if (window.service) {
    await disconnect(window.device);
    window.device = null;
    window.service = null;
    window.server = null;
    window.characteristic = null;
  }
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
});

cooldownButton?.addEventListener("click", async () => {
  console.log("Measuring cooldown...", !!window.service);
  if (window.service) {
    try {
      await measureCooldown(window.service);
    } catch (error) {
      console.error('Measure cooldown error:', error);
    }
  }
});

