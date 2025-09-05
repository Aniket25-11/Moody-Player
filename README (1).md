# Moody Player 🎵🤳

A face‑expression powered music recommender. **Moody Player** uses your webcam with **face‑api.js** to detect one of 7 expressions — `neutral`, `happy`, `sad`, `angry`, `fearful`, `disgusted`, `surprised` — and fetches matching songs from a Node/Express + MongoDB backend. Built with **React (Vite)** and **Tailwind CSS**.

> Tip: This README was auto‑generated from the project source to help you publish quickly on GitHub.

---

## ✨ Features

- Real‑time **face expression detection** in the browser (via `getUserMedia` + `face-api.js`).
- 7 mood categories mapped 1:1 with face‑api.js expressions.
- **Song recommendations** fetched from the backend `GET /songs?mood=...`.
- Inline **audio player** with Play/Pause & Seek controls per recommended song.
- Admin/seed route to **upload tracks** with mood tags (`POST /songs` + file upload).
- Clean **React + Vite** setup styled with **Tailwind CSS** and icons via Remix Icon.
- Backend built with **Express**, **Mongoose** (MongoDB), **Multer** (file upload), and **ImageKit** (asset hosting).

---

## 🧱 Project Structure

```
├── Backend/
│   ├── src/
│   │   ├── db/
│   │   │   └── db.js
│   │   ├── models/
│   │   │   └── song.model.js
│   │   ├── routes/
│   │   │   └── song.routes.js
│   │   ├── service/
│   │   │   └── storage.service.js
│   │   └── app.js
│   ├── .gitignore
│   ├── package-lock.json
│   ├── package.json
│   ├── server.js
│   └── vercel.json
└── Frontend/
    ├── public/
    │   ├── models/
    │   │   ├── face_expression_model-shard1
    │   │   ├── face_expression_model-weights_manifest.json
    │   │   ├── face_landmark_68_model-shard1
    │   │   ├── face_landmark_68_model-weights_manifest.json
    │   │   ├── face_landmark_68_tiny_model-shard1
    │   │   ├── face_landmark_68_tiny_model-weights_manifest.json
    │   │   ├── face_recognition_model-shard1
    │   │   ├── face_recognition_model-shard2
    │   │   ├── face_recognition_model-weights_manifest.json
    │   │   ├── ssd_mobilenetv1_model-shard1
    │   │   ├── ssd_mobilenetv1_model-shard2
    │   │   ├── ssd_mobilenetv1_model-weights_manifest.json
    │   │   ├── tiny_face_detector_model-shard1
    │   │   └── tiny_face_detector_model-weights_manifest.json
    │   └── vite.svg
    ├── src/
    │   ├── assets/
    │   │   └── react.svg
    │   ├── components/
    │   │   └── MoodPlayer.jsx
    │   ├── App.css
    │   ├── App.jsx
    │   ├── index.css
    │   ├── index.js
    │   └── main.jsx
    ├── .gitignore
    ├── eslint.config.js
    ├── index.html
    ├── package-lock.json
    ├── package.json
    ├── postcss.config.js
    ├── README.md
    ├── tailwind.config.js
    └── vite.config.js
```

