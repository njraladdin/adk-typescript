import { LlmAgent as Agent } from '../../../../src/agents/LlmAgent';
import { RemoteAgent } from '../../../../src/agents/RemoteAgent';
import { Session } from '../../../../src/sessions/Session';
import { Content, Part } from '../../../../src/types';
import { BaseLlm } from '../../../../src/models/BaseLlm';
import { LlmRegistry } from '../../../../src/models';
import { FunctionTool } from '../../../../src/tools/FunctionTool';
import { AutoFlow } from '../../../../src/flows/llm_flows/AutoFlow';

/**
 * Reset any data maintained by the agent
 */
function resetData(): void {
  // Implementation would go here
}

/**
 * Fetch user flight information.
 * @param customerEmail The email of the customer
 * @returns A string containing flight information
 */
function fetchUserFlightInformation(customerEmail: string): string {
  return `
[{"ticket_no": "7240005432906569", "book_ref": "C46E9F", "flight_id": 19250, "flight_no": "LX0112", "departure_airport": "CDG", "arrival_airport": "BSL", "scheduled_departure": "2024-12-30 12:09:03.561731-04:00", "scheduled_arrival": "2024-12-30 13:39:03.561731-04:00", "seat_no": "18E", "fare_conditions": "Economy"}]
`;
}

/**
 * List customer flights
 * @param customerEmail The email of the customer
 * @returns A string containing flight information
 */
function listCustomerFlights(customerEmail: string): string {
  return "{'flights': [{'book_ref': 'C46E9F'}]}";
}

/**
 * Update ticket to a new flight
 * @param ticketNo The ticket number
 * @param newFlightId The new flight ID
 * @returns A confirmation message
 */
function updateTicketToNewFlight(ticketNo: string, newFlightId: string): string {
  return 'OK, your ticket has been updated.';
}

/**
 * Lookup company policy
 * @param topic The policy topic to look up
 * @returns Policy information as a string
 */
function lookupCompanyPolicy(topic: string): string {
  return `
1. How can I change my booking?
	* The ticket number must start with 724 (SWISS ticket no./plate).
	* The ticket was not paid for by barter or voucher (there are exceptions to voucher payments; if the ticket was paid for in full by voucher, then it may be possible to rebook online under certain circumstances. If it is not possible to rebook online because of the payment method, then you will be informed accordingly during the rebooking process).
	* There must be an active flight booking for your ticket. It is not possible to rebook open tickets or tickets without the corresponding flight segments online at the moment.
	* It is currently only possible to rebook outbound (one-way) tickets or return tickets with single flight routes (point-to-point).
`;
}

/**
 * Search for flights
 * @param departureAirport The departure airport code
 * @param arrivalAirport The arrival airport code
 * @param startTime The start time for the flight search
 * @param endTime The end time for the flight search
 * @returns Flight search results as a string
 */
function searchFlights(
  departureAirport?: string,
  arrivalAirport?: string,
  startTime?: string,
  endTime?: string
): string {
  return `
[{"flight_id": 19238, "flight_no": "LX0112", "scheduled_departure": "2024-05-08 12:09:03.561731-04:00", "scheduled_arrival": "2024-05-08 13:39:03.561731-04:00", "departure_airport": "CDG", "arrival_airport": "BSL", "status": "Scheduled", "aircraft_code": "SU9", "actual_departure": null, "actual_arrival": null}, {"flight_id": 19242, "flight_no": "LX0112", "scheduled_departure": "2024-05-09 12:09:03.561731-04:00", "scheduled_arrival": "2024-05-09 13:39:03.561731-04:00", "departure_airport": "CDG", "arrival_airport": "BSL", "status": "Scheduled", "aircraft_code": "SU9", "actual_departure": null, "actual_arrival": null}]`;
}

/**
 * Search for hotels
 * @param location The hotel location
 * @param priceTier The price tier
 * @param checkinDate The check-in date
 * @param checkoutDate The check-out date
 * @returns Hotel search results as a string
 */
function searchHotels(
  location?: string,
  priceTier?: string,
  checkinDate?: string,
  checkoutDate?: string
): string {
  return `
[{"id": 1, "name": "Hilton Basel", "location": "Basel", "price_tier": "Luxury"}, {"id": 3, "name": "Hyatt Regency Basel", "location": "Basel", "price_tier": "Upper Upscale"}, {"id": 8, "name": "Holiday Inn Basel", "location": "Basel", "price_tier": "Upper Midscale"}]
`;
}

/**
 * Book a hotel
 * @param hotelName The name of the hotel to book
 * @returns A confirmation message
 */
function bookHotel(hotelName: string): string {
  return 'OK, your hotel has been booked.';
}

/**
 * Hook executed before model call
 * @param agent The agent instance
 * @param session The session
 * @param userMessage The user message
 * @returns A response if intercept needed, otherwise null
 */
function beforeModelCall(agent: Agent, session: Session, userMessage: string): Content | null {
  if (userMessage.toLowerCase().includes('expedia')) {
    return {
      role: 'model',
      parts: [{ text: "Sorry, I can't answer this question." }]
    };
  }
  return null;
}

/**
 * Hook executed after model call
 * @param agent The agent instance
 * @param session The session
 * @param content The model content
 * @returns A modified response if needed, otherwise null
 */
function afterModelCall(agent: Agent, session: Session, content: Content): Content | null {
  const modelMessage = content.parts[0].text;
  if (modelMessage && modelMessage.toLowerCase().includes('expedia')) {
    return {
      role: 'model',
      parts: [{ text: "Sorry, I can't answer this question." }]
    };
  }
  return null;
}

// Create model instances for our agents
const geminiModel = LlmRegistry.newLlm('gemini-2.0-flash');

// Create flow instances
const autoFlow = new AutoFlow();

