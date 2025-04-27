/**
 * ADK Web UI - Main Client Script
 */

class AdkChatApp {
  constructor() {
    // Initialize properties
    this.socket = null;
    this.agents = [];
    this.selectedAgent = null;
    this.currentSession = null;
    this.isConnected = false;
    this.isThinking = false;

    // Get DOM elements
    this.agentSelect = document.getElementById('agent-select');
    this.connectBtn = document.getElementById('connect-btn');
    this.messagesContainer = document.getElementById('messages');
    this.userInput = document.getElementById('user-input');
    this.sendBtn = document.getElementById('send-btn');
    this.newSessionBtn = document.getElementById('new-session-btn');
    this.sessionDetails = document.getElementById('session-details');
    this.agentDetails = document.getElementById('agent-details');

    // Set up event listeners
    this.connectBtn.addEventListener('click', () => this.connectToAgent());
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.newSessionBtn.addEventListener('click', () => this.createNewSession());
    this.userInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Initialize
    this.initialize();
  }

  async initialize() {
    try {
      // Fetch available agents
      console.log('Fetching available agents from /list-apps');
      const response = await fetch('/list-apps');
      if (response.ok) {
        const data = await response.json();
        console.log('Agent list response:', data);
        
        // Handle different API response formats:
        // - TypeScript API returns { agents: [{ name, path }] }
        // - A simple array of strings might also be returned in some cases
        if (data.agents) {
          console.log('Found agents in data.agents:', data.agents);
          this.agents = data.agents;
        } else if (Array.isArray(data)) {
          console.log('Data is an array:', data);
          // If the response is a direct array of strings (agent names)
          this.agents = data.map(name => ({ name }));
        } else {
          console.log('No agents found in data, using empty array');
          // Empty array as fallback
          this.agents = [];
        }
        
        console.log('Final agents list:', this.agents);
        this.populateAgentDropdown();
      } else {
        const errorText = await response.text();
        console.error('Failed to load agents, status:', response.status, errorText);
        this.showError(`Failed to load agents: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error('Error initializing:', error);
      this.showError('Error initializing: ' + error.message);
    }
  }

  populateAgentDropdown() {
    this.agentSelect.innerHTML = '';
    this.agents.forEach(agent => {
      const option = document.createElement('option');
      option.value = agent.name;
      option.textContent = agent.name;
      this.agentSelect.appendChild(option);
    });
  }

  async connectToAgent() {
    const agentName = this.agentSelect.value;
    if (!agentName) {
      this.showError('Please select an agent');
      return;
    }

    this.selectedAgent = { name: agentName };
    this.connectBtn.disabled = true;
    this.connectBtn.textContent = 'Connecting...';

    try {
      console.log(`Creating session for agent: ${agentName}`);
      
      // Create a new session
      const response = await fetch(`/apps/${agentName}/users/web-user/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: {} })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create session: ${response.status} ${errorText}`);
      }

      this.currentSession = await response.json();
      console.log('Session created:', this.currentSession);
      
      // Set up Socket.IO connection
      this.setupSocketConnection();
      this.updateSessionInfo();
      this.updateAgentInfo();
      this.clearMessages();
      this.sendBtn.disabled = false;
      this.isConnected = true;
      this.addSystemMessage(`Connected to agent: ${agentName}`);
    } catch (error) {
      console.error('Connection error:', error);
      this.showError('Connection error: ' + error.message);
      this.connectBtn.disabled = false;
      this.connectBtn.textContent = 'Connect';
    }
  }

  setupSocketConnection() {
    if (this.socket) {
      this.socket.disconnect();
    }

    // Connect to the socket server
    console.log('Connecting to Socket.IO server');
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connectBtn.textContent = 'Connected';
      
      // Make sure we're using the same userId that was used to create the session
      const sessionUserId = this.currentSession?.userId || 'web-user';
      
      // Initialize the agent by sending information to the socket
      console.log(`Initializing agent: ${this.selectedAgent.name}, sessionId: ${this.currentSession.id}, userId: ${sessionUserId}`);
      this.socket.emit('initialize_agent', {
        agentPath: this.selectedAgent.name,
        sessionId: this.currentSession.id,
        userId: sessionUserId
      });
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.showError('Socket error: ' + error.message);
    });
    
    this.socket.on('agent_initialized', (data) => {
      console.log('Agent initialized:', data);
      this.addSystemMessage(`Agent ${data.agentName} initialized with session ${data.sessionId}`);
    });

    this.socket.on('thinking', () => {
      console.log('Agent is thinking...');
      this.isThinking = true;
      this.addThinkingIndicator();
    });

    this.socket.on('response_chunk', (data) => {
      console.log('Received response chunk:', data);
      this.isThinking = false;
      this.removeThinkingIndicator();
      this.updateOrAddAgentMessage(data.text, data.author, data.partial);
    });

    this.socket.on('response_complete', () => {
      console.log('Response complete');
      this.isThinking = false;
      this.removeThinkingIndicator();
    });

    this.socket.on('function_calls', (data) => {
      console.log('Function calls:', data);
      // Display function calls in the UI if needed
    });

    this.socket.on('function_responses', (data) => {
      console.log('Function responses:', data);
      // Display function responses in the UI if needed
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.sendBtn.disabled = true;
      this.connectBtn.disabled = false;
      this.connectBtn.textContent = 'Connect';
    });
  }

  async sendMessage() {
    if (!this.isConnected || !this.currentSession || this.isThinking) return;
    
    const message = this.userInput.value.trim();
    if (!message) return;
    
    this.addUserMessage(message);
    this.userInput.value = '';
    
    if (this.socket) {
      this.socket.emit('message', { message });
    }
  }

  async createNewSession() {
    if (!this.selectedAgent) {
      this.showError('Please select and connect to an agent first');
      return;
    }

    try {
      const response = await fetch(`/apps/${this.selectedAgent.name}/users/web-user/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: {} })
      });

      if (response.ok) {
        this.currentSession = await response.json();
        this.updateSessionInfo();
        this.clearMessages();
        this.addSystemMessage('New session created');
      } else {
        throw new Error('Failed to create new session');
      }
    } catch (error) {
      this.showError('Error creating new session: ' + error.message);
    }
  }

  addUserMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.textContent = text;
    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  addAgentMessage(text, agent) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message agent-message';
    messageDiv.dataset.agent = agent;
    messageDiv.textContent = text;
    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
    return messageDiv;
  }

  updateOrAddAgentMessage(text, agent, isPartial) {
    const existingPartialMessage = this.messagesContainer.querySelector(`.message.agent-message[data-partial="true"][data-agent="${agent}"]`);

    if (existingPartialMessage) {
      existingPartialMessage.textContent = text;
      if (!isPartial) {
        existingPartialMessage.dataset.partial = 'false';
      }
    } else {
      const messageDiv = this.addAgentMessage(text, agent);
      messageDiv.dataset.partial = isPartial ? 'true' : 'false';
    }
    this.scrollToBottom();
  }

  addSystemMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message system-message';
    messageDiv.textContent = text;
    this.messagesContainer.appendChild(messageDiv);
    this.scrollToBottom();
  }

  addThinkingIndicator() {
    // Remove any existing thinking indicators
    this.removeThinkingIndicator();
    
    // Add new thinking indicator
    const thinkingDiv = document.createElement('div');
    thinkingDiv.className = 'message agent-message thinking-message';
    
    const loadingSpan = document.createElement('span');
    loadingSpan.className = 'loading';
    thinkingDiv.appendChild(loadingSpan);
    
    const textSpan = document.createElement('span');
    textSpan.textContent = 'Thinking...';
    thinkingDiv.appendChild(textSpan);
    
    this.messagesContainer.appendChild(thinkingDiv);
    this.scrollToBottom();
  }

  removeThinkingIndicator() {
    const thinkingMessage = this.messagesContainer.querySelector('.thinking-message');
    if (thinkingMessage) {
      thinkingMessage.remove();
    }
  }

  updateSessionInfo() {
    if (!this.currentSession) return;
    
    this.sessionDetails.innerHTML = `
      <p><strong>Session ID:</strong> ${this.currentSession.id}</p>
      <p><strong>User ID:</strong> ${this.currentSession.userId}</p>
    `;
  }

  updateAgentInfo() {
    if (!this.selectedAgent) return;
    
    this.agentDetails.innerHTML = `
      <p><strong>Agent:</strong> ${this.selectedAgent.name}</p>
    `;
  }

  clearMessages() {
    this.messagesContainer.innerHTML = '';
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  showError(message) {
    console.error(message);
    this.addSystemMessage(`Error: ${message}`);
  }
}

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  new AdkChatApp();
}); 