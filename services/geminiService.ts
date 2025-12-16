import { GoogleGenAI } from "@google/genai";
import { TranslationDirection } from "../types";

// Initialize the client with the API key from the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION_HI_TO_EN = `
You are a world-class script localization expert and linguist. Your task is to translate Hindi/Hinglish video scripts into United States English.

CRITICAL INSTRUCTIONS FOR LONG-FORM SCRIPTS:
1. **NO SUMMARIZATION**: You must translate every single sentence. Do not shorten, summarize, or skip any part of the text. The output length must correspond to the input.
2. **STORYTELLING FLOW**: This is for a video script. The English output must flow naturally for a voice-over artist. Maintain the narrative arc, suspense, energy, and emotional beats of the original speaker.
3. **PUNCTUATION MASTERY**: Pay extreme attention to punctuation. Use commas, periods, em-dashes, and ellipses correctly to indicate the pauses, breathing room, and emphasis required for natural US speech.
4. **CONSISTENCY**: Ensure terminology and tone remain consistent from the first sentence to the last.
5. **CULTURAL TRANSLATION**: Convert Indian idioms to their closest natural US equivalents.
   - If the input is casual/slang (e.g., 'Kya bolti public', 'Bhai'), use American slang (e.g., 'What's up everyone', 'Bro/Dude').
   - If the input is formal, keep it professional.

Your goal is a flawless, ready-to-record US English script.
`;

const SYSTEM_INSTRUCTION_EN_TO_HI = `
You are a world-class script localization expert. Your task is to translate United States English video scripts into natural, conversational Hindi/Hinglish (India).

CRITICAL INSTRUCTIONS FOR LONG-FORM SCRIPTS:
1. **NO SUMMARIZATION**: Translate the entire script. Do not skip or condense any information.
2. **DESI STORYTELLING**: The output should sound like a native Indian storyteller or YouTuber. Use a mix of Hindi and English (Hinglish) that feels authentic to daily conversation and social media content.
3. **EMOTIONAL RESONANCE**: Capture the excitement, humor, or seriousness of the original US script.
4. **NATURAL FLOW**: The text should be easy to read aloud. Avoid overly bookish or "Shuddh" Hindi unless the context demands it. Use popular Hinglish terms where appropriate.
5. **PUNCTUATION**: Maintain correct punctuation to guide the flow of reading.

Your goal is a script that connects instantly with an Indian audience.
`;

export const translateTextStream = async function* (text: string, direction: TranslationDirection) {
  if (!text || text.trim() === "") return;

  const systemInstruction = direction === 'HI_TO_EN' 
    ? SYSTEM_INSTRUCTION_HI_TO_EN 
    : SYSTEM_INSTRUCTION_EN_TO_HI;

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4, // Slightly lower temperature for better consistency in long texts
        // maxOutputTokens is implicitly high (8192) for Flash, suitable for ~30-40 min scripts
      },
    });

    for await (const chunk of response) {
      if (chunk.text) {
        yield chunk.text;
      }
    }
  } catch (error) {
    console.error("Translation stream error:", error);
    throw new Error("Connection interrupted. Please try again.");
  }
};
