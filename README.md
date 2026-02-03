client==frontend folder
server == backend folder
🎙️ Groq Speech-to-Text App
A modern, high-performance web application that converts audio to text using the Groq API. Built with the MERN stack and styled with Tailwind CSS, this app features a sleek dark-themed UI, real-time error handling, and persistent history management via MongoDB.

✨ Features
🎤 Live Recording: Record audio directly from the browser using the MediaStream Recording API.
📂 File Upload: Support for uploading audio files (WebM, MP3, WAV) with validation.
🚀 Fast Transcription: Powered by Groq's Whisper Large v3 model for lightning-fast speech-to-text conversion.
💾 Persistent History: Saves transcriptions securely to MongoDB.
🎨 Dark Mode UI: A modern, responsive interface built with Tailwind CSS featuring glassmorphism effects and animations.
⚠️ Robust Error Handling: Validates file types, sizes, and handles API failures gracefully.
🛠️ Tech Stack
Frontend:
React.js (Vite)
Tailwind CSS
Axios (API requests)
Lucide React (Icons)
Backend:
Node.js & Express.js
Groq SDK (AI Processing)
Multer (File Uploads)
Mongoose (Database ODM)
Database:
MongoDB (Atlas Cloud)
Deployment:
Vercel (Frontend)
Render (Backend)
