# Vexor - On-Demand Content Delivery System

A comprehensive full-stack streaming platform(SaaS) built to stream media files (Movies and TV Shows) directly from Telegram's servers to a user-friendly React web interface.

The project is divided into two primary components: **Stream-Backend** (FastAPI + Pyrogram) and **Stream-Frontend** (React + Vite + Firebase).

---

## 🏗 Code Structure

```text
Stream-master/
├── Stream-Backend/         # The backend server & Telegram Bot
│   ├── Backend/
│   │   ├── fastapi/        # FastAPI web server and API endpoints
│   │   │   └── main.py     # Main API router, serves metadata and streams media
│   │   ├── pyrofork/       # Pyrogram (fork) for interacting with Telegram API
│   │   │   └── plugins/    # Bot commands and event handlers
│   │   ├── helper/         # Utilities for encryption, decryption, and byte streaming
│   │   ├── logger.py       # Centralized logging configuration
│   │   ├── config.py       # Configuration and Environment variable management
│   │   └── __main__.py     # Backend entry point, initializes DB, Bot, and FastAPI
│   ├── requirements.txt    # Python dependencies
│   └── update.py           # Deployment/updater script
│
└── Stream-Frontend/        # The frontend Single Page Application (SPA)
    ├── src/
    │   ├── assets/         # Static assets like images and SVGs
    │   ├── components/     # Reusable React components (Nav, Footer, PrivateRoute)
    │   ├── context/        # React Context (AuthContext for user state)
    │   ├── pages/          # Full page views (Home, MovieDetails, TvDetails, Login, etc.)
    │   ├── App.jsx         # App routing and layout configuration
    │   ├── main.jsx        # Frontend entry point
    │   ├── index.css       # Tailwind directives and global styles
    │   └── firebase.jsx    # Firebase initialization for user authentication
    ├── package.json        # Node.js dependencies and scripts
    ├── tailwind.config.mjs # Tailwind CSS configuration
    └── vite.config.js      # Vite build configuration
```

---

## 🧠 Basic Logic & Workflow

### 1. The Telegram Bot & Media Storage (Backend/pyrofork)
To save on traditional server storage costs, large media files (movies and TV episodes) are uploaded directly to Telegram channels. The bot uses a Pyrogram fork (`pyrofork`) to act as a Telegram client. When a file is uploaded to the designated channel, the bot generates a unique, encrypted `hash` and `msg_id` for that file, which is then stored in a database alongside its TMDB metadata (Title, Rating, Cast, etc.).

### 2. The API Server & Media Streamer (Backend/fastapi)
The backend runs a **FastAPI** web server alongside the Telegram bot. 
- **Metadata Endpoints**: It exposes RESTful APIs (e.g., `/api/movies`, `/api/tvshows`, `/api/search/`) which pull paginated TMDB metadata directly from the database.
- **The Streamer (`/dl/{id}/{name}`)**: When the user requests to watch a video, the frontend calls the download endpoint. The backend decodes the requested `id` to extract the Telegram `msg_id` and `chat_id`. It then uses a custom `ByteStreamer` class to request chunks of the file directly from Telegram's servers and proxies those byte chunks back to the client using an HTTP `StreamingResponse`. This supports HTTP `Range` headers, meaning users can seamlessly seek (skip forward/backward) through the video.

### 3. The User Interface (Stream-Frontend)
The frontend is a modern **React** application built with **Vite** and styled using **Tailwind CSS**.
- **Authentication**: It enforces user sign-in using **Firebase Authentication**. Access to streaming pages and media lists is protected by a `PrivateRoute` wrapper.
- **Content Browsing**: Users can browse the latest movies and TV shows, view detailed metadata, and search for specific titles.
- **Playback**: Once a user clicks play, the frontend renders an HTML5 `<video>` player (or a specialized player component) whose `src` points to the FastAPI streaming endpoint.
- **Premium Features**: The platform incorporates a premium subscription model (tracked in the MongoDB database via the backend `/check-premium` routes), preventing unauthorized or expired users from accessing premium tokens or direct Stremio integration.

### Summary
1. File uploaded to Telegram.
2. Metadata and Telegram Message ID stored in the Database.
3. User logs into the React Frontend via Firebase.
4. React queries FastAPI for Movie/TV metadata.
5. User clicks play; FastAPI seamlessly streams the file chunks from Telegram directly to the user's browser.
