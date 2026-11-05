# 🌿 Kindred — Server

<p align="center">
  <img src="https://img.shields.io/badge/Kindred-Backend%20API-647e65?style=for-the-badge" alt="Kindred Backend" />
  <img src="https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-Framework-black?style=for-the-badge&logo=express" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/TypeScript-Type%20Safe-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

<p align="center">
  <b>Powering meaningful connections.</b>
  <br />
  The REST API behind Kindred's community events and volunteering platform.
</p>

---

## 💚 About

Kindred Server provides the backend services for the Kindred platform.

Built with Express, TypeScript, and MongoDB, it handles event management, user authentication, and community participation.

## Related Repository

- **Kindred Client:** [View the Client Repository](https://github.com/fahiyahedayet/kindred-client)

## ✨ Features

- 📅 **Event Management** — Create, retrieve, update, and delete events.
- 🔎 **Event Discovery** — Search and filter community events.
- 🌱 **Upcoming Events** — Retrieve future events with pagination or limits.
- 🤝 **Event Participation** — Join and leave community events.
- 👤 **User-Specific Events** — Retrieve created and joined events.
- 🔐 **Protected Routes** — Authentication for user-specific actions.
- 🗄️ **MongoDB Integration** — Persistent data storage.
- 🛡️ **Authentication** — Better Auth integration.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | REST API framework |
| TypeScript | Type safety |
| MongoDB | Database |
| Better Auth | Authentication |
| dotenv | Environment configuration |

## 🚀 Getting Started

### Prerequisites

- Node.js
- npm
- Git
- MongoDB Atlas or a local MongoDB instance

### Installation

```bash
git clone https://github.com/fahiyahedayet/kindred-server.git
cd kindred-server
npm install
```

### Environment Variables

Create a `.env` file in the server root:

```env
PORT=5000
NODE_ENV=development

CLIENT_URL=http://localhost:3000

BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=your_secret_key_at_least_32_characters

MONGODB_URI=your_mongodb_connection_string
```

Replace the placeholder values with your actual configuration.

> ⚠️ Never commit your `.env` file, database credentials, or authentication secrets to GitHub.

### Start Development

```bash
npm run dev
```

The server runs at:

[http://localhost:5000](http://localhost:5000)

### Production Build

```bash
npm run build
npm start
```

## 📡 API Endpoints

Base URL:

```text
http://localhost:5000/api
```

### Events

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/events` | Retrieve events |
| `POST` | `/events` | Create an event |
| `GET` | `/events/:id` | Retrieve event details |
| `PUT` | `/events/:id` | Update an event |
| `DELETE` | `/events/:id` | Delete an event |
| `POST` | `/events/:id/join` | Join an event |
| `DELETE` | `/events/:id/leave` | Leave an event |
| `GET` | `/events/:id/join-status` | Check participation status |
| `GET` | `/events/joined` | Retrieve joined events |
| `GET` | `/events/my-events` | Retrieve events created by the user |

### Query Parameters

The events endpoint supports:

| Parameter | Description |
|---|---|
| `search` | Search events |
| `category` | Filter by category |
| `upcoming=true` | Retrieve upcoming events |
| `limit` | Limit the number of results |

Example:

```http
GET /api/events?upcoming=true&limit=6
```

Some endpoints require an authenticated user.

## 📂 Project Structure

```text
server/
├── src/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── utils/
│   ├── config/
│   ├── app.ts
│   └── server.ts
├── .env
├── package.json
├── tsconfig.json
└── README.md
```

## 🗄️ Database

Kindred uses MongoDB to store event and user-related data.

The database connection is configured through `MONGODB_URI`.

## 🔐 Authentication

Better Auth manages authentication and user sessions.

Protected endpoints require a valid authenticated session.

## 🌍 Deployment

The backend can be deployed to a Node.js hosting platform.

Configure the following environment variables in your deployment settings:

- `PORT`
- `NODE_ENV`
- `CLIENT_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `MONGODB_URI`

Make sure the deployed client URL is allowed by the server's CORS configuration.

---
