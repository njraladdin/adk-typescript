/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { LlmAgent as Agent } from '../../../../src';
import { LlmRegistry } from '../../../../src/models/LlmRegistry';
import { FunctionTool } from '../../../../src/tools/FunctionTool';
import { AutoFlow } from '../../../../src/flows/llm_flows/AutoFlow';

// Device database interfaces
interface DeviceInfo {
  status: string;
  location: string;
}

interface DeviceDB {
  [deviceId: string]: DeviceInfo;
}

interface TemperatureDB {
  [location: string]: number;
}

interface ScheduleInfo {
  time: string;
  status: string;
}

interface ScheduleDB {
  [deviceId: string]: ScheduleInfo;
}

interface UserPreference {
  preferred_temp: number;
  location: string;
}

interface UserPreferencesDB {
  [userId: string]: UserPreference;
}

// Global mock databases
let DEVICE_DB: DeviceDB = {
  "device_1": { "status": "ON", "location": "Living Room" },
  "device_2": { "status": "OFF", "location": "Bedroom" },
  "device_3": { "status": "OFF", "location": "Kitchen" },
};

let TEMPERATURE_DB: TemperatureDB = {
  "Living Room": 22,
  "Bedroom": 20,
  "Kitchen": 24,
};

let SCHEDULE_DB: ScheduleDB = {
  "device_1": { "time": "18:00", "status": "ON" },
  "device_2": { "time": "22:00", "status": "OFF" },
};

let USER_PREFERENCES_DB: UserPreferencesDB = {
  "user_x": { "preferred_temp": 21, "location": "Bedroom" },
  "user_y": { "preferred_temp": 23, "location": "Living Room" },
};

/**
 * Reset all mock data to initial state
 */
function resetData(): void {
  DEVICE_DB = {
    "device_1": { "status": "ON", "location": "Living Room" },
    "device_2": { "status": "OFF", "location": "Bedroom" },
    "device_3": { "status": "OFF", "location": "Kitchen" },
  };

  TEMPERATURE_DB = {
    "Living Room": 22,
    "Bedroom": 20,
    "Kitchen": 24,
  };

  SCHEDULE_DB = {
    "device_1": { "time": "18:00", "status": "ON" },
    "device_2": { "time": "22:00", "status": "OFF" },
  };

  USER_PREFERENCES_DB = {
    "user_x": { "preferred_temp": 21, "location": "Bedroom" },
    "user_y": { "preferred_temp": 23, "location": "Living Room" },
  };
}

/**
 * Get the current status and location of a AC device.
 * @param deviceId The unique identifier of the device.
 * @returns A dictionary containing the status and location, or 'Device not found' if the device_id does not exist.
 */
function getDeviceInfo(deviceId: string): DeviceInfo | string {
  return DEVICE_DB[deviceId] || "Device not found";
}

/**
 * Update the information of a AC device, specifically its status and/or location.
 * @param deviceId The unique identifier of the device.
 * @param status The new status to set for the device. Accepted values: 'ON', 'OFF'.
 * @param location The new location to set for the device. Accepted values: 'Living Room', 'Bedroom', 'Kitchen'.
 * @returns A message indicating whether the device information was successfully updated.
 */
function setDeviceInfo(deviceId: string, status: string = "", location: string = ""): string {
  if (deviceId in DEVICE_DB) {
    if (status) {
      DEVICE_DB[deviceId].status = status;
      return `Device ${deviceId} information updated: status -> ${status}.`;
    }
    if (location) {
      DEVICE_DB[deviceId].location = location;
      return `Device ${deviceId} information updated: location -> ${location}.`;
    }
  }
  return "Device not found";
}

/**
 * Get the current temperature in celsius of a location.
 * @param location The location for which to retrieve the temperature (e.g., 'Living Room', 'Bedroom', 'Kitchen').
 * @returns The current temperature in celsius in the specified location, or 'Location not found' if the location does not exist.
 */
function getTemperature(location: string): number | string {
  return location in TEMPERATURE_DB ? TEMPERATURE_DB[location] : "Location not found";
}

/**
 * Set the desired temperature in celsius for a location.
 * @param location The location where the temperature should be set.
 * @param temperature The desired temperature as integer to set in celsius. Acceptable range: 18-30 celsius.
 * @returns A message indicating whether the temperature was successfully set.
 */