- **Frontend/** – React app (Vite) with Tailwind. Face‑API models live in `Frontend/public/models/`.
- **Backend/** – Express server, MongoDB models & routes, ImageKit upload service.

---

## 🧰 Tech Stack

**Frontend**
- React 19 + Vite 7
- Tailwind CSS
- face‑api.js (uses TensorFlow.js under the hood)
- Axios
- Remix Icon (CDN)

**Backend**
- Node.js + Express (v5)
- MongoDB + Mongoose
- Multer (in‑memory) for file upload
- ImageKit SDK for media storage
- CORS, dotenv
- Vercel adapter (`vercel.json`) for serverless deployment

---

## 🚀 Quick Start (Local)

### 1) Backend
```bash
cd Backend
npm install
# .env – create it using the keys below
node server.js
# server runs at http://localhost:3000
```

Create a **.env** file in `Backend/`:

```bash
MONGODB_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
IMAGEKIT_PUBLIC_KEY=your_public_key
IMAGEKIT_PRIVATE_KEY=your_private_key
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/<your_endpoint_id>
# optionally
PORT=3000
```

> Note: `server.js` currently binds to port **3000**; for cloud deploys consider changing to `app.listen(process.env.PORT || 3000)`.

### 2) Frontend
```bash
cd Frontend
npm install
npm run dev
# Vite dev server runs at http://localhost:5173
```

The face‑api.js models are already included under `Frontend/public/models`. If you move them, update `MODEL_URL` in `src/components/MoodPlayer.jsx` (defaults to `/models`).

Grant the browser permission to access your **camera** when prompted.

---

## 🖥️ How It Works

### Frontend (React)
- Loads the **TinyFaceDetector** and **FaceExpressionNet** models:
  ```js
  const MODEL_URL = "/models";
  await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
  ```
- Starts webcam (`navigator.mediaDevices.getUserMedia({ video: {} })`).
- On capture, gets the top expression and requests recommendations:
  ```js
  const {{ expressions }} = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  const [mood] = Object.entries(expressions)
    .sort((a, b) => b[1] - a[1])[0]; // e.g., "happy"

  const res = await axios.get(`http://localhost:3000/songs?mood=${{mood}}`);
  setSongs(res.data.songs);
  ```
- Renders a simple player list with per‑track Play/Pause/Seek.

### Backend (Node/Express)
- **Model**
  ```js
  // Backend/src/models/song.model.js
  {{ title: String, artist: String, audio: String, mood: String }}
  ```
- **Routes**
  - `GET /songs?mood=<neutral|happy|sad|angry|fearful|disgusted|surprised>` → List songs by mood.
  - `POST /songs` (multipart/form‑data: `title`, `artist`, `mood`, `audio` file) → Uploads to ImageKit and stores MongoDB document.
- **Infra**
  - MongoDB connection via `MONGODB_URL`.
  - File storage via **ImageKit** (`IMAGEKIT_*` envs).

---

## 📡 API Documentation

### GET `/songs`
**Query:** `mood` (required) — one of `neutral, happy, sad, angry, fearful, disgusted, surprised`  
**Response:**
```json
{
  "message": "Songs fetched Successfully",
  "songs": [
    {{ "title": "Tu Hi Haqeeqat", "artist": "Javed Ali", "audio": "https://...", "mood": "sad" }}
  ]
}
```

### POST `/songs`
**Content-Type:** `multipart/form-data`  
**Fields:**  
- `title` – string  
- `artist` – string  
- `mood` – one of the 7 moods above  
- `audio` – file (MP3/Audio)

**Response:** Created song document with `audio` set to the ImageKit URL.

> Tip: Seed data quickly using Postman or curl:
```bash
curl -X POST http://localhost:3000/songs \
  -F "title=Sample Track" \
  -F "artist=Demo Artist" \
  -F "mood=happy" \
  -F "audio=@/path/to/song.mp3"
```

---

## 🔐 Permissions & CORS

- Browser will request **camera** permission for mood detection.
- Backend enables **CORS**. If you deploy frontend/backend on different origins, set allowed origins appropriately.

---

## 🧪 Testing Checklist

- [ ] Frontend loads models (`/models/*`) without 404s
- [ ] Camera preview works; expression changes as you emote
- [ ] `GET /songs?mood=happy` returns data from MongoDB
- [ ] Tracks stream from the `audio` URLs and Play/Pause works
- [ ] `POST /songs` uploads the file to ImageKit and stores the doc

---

## 📦 Build & Deploy

**Frontend**
- `npm run build` creates a production build (Vite). Deploy `dist/` to any static host (Vercel, Netlify, S3, etc.). Make sure the `models/` directory is also published.

**Backend**
- Includes `vercel.json` for Vercel. Set the required env vars in your hosting provider.
- Ensure the server uses `process.env.PORT` for compatibility.

---

## 🛠️ Improvements (Nice to have)

- Centralize API base URL via env (`import.meta.env.VITE_API_BASE_URL`) instead of hardcoding `http://localhost:3000`.
- Validation for uploads (MIME type/size) and schema constraints.
- Persist play queue / history; add shuffle & repeat.
- Add unit tests and CI workflow.
- Add authentication for admin upload route.

---

## 📄 License

No explicit license was found in this repository. Consider adding an OSS license (e.g., MIT).

---

## 🙏 Acknowledgements

- face-api.js and TensorFlow.js
- ImageKit for asset hosting
- React, Vite, Tailwind, Express, MongoDB

---

Happy hacking! 🎧
