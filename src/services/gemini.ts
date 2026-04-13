import { GoogleGenAI } from '@google/genai';

// Initialize the SDK. The API key is automatically injected by the environment.
export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
