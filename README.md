# LeetNode

LeetNode is a full-stack social platform for LeetCode users. It allows developers to view coding profiles, track problem-solving activity, browse recent submissions, and interact through comments.

## Live Demo

```text
https://leetnode-nine.vercel.app/
```

## Features

* GitHub OAuth authentication
* Public LeetCode profile pages
* Solved problem statistics
* Difficulty breakdowns
* Submission activity heatmap
* Recent submission history
* Attempt and retry insights
* LeetCode badge display
* Social submission feed
* Commenting on submissions
* User search

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Node.js
* Express
* MongoDB
* Mongoose
* Express Session
* Connect Mongo

### Integrations

* GitHub OAuth
* LeetCode data APIs
* MongoDB Atlas

## Project Structure

```text
LeetNode/
├── docs/
├── src/
│   ├── backend/
│   └── frontend/
└── README.md
```

## Running Locally

### Prerequisites

Make sure you have the following installed:

* Node.js
* npm
* MongoDB or a MongoDB Atlas account
* A GitHub OAuth application

### Clone the Repository

```bash
git clone https://github.com/oliveiramnando/LeetNode.git
cd LeetNode
```

## Backend Setup

Navigate to the backend directory:

```bash
cd src/backend
npm install
```

Create a `.env` file:

```env
PORT=8080
NODE_ENV=development

MONGODB_URI=your_mongodb_connection_string
SESSION_SECRET=your_session_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=http://localhost:8080/api/auth/github/callback

FRONTEND_URL=http://localhost:3000
```

Start the backend:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:8080
```

## Frontend Setup

Navigate to the frontend directory:

```bash
cd src/frontend
npm install
```

Create a `.env` file:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
```

Start the frontend:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:3000
```

## GitHub OAuth Setup

Create a GitHub OAuth application with the following local development settings:

```text
Homepage URL:
http://localhost:3000

Authorization callback URL:
http://localhost:8080/api/auth/github/callback
```

A separate GitHub OAuth application is recommended for production.

## Authentication

LeetNode uses GitHub OAuth and server-side sessions.

Authenticated frontend requests must include credentials:

```ts
fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
  credentials: "include",
});
```

## Deployment

LeetNode uses separate frontend and backend deployments.

* The frontend hosts the Next.js application.
* The backend manages authentication, sessions, database operations, and LeetCode data.
* MongoDB Atlas stores user, submission, comment, and session data.

Production deployments require updated environment variables, OAuth callback URLs, CORS settings, and secure cookie configuration.

## Future Improvements

* Notifications
* Improved social functionality
* Additional profile analytics
* Submission filtering
* Automated testing
* Performance improvements
* Browser extension synchronization

## Disclaimer

LeetNode is an independent project and is not affiliated with, endorsed by,
or sponsored by LeetCode. LeetCode and its associated trademarks are the
property of their respective owners.

## Author

**Fernando Oliveira**

Software engineer focused on backend systems, full-stack development, APIs, authentication, and infrastructure.