function setTemperature(location: string, temperature: number): string {
  if (location in TEMPERATURE_DB) {
    TEMPERATURE_DB[location] = temperature;
    return `Temperature in ${location} set to ${temperature}°C.`;
  }
  return "Location not found";
}

/**
 * Get the temperature preferences and preferred location of a user.
 * @param userId The unique identifier of the user.
 * @returns A dictionary containing the user preferences, or 'User not found' if the user_id does not exist.
 */
function getUserPreferences(userId: string): UserPreference | string {
  return USER_PREFERENCES_DB[userId] || "User not found";
}

/**
 * Schedule a device to change its status at a specific time.
 * @param deviceId The unique identifier of the device.
 * @param time The time at which the device should change its status (format: 'HH:MM').
 * @param status The status to set for the device at the specified time (e.g., 'ON', 'OFF').
 * @returns A message indicating whether the schedule was successfully set.
 */
function setDeviceSchedule(deviceId: string, time: string, status: string): string {
  if (deviceId in DEVICE_DB) {
    SCHEDULE_DB[deviceId] = { time, status };
    return `Device ${deviceId} scheduled to turn ${status} at ${time}.`;
  }
  return "Device not found";
}

/**
 * Retrieve the schedule of a device.
 * @param deviceId The unique identifier of the device.
 * @returns A dictionary containing the schedule information, or 'Schedule not found' if the device_id does not exist.
 */
function getDeviceSchedule(deviceId: string): ScheduleInfo | string {
  return SCHEDULE_DB[deviceId] || "Schedule not found";
}

/**
 * Convert Celsius to Fahrenheit.
 * @param celsius Temperature in Celsius.
 * @returns Temperature in Fahrenheit.
 */
function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9 / 5) + 32;
}

/**
 * Convert Fahrenheit to Celsius.
 * @param fahrenheit Temperature in Fahrenheit.
 * @returns Temperature in Celsius.
 */
function fahrenheitToCelsius(fahrenheit: number): number {
  return Math.round((fahrenheit - 32) * 5 / 9);
}

/**
 * Retrieve a list of AC devices, filtered by status and/or location when provided.
 * @param status The status to filter devices by (e.g., 'ON', 'OFF').
 * @param location The location to filter devices by (e.g., 'Living Room', 'Bedroom', 'Kitchen').
 * @returns A list of dictionaries containing device information, or a message if no devices match the criteria.
 */
function listDevices(status: string = "", location: string = ""): Array<{ device_id: string; status: string; location: string }> | string {
  const devices: Array<{ device_id: string; status: string; location: string }> = [];
  for (const deviceId in DEVICE_DB) {
    const info = DEVICE_DB[deviceId];
    if ((!status || info.status === status) && (!location || info.location === location)) {
      devices.push({
        device_id: deviceId,
        status: info.status,
        location: info.location,
      });
    }
  }
  return devices.length > 0 ? devices : "No devices found matching the criteria.";
}

// Create model instance
const geminiModel = LlmRegistry.newLlm('gemini-1.5-flash');

// Create flow instance
const autoFlow = new AutoFlow();

/**
 * Home automation agent for controlling smart home devices
 */
