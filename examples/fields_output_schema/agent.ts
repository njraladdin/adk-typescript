import { LlmAgent as Agent } from 'adk-typescript/agents';
import { runAgent } from 'adk-typescript';

class WeatherData {
  temperature: string;
  humidity: string;
  wind_speed: string;

  constructor(data: {
    temperature: string;
    humidity: string;
    wind_speed: string;
  }) {
    this.temperature = data.temperature;
    this.humidity = data.humidity;
    this.wind_speed = data.wind_speed;
  }
}

export const rootAgent = new Agent({
  name: 'root_agent',
  model: 'gemini-2.0-flash',
  instruction: `Answer user's questions based on the data you have.

If you don't have the data, you can just say you don't know.

Here are the data you have for San Jose

* temperature: 26 C
* humidity: 20%
* wind_speed: 29 mph

Here are the data you have for Cupertino

* temperature: 16 C
* humidity: 10%
* wind_speed: 13 mph
`,
  outputSchema: WeatherData,
  outputKey: 'weather_data',
});

// Run agent directly when this file is executed
// Usage: npx ts-node examples/fields_output_schema/agent.ts
if (require.main === module) {
  runAgent(rootAgent).catch(console.error);
}
