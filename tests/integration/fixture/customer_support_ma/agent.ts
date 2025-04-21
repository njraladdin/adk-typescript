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

import { Agent, RemoteAgent, Session } from '../../../../src';
import { Content, Part } from '../../../../src/types';

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

/**
 * Flight agent for handling flight bookings and information
 */
export const flightAgent = new Agent({
  name: 'flight_agent',
  description: 'Handles flight information, policy and updates',
  llm: 'gemini-1.5-pro',
  instruction: `
      You are a specialized assistant for handling flight updates.
        The primary assistant delegates work to you whenever the user needs help updating their bookings.
      Confirm the updated flight details with the customer and inform them of any additional fees.
        When searching, be persistent. Expand your query bounds if the first search returns no results.
        Remember that a booking isn't completed until after the relevant tool has successfully been used.
      Do not waste the user's time. Do not make up invalid tools or functions.
  `,
  tools: [
    {
      name: 'list_customer_flights',
      function: listCustomerFlights,
      parameters: {
        customer_email: {
          type: 'string',
          description: 'Customer email address'
        }
      }
    },
    {
      name: 'lookup_company_policy',
      function: lookupCompanyPolicy,
      parameters: {
        topic: {
          type: 'string',
          description: 'The policy topic to look up'
        }
      }
    },
    {
      name: 'fetch_user_flight_information',
      function: fetchUserFlightInformation,
      parameters: {
        customer_email: {
          type: 'string',
          description: 'Customer email address'
        }
      }
    },
    {
      name: 'search_flights',
      function: searchFlights,
      parameters: {
        departure_airport: {
          type: 'string',
          description: 'Departure airport code',
          optional: true
        },
        arrival_airport: {
          type: 'string',
          description: 'Arrival airport code',
          optional: true
        },
        start_time: {
          type: 'string',
          description: 'Start time for the flight search',
          optional: true
        },
        end_time: {
          type: 'string',
          description: 'End time for the flight search',
          optional: true
        }
      }
    },
    {
      name: 'update_ticket_to_new_flight',
      function: updateTicketToNewFlight,
      parameters: {
        ticket_no: {
          type: 'string',
          description: 'Ticket number'
        },
        new_flight_id: {
          type: 'string',
          description: 'New flight ID'
        }
      }
    }
  ]
});

/**
 * Hotel agent for handling hotel bookings
 */
export const hotelAgent = new Agent({
  name: 'hotel_agent',
  description: 'Handles hotel information and booking',
  llm: 'gemini-1.5-pro',
  instruction: `
      You are a specialized assistant for handling hotel bookings.
      The primary assistant delegates work to you whenever the user needs help booking a hotel.
      Search for available hotels based on the user's preferences and confirm the booking details with the customer.
        When searching, be persistent. Expand your query bounds if the first search returns no results.
  `,
  tools: [
    {
      name: 'search_hotels',
      function: searchHotels,
      parameters: {
        location: {
          type: 'string',
          description: 'Hotel location',
          optional: true
        },
        price_tier: {
          type: 'string',
          description: 'Price tier',
          optional: true
        },
        checkin_date: {
          type: 'string',
          description: 'Check-in date',
          optional: true
        },
        checkout_date: {
          type: 'string',
          description: 'Check-out date',
          optional: true
        }
      }
    },
    {
      name: 'book_hotel',
      function: bookHotel,
      parameters: {
        hotel_name: {
          type: 'string',
          description: 'Name of the hotel to book'
        }
      }
    }
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
    llm: 'gemini-1.5-pro'
  }
);

/**
 * Root agent for customer support
 */
export const customerSupportRootAgent = new Agent({
  name: 'root_agent',
  llm: 'gemini-1.5-pro',
  instruction: `
      You are a helpful customer support assistant for Swiss Airlines.
  `,
  subAgents: [flightAgent, hotelAgent, ideaAgent],
  flow: 'auto',
  examples: [
    {
      input: {
        role: 'user',
        parts: [{ text: 'How were you built?' }]
      },
      output: [
        {
          role: 'model',
          parts: [{ text: 'I was built with the best agent framework.' }]
        }
      ]
    }
  ]
}); 