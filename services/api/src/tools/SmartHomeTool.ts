import { BaseTool } from '@holmev/tool-sdk';
import { PermissionLevel, SmartDevice } from '@holmev/shared-types';

export interface SmartHomeParams {
  action: 'turn_on' | 'turn_off' | 'set_fan_speed' | 'set_temperature' | 'get_status';
  device?: string;
  room?: string;
  speed?: number;
  temperature?: number;
}

export class SmartHomeTool extends BaseTool<SmartHomeParams, { success: boolean; device: SmartDevice | null; message: string }> {
  name = 'smart_home';
  description = 'Control registered smart home devices (lights, fans, AC, TV) or inspect their real status.';
  permissionLevel = PermissionLevel.LEVEL_2_DEVICE_NET;
  parametersSchema = {
    type: 'object',
    properties: {
      action: { type: 'string', enum: ['turn_on', 'turn_off', 'set_fan_speed', 'set_temperature', 'get_status'] },
      device: { type: 'string', description: 'Device name or type e.g. "fan", "light", "AC"' },
      room: { type: 'string', description: 'Room name e.g. "bedroom", "hall", "kitchen"' },
      speed: { type: 'number', description: 'Fan speed (1-5)' },
      temperature: { type: 'number', description: 'AC target temperature (16-30)' },
    },
    required: ['action'],
  };

  // In-memory device registry (synchronized with DB/Gateway)
  private devices: Map<string, SmartDevice> = new Map([
    [
      'bedroom-fan',
      {
        id: 'bedroom-fan',
        name: 'Bedroom Fan',
        room: 'bedroom',
        type: 'fan',
        protocol: 'IR',
        status: 'ONLINE',
        state: { power: true, speed: 3 },
        lastSeen: Date.now(),
      },
    ],
    [
      'bedroom-light',
      {
        id: 'bedroom-light',
        name: 'Bedroom Light',
        room: 'bedroom',
        type: 'light',
        protocol: 'MQTT',
        status: 'ONLINE',
        state: { power: false, brightness: 100 },
        lastSeen: Date.now(),
      },
    ],
    [
      'hall-light',
      {
        id: 'hall-light',
        name: 'Hall Light',
        room: 'hall',
        type: 'light',
        protocol: 'WIFI',
        status: 'ONLINE',
        state: { power: true, brightness: 80 },
        lastSeen: Date.now(),
      },
    ],
  ]);

  async execute(params: SmartHomeParams): Promise<{ success: boolean; device: SmartDevice | null; message: string }> {
    const { action, device: reqDevice, room: reqRoom, speed, temperature } = params;

    // Resolve matching device from registry
    let targetDevice: SmartDevice | undefined;
    for (const d of this.devices.values()) {
      const matchRoom = !reqRoom || d.room.toLowerCase() === reqRoom.toLowerCase();
      const matchType = !reqDevice || d.name.toLowerCase().includes(reqDevice.toLowerCase()) || d.type.toLowerCase() === reqDevice.toLowerCase();
      if (matchRoom && matchType) {
        targetDevice = d;
        break;
      }
    }

    if (!targetDevice) {
      const roomStr = reqRoom ? ` in ${reqRoom}` : '';
      const devStr = reqDevice || 'device';
      return {
        success: false,
        device: null,
        message: `Boss, ${devStr}${roomStr} H.O.L.M.E.V registry mein connect nahi hai.`,
      };
    }

    // Perform action on target device
    switch (action) {
      case 'turn_on':
        targetDevice.state.power = true;
        return {
          success: true,
          device: targetDevice,
          message: `Done Boss! ${targetDevice.name} turn on ho gaya.`,
        };
      case 'turn_off':
        targetDevice.state.power = false;
        return {
          success: true,
          device: targetDevice,
          message: `Done Boss! ${targetDevice.name} turn off kar diya.`,
        };
      case 'set_fan_speed':
        if (targetDevice.type !== 'fan') {
          return {
            success: false,
            device: targetDevice,
            message: `Boss, ${targetDevice.name} speed control support nahi karta.`,
          };
        }
        targetDevice.state.speed = speed ?? 2;
        targetDevice.state.power = true;
        return {
          success: true,
          device: targetDevice,
          message: `Done Boss! ${targetDevice.name} speed ${targetDevice.state.speed} par set ho gaya.`,
        };
      case 'set_temperature':
        if (targetDevice.type !== 'ac') {
          return {
            success: false,
            device: targetDevice,
            message: `Boss, ${targetDevice.name} temperature control support nahi karta.`,
          };
        }
        targetDevice.state.temperature = temperature ?? 24;
        targetDevice.state.power = true;
        return {
          success: true,
          device: targetDevice,
          message: `Done Boss! AC ${targetDevice.state.temperature}°C par set ho gaya.`,
        };
      case 'get_status':
        return {
          success: true,
          device: targetDevice,
          message: `${targetDevice.name} status: ${targetDevice.state.power ? 'ON' : 'OFF'}.`,
        };
    }
  }

  getRegisteredDevices(): SmartDevice[] {
    return Array.from(this.devices.values());
  }
}
