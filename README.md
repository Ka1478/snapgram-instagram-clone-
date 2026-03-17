# 📸 Snapgram

> A full-stack Instagram-inspired social media app built with React, Node.js, MongoDB, Socket.io, and Cloudinary.

![Snapgram Banner](https://placehold.co/1200x400/1a1a2e/ffffff?text=Snapgram+%7C+Share+Your+World)

---

## ✨ Features

- 🔐 **Authentication** — JWT with HTTP-only cookies (register, login, logout)
- 🖼️ **Posts** — Upload photos with captions, like, comment, save, and delete
- 👤 **Profiles** — Avatar, bio, website, follower/following counts, post grid
- 🔔 **Real-time Notifications** — Likes, comments, follows via Socket.io
- 💬 **Real-time Chat** — Direct messaging with typing indicators and read receipts
- 🌍 **Explore** — Discover posts + search users
- 🌙 **Dark / Light Mode** — Persisted theme toggle
- 📱 **Fully Responsive** — Mobile bottom nav, desktop sidebar
- ⚡ **Performance** — Lazy-loaded pages, optimized image delivery via Cloudinary

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| State | Zustand |
| Routing | React Router v6 |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose |
| Auth | JWT + Cookies |
| Images | Cloudinary |
| Real-time | Socket.io |
| Toasts | React Hot Toast |

---

## 📁 Project Structure

```
snapgram/
├── backend/
│   ├── config/
│   │   └── cloudinary.js          # Cloudinary configuration
│   ├── controllers/
│   │   ├── auth.controller.js     # Register, login, logout, getMe
│   │   ├── user.controller.js     # Profile, follow/unfollow, search
│   │   ├── post.controller.js     # CRUD posts, like, comment, save
│   │   ├── message.controller.js  # Conversations, send messages
│   │   └── notification.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT protect middleware
│   │   └── upload.middleware.js   # Multer + Cloudinary storage
│   ├── models/
│   │   ├── user.model.js
│   │   ├── post.model.js
│   │   ├── message.model.js
│   │   └── notification.model.js
│   ├── routes/
│   │   ├── auth.route.js
│   │   ├── user.route.js
│   │   ├── post.route.js
│   │   ├── message.route.js
│   │   └── notification.route.js
│   ├── socket/
│   │   └── socket.js              # Socket.io event handlers
│   ├── utils/
│   │   └── token.js               # JWT token generator
│   ├── .env.example
│   ├── index.js                   # Entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── MainLayout.jsx  # Sidebar + BottomNav wrapper
    │   │   │   ├── Sidebar.jsx     # Desktop navigation
    │   │   │   └── BottomNav.jsx   # Mobile navigation
    │   │   ├── post/
    │   │   │   ├── PostCard.jsx    # Full post with like/comment
    │   │   │   ├── CreatePostModal.jsx
    │   │   │   └── StoryBar.jsx
    │   │   ├── profile/
    │   │   │   ├── ProfileHeader.jsx
    │   │   │   ├── FollowButton.jsx
    │   │   │   └── SuggestedUsers.jsx
    │   │   ├── chat/
    │   │   │   └── ChatWindow.jsx  # Real-time chat with typing
    │   │   └── ui/
    │   │       └── LoadingSpinner.jsx
    │   ├── context/
    │   │   ├── authStore.js        # Zustand auth store
    │   │   ├── SocketContext.jsx   # Socket.io provider
    │   │   └── ThemeContext.jsx    # Dark/light theme
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── HomePage.jsx        # Feed + stories + suggestions
    │   │   ├── ExplorePage.jsx     # Grid + search
    │   │   ├── ProfilePage.jsx
    │   │   ├── PostDetailPage.jsx
    │   │   ├── MessagesPage.jsx
    │   │   └── NotificationsPage.jsx
    │   ├── utils/
    │   │   └── api.js              # Axios instance with interceptors
    │   ├── App.jsx                 # Routes + providers
    │   ├── main.jsx
    │   └── index.css               # Tailwind + custom styles
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## 🚀 Setup & Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- [Cloudinary](https://cloudinary.com) account (free tier works)

---

### 1. Clone & Install

```bash
# Clone the repository
git clone https://github.com/yourname/snapgram.git
cd snapgram

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

---

### 2. Environment Variables

**Backend** — Copy `.env.example` to `.env` and fill in:

```bash
cd backend
cp .env.example .env
```

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/snapgram
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Get these from cloudinary.com → Dashboard
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Frontend** — Create `.env` in the frontend folder:

```env
VITE_API_URL=http://localhost:5000/api
```

---

### 3. Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com) (free)
2. Go to Dashboard → copy **Cloud Name**, **API Key**, **API Secret**
3. Paste into your backend `.env`

---

### 4. Run the App

```bash
# Terminal 1 — Backend (from /backend)
npm run dev
# → Server running on http://localhost:5000

# Terminal 2 — Frontend (from /frontend)
npm run dev
# → App running on http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🔌 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:username` | Get profile |
| PUT | `/api/users/profile/update` | Update profile + avatar |
| POST | `/api/users/:userId/follow` | Follow / unfollow |
| GET | `/api/users/suggested` | Suggested users |
| GET | `/api/users/search?q=` | Search users |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts/feed` | Home feed (paginated) |
| GET | `/api/posts/explore` | Explore posts |
| POST | `/api/posts` | Create post (multipart) |
| GET | `/api/posts/:postId` | Get single post |
| DELETE | `/api/posts/:postId` | Delete post |
| POST | `/api/posts/:postId/like` | Like / unlike |
| POST | `/api/posts/:postId/save` | Save / unsave |
| POST | `/api/posts/:postId/comments` | Add comment |
| DELETE | `/api/posts/:postId/comments/:commentId` | Delete comment |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/conversations` | Get all conversations |
| GET | `/api/messages/:userId` | Get messages with user |
| POST | `/api/messages/:userId` | Send message |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get notifications |
| GET | `/api/notifications/unread/count` | Unread count |
| PUT | `/api/notifications/read-all` | Mark all read |

---

## 🔄 Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `onlineUsers` | Server → Client | `string[]` of user IDs |
| `newMessage` | Server → Client | Message object |
| `notification` | Server → Client | Notification object |
| `typing` | Client → Server | `{ receiverId }` |
| `stopTyping` | Client → Server | `{ receiverId }` |

---

## 🎨 UI Customization

### Snapgram Gradient
The brand gradient (`#f09433` → `#bc1888`) is available as Tailwind utilities:
- `.snapgram-gradient` — background gradient
- `.snapgram-gradient-text` — gradient text
- `.story-ring` — story ring around avatars

### Theme
Dark/light mode is toggled via the `ThemeContext` and persisted in `localStorage`. The `dark` class is applied to `<html>` and Tailwind's `darkMode: 'class'` handles the rest.

---

## 🚢 Deployment

### Backend (Railway / Render / Heroku)
1. Set all environment variables in the platform
2. Set `NODE_ENV=production`
3. Set `CLIENT_URL` to your frontend URL

### Frontend (Vercel / Netlify)
1. Set `VITE_API_URL` to your backend URL
2. Update `vite.config.js` proxy → remove (not needed in production)
3. Build: `npm run build` → deploy `/dist`

---

## 📝 License

MIT © 2024 Snapgram
#   s n a p g r a m  
 