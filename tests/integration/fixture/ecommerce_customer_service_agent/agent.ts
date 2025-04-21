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

// A lightweight in-memory mock database
interface OrderDB {
  [orderId: string]: string;
}

interface UserToOrderDB {
  [userId: string]: string[];
}

interface TicketInfo {
  ticket_id: string;
  user_id: string;
  issue_type: string;
  status: string;
}

interface UserInfo {
  name: string;
  email: string;
}

interface UserInfoDB {
  [userId: string]: UserInfo;
}

// Global mock databases
let ORDER_DB: OrderDB = {
  "1": "FINISHED",
  "2": "CANCELED",
  "3": "PENDING",
  "4": "PENDING",
}; // Order id to status mapping. Available states: 'FINISHED', 'PENDING', and 'CANCELED'

let USER_TO_ORDER_DB: UserToOrderDB = {
  "user_a": ["1", "4"],
  "user_b": ["2"],
  "user_c": ["3"],
}; // User id to Order id mapping

let TICKET_DB: TicketInfo[] = [{
  "ticket_id": "1",
  "user_id": "user_a",
  "issue_type": "LOGIN_ISSUE",
  "status": "OPEN",
}]; // Available states: 'OPEN', 'CLOSED', 'ESCALATED'

let USER_INFO_DB: UserInfoDB = {
  "user_a": { "name": "Alice", "email": "alice@example.com" },
  "user_b": { "name": "Bob", "email": "bob@example.com" },
};

/**
 * Reset all mock data to initial state
 */
function resetData(): void {
  ORDER_DB = {
    "1": "FINISHED",
    "2": "CANCELED",
    "3": "PENDING",
    "4": "PENDING",
  };

  USER_TO_ORDER_DB = {
    "user_a": ["1", "4"],
    "user_b": ["2"],
    "user_c": ["3"],
  };

  TICKET_DB = [{
    "ticket_id": "1",
    "user_id": "user_a",
    "issue_type": "LOGIN_ISSUE",
    "status": "OPEN",
  }];

  USER_INFO_DB = {
    "user_a": { "name": "Alice", "email": "alice@example.com" },
    "user_b": { "name": "Bob", "email": "bob@example.com" },
  };
}

/**
 * Get the status of an order.
 * @param orderId The unique identifier of the order.
 * @returns The status of the order (e.g., 'FINISHED', 'CANCELED', 'PENDING'),
 * or 'Order not found' if the order_id does not exist.
 */
function getOrderStatus(orderId: string): string {
  return ORDER_DB[orderId] || "Order not found";
}

/**
 * Get the list of order IDs assigned to a specific transaction associated with a user.
 * @param userId The unique identifier of the user.
 * @returns A list of order IDs associated with the user, or an empty list if no orders are found.
 */
function getOrderIdsForUser(userId: string): string[] {
  return USER_TO_ORDER_DB[userId] || [];
}

/**
 * Cancel an order if it is in a 'PENDING' state.
 * You should call "get_order_status" to check the status first, before calling this tool.
 * @param orderId The unique identifier of the order to be canceled.
 * @returns A message indicating whether the order was successfully canceled or not.
 */
function cancelOrder(orderId: string): string {
  if (orderId in ORDER_DB && ORDER_DB[orderId] === "PENDING") {
    ORDER_DB[orderId] = "CANCELED";
    return `Order ${orderId} has been canceled.`;
  }
  return `Order ${orderId} cannot be canceled.`;
}

/**
 * Process a refund for an order if it is in a 'CANCELED' state.
 * You should call "get_order_status" to check if status first, before calling this tool.
 * @param orderId The unique identifier of the order to be refunded.
 * @returns A message indicating whether the order was successfully refunded or not.
 */
function refundOrder(orderId: string): string {
  if (orderId in ORDER_DB && ORDER_DB[orderId] === "CANCELED") {
    return `Order ${orderId} has been refunded.`;
  }
  return `Order ${orderId} cannot be refunded.`;
}

/**
 * Create a new support ticket for a user.
 * @param userId The unique identifier of the user creating the ticket.
 * @param issueType An issue type the user is facing. Available types: 'LOGIN_ISSUE', 'ORDER_ISSUE', 'OTHER'.
 * @returns A message indicating that the ticket was created successfully, including the ticket ID.
 */
function createTicket(userId: string, issueType: string): string {
  const ticketId = String(TICKET_DB.length + 1);
  TICKET_DB.push({
    "ticket_id": ticketId,
    "user_id": userId,
    "issue_type": issueType,
    "status": "OPEN",
  });
  return `Ticket ${ticketId} created successfully.`;
}

/**
 * Retrieve the information of a support ticket.
 * @param ticketId The unique identifier of the ticket.
 * @returns A dictionary contains the ticket information, or 'Ticket not found' if the ticket_id does not exist.
 */
