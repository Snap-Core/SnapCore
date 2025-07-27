# SnapCore

SnapCore is a social media-inspired web application themed around Mastodon, Instagram, and TikTok (MastoInstaTok), designed to demonstrate the use of non-relational databases. The project is built with a TypeScript backend (Node.js/Express) and a TypeScript-based web frontend framework React. **No SQL/relational databases are used**—all data is managed with scalable, modern NoSQL solutions.

## Features

- User registration and authentication
- Posting images, videos, and short messages
- Feed/timeline displaying recent posts
- Like and comment functionality
- Explore trending content

## Tech Stack

- **Backend:** TypeScript (Node.js/Express)
- **Frontend:** TypeScript (React)
- **Databases:** Non-relational only (e.g., MongoDB Atlas, DynamoDB, Redis, etc.)

## Database Choices

- **MongoDB (Document Store):** For storing user profiles, posts, and comments
- **Neo4j (Graphs):** For storing users, follower/following and likes
- **AWS S3 (Object storage):** For storing media files (images/possible video, sticker and GIF implementation)

## How to Run


### Backend

1. Clone the repository:
    ```sh
    git clone https://github.com/Snap-Core/SnapCore.git
    cd SnapCore/backend
    ```

2. Install dependencies:
    ```sh
    npm install
    ```

3. Configure environment variables (MongoDB URI, AWS credentials, etc.) in a `.env` file.

4. Start the backend server:
    ```sh
    npm run dev
    ```

### Frontend

  To be immplemented


## Usage

1. Register a new user and log in.
2. Create posts with images or videos.
3. Browse the feed, like, and comment on posts.
4. Explore trending content.

## Notes

- **No SQL/relational databases are used.**
- All services are chosen to minimize costs (free tiers where possible).
- No CSS frameworks are used; all styling is custom.

---

For more details, see the [backend](backend/) directory