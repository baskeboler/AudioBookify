import OpenAI from "openai";
import fs from 'fs';
import path from 'path';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export type VoiceOption = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

export interface TTSOptions {
  voice: VoiceOption;
  speed: number;
}

export class OpenAIService {
  static async textToSpeech(text: string, options: TTSOptions, outputPath: string): Promise<string> {
    try {
      const response = await openai.audio.speech.create({
        model: "tts-1",
        voice: options.voice,
        speed: Math.max(0.25, Math.min(4.0, options.speed)), // Clamp speed between 0.25 and 4.0
        input: text,
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, buffer);
      
      return outputPath;
    } catch (error: any) {
      throw new Error(`Failed to convert text to speech: ${error?.message || 'Unknown error'}`);
    }
  }

  static async chunkedTextToSpeech(
    text: string, 
    options: TTSOptions, 
    outputDir: string,
    onProgress?: (progress: number) => void
  ): Promise<string[]> {
    // Split text into chunks (OpenAI TTS has a 4096 character limit)
    const chunks = this.splitTextIntoChunks(text, 4000);
    const audioFiles: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const outputPath = path.join(outputDir, `chunk_${i.toString().padStart(3, '0')}.mp3`);
      
      await this.textToSpeech(chunk, options, outputPath);
      audioFiles.push(outputPath);
      
      if (onProgress) {
        onProgress(((i + 1) / chunks.length) * 100);
      }
    }
    
    return audioFiles;
  }

  private static splitTextIntoChunks(text: string, maxLength: number): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (currentChunk.length + trimmedSentence.length + 1 > maxLength) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // If single sentence is too long, split it further
        if (trimmedSentence.length > maxLength) {
          const words = trimmedSentence.split(' ');
          let wordChunk = '';
          
          for (const word of words) {
            if (wordChunk.length + word.length + 1 > maxLength) {
              if (wordChunk.length > 0) {
                chunks.push(wordChunk.trim());
                wordChunk = word;
              }
            } else {
              wordChunk += (wordChunk.length > 0 ? ' ' : '') + word;
            }
          }
          
          if (wordChunk.length > 0) {
            currentChunk = wordChunk;
          }
        } else {
          currentChunk = trimmedSentence;
        }
      } else {
        currentChunk += (currentChunk.length > 0 ? '. ' : '') + trimmedSentence;
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}
