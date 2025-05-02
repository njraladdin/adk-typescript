// https://github.com/crewAIInc/crewAI-examples/tree/main/trip_planner

import { LlmAgent as Agent } from '../../../../src/agents';

// Agent that selects the best city for the trip.
export const identifyAgent = new Agent({
  name: 'identify_agent',
  description: 'Select the best city based on weather, season, and prices.',
  model: 'gemini-2.0-flash',
  instruction: `
  Analyze and select the best city for the trip based
  on specific criteria such as weather patterns, seasonal
  events, and travel costs. This task involves comparing
  multiple cities, considering factors like current weather
  conditions, upcoming cultural or seasonal events, and
  overall travel expenses.

  Your final answer must be a detailed
  report on the chosen city, and everything you found out
  about it, including the actual flight costs, weather
  forecast and attractions.

  Traveling from: {origin}
  City Options: {cities}
  Trip Date: {range}
  Traveler Interests: {interests}
`
});

// Agent that gathers information about the city.
export const gatherAgent = new Agent({
  name: 'gather_agent',
  description: 'Provide the BEST insights about the selected city',
  model: 'gemini-2.0-flash',
  instruction: `
  As a local expert on this city you must compile an
  in-depth guide for someone traveling there and wanting
  to have THE BEST trip ever!
  Gather information about key attractions, local customs,
  special events, and daily activity recommendations.
  Find the best spots to go to, the kind of place only a
  local would know.
  This guide should provide a thorough overview of what
  the city has to offer, including hidden gems, cultural
  hotspots, must-visit landmarks, weather forecasts, and
  high level costs.

  The final answer must be a comprehensive city guide,
  rich in cultural insights and practical tips,
  tailored to enhance the travel experience.

  Trip Date: {range}
  Traveling from: {origin}
  Traveler Interests: {interests}
`
});

// Agent that plans the trip.
export const planAgent = new Agent({
  name: 'plan_agent',
  description: `Create the most amazing travel itineraries with budget and
    packing suggestions for the city`,
  model: 'gemini-2.0-flash',
  instruction: `
  Expand this guide into a full 7-day travel
  itinerary with detailed per-day plans, including
  weather forecasts, places to eat, packing suggestions,
  and a budget breakdown.

  You MUST suggest actual places to visit, actual hotels
  to stay and actual restaurants to go to.

  This itinerary should cover all aspects of the trip,
  from arrival to departure, integrating the city guide
  information with practical travel logistics.

  Your final answer MUST be a complete expanded travel plan,
  formatted as markdown, encompassing a daily schedule,
  anticipated weather conditions, recommended clothing and
  items to pack, and a detailed budget, ensuring THE BEST
  TRIP EVER. Be specific and give it a reason why you picked
  each place, what makes them special!

  Trip Date: {range}
  Traveling from: {origin}
  Traveler Interests: {interests}
`
});

const rootAgent = new Agent({
  model: 'gemini-2.0-flash',
  name: 'trip_planner',
  description: 'Plan the best trip ever',
  instruction: `
  Your goal is to plan the best trip according to information listed above.
  You describe why did you choose the city, list top 3
  attactions and provide a detailed itinerary for each day.`,
  subAgents: [identifyAgent, gatherAgent, planAgent]
}); 

/**
 * Reset function for the trip planner agent
 */
export function reset_data(): void {
  console.log('Resetting trip planner agent data');
}

// Export in the format expected by EvaluationGenerator
export const agent = {
  rootAgent,
  reset_data
};

// Keep the direct export for other uses
export { rootAgent }; 