export const homeAutomationRootAgent = new Agent('Home_automation_agent', {
  llm: geminiModel,
  instruction: `
    You are Home Automation Agent. You are responsible for controlling the devices in the home.
  `,
  flow: autoFlow,
  tools: [
    new FunctionTool({
      name: 'get_device_info',
      description: 'Get the current status and location of a AC device',
      fn: async (params) => getDeviceInfo(params.device_id),
      functionDeclaration: {
        name: 'get_device_info',
        description: 'Get the current status and location of a AC device',
        parameters: {
          type: 'object',
          properties: {
            device_id: {
              type: 'string',
              description: 'The unique identifier of the device'
            }
          },
          required: ['device_id']
        }
      }
    }),
    new FunctionTool({
      name: 'set_device_info',
      description: 'Update the information of a AC device',
      fn: async (params) => setDeviceInfo(params.device_id, params.status, params.location),
      functionDeclaration: {
        name: 'set_device_info',
        description: 'Update the information of a AC device',
        parameters: {
          type: 'object',
          properties: {
            device_id: {
              type: 'string',
              description: 'The unique identifier of the device'
            },
            status: {
              type: 'string',
              description: 'The new status to set for the device (ON or OFF)'
            },
            location: {
              type: 'string',
              description: 'The new location to set for the device'
            }
          },
          required: ['device_id']
        }
      }
    }),
    new FunctionTool({
      name: 'get_temperature',
      description: 'Get the current temperature in celsius of a location',
      fn: async (params) => getTemperature(params.location),
      functionDeclaration: {
        name: 'get_temperature',
        description: 'Get the current temperature in celsius of a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The location for which to retrieve the temperature'
            }
          },
          required: ['location']
        }
      }
    }),
    new FunctionTool({
      name: 'set_temperature',
      description: 'Set the desired temperature in celsius for a location',
      fn: async (params) => setTemperature(params.location, params.temperature),
      functionDeclaration: {
        name: 'set_temperature',
        description: 'Set the desired temperature in celsius for a location',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'The location where the temperature should be set'
            },
            temperature: {
              type: 'number',
              description: 'The desired temperature to set in celsius'
            }
          },
          required: ['location', 'temperature']
        }
      }
    }),
    new FunctionTool({
      name: 'get_user_preferences',
      description: 'Get the temperature preferences and preferred location of a user',
      fn: async (params) => getUserPreferences(params.user_id),
      functionDeclaration: {
        name: 'get_user_preferences',
        description: 'Get the temperature preferences and preferred location of a user',
        parameters: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'The unique identifier of the user'
            }
          },
          required: ['user_id']
        }
      }
    }),
    new FunctionTool({
      name: 'set_device_schedule',
      description: 'Schedule a device to change its status at a specific time',
      fn: async (params) => setDeviceSchedule(params.device_id, params.time, params.status),
      functionDeclaration: {
        name: 'set_device_schedule',
        description: 'Schedule a device to change its status at a specific time',
        parameters: {
          type: 'object',
          properties: {
            device_id: {
              type: 'string',
              description: 'The unique identifier of the device'
            },
            time: {
              type: 'string',
              description: 'The time at which the device should change its status (format: HH:MM)'
            },
            status: {
              type: 'string',
              description: 'The status to set for the device at the specified time'
            }
          },
          required: ['device_id', 'time', 'status']
        }
      }
    }),
    new FunctionTool({
      name: 'get_device_schedule',
      description: 'Retrieve the schedule of a device',
      fn: async (params) => getDeviceSchedule(params.device_id),
      functionDeclaration: {
        name: 'get_device_schedule',
        description: 'Retrieve the schedule of a device',
        parameters: {
          type: 'object',
          properties: {
            device_id: {
              type: 'string',
              description: 'The unique identifier of the device'
            }
          },
          required: ['device_id']
        }
      }
    }),
    new FunctionTool({
      name: 'celsius_to_fahrenheit',
      description: 'Convert Celsius to Fahrenheit',
      fn: async (params) => celsiusToFahrenheit(params.celsius),
      functionDeclaration: {
        name: 'celsius_to_fahrenheit',
        description: 'Convert Celsius to Fahrenheit',
        parameters: {
          type: 'object',
          properties: {
            celsius: {
              type: 'number',
              description: 'Temperature in Celsius'
            }
          },
          required: ['celsius']
        }
      }
    }),
    new FunctionTool({
      name: 'fahrenheit_to_celsius',
      description: 'Convert Fahrenheit to Celsius',
      fn: async (params) => fahrenheitToCelsius(params.fahrenheit),
      functionDeclaration: {
        name: 'fahrenheit_to_celsius',
        description: 'Convert Fahrenheit to Celsius',
        parameters: {
          type: 'object',
          properties: {
            fahrenheit: {
              type: 'number',
              description: 'Temperature in Fahrenheit'
            }
          },
          required: ['fahrenheit']
        }
      }
    }),
    new FunctionTool({
      name: 'list_devices',
      description: 'Retrieve a list of AC devices, filtered by status and/or location',
      fn: async (params) => listDevices(params.status, params.location),
      functionDeclaration: {
        name: 'list_devices',
        description: 'Retrieve a list of AC devices, filtered by status and/or location',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              description: 'The status to filter devices by'
            },
            location: {
              type: 'string',
              description: 'The location to filter devices by'
            }
          }
        }
      }
    })
  ]
}); 