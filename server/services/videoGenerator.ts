import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

export class VideoGenerator {
  static async combineAudioChunks(audioFiles: string[], outputPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a temporary file list for ffmpeg
      const fileListPath = path.join(path.dirname(outputPath), 'filelist.txt');
      const fileListContent = audioFiles.map(file => `file '${path.resolve(file)}'`).join('\n');
      
      fs.writeFileSync(fileListPath, fileListContent);
      
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'concat',
        '-safe', '0',
        '-i', fileListPath,
        '-c', 'copy',
        '-y', // Overwrite output file
        outputPath
      ]);

      ffmpeg.on('close', (code) => {
        // Clean up temporary file
        if (fs.existsSync(fileListPath)) {
          fs.unlinkSync(fileListPath);
        }
        
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
  }

  static async createVideoFromAudio(
    audioPath: string, 
    pdfPath: string, 
    outputPath: string,
    duration: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Create a simple black background with PDF filename as video
      const ffmpeg = spawn('ffmpeg', [
        '-f', 'lavfi',
        '-i', `color=c=black:size=1280x720:duration=${duration}`,
        '-i', audioPath,
        '-vf', `drawtext=text='${path.basename(pdfPath, '.pdf')}':fontcolor=white:fontsize=48:x=(w-tw)/2:y=(h-th)/2`,
        '-c:v', 'libx264',
        '-c:a', 'aac',
        '-shortest',
        '-y', // Overwrite output file
        outputPath
      ]);

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath);
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`));
        }
      });

      ffmpeg.on('error', (error) => {
        reject(error);
      });
    });
  }

  static async getAudioDuration(audioPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', [
        '-v', 'quiet',
        '-print_format', 'json',
        '-show_format',
        audioPath
      ]);

      let output = '';
      
      ffprobe.stdout.on('data', (data) => {
        output += data.toString();
      });

      ffprobe.on('close', (code) => {
        if (code === 0) {
          try {
            const metadata = JSON.parse(output);
            const duration = parseFloat(metadata.format.duration);
            resolve(duration);
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`FFprobe process exited with code ${code}`));
        }
      });

      ffprobe.on('error', (error) => {
        reject(error);
      });
    });
  }
}
