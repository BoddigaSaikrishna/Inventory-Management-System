# VoiceStock India — Voice-First Regional Inventory Management System

A modern, voice-first inventory management system designed for SMBs, Kiranas, and retail stores in India.

## 🚀 Key Features

- 🎙️ **Multi-Language Code-Mixed Voice Speech Engine**: Spoken voice input support for Telugu, Hindi, Tamil, and English mid-sentence combinations (*"5 borii chawal aayi"*, *"Rice stock check cheyyi"*, *"10 cartons add karo"*).
- 🐍 **Python 3.13 Backend Subsystem (`python-backend/`)**: Object-Oriented Inventory Service (`models.py`, `inventory_service.py`), low-stock alerts, JSON export/import, and `unittest` test suite.
- 🌐 **Offline-First PWA Support**: Service Worker cache shell and background offline queue with automatic re-synchronization when connection returns.
- 📦 **Trade Unit Conversion**: Automatic conversion between spoken packaging (bags, boxes, cartons, dozen) and base inventory units (kg, liters, units).
- 📊 **Audit Trail & Reorder Alerts**: Real-time transaction history logs and low-stock threshold triggers.

---

## 🛠️ Tech Stack

- **Backend**: Python 3.13 (Dataclasses, Object-Oriented Models, Serialization, `unittest` suite)
- **Frontend App**: React 18, TypeScript 5.8, Vite 5.4, Tailwind CSS 3.4, Radix UI Primitives
- **Voice Engine**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) + Custom Rule-Based Code-Mixing NLP Parser
- **Offline PWA Engine**: Service Worker (`sw.js`), Web App Manifest, LocalStorage Action Queue

---

## 🏃 Run Instructions

### 1. Run Web Application (React + Vite)
```powershell
npm run dev
```
Open `http://localhost:8081` in your browser.

### 2. Run Python Backend Subsystem
```powershell
cd python-backend
python main.py
python -m unittest test_inventory.py
```

### 3. Run Frontend Test Suite
```powershell
npm test
```