function getTicketInfo(ticketId: string): TicketInfo | string {
  for (const ticket of TICKET_DB) {
    if (ticket.ticket_id === ticketId) {
      return ticket;
    }
  }
  return "Ticket not found";
}

/**
 * Get all the ticket IDs associated with a user.
 * @param userId The unique identifier of the user.
 * @returns A list of ticket IDs associated with the user. If no tickets are found, returns an empty list.
 */
function getTicketsForUser(userId: string): string[] {
  return TICKET_DB
    .filter(ticket => ticket.user_id === userId)
    .map(ticket => ticket.ticket_id);
}

/**
 * Update the status of a support ticket.
 * @param ticketId The unique identifier of the ticket.
 * @param status The new status to assign to the ticket (e.g., 'OPEN', 'CLOSED', 'ESCALATED').
 * @returns A message indicating whether the ticket status was successfully updated.
 */
function updateTicketStatus(ticketId: string, status: string): string {
  for (const ticket of TICKET_DB) {
    if (ticket.ticket_id === ticketId) {
      ticket.status = status;
      return `Ticket ${ticketId} status updated to ${status}.`;
    }
  }
  return "Ticket not found";
}

/**
 * Retrieve information (name, email) about a user.
 * @param userId The unique identifier of the user.
 * @returns A dictionary containing user information, or 'User not found' if the user_id does not exist.
 */
function getUserInfo(userId: string): UserInfo | string {
  return USER_INFO_DB[userId] || "User not found";
}

/**
 * Send email to user for notification.
 * @param userId The unique identifier of the user.
 * @param email The email address of the user.
 * @returns A message indicating whether the email was successfully sent.
 */
function sendEmail(userId: string, email: string): string {
  if (userId in USER_INFO_DB) {
    return `Email sent to ${email} for user id ${userId}`;
  }
  return "Cannot find this user";
}

/**
 * Update a user's information.
 * @param userId The unique identifier of the user.
 * @param email The new email address (optional).
 * @param name The new name (optional).
 * @returns A message indicating whether the user's information was successfully updated or not.
 */
function updateUserInfo(userId: string, email: string, name: string): string {
  if (userId in USER_INFO_DB) {
    if (email && name) {
      USER_INFO_DB[userId] = { ...USER_INFO_DB[userId], email, name };
    } else if (email) {
      USER_INFO_DB[userId] = { ...USER_INFO_DB[userId], email };
    } else if (name) {
      USER_INFO_DB[userId] = { ...USER_INFO_DB[userId], name };
    } else {
      throw new Error("This should not happen.");
    }
    return `User ${userId} information updated.`;
  }
  return "User not found";
}

/**
 * Get user ID(username) from the cookie.
 * Only use this function when you do not know user ID(username).
 * @returns The user ID.
 */
function getUserIdFromCookie(): string {
  return "user_a";
}

// Create model instances for our agents
const geminiModel = LlmRegistry.newLlm('gemini-1.5-flash');

// Create flow instances
const autoFlow = new AutoFlow();

/**
 * E-commerce customer service agent
 */
