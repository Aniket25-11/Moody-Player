require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/db/db");
const cors = require("cors");

// ✅ Setup CORS (allow frontend domain + local dev)
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local dev (Vite)
      "https://moody-player-silk.vercel.app", // deployed frontend
    ],
    methods: ["GET", "POST"],
  })
);

connectDB();

// ✅ Use dynamic port for Vercel/Heroku/etc.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
