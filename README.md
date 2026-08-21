# 📸 Snapgram — Instagram Clone

A full-stack social media web application inspired by Instagram, built with the MERN stack, real-time features via Socket.io, and AI-powered caption generation using Groq API.

---

## 🌐 Live Demo

🔗 [https://cheery-stroopwafel-de0527.netlify.app](https://cheery-stroopwafel-de0527.netlify.app)

---

## 🚀 What the Project Does

Snapgram is a feature-rich social media platform where users can share photos, reels, and stories, chat in real time, follow other users, and use AI to generate captions for their posts. It also includes group chats with AI assistance and a quiz battle game mode.

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| Tailwind CSS | Styling |
| Zustand | State management |
| React Router v6 | Client-side routing |
| Socket.io Client | Real-time communication |
| Axios | HTTP requests |
| React Hot Toast | Notifications |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | Server framework |
| MongoDB + Mongoose | Database |
| Socket.io | Real-time messaging and notifications |
| JWT + Cookies | Authentication |
| Cloudinary | Image and video storage |
| Nodemailer | Email (password reset) |
| Groq SDK | AI caption generation and quiz |

---

## ✨ Main Features

### 👤 Authentication
- Register and login with email/password
- JWT-based authentication with HTTP-only cookies
- Forgot password and reset password via email

### 📸 Posts & Feed
- Create posts with image uploads (via Cloudinary)
- Like, comment, and save posts
- Explore page with trending posts and hashtags
- Hashtag pages

### 🤖 AI Features (Powered by Groq — qwen3.6-27b)
- **AI Caption Generator** — upload an image and get captions in 5 styles: Casual, Professional, Funny, Inspirational, Minimal
- **Caption Ideas** — generate 3 caption variations at once
- **Group AI Assistant** — ask AI questions in group chats, supports images and PDFs
- **AI MCQ Generator** — generate quiz questions on any topic for group learning
- **Quiz Battle** — challenge group members to a live quiz battle

### 💬 Messaging
- Real-time direct messaging with Socket.io
- Typing indicators
- Online/offline status

### 👥 Group Chats
- Create groups with multiple members
- Send messages in groups
- AI assistant available inside groups
- MCQ quiz generation for group study

### 📱 Stories & Reels
- Upload and view 24-hour stories
- Create and browse reels (short videos)

### 🔔 Notifications
- Real-time notifications for likes, comments, follows

### 📹 Video Calling
- WebRTC-based peer-to-peer video calling
- Incoming call UI with accept/reject

### 🌙 Theme
- Light and dark mode toggle

---

## 📁 Project Structure

```
snapgram/
├── frontend/
│   ├── public/                         # Static assets (icons, images)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.jsx      # Root layout with sidebar + outlet for pages
│   │   │   │   ├── Sidebar.jsx         # Left navigation sidebar with links
│   │   │   │   └── Navbar.jsx          # Top navigation bar
│   │   │   └── ui/
│   │   │       └── LoadingSpinner.jsx  # Reusable loading spinner component
│   │   ├── context/
│   │   │   ├── authStore.js            # Zustand store — login, logout, register, getMe
│   │   │   ├── SocketContext.jsx       # Socket.io connection provider for real-time events
│   │   │   └── ThemeContext.jsx        # Light/dark mode toggle context
│   │   ├── pages/
│   │   │   ├── HomePage.jsx            # Main feed showing posts from followed users
│   │   │   ├── ExplorePage.jsx         # Discover trending posts, users, and hashtags
│   │   │   ├── ProfilePage.jsx         # User profile with posts, followers, following
│   │   │   ├── EditProfilePage.jsx     # Edit username, bio, avatar, and account info
│   │   │   ├── PostDetailPage.jsx      # Single post view with comments
│   │   │   ├── MessagesPage.jsx        # Direct messaging with real-time chat
│   │   │   ├── NotificationsPage.jsx   # Likes, comments, and follow notifications
│   │   │   ├── ReelsPage.jsx           # Short video reels feed
│   │   │   ├── HashtagPage.jsx         # Posts filtered by a specific hashtag
│   │   │   ├── GroupChatPage.jsx       # Group chat with AI assistant and MCQ quiz
│   │   │   ├── LoginPage.jsx           # Login form with email and password
│   │   │   ├── RegisterPage.jsx        # New user registration form
│   │   │   ├── ForgotPasswordPage.jsx  # Request password reset email
│   │   │   └── ResetPasswordPage.jsx   # Reset password using token from email
│   │   ├── utils/
│   │   │   └── api.js                  # Axios instance with baseURL and credentials
│   │   ├── App.jsx                     # Root component with all routes defined
│   │   └── main.jsx                    # React entry point — mounts App to DOM
│   ├── index.html                      # HTML shell loaded by Vite
│   ├── vite.config.js                  # Vite build configuration
│   └── package.json                    # Frontend dependencies and scripts
│
├── backend/
│   ├── controllers/
│   │   ├── auth.controller.js          # Register, login, logout, forgot/reset password
│   │   ├── user.controller.js          # Follow/unfollow, search users, update profile
│   │   ├── post.controller.js          # Create, delete, like, comment, save posts
│   │   ├── message.controller.js       # Send and fetch direct messages between users
│   │   ├── story.controller.js         # Upload, view, and delete 24-hour stories
│   │   ├── reel.controller.js          # Upload, fetch, and like short video reels
│   │   ├── notification.controller.js  # Create and fetch user notifications
│   │   ├── hashtag.controller.js       # Track and fetch posts by hashtag
│   │   ├── groupChat.controller.js     # Group creation, messaging, AI assistant, MCQ
│   │   ├── quizBattle.controller.js    # Start, join, and submit answers in quiz battles
│   │   └── ai.controller.js            # Groq AI caption generation and caption ideas
│   ├── models/
│   │   ├── user.model.js               # User schema — name, email, password, avatar, bio
│   │   ├── post.model.js               # Post schema — image, caption, likes, comments
│   │   ├── message.model.js            # Direct message schema — sender, receiver, text
│   │   ├── story.model.js              # Story schema — media, expiry time, views
│   │   ├── reel.model.js               # Reel schema — video URL, caption, likes
│   │   ├── notification.model.js       # Notification schema — type, sender, receiver
│   │   ├── groupChat.model.js          # Group schema — name, members, messages, MCQs
│   │   └── quizBattle.model.js         # Quiz battle schema — questions, answers, winner
│   ├── routes/
│   │   ├── auth.route.js               # /api/auth — login, register, reset password
│   │   ├── user.route.js               # /api/users — profile, follow, search
│   │   ├── post.route.js               # /api/posts — CRUD, likes, comments
│   │   ├── message.route.js            # /api/messages — send and get messages
│   │   ├── story.route.js              # /api/stories — upload and view stories
│   │   ├── reel.route.js               # /api/reels — upload and browse reels
│   │   ├── notification.route.js       # /api/notifications — fetch notifications
│   │   ├── hashtag.route.js            # /api/hashtags — posts by hashtag
│   │   ├── groupChat.route.js          # /api/groups — group chat and AI features
│   │   ├── quizBattle.route.js         # /api/quiz — quiz battle game endpoints
│   │   └── ai.route.js                 # /api/ai — caption generation endpoints
│   ├── middleware/
│   │   └── auth.middleware.js          # Verifies JWT token and attaches user to request
│   ├── utils/
│   │   └── token.js                    # Generates JWT and sets it as HTTP-only cookie
│   ├── index.js                        # Express app setup, Socket.io, MongoDB connect
│   └── package.json                    # Backend dependencies and scripts
│
└── README.md                           # Project documentation
```

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account
- Groq API key (free at [console.groq.com](https://console.groq.com))

### 1. Clone the Repository
```bash
git clone https://github.com/Ka1478/snapgram-instagram-clone-.git
cd snapgram-instagram-clone-
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (for password reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Groq AI
GROQ_API_KEY=your_groq_api_key
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
```

### 4. Open in Browser
```
http://localhost:5173
```

---

## 🔐 Environment Variables Summary

| Variable | Where | Description |
|---|---|---|
| `PORT` | Backend | Server port (default 5000) |
| `MONGODB_URI` | Backend | MongoDB Atlas connection string |
| `JWT_SECRET` | Backend | Secret key for JWT tokens |
| `CLIENT_URL` | Backend | Frontend URL for CORS |
| `CLOUDINARY_*` | Backend | Cloudinary credentials |
| `EMAIL_USER` | Backend | Gmail address for sending emails |
| `EMAIL_PASS` | Backend | Gmail app password |
| `GROQ_API_KEY` | Backend | Groq API key for AI features |
| `VITE_API_URL` | Frontend | Backend API base URL |

---

## 👩‍💻 Author

**Ka1478** — [GitHub](https://github.com/Ka1478)

---

## 📄 License

This project is for educational purposes.