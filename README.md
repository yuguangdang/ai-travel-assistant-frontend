## Overview

This project showcases an AI assistant chat application that supports three communication methods: standard HTTP, Server-Sent Events (SSE), and WebSocket with streaming capabilities. The frontend dynamically connects to two Flask servers based on the chosen communication method. These Flask servers interface with an OpenAI-powered travel assistant, capable of automating various travel inquiries, such as searching flight schedules and checking visa requirements. To enhance AI responses, the system employs Retrieval-Augmented Generation (RAG). Additionally, the application integrates with an external chat system, providing users with a seamless experience when interacting with both AI travel assistants and human consultants.

## Architecture
<img width="882" height="662" alt="intro-m" src="https://github.com/yuguangdang/ai-travel-assistant-frontend/assets/55920971/32ec8ed4-f30a-43d7-8d72-cbde5081475d">


## Features

- **Chat with AI Assistant using WebSocket:** Real-time communication with AI assistant using WebSocket for instant responses.
- **Chat with AI Assistant using REST:** Communicate with AI assistant through REST API.
- **Chat with AI Assistant using SSE:** Use Server-Sent Events for real-time communication with AI assistant.
- **Switch between AI Assistant and Human Consultant:** The application can switch between chatting with an AI assistant and a human consultant based on the conversation context.


### Communication Flow

1. **Initialization:** When the chat application is loaded, it initializes the chat session by sending a request to the backend (`POST /init`).

2. **Sending Messages:**
   - **WebSocket:** Messages are sent and received in real-time using a persistent WebSocket connection.
   - **REST:** Messages are sent via HTTP POST requests, and responses are received as HTTP responses.
   - **SSE:** Messages are sent via HTTP POST requests, and responses are streamed in real-time using SSE.

3. **Receiving Messages:**
   - **WebSocket:** Messages from the AI assistant are received instantly through the WebSocket connection.
   - **REST:** Responses from the AI assistant are received as part of the HTTP response to the POST request.
   - **SSE:** Responses from the AI assistant are received as a continuous stream of events, allowing real-time updates.

4. **Switching to Human Consultant:** During the conversation, if the AI travel assistant thinks the client needs to talk to a consultant, it will open a tab for talking to a consultant. This is managed by the backend, which provides the necessary endpoints and real-time communication channels. Once, the chat is picked by a consultant, the user can switch between chatting with AI and chatting with the consultant at any point. 

<img width="800" height="700" alt="intro-m" src="https://github.com/user-attachments/assets/2346b0c9-be4c-4b43-b648-b2917b7bfebb">
<div>
   <img width="400" height="650" alt="intro-m" src="https://github.com/yuguangdang/ai-travel-assistant-frontend/assets/55920971/72757398-f3bf-4155-bc7a-fa14f5255294">
   <img width="400" height="650" alt="intro-m" src="https://github.com/yuguangdang/ai-travel-assistant-frontend/assets/55920971/597ed74e-2908-44c2-b899-961f6a2fb64c">
</div>

### State Management and UI Updates

- **State Management:** The application uses React's `useState` and `useEffect` hooks to manage the state of messages, listening status, and active tabs.
- **UI Updates:** The chat interface is dynamically updated based on the state changes, ensuring a seamless user experience. The application scrolls to the bottom of the chat view whenever new messages are added, providing a smooth scrolling experience.

### Speech Recognition

The application includes speech recognition functionality using the Web Speech API. Users can toggle the microphone to enable or disable speech input, providing a hands-free chat experience.

