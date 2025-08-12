import { useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
import { useState } from "react";
import axios from "axios";

const MoodPlayer = ({ songs, setSongs }) => {
  const videoRef = useRef(null);
  const [expression, setExpression] = useState("");
  const [isPlaying, setIsPlaying] = useState(null);

  const handlePlayPause = (idx) => {
    if (isPlaying == idx) {
      setIsPlaying(null);
    } else {
      setIsPlaying(idx);
    }
  };

  // Load the face-api models
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
    };

    loadModels().then(startVideo);
  }, []);

  // Start video using native navigator API
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: {} })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.error("Camera error:", err));
  };

  // Handle video frame for expression detection
  const handleVideoPlay = async function () {
    if (videoRef.current) {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      if (detections.length > 0) {
        const expressions = detections[0].expressions;

        // Get the expression with the highest probability
        const maxExpression = Object.entries(expressions).reduce(
          (prev, current) => (prev[1] > current[1] ? prev : current)
        );

        setExpression(maxExpression[0]);
        axios
          .get(`http://localhost:3000/songs?mood=${maxExpression[0]}`)
          .then((res) => {
            console.log(res);
            setSongs(res.data.songs);
          });
      } else {
        setExpression("No face detected");
        console.log("No face detected");
      }
    }
  };

  return (
    <div className="container mx-auto p-6 flex flex-col lg:flex-row gap-8 min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Face detection section */}
      <div className="faceDetect flex-1 flex flex-col items-center backdrop-blur-lg bg-white/10 p-6 rounded-3xl shadow-xl border border-white/20 transition hover:scale-[1.01] duration-300">
        <div className="face w-full flex flex-col items-center gap-4">
          <video
            ref={videoRef}
            autoPlay
            muted
            className="w-full max-w-md rounded-2xl border-4 border-white/30 shadow-lg"
          />
          <h1 className="text-2xl font-bold text-white drop-shadow-md">
            {expression || "Waiting..."}
          </h1>
        </div>
        <button
          className="capture mt-6 px-8 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold rounded-full shadow-lg hover:opacity-90 transition duration-300"
          onClick={handleVideoPlay}
        >
          Capture Mood
        </button>
      </div>

      {/* Song suggestion section */}
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
                {isPlaying === idx && (
                  <audio
                    src={song.audio}
                    autoPlay={isPlaying == idx}
                    style={{ display: "none" }}
                  ></audio>
                )}
                <button
                  className="text-4xl text-pink-400 hover:text-pink-300 transition duration-200"
                  onClick={() => handlePlayPause(idx)}
                >
                  {isPlaying == idx ? (
                    <i className="ri-pause-fill"></i>
                  ) : (
                    <i className="ri-play-circle-fill"></i>
                  )}
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
