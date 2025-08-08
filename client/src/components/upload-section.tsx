import { useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function UploadSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [voice, setVoice] = useState("alloy");
  const [speed, setSpeed] = useState("1.0");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; voice: string; speed: string }) => {
      const formData = new FormData();
      formData.append('pdf', data.file);
      formData.append('voice', data.voice);
      formData.append('speed', data.speed);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Upload Successful",
        description: "Your PDF is being processed. This may take a few minutes.",
      });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/audiobooks"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload PDF",
        variant: "destructive",
      });
    },
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === 'application/pdf');
    
    if (pdfFile) {
      if (pdfFile.size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "PDF files must be under 50MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(pdfFile);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid File",
          description: "Please select a PDF file",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "PDF files must be under 50MB",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  }, [toast]);

  const handleConvert = () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select a PDF file first",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      file: selectedFile,
      voice,
      speed,
    });
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Convert PDFs to AudioBooks</h2>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Transform your documents into engaging audio experiences using AI-powered text-to-speech technology.
        </p>
      </div>

      <Card className="shadow-sm border border-slate-200">
        <CardContent className="p-8">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer ${
              isDragging 
                ? 'border-primary bg-blue-50' 
                : 'border-slate-300 hover:border-primary hover:bg-blue-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => document.getElementById('pdf-upload')?.click()}
          >
            <div className="max-w-md mx-auto">
              <i className="fas fa-cloud-upload-alt text-5xl text-slate-400 mb-4"></i>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Drop your PDF here</h3>
              <p className="text-slate-600 mb-4">or click to browse files</p>
              <Button className="bg-primary text-white hover:bg-blue-600">
                Choose File
              </Button>
              <p className="text-sm text-slate-500 mt-3">Supports PDF files up to 50MB</p>
            </div>
          </div>

          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* File Preview */}
          {selectedFile && (
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-file-pdf text-red-500 text-2xl"></i>
                  <div>
                    <p className="font-medium text-slate-900">{selectedFile.name}</p>
                    <p className="text-sm text-slate-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <i className="fas fa-times"></i>
                </Button>
              </div>
            </div>
          )}

          {/* Conversion Options */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Voice Selection</label>
              <Select value={voice} onValueChange={setVoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alloy">Alloy (Natural)</SelectItem>
                  <SelectItem value="echo">Echo (Expressive)</SelectItem>
                  <SelectItem value="fable">Fable (Warm)</SelectItem>
                  <SelectItem value="onyx">Onyx (Deep)</SelectItem>
                  <SelectItem value="nova">Nova (Energetic)</SelectItem>
                  <SelectItem value="shimmer">Shimmer (Clear)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Speed</label>
              <Select value={speed} onValueChange={setSpeed}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.75">0.75x (Slow)</SelectItem>
                  <SelectItem value="1.0">1.0x (Normal)</SelectItem>
                  <SelectItem value="1.25">1.25x (Fast)</SelectItem>
                  <SelectItem value="1.5">1.5x (Very Fast)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Convert Button */}
          <div className="mt-8 text-center">
            <Button 
              onClick={handleConvert}
              disabled={!selectedFile || uploadMutation.isPending}
              size="lg"
              className="bg-accent text-white hover:bg-emerald-600 px-8 py-4 text-lg"
            >
              {uploadMutation.isPending ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Processing...
                </>
              ) : (
                <>
                  <i className="fas fa-magic mr-2"></i>
                  Convert to AudioBook
                </>
              )}
            </Button>
            <p className="text-sm text-slate-500 mt-2">Processing typically takes 2-5 minutes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
