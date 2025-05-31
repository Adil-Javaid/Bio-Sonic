import { BleManager } from "react-native-ble-plx";
import { PermissionsAndroid, Platform } from "react-native";

class BluetoothManager {
  constructor() {
    this.manager = new BleManager();
    this.connectedDevice = null;
    this.subscription = null;
  }

  // Initialize Bluetooth
  init = async () => {
    try {
      // Request permissions
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth requires location permission",
            buttonNeutral: "Ask Me Later",
            buttonNegative: "Cancel",
            buttonPositive: "OK",
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error("Location permission denied");
        }
      }

      // Enable Bluetooth if not enabled
      const isEnabled = (await this.manager.state()) === "PoweredOn";
      if (!isEnabled) {
        throw new Error("Bluetooth is not enabled");
      }

      return true;
    } catch (error) {
      console.error("Bluetooth init error:", error);
      throw error;
    }
  };

  // Check if Bluetooth is enabled
  checkBluetoothEnabled = async () => {
    const state = await this.manager.state();
    return state === "PoweredOn";
  };

  // Scan for devices
  scanDevices = async (timeout = 10000) => {
    try {
      await this.init();
      const devices = [];
      let scanTimer;

      return new Promise((resolve, reject) => {
        // Set scan timeout
        scanTimer = setTimeout(() => {
          this.manager.stopDeviceScan();
          resolve(devices);
        }, timeout);

        // Start scanning
        this.manager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            clearTimeout(scanTimer);
            reject(error);
            return;
          }

          // Filter for medical devices (adjust as needed)
          if (
            device.name &&
            (device.name.includes("Littmann") ||
              device.name.includes("Stethoscope") ||
              device.name.includes("Eko"))
          ) {
            const existingIndex = devices.findIndex((d) => d.id === device.id);
            if (existingIndex === -1) {
              devices.push({
                id: device.id,
                name: device.name,
                serviceUUIDs: device.serviceUUIDs,
                manufacturerData: device.manufacturerData,
              });
            }
          }
        });
      });
    } catch (error) {
      console.error("Scan error:", error);
      throw error;
    }
  };

  // Connect to a device
  connect = async (deviceId) => {
    try {
      this.connectedDevice = await this.manager.connectToDevice(deviceId);
      await this.connectedDevice.discoverAllServicesAndCharacteristics();

      // Monitor connection state
      this.monitorConnection();

      return true;
    } catch (error) {
      console.error("Connection error:", error);
      throw error;
    }
  };

  // Monitor connection state
  monitorConnection = () => {
    this.subscription = this.connectedDevice.onDisconnected((error, device) => {
      console.log(`Device ${device.id} disconnected`, error);
      this.connectedDevice = null;
      if (this.subscription) {
        this.subscription.remove();
        this.subscription = null;
      }
    });
  };

  // Disconnect from device
  disconnect = async () => {
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
        this.connectedDevice = null;
        if (this.subscription) {
          this.subscription.remove();
          this.subscription = null;
        }
        return true;
      } catch (error) {
        console.error("Disconnection error:", error);
        throw error;
      }
    }
    return false;
  };

  // Read characteristics (for receiving audio data)
  readCharacteristic = async (serviceUUID, characteristicUUID) => {
    if (!this.connectedDevice) {
      throw new Error("No device connected");
    }

    try {
      const characteristic =
        await this.connectedDevice.readCharacteristicForService(
          serviceUUID,
          characteristicUUID
        );
      return characteristic.value;
    } catch (error) {
      console.error("Read characteristic error:", error);
      throw error;
    }
  };

  // Write to characteristics (for sending commands)
  writeCharacteristic = async (serviceUUID, characteristicUUID, value) => {
    if (!this.connectedDevice) {
      throw new Error("No device connected");
    }

    try {
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        serviceUUID,
        characteristicUUID,
        value
      );
      return true;
    } catch (error) {
      console.error("Write characteristic error:", error);
      throw error;
    }
  };

  // Monitor characteristic (for streaming audio)
  monitorCharacteristic = (serviceUUID, characteristicUUID, callback) => {
    if (!this.connectedDevice) {
      throw new Error("No device connected");
    }

    return this.connectedDevice.monitorCharacteristicForService(
      serviceUUID,
      characteristicUUID,
      (error, characteristic) => {
        if (error) {
          console.error("Monitor error:", error);
          return;
        }
        callback(characteristic.value);
      }
    );
  };

  // Get connected device info
  getConnectedDevice = () => {
    return this.connectedDevice;
  };

  // Clean up
  destroy = () => {
    if (this.subscription) {
      this.subscription.remove();
    }
    this.manager.destroy();
  };
}

const instance = new BluetoothManager();
export default instance;