/**
 * Flight agent for handling flight bookings and information
 */
export const flightAgent = new Agent({
  name: 'flight_agent',
  description: 'Handles flight information, policy and updates',
  model: geminiModel,
  instruction: `
      You are a specialized assistant for handling flight updates.
        The primary assistant delegates work to you whenever the user needs help updating their bookings.
      Confirm the updated flight details with the customer and inform them of any additional fees.
        When searching, be persistent. Expand your query bounds if the first search returns no results.
        Remember that a booking isn't completed until after the relevant tool has successfully been used.
      Do not waste the user's time. Do not make up invalid tools or functions.
  `,
  flow: autoFlow,
  tools: [
    new FunctionTool({
      name: 'list_customer_flights',
      description: 'List flights for a customer',
      fn: async (params) => listCustomerFlights(params.customer_email),
      functionDeclaration: {
        name: 'list_customer_flights',
        description: 'List flights for a customer',
        parameters: {
          type: 'object',
          properties: {
            customer_email: {
              type: 'string',
              description: 'Customer email address'
            }
          },
          required: ['customer_email']
        }
      }
    }),
    new FunctionTool({
      name: 'lookup_company_policy',
      description: 'Look up company policy',
      fn: async (params) => lookupCompanyPolicy(params.topic),
      functionDeclaration: {
        name: 'lookup_company_policy',
        description: 'Look up company policy',
        parameters: {
          type: 'object',
          properties: {
            topic: {
              type: 'string',
              description: 'The policy topic to look up'
            }
          },
          required: ['topic']
        }
      }
    }),
    new FunctionTool({
      name: 'fetch_user_flight_information',
      description: 'Fetch user flight information',
      fn: async (params) => fetchUserFlightInformation(params.customer_email),
      functionDeclaration: {
        name: 'fetch_user_flight_information',
        description: 'Fetch user flight information',
        parameters: {
          type: 'object',
          properties: {
            customer_email: {
              type: 'string',
              description: 'Customer email address'
            }
          },
          required: ['customer_email']
        }
      }
    }),
    new FunctionTool({
      name: 'search_flights',
      description: 'Search for available flights',
      fn: async (params) => searchFlights(
        params.departure_airport,
        params.arrival_airport,
        params.start_time,
        params.end_time
      ),
      functionDeclaration: {
        name: 'search_flights',
        description: 'Search for available flights',
        parameters: {
          type: 'object',
          properties: {
            departure_airport: {
              type: 'string',
              description: 'Departure airport code'
            },
            arrival_airport: {
              type: 'string',
              description: 'Arrival airport code'
            },
            start_time: {
              type: 'string',
              description: 'Start time for the flight search'
            },
            end_time: {
              type: 'string',
              description: 'End time for the flight search'
            }
          }
        }
      }
    }),
    new FunctionTool({
      name: 'update_ticket_to_new_flight',
      description: 'Update ticket to a new flight',
      fn: async (params) => updateTicketToNewFlight(params.ticket_no, params.new_flight_id),
      functionDeclaration: {
        name: 'update_ticket_to_new_flight',
        description: 'Update ticket to a new flight',
        parameters: {
          type: 'object',
          properties: {
            ticket_no: {
              type: 'string',
              description: 'Ticket number'
            },
            new_flight_id: {
              type: 'string',
              description: 'New flight ID'
            }
          },
          required: ['ticket_no', 'new_flight_id']
        }
      }
    })
  ]
});

/**
 * Hotel agent for handling hotel bookings
 */
export const hotelAgent = new Agent({
  name: 'hotel_agent',
  description: 'Handles hotel information and booking',
  model: geminiModel,
  instruction: `
      You are a specialized assistant for handling hotel bookings.
      The primary assistant delegates work to you whenever the user needs help booking a hotel.
      Search for available hotels based on the user's preferences and confirm the booking details with the customer.
        When searching, be persistent. Expand your query bounds if the first search returns no results.
  `,
  flow: autoFlow,
  tools: [
    new FunctionTool({
      name: 'search_hotels',
      description: 'Search for available hotels',
      fn: async (params) => searchHotels(
        params.location,
        params.price_tier,
        params.checkin_date,
        params.checkout_date
      ),
      functionDeclaration: {
        name: 'search_hotels',
        description: 'Search for available hotels',
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: 'Hotel location'
            },
            price_tier: {
              type: 'string',
              description: 'Price tier'
            },
            checkin_date: {
              type: 'string',
              description: 'Check-in date'
            },
            checkout_date: {
              type: 'string',
              description: 'Check-out date'
            }
          }
        }
      }
    }),
    new FunctionTool({
      name: 'book_hotel',
      description: 'Book a hotel',
      fn: async (params) => bookHotel(params.hotel_name),
      functionDeclaration: {
        name: 'book_hotel',
        description: 'Book a hotel',
        parameters: {
          type: 'object',
          properties: {
            hotel_name: {
              type: 'string',
              description: 'Name of the hotel to book'
            }
          },
          required: ['hotel_name']
        }
      }
    })
  ]
});

/**
 * Idea agent for providing travel ideas
 */
export const ideaAgent = new RemoteAgent(
  'idea_agent',
  {
    description: 'Provide travel ideas base on the destination.',
    url: 'http://localhost:8000/agent/run',
    model: geminiModel
  }
);

/**
 * Root agent for customer support
 */
export const customerSupportRootAgent = new Agent({
  name: 'root_agent',
  model: geminiModel,
  instruction: `
      You are a helpful customer support assistant for Swiss Airlines.
  `,
  subAgents: [flightAgent, hotelAgent, ideaAgent],
  flow: autoFlow,
  examples: [
    {
      input: 'How were you built?',
      output: 'I was built with the best agent framework.'
    }
  ]
}); 