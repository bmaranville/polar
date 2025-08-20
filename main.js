import { connectToDevice, BluetoothScanner, connectAndReadHr } from "./polar.js";

let device;

const connectButton = document.getElementById("connect");

connectButton.addEventListener("click", async () => {
    const new_device = connectToDevice();
    device = new_device;
    window.device = new_device;
    console.log({device});
})

const startScanButton = document.getElementById("start_scan");
const stopScanButton = document.getElementById("stop_scan");
const scanner = new BluetoothScanner();
const devices = {};
window.devices = devices;
scanner.onDeviceFound(async (device) => {
    console.log('Found device:', device.name);
    devices[device.name] = device;
    const { server, characteristic } = await connectAndReadHr(device);
    window.server = server;
    window.characteristic = characteristic;
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

stopScanButton.addEventListener("click", async () => {
    await scanner.stopScanning();
});

