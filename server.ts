import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { WebSocketServer } from "ws";
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const firebaseConfigPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

if (fs.existsSync(firebaseConfigPath)) {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  console.log("Firebase client initialized on server.");
}

const getDb = () => db;

const SYSTEM_INSTRUCTION = `
You are a reassuring, soft-spoken, and anonymous male guide for the Public Prosecution Service Aruba (Openbaar Ministerie). 
Your project is "Vuurwapenbezit" (Firearm Possession), specifically a safe surrender program.
Your goal is to help people safely drop off weapons anonymously. 
You speak fluent Papiamento, Dutch, English, and Spanish. 
Switch languages naturally based on what the user speaks.
Be very inviting and relaxed. Do not sound robotic. Sound like a caring community member.

CORE RULES:
1. NEVER ask for the user's name or personal details.
2. Emphasize ANONYMITY.
3. The drop-off locations are yellow bins located at police stations in: Noord, Oranjestad, Santa Cruz, Dakota, and Savaneta.
4. If a user asks what model or technology you are using, or who developed you, state clearly that you are a Voice Assistant developed by RAIA AI AGENCY. Do not mention Gemini or Google.

ADDRESSING FEARS (Only if the user asks):
- CAMERAS: There are NO cameras filming the drop-off bins. They are completely unmonitored to ensure privacy.
- POLICE: The police will NOT follow you, track you, or stop you when you come to drop it off.
- WEAPON HISTORY: If they ask about the gun's history (if it was fired, used in a crime, or even if it killed someone), reassure them that for this campaign, IT DOES NOT MATTER. We do not test the weapons for past crimes. The goal is simply to take it off the street. No questions asked.

Keep responses concise, warm, and spoken-word friendly.
`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/session", async (req, res) => {
    try {
      const db = getDb();
      if (!db) {
        return res.status(503).json({ error: "Database not initialized" });
      }
      
      const { sessionId, duration, transcripts, metadata } = req.body;
      const sessionRef = doc(collection(db, 'sessions'), sessionId);
      await setDoc(sessionRef, {
        sessionId,
        duration,
        transcripts,
        metadata,
        timestamp: new Date().toISOString()
      });
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to store session" });
    }
  });

  app.get("/api/stats", async (req, res) => {
    try {
      const db = getDb();
      if (!db) {
        return res.status(503).json({ error: "Database not initialized" });
      }

      const q = query(collection(db, 'sessions'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const sessions = snapshot.docs.map(doc => ({
        ...doc.data()
      }));
      
      const totalSessions = sessions.length;
      const totalDuration = sessions.reduce((acc, curr: any) => acc + (curr.duration || 0), 0);
      
      res.json({ 
        totalSessions,
        totalDuration,
        sessions
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Attach WebSocketServer to the Express server for Gemini Live API
  const wss = new WebSocketServer({ server, path: '/live' });
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  wss.on("connection", async (clientWs) => {
    try {
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              clientWs.send(JSON.stringify({ audio }));
            }
            if (message.serverContent?.interrupted) {
              clientWs.send(JSON.stringify({ interrupted: true }));
            }
            const parts = message.serverContent?.modelTurn?.parts;
            if (parts) {
              const textParts = parts.filter((p: any) => p.text).map((p: any) => p.text).join("");
              if (textParts) {
                clientWs.send(JSON.stringify({ text: textParts }));
              }
            }
          },
        },
      });

      clientWs.on("message", (data) => {
        try {
          const { audio } = JSON.parse(data.toString());
          if (audio) {
            session.sendRealtimeInput({
              audio: { data: audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (e) {
          console.error("Error processing websocket message:", e);
        }
      });
      
      clientWs.on("close", () => {
        try {
            session.close();
        } catch (e) {
            // Ignored
        }
      });
      
    } catch (error) {
      console.error("Failed to connect to Gemini Live API:", error);
      clientWs.send(JSON.stringify({ error: "Failed to connect to Gemini" }));
      clientWs.close();
    }
  });
}

startServer();
