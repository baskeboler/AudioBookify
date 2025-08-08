import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { PDFProcessor } from "./services/pdfProcessor";
import { OpenAIService, type VoiceOption } from "./services/openaiService";
import { VideoGenerator } from "./services/videoGenerator";
import { insertAudiobookSchema } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
const audioDir = path.join(process.cwd(), 'audio');
const videoDir = path.join(process.cwd(), 'video');

// Ensure directories exist
[uploadDir, audioDir, videoDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // File upload endpoint
  app.post('/api/upload', isAuthenticated, upload.single('pdf'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const userId = req.user.claims.sub;
      const { voice = 'alloy', speed = 1.0 } = req.body;

      // Validate PDF
      const isValidPDF = await PDFProcessor.validatePDF(req.file.path);
      if (!isValidPDF) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Invalid PDF file' });
      }

      // Extract PDF info
      const pdfInfo = await PDFProcessor.extractText(req.file.path);
      
      // Create audiobook record
      const audiobook = await storage.createAudiobook({
        userId,
        title: pdfInfo.title || path.parse(req.file.originalname).name,
        originalFileName: req.file.originalname,
        filePath: req.file.path,
        pages: pdfInfo.numPages,
        voice: voice as VoiceOption,
        speed: parseFloat(speed),
        status: 'processing',
        progress: 0,
      });

      // Start processing in background
      processAudiobook(audiobook.id, pdfInfo.text, {
        voice: voice as VoiceOption,
        speed: parseFloat(speed),
      });

      res.json({ 
        message: 'Upload successful, processing started',
        audiobookId: audiobook.id,
        audiobook 
      });

    } catch (error) {
      console.error('Upload error:', error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Upload failed: ' + error.message });
    }
  });

  // Get user audiobooks
  app.get('/api/audiobooks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const audiobooks = await storage.getUserAudiobooks(userId);
      res.json(audiobooks);
    } catch (error) {
      console.error('Error fetching audiobooks:', error);
      res.status(500).json({ message: 'Failed to fetch audiobooks' });
    }
  });

  // Get specific audiobook
  app.get('/api/audiobooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const audiobook = await storage.getAudiobook(req.params.id);
      
      if (!audiobook) {
        return res.status(404).json({ message: 'Audiobook not found' });
      }

      // Check if user owns this audiobook
      const userId = req.user.claims.sub;
      if (audiobook.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      res.json(audiobook);
    } catch (error) {
      console.error('Error fetching audiobook:', error);
      res.status(500).json({ message: 'Failed to fetch audiobook' });
    }
  });

  // Download audiobook
  app.get('/api/audiobooks/:id/download', isAuthenticated, async (req: any, res) => {
    try {
      const audiobook = await storage.getAudiobook(req.params.id);
      
      if (!audiobook) {
        return res.status(404).json({ message: 'Audiobook not found' });
      }

      // Check if user owns this audiobook
      const userId = req.user.claims.sub;
      if (audiobook.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (audiobook.status !== 'complete' || !audiobook.videoPath) {
        return res.status(400).json({ message: 'Audiobook not ready for download' });
      }

      if (!fs.existsSync(audiobook.videoPath)) {
        return res.status(404).json({ message: 'File not found' });
      }

      const filename = `${audiobook.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      res.download(audiobook.videoPath, filename);

    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: 'Download failed' });
    }
  });

  // Delete audiobook
  app.delete('/api/audiobooks/:id', isAuthenticated, async (req: any, res) => {
    try {
      const audiobook = await storage.getAudiobook(req.params.id);
      
      if (!audiobook) {
        return res.status(404).json({ message: 'Audiobook not found' });
      }

      // Check if user owns this audiobook
      const userId = req.user.claims.sub;
      if (audiobook.userId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      // Clean up files
      [audiobook.filePath, audiobook.audioPath, audiobook.videoPath].forEach(filePath => {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      await storage.deleteAudiobook(req.params.id);
      res.json({ message: 'Audiobook deleted successfully' });

    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ message: 'Failed to delete audiobook' });
    }
  });

  // Stripe subscription endpoints
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    let user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
        });
        return;
      } catch (error) {
        console.error('Error retrieving subscription:', error);
        // Continue to create new subscription if retrieval fails
      }
    }

    if (!user.email) {
      return res.status(400).json({ message: 'No user email on file' });
    }

    try {
      let customer;
      
      if (user.stripeCustomerId) {
        try {
          customer = await stripe.customers.retrieve(user.stripeCustomerId);
        } catch (error) {
          console.error('Error retrieving customer:', error);
          customer = null;
        }
      }

      if (!customer) {
        customer = await stripe.customers.create({
          email: user.email,
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : undefined,
        });
      }

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID || 'price_default',
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      await storage.updateUserStripeInfo(userId, customer.id, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      console.error('Subscription creation error:', error);
      res.status(400).json({ error: { message: error.message } });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background processing function
async function processAudiobook(
  audiobookId: string, 
  text: string, 
  options: { voice: VoiceOption; speed: number }
) {
  try {
    // Update status to processing
    await storage.updateAudiobook(audiobookId, { 
      status: 'processing', 
      progress: 10 
    });

    // Clean and format text
    const formattedText = PDFProcessor.formatTextForTTS(text);
    
    // Create audio directory for this audiobook
    const audiobookDir = path.join(audioDir, audiobookId);
    if (!fs.existsSync(audiobookDir)) {
      fs.mkdirSync(audiobookDir, { recursive: true });
    }

    // Convert text to speech in chunks
    const audioChunks = await OpenAIService.chunkedTextToSpeech(
      formattedText,
      options,
      audiobookDir,
      (progress) => {
        // Update progress (10% to 70%)
        const adjustedProgress = Math.round(10 + (progress * 0.6));
        storage.updateAudiobook(audiobookId, { progress: adjustedProgress });
      }
    );

    // Combine audio chunks
    const finalAudioPath = path.join(audiobookDir, 'complete.mp3');
    await VideoGenerator.combineAudioChunks(audioChunks, finalAudioPath);

    // Update progress
    await storage.updateAudiobook(audiobookId, { 
      audioPath: finalAudioPath,
      progress: 80 
    });

    // Get audio duration
    const duration = await VideoGenerator.getAudioDuration(finalAudioPath);

    // Create video
    const audiobook = await storage.getAudiobook(audiobookId);
    if (!audiobook) throw new Error('Audiobook not found');

    const videoPath = path.join(videoDir, `${audiobookId}.mp4`);
    await VideoGenerator.createVideoFromAudio(
      finalAudioPath,
      audiobook.filePath,
      videoPath,
      duration
    );

    // Clean up temporary audio chunks
    audioChunks.forEach(chunkPath => {
      if (fs.existsSync(chunkPath)) {
        fs.unlinkSync(chunkPath);
      }
    });

    // Update final status
    await storage.updateAudiobook(audiobookId, {
      status: 'complete',
      progress: 100,
      duration,
      videoPath,
    });

  } catch (error) {
    console.error('Processing error:', error);
    
    await storage.updateAudiobook(audiobookId, {
      status: 'error',
      errorMessage: error.message,
    });
  }
}
