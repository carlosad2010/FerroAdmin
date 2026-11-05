import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api", (_request, response) => {
  response.status(404).json({ error: "API route not found" });
});

app.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
});