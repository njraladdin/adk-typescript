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

import { Agent } from '../../../../src';

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

/**
 * E-commerce customer service agent
 */
export const ecommerceCustomerServiceAgent = new Agent({
  name: "Ecommerce_Customer_Service",
  llm: "gemini-2.0-flash-001",
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
  tools: [
    {
      name: 'get_order_status',
      function: getOrderStatus,
      parameters: {
        order_id: {
          type: 'string',
          description: 'The unique identifier of the order'
        }
      }
    },
    {
      name: 'cancel_order',
      function: cancelOrder,
      parameters: {
        order_id: {
          type: 'string',
          description: 'The unique identifier of the order to be canceled'
        }
      }
    },
    {
      name: 'get_order_ids_for_user',
      function: getOrderIdsForUser,
      parameters: {
        user_id: {
          type: 'string',
          description: 'The unique identifier of the user'
        }
      }
    },
    {
      name: 'refund_order',
      function: refundOrder,
      parameters: {
        order_id: {
          type: 'string',
          description: 'The unique identifier of the order to be refunded'
        }
      }
    },
    {
      name: 'create_ticket',
      function: createTicket,
      parameters: {
        user_id: {
          type: 'string',
          description: 'The unique identifier of the user creating the ticket'
        },
        issue_type: {
          type: 'string',
          description: 'An issue type the user is facing'
        }
      }
    },
    {
      name: 'update_ticket_status',
      function: updateTicketStatus,
      parameters: {
        ticket_id: {
          type: 'string',
          description: 'The unique identifier of the ticket'
        },
        status: {
          type: 'string',
          description: 'The new status to assign to the ticket'
        }
      }
    },
    {
      name: 'get_tickets_for_user',
      function: getTicketsForUser,
      parameters: {
        user_id: {
          type: 'string',
          description: 'The unique identifier of the user'
        }
      }
    },
    {
      name: 'get_ticket_info',
      function: getTicketInfo,
      parameters: {
        ticket_id: {
          type: 'string',
          description: 'The unique identifier of the ticket'
        }
      }
    },
    {
      name: 'get_user_info',
      function: getUserInfo,
      parameters: {
        user_id: {
          type: 'string',
          description: 'The unique identifier of the user'
        }
      }
    },
    {
      name: 'send_email',
      function: sendEmail,
      parameters: {
        user_id: {
          type: 'string',
          description: 'The unique identifier of the user'
        },
        email: {
          type: 'string',
          description: 'The email address of the user'
        }
      }
    },
    {
      name: 'update_user_info',
      function: updateUserInfo,
      parameters: {
        user_id: {
          type: 'string',
          description: 'The unique identifier of the user'
        },
        email: {
          type: 'string',
          description: 'The new email address',
          optional: true
        },
        name: {
          type: 'string',
          description: 'The new name',
          optional: true
        }
      }
    },
    {
      name: 'get_user_id_from_cookie',
      function: getUserIdFromCookie,
      parameters: {}
    }
  ]
}); 