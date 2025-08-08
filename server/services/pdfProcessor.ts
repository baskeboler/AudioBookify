import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';

export interface PDFInfo {
  text: string;
  numPages: number;
  title?: string;
}

export class PDFProcessor {
  static async extractText(filePath: string): Promise<PDFInfo> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      
      return {
        text: data.text,
        numPages: data.numpages,
        title: data.info?.Title,
      };
    } catch (error) {
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
    }
  }

  static async validatePDF(filePath: string): Promise<boolean> {
    try {
      await this.extractText(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  static formatTextForTTS(text: string): string {
    // Clean up text for better TTS output
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '. ') // Replace newlines with periods
      .replace(/[^\w\s.,!?;:-]/g, '') // Remove special characters except basic punctuation
      .trim();
  }
}