export const ecommerceCustomerServiceAgent = new Agent('Ecommerce_Customer_Service', {
  llm: geminiModel,
  instruction: `
    You are an intelligent customer service assistant for an e-commerce platform. Your goal is to accurately understand user queries and use the appropriate tools to fulfill requests. Follow these guidelines:

    1. **Understand the Query**:
      - Identify actions and conditions (e.g., create a ticket only for pending orders).
      - Extract necessary details (e.g., user ID, order ID) from the query or infer them from the context.

    2. **Plan Multi-Step Workflows**:
      - Break down complex queries into sequential steps. For example
      - typical workflow:
        - Retrieve IDs or references first (e.g., orders for a user).
        - Evaluate conditions (e.g., check order status).
        - Perform actions (e.g., create a ticket) only when conditions are met.
      - another typical workflows - order cancellation and refund:
        - Retrieve all orders for the user (\`get_order_ids_for_user\`).
        - Cancel pending orders (\`cancel_order\`).
        - Refund canceled orders (\`refund_order\`).
        - Notify the user (\`send_email\`).
      - another typical workflows - send user report:
        - Get user id.
        - Get user info(like emails)
        - Send email to user.

    3. **Avoid Skipping Steps**:
      - Ensure each intermediate step is completed before moving to the next.
      - Do not create tickets or take other actions without verifying the conditions specified in the query.

    4. **Provide Clear Responses**:
      - Confirm the actions performed, including details like ticket ID or pending orders.
      - Ensure the response aligns with the steps taken and query intent.
  `,
  flow: autoFlow,
  tools: [
    new FunctionTool({
      name: 'get_order_status',
      description: 'Get the status of an order',
      fn: async (params) => getOrderStatus(params.order_id),
      functionDeclaration: {
        name: 'get_order_status',
        description: 'Get the status of an order',
        parameters: {
          type: 'object',
          properties: {
            order_id: {
              type: 'string',
              description: 'The unique identifier of the order'
            }
          },
          required: ['order_id']
        }
      }
    }),
    new FunctionTool({
      name: 'cancel_order',
      description: 'Cancel an order if it is in a PENDING state',
      fn: async (params) => cancelOrder(params.order_id),
      functionDeclaration: {
        name: 'cancel_order',
        description: 'Cancel an order if it is in a PENDING state',
        parameters: {
          type: 'object',
          properties: {
            order_id: {
              type: 'string',
              description: 'The unique identifier of the order to be canceled'
            }
          },
          required: ['order_id']
        }
      }
    }),
    new FunctionTool({
      name: 'get_order_ids_for_user',
      description: 'Get the list of order IDs assigned to a specific user',
      fn: async (params) => getOrderIdsForUser(params.user_id),
      functionDeclaration: {
        name: 'get_order_ids_for_user',
        description: 'Get the list of order IDs assigned to a specific user',
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
      name: 'refund_order',
      description: 'Process a refund for an order if it is in a CANCELED state',
      fn: async (params) => refundOrder(params.order_id),
      functionDeclaration: {
        name: 'refund_order',
        description: 'Process a refund for an order if it is in a CANCELED state',
        parameters: {
          type: 'object',
          properties: {
            order_id: {
              type: 'string',
              description: 'The unique identifier of the order to be refunded'
            }
          },
          required: ['order_id']
        }
      }
    }),
    new FunctionTool({
      name: 'create_ticket',
      description: 'Create a new support ticket for a user',
      fn: async (params) => createTicket(params.user_id, params.issue_type),
      functionDeclaration: {
        name: 'create_ticket',
        description: 'Create a new support ticket for a user',
        parameters: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'The unique identifier of the user creating the ticket'
            },
            issue_type: {
              type: 'string',
              description: 'An issue type the user is facing'
            }
          },
          required: ['user_id', 'issue_type']
        }
      }
    }),
    new FunctionTool({
      name: 'update_ticket_status',
      description: 'Update the status of a support ticket',
      fn: async (params) => updateTicketStatus(params.ticket_id, params.status),
      functionDeclaration: {
        name: 'update_ticket_status',
        description: 'Update the status of a support ticket',
        parameters: {
          type: 'object',
          properties: {
            ticket_id: {
              type: 'string',
              description: 'The unique identifier of the ticket'
            },
            status: {
              type: 'string',
              description: 'The new status to assign to the ticket'
            }
          },
          required: ['ticket_id', 'status']
        }
      }
    }),
    new FunctionTool({
      name: 'get_tickets_for_user',
      description: 'Get all the ticket IDs associated with a user',
      fn: async (params) => getTicketsForUser(params.user_id),
      functionDeclaration: {
        name: 'get_tickets_for_user',
        description: 'Get all the ticket IDs associated with a user',
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
      name: 'get_ticket_info',
      description: 'Retrieve the information of a support ticket',
      fn: async (params) => getTicketInfo(params.ticket_id),
      functionDeclaration: {
        name: 'get_ticket_info',
        description: 'Retrieve the information of a support ticket',
        parameters: {
          type: 'object',
          properties: {
            ticket_id: {
              type: 'string',
              description: 'The unique identifier of the ticket'
            }
          },
          required: ['ticket_id']
        }
      }
    }),
    new FunctionTool({
      name: 'get_user_info',
      description: 'Retrieve information about a user',
      fn: async (params) => getUserInfo(params.user_id),
      functionDeclaration: {
        name: 'get_user_info',
        description: 'Retrieve information about a user',
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
      name: 'send_email',
      description: 'Send email to user for notification',
      fn: async (params) => sendEmail(params.user_id, params.email),
      functionDeclaration: {
        name: 'send_email',
        description: 'Send email to user for notification',
        parameters: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'The unique identifier of the user'
            },
            email: {
              type: 'string',
              description: 'The email address of the user'
            }
          },
          required: ['user_id', 'email']
        }
      }
    }),
    new FunctionTool({
      name: 'update_user_info',
      description: 'Update a user\'s information',
      fn: async (params) => updateUserInfo(params.user_id, params.email, params.name),
      functionDeclaration: {
        name: 'update_user_info',
        description: 'Update a user\'s information',
        parameters: {
          type: 'object',
          properties: {
            user_id: {
              type: 'string',
              description: 'The unique identifier of the user'
            },
            email: {
              type: 'string',
              description: 'The new email address'
            },
            name: {
              type: 'string',
              description: 'The new name'
            }
          },
          required: ['user_id']
        }
      }
    }),
    new FunctionTool({
      name: 'get_user_id_from_cookie',
      description: 'Get user ID from the cookie',
      fn: async () => getUserIdFromCookie(),
      functionDeclaration: {
        name: 'get_user_id_from_cookie',
        description: 'Get user ID from the cookie',
        parameters: {
          type: 'object',
          properties: {}
        }
      }
    })
  ]
}); 