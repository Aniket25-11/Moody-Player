import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";

// ✅ Use env-based API URL (set VITE_API_BASE_URL in Vercel -> Project -> Settings -> Environment Variables)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:3000"; // fallback for local dev

const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

const MoodPlayer = ({ songs, setSongs }) => {
  const videoRef = useRef(null);
  const audioRefs = useRef([]); // Refs to control each audio
  const [expression, setExpression] = useState("");
  const [isPlaying, setIsPlaying] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const handlePlayPause = (idx) => {
    if (isPlaying === idx) {
      audioRefs.current[idx].pause();
      setIsPlaying(null);
    } else {
      if (isPlaying !== null && audioRefs.current[isPlaying]) {
        audioRefs.current[isPlaying].pause();
      }
      audioRefs.current[idx].play();
      setIsPlaying(idx);
    }
  };

  // Load face-api models
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models"; // served from Frontend/public/models
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
      } catch (e) {
        console.error("Failed to load face-api models:", e);
      }
    };

    loadModels().then(startVideo);
  }, []);

  // Start webcam
  const startVideo = () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      console.error("getUserMedia not supported in this browser.");
      setExpression("Camera not supported");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Camera error:", err);
        setExpression("Camera permission denied");
      });
  };

  // Handle video for face detection
  const handleVideoPlay = async () => {
    if (!modelsLoaded) {
      setExpression("Loading models…");
      return;
    }

    if (videoRef.current) {
      try {
        setLoading(true);

        const detections = await faceapi
          .detectAllFaces(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceExpressions();

        if (detections.length > 0) {
          const expressions = detections[0].expressions;
          const maxExpression = Object.entries(expressions).reduce((prev, curr) =>
            prev[1] > curr[1] ? prev : curr
          );
          const mood = maxExpression[0]; // one of: neutral, happy, sad, angry, fearful, disgusted, surprised
          setExpression(mood);

          // ✅ Use deployed backend via env var
          const res = await http.get("/songs", { params: { mood } });

          setSongs(res.data?.songs || []);
          setIsPlaying(null); // Stop any currently playing song
        } else {
          setExpression("No face detected");
        }
      } catch (err) {
        console.error("Mood detection / fetch error:", err);
        setExpression("Error fetching songs");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mx-auto p-6 flex flex-col lg:flex-row gap-8 min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Face Detection */}
      <div className="faceDetect flex-1 flex flex-col items-center backdrop-blur-lg bg-white/10 p-6 rounded-3xl shadow-xl border border-white/20 transition hover:scale-[1.01] duration-300">
        <div className="face w-full flex flex-col items-center gap-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full max-w-md rounded-2xl border-4 border-white/30 shadow-lg"
          />
          <h1 className="text-2xl font-bold text-white drop-shadow-md">
            {loading ? "Loading…" : expression || "Waiting..."}
          </h1>
        </div>
        <button
          className="capture mt-6 px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-full shadow-lg hover:opacity-90 transition duration-300 disabled:opacity-50"
          onClick={handleVideoPlay}
          disabled={!modelsLoaded}
          title={!modelsLoaded ? "Loading models..." : "Capture"}
        >
          {modelsLoaded ? "Capture Mood" : "Loading Models…"}
        </button>
      </div>

      {/* Song Suggestions */}
      <div className="songSuggest flex-1 backdrop-blur-lg bg-white/10 p-6 rounded-3xl shadow-xl border border-white/20">
        <h1 className="text-3xl font-bold mb-6 text-white drop-shadow-lg">
          Recommended Songs
        </h1>
        {songs.length === 0 && (
          <p className="text-gray-200 italic">
            No songs yet. Try capturing your mood!
          </p>
        )}
        <div className="flex flex-col gap-4">
          {songs.map((song, idx) => (
            <div
              key={idx}
              className="songs flex justify-between items-center bg-white/20 p-4 rounded-xl shadow-md border border-white/10 hover:bg-white/30 transition"
            >
              <div className="name">
                <h2 className="text-lg font-semibold text-white">{song.title}</h2>
                <h3 className="text-sm text-gray-200">{song.artist}</h3>
              </div>
              <div className="btn flex items-center gap-2">
                <audio
                  src={song.audio}
                  ref={(el) => (audioRefs.current[idx] = el)}
                  controls
                  className="w-80"
                  style={{ display: "none" }}
                />

                {/* ⏪ Rewind 10s */}
                <button
                  className="text-2xl text-white hover:text-indigo-400 transition duration-200"
                  onClick={() => {
                    const audio = audioRefs.current[idx];
                    if (audio) audio.currentTime = Math.max(0, audio.currentTime - 10);
                  }}
                >
                  <i className="ri-rewind-fill"></i>
                </button>

                {/* ▶️ / ⏸ Play / Pause */}
                <button
                  className="text-4xl text-white hover:text-indigo-500 transition duration-200"
                  onClick={() => handlePlayPause(idx)}
                >
                  {isPlaying === idx ? (
                    <i className="ri-pause-fill"></i>
                  ) : (
                    <i className="ri-play-circle-fill"></i>
                  )}
                </button>

                {/* ⏩ Forward 10s */}
                <button
                  className="text-2xl text-white hover:text-indigo-400 transition duration-200"
                  onClick={() => {
                    const audio = audioRefs.current[idx];
                    if (audio)
                      audio.currentTime = Math.min(
                        audio.duration,
                        audio.currentTime + 10
                      );
                  }}
                >
                  <i className="ri-speed-fill"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MoodPlayer;
