# 🎓 AI PDF Voice Reader & Virtual Teacher

> An intelligent web application that reads your documents aloud — upload a PDF, DOCX, or PPTX and let the AI teach you.

![Python](https://img.shields.io/badge/Python-3.10+-blue?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)
![Flask](https://img.shields.io/badge/Flask-2.x-black?style=flat-square&logo=flask)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange?style=flat-square&logo=mysql)
![License](https://img.shields.io/badge/License-Educational-green?style=flat-square)

---

## 📌 Overview

**AI PDF Voice Reader** is a full-stack web application designed to act as a **virtual teacher**. Users can upload documents, view them in the browser, and have an AI voice assistant read the content aloud — page by page — with full playback controls.

Built for students, visually impaired users, and self-learners who benefit from audio-assisted reading.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **Multi-format Upload** | Supports PDF, DOCX, and PPTX files |
| 🔄 **Auto Conversion** | DOCX and PPTX are automatically converted to PDF |
| 👀 **In-browser Viewer** | View the document while it's being read |
| 🧠 **Page-wise Text Extraction** | Text extracted per page for accurate sync |
| 🔊 **AI Voice Reading** | Document read aloud using Web Speech Synthesis |
| ⏯ **Full Playback Controls** | Start, Pause, Resume, and Stop |
| 🎙 **Voice Selection** | Choose between Male and Female voices |
| 📖 **Auto Page Scrolling** | PDF auto-advances when a page is fully read |
| 🗄 **Database Storage** | Extracted text stored in MySQL |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                 Frontend (React)             │
│                                             │
│  ┌─────────────┐      ┌──────────────────┐  │
│  │  PDFViewer  │      │ AIVoiceAssistant │  │
│  │  • Upload   │      │  • Speech Synth  │  │
│  │  • Render   │      │  • Controls      │  │
│  │  • Extract  │      │  • Voice Select  │  │
│  └──────┬──────┘      └────────┬─────────┘  │
│         └──────────┬───────────┘            │
│               App.jsx                       │
│           (Shared pdfText state)            │
└───────────────────┬─────────────────────────┘
                    │ HTTP (Axios)
┌───────────────────▼─────────────────────────┐
│                Backend (Flask)               │
│                                             │
│  • Upload API       • PDF Text Extractor    │
│  • File Converter   • MySQL Storage         │
│  • Static File Server                       │
└─────────────────────────────────────────────┘
```

---

## 🧑‍💻 Tech Stack

### Frontend
- **React 18** — UI framework
- **Axios** — HTTP requests
- **Web Speech API** — Browser-native voice synthesis
- **CSS3** — Styling

### Backend
- **Python / Flask** — REST API server
- **pdfplumber** — PDF text extraction
- **docx2pdf** — DOCX to PDF conversion
- **python-pptx** — PPTX to PDF conversion
- **Flask-CORS** — Cross-origin support
- **mysql-connector-python** — Database layer

### Database
- **MySQL 8.0** — Stores document names and extracted text

---

## 📂 Project Structure

```
ai-pdf-reader/
│
├── backend/
│   ├── app.py                  # Flask application entry point
│   ├── requirements.txt        # Python dependencies
│   └── uploads/                # Uploaded & converted files (auto-created)
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx             # Root component & shared state
│   │   ├── PDFViewer.jsx       # Upload, render, and extract PDF text
│   │   ├── PDFViewer.css
│   │   ├── AIVoiceAssistant.jsx # Voice reading & playback controls
│   │   └── AIVoiceAssistant.css
│   └── package.json
│
└── README.md
```

---

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+
- Python 3.10+
- MySQL 8.0+

---

### 1️⃣ Database Setup

Open your MySQL client and run:

```sql
CREATE DATABASE ai_teacher;

USE ai_teacher;

CREATE TABLE pdf_knowledge (
  id        INT AUTO_INCREMENT PRIMARY KEY,
  pdf_name  VARCHAR(255),
  content   LONGTEXT
);
```

---

### 2️⃣ Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the Flask server
python app.py
```

> Backend runs at **http://127.0.0.1:5000**

---

### 3️⃣ Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the React app
npm start
```

> Frontend runs at **http://localhost:3000**

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/upload` | Upload a PDF / DOCX / PPTX file |
| `GET` | `/pdf/<filename>` | Serve the converted PDF file |
| `GET` | `/pdf_text_pages` | Get page-wise extracted text |
| `GET` | `/explain_pdf` | AI summary of document *(optional)* |

---

## 🎯 How It Works

```
1. User uploads a document (PDF / DOCX / PPTX)
        ↓
2. Backend converts it to PDF (if needed)
        ↓
3. PDF is rendered in the browser via iframe
        ↓
4. Text is extracted page-by-page and stored in MySQL
        ↓
5. Extracted text is sent to the React frontend
        ↓
6. AI Voice Assistant reads the text aloud
        ↓
7. PDF auto-scrolls to the next page when current page is fully read
```

---

## ✅ Current Capabilities

- ✔ Full document reading with AI voice
- ✔ Smooth Pause and Resume support
- ✔ Auto page advance when reading completes a page
- ✔ Male / Female voice selection
- ✔ Clean, distraction-free UI
- ✔ Stable Flask backend with MySQL persistence

---

## 🔮 Roadmap

- [ ] Word-level highlighting inside the PDF
- [ ] Question & Answer from document content
- [ ] Google Neural TTS integration
- [ ] Multi-language support
- [ ] Mobile-responsive UI
- [ ] User authentication and document history

---

## 👥 Use Cases

- 🎓 **Students** — Listen to study material while viewing notes
- 👁 **Visually impaired users** — Full audio-assisted document reading
- 🏫 **Online education platforms** — AI-powered lecture delivery
- 📚 **Self-learners** — Hands-free reading of books and articles
- 🤖 **AI teaching tools** — Automated virtual classroom assistant

---

## 👨‍🎓 Author

**Gireesh Boggala**
AI Virtual Teacher Project — College Final Year Project

---

## 🧾 License

This project is developed for **educational and research purposes only**.
