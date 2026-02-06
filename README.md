# CollabWrite

CollabWrite is a real-time collaborative writing web application that allows multiple users to edit a document simultaneously.

## Features

*   **Real-time Collaboration:** See changes from other users in real-time.
*   **User Authentication:** Secure user registration and login system.
*   **Document Management:** Create, share, and manage your documents.
*   **Rich Text Editing:** A simple and intuitive editor for formatting your text.

## Tech Stack

**Client:**

*   React
*   Vite
*   Socket.IO Client
*   CSS

**Server:**

*   Node.js
*   Express.js
*   Socket.IO
*   MongoDB (with Mongoose)

## Getting Started

To get a local copy up and running follow these simple example steps.

### Prerequisites

*   Node.js and npm
*   MongoDB

### Installation

1.  **Clone the repo**
    ```sh
    git clone https://github.com/your_username_/CollabWrite.git
    ```
2.  **Install server dependencies**
    ```sh
    cd server
    npm install
    ```
3.  **Install client dependencies**
    ```sh
    cd ../client
    npm install
    ```

### Running the application

1.  **Start the server**
    ```sh
    cd server
    npm start
    ```
    The server will start on `http://localhost:5000`

2.  **Start the client**
    ```sh
    cd client
    npm run dev
    ```
    The client will be available on `http://localhost:5173`

## Folder Structure

```
CollabWrite/
├── client/         # Frontend React application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── context/    # React contexts
│   │   ├── pages/      # Application pages
│   │   └── utils/      # Utility functions
├── server/         # Backend Node.js application
│   ├── models/       # Mongoose models
│   └── routes/       # Express routes
└── README.md
```

## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
