export default class BluetoothManager {
  static async checkBluetoothEnabled() {
    try {
      // Mock Bluetooth enabled check
      return true; // Simulate Bluetooth being enabled
    } catch (error) {
      console.error("Mock Bluetooth check error:", error);
      return false;
    }
  }

  static async scanDevices() {
    try {
      // Mock device scan
      return [
        { id: "mock-device-1", name: "Mock Littmann Stethoscope" },
        { id: "mock-device-2", name: "Mock Eko Stethoscope" },
      ];
    } catch (error) {
      console.error("Mock device scan error:", error);
      return [];
    }
  }

  static async destroy() {
    try {
      // Mock cleanup
      console.log("Mock Bluetooth cleanup completed");
    } catch (error) {
      console.error("Mock Bluetooth destroy error:", error);
    }
  }
}