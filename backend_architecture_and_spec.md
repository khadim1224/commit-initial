# Backend Architecture and Specifications

This document outlines a proposed backend architecture for the "Génie en Herbe" quiz application. The goal is to create a more structured, scalable, and maintainable backend that aligns with the existing frontend and can accommodate future features like user authentication.

## 1. Current Architecture Analysis

The current backend consists of a single `server.js` file that handles all the application's logic, including:

*   Express server setup
*   Socket.IO connection management
*   Game logic (room creation, joining, starting, etc.)
*   Question management (hardcoded in the `server.js` file)
*   State management (in-memory `rooms` map)

While this approach is suitable for a simple prototype, it has several limitations:

*   **Lack of Scalability:** A single file becomes difficult to manage as the application grows.
*   **Maintainability Issues:** Tightly coupled logic makes it hard to debug and add new features.
*   **No Data Persistence:** Game state is lost when the server restarts.
*   **No User Authentication:** The current implementation does not support user accounts or authentication.

## 2. Proposed Backend Architecture

To address these limitations, I propose a modular, service-oriented architecture. The backend will be organized into distinct services, each responsible for a specific domain.

### 2.1. Directory Structure

```
/backend
├── /src
│   ├── /api
│   │   ├── /auth
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.service.js
│   │   │   └── auth.routes.js
│   │   ├── /game
│   │   │   ├── game.controller.js
│   │   │   ├── game.service.js
│   │   │   └── game.routes.js
│   │   └── /questions
│   │       ├── questions.controller.js
│   │       ├── questions.service.js
│   │       └── questions.routes.js
│   ├── /config
│   │   ├── database.js
│   │   └── index.js
│   ├── /models
│   │   ├── user.model.js
│   │   ├── room.model.js
│   │   └── question.model.js
│   ├── /services
│   │   └── socket.service.js
│   ├── app.js
│   └── server.js
├── package.json
└── .env
```

### 2.2. Core Components

*   **`server.js`**: The main entry point of the application. It will be responsible for starting the Express server and initializing the Socket.IO server.
*   **`app.js`**: This file will contain the Express application configuration, including middleware, routes, and error handling.
*   **`/config`**: This directory will hold configuration files for the database, environment variables, etc.
*   **`/models`**: This directory will contain the data models for the application (e.g., User, Room, Question) using an ORM like Mongoose (for MongoDB) or Sequelize (for SQL databases).
*   **`/api`**: This directory will contain the API routes, controllers, and services for each domain (auth, game, questions).
    *   **`*.routes.js`**: Defines the API endpoints for each module.
    *   **`*.controller.js`**: Handles incoming requests, validates data, and calls the appropriate service.
    *   **`*.service.js`**: Contains the business logic for each module.
*   **`/services/socket.service.js`**: This service will encapsulate all the Socket.IO-related logic, such as connection handling and event emission.

### 2.3. Database

To ensure data persistence, I recommend using a database. Based on the application's needs, a NoSQL database like **MongoDB** would be a good choice due to its flexibility and scalability.

*   **User Collection**: Will store user information, including usernames, hashed passwords, and other profile data.
*   **Room Collection**: Will store the state of each game room, including players, scores, and the current question.
*   **Question Collection**: Will store the quiz questions, options, and correct answers.

## 3. Key Features and Specifications

### 3.1. User Authentication

*   **JWT-based authentication**: We will use JSON Web Tokens (JWT) for secure user authentication.
*   **Endpoints**:
    *   `POST /api/auth/register`: Register a new user.
    *   `POST /api/auth/login`: Log in a user and return a JWT.
    *   `GET /api/auth/me`: Get the current user's profile.

### 3.2. Game Management

*   **Real-time updates via Socket.IO**: All game-related events will be handled in real-time using Socket.IO.
*   **Game state persistence**: The game state will be stored in the database, allowing games to be resumed even if the server restarts.
*   **Socket Events**:
    *   `create-room`: Create a new game room.
    *   `join-room`: Join an existing game room.
    *   `start-game`: Start the game.
    *   And all the other events currently in `server.js`.

### 3.3. Question Management

*   **REST API for questions**: We will create a REST API to manage the questions.
*   **Endpoints**:
    *   `GET /api/questions`: Get all questions.
    *   `POST /api/questions`: Create a new question.
    *   `PUT /api/questions/:id`: Update a question.
    *   `DELETE /api/questions/:id`: Delete a question.

## 4. Implementation Plan

1.  **Set up the new backend project structure.**
2.  **Install necessary dependencies**: `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `socket.io`, etc.
3.  **Implement user authentication.**
4.  **Migrate the game logic from `server.js` to the new `game` module.**
5.  **Implement the question management API.**
6.  **Integrate the new backend with the frontend.**

This new architecture will provide a solid foundation for the "Génie en Herbe" quiz application, making it more robust, scalable, and easier to maintain in the long run.