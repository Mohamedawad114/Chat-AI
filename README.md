# 🎨 Chat AI Frontend

A modern real-time chat frontend built with **React (Vite)**, designed to deliver a smooth, responsive, and interactive chat experience similar to AI chat applications.

It focuses on **real-time communication, clean UI/UX, authentication flow, and scalable frontend architecture**.

---

## 🚀 Key Features

### 💬 Real-time Chat Experience
- Instant messaging using Socket.IO
- Live streaming responses from the backend
- Typing indicators for better UX
- Auto-scroll to latest messages

---

### 🔐 Authentication System
- Login / Signup functionality
- JWT authentication (Access + Refresh Token)
- Automatic silent token refresh
- Persistent login using localStorage

---

### 🧠 Chat Management
- Multiple conversations support
- Load previous chat history
- Pagination for messages
- Separation between user and assistant messages

---

### 🎨 Modern UI / UX
- Clean and minimal chat interface
- Responsive design for all devices
- Sidebar for conversation navigation
- Smooth transitions and animations

---

## 🌙 Dark Mode System

This project includes a fully functional **Dark / Light Mode system**.

### ✨ Features:
- Toggle between Dark and Light themes
- Global theme state using `data-theme` attribute
- CSS variables for dynamic theming
- Smooth transitions between themes
- Persistent UI experience across sessions

### 🧠 How it works:
- Theme is stored in React state
- Applied globally using:
```js
document.documentElement.setAttribute("data-theme", theme);
