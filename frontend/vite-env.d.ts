/// <reference types="vite/client" />

interface BluetoothDeviceInfo {
  id: string;
  name?: string;
  paired?: boolean;
}

interface BluetoothRequestDeviceOptions {
  filters?: Array<{ namePrefix?: string }>;
  optionalServices?: string[];
}

interface Bluetooth {
  requestDevice(options?: BluetoothRequestDeviceOptions): Promise<BluetoothDeviceInfo>;
}

interface Navigator {
  bluetooth?: Bluetooth;
}
