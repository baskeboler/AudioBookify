import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import ProcessingStatus from "./processing-status";

interface AudiobookListProps {
  audiobooks: any[];
  isLoading: boolean;
}

export default function AudiobookList({ audiobooks, isLoading }: AudiobookListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/audiobooks/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Audiobook Deleted",
        description: "The audiobook has been removed from your library.",
      });
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
        title: "Delete Failed",
        description: error.message || "Failed to delete audiobook",
        variant: "destructive",
      });
    },
  });

  const handleDownload = async (audiobook: any) => {
    try {
      const response = await fetch(`/api/audiobooks/${audiobook.id}/download`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${audiobook.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download Started",
        description: "Your audiobook is being downloaded.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download audiobook",
        variant: "destructive",
      });
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "—";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatProgress = (audiobook: any) => {
    const progress = audiobook.listeningProgress;
    if (!progress || !audiobook.duration) return "Not started";
    
    const percentage = (progress.currentTime / audiobook.duration) * 100;
    const currentMinutes = Math.floor(progress.currentTime / 60);
    const totalMinutes = Math.floor(audiobook.duration / 60);
    
    return `${currentMinutes}:${(progress.currentTime % 60).toFixed(0).padStart(2, '0')} / ${totalMinutes}:${(audiobook.duration % 60).toFixed(0).padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      complete: { variant: "default" as const, icon: "fas fa-check", text: "Complete", color: "bg-accent/10 text-accent" },
      processing: { variant: "secondary" as const, icon: "fas fa-clock", text: "Processing", color: "bg-amber-100 text-amber-800" },
      error: { variant: "destructive" as const, icon: "fas fa-exclamation-triangle", text: "Error", color: "bg-red-100 text-red-800" },
      pending: { variant: "outline" as const, icon: "fas fa-hourglass-half", text: "Pending", color: "bg-slate-100 text-slate-600" },
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    
    return (
      <Badge className={config.color}>
        <i className={`${config.icon} mr-1`}></i>
        {config.text}
      </Badge>
    );
  };

  // Show processing status for any currently processing audiobook
  const processingAudiobook = audiobooks?.find(book => book.status === 'processing');

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="shadow-sm border border-slate-200">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4 animate-pulse">
                <div className="w-16 h-20 bg-slate-200 rounded-lg flex-shrink-0"></div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      {processingAudiobook && <ProcessingStatus audiobook={processingAudiobook} />}
      
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Your AudioBooks</h3>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <i className="fas fa-filter mr-2"></i>Filter
          </Button>
          <Button variant="outline" size="sm">
            <i className="fas fa-sort mr-2"></i>Sort
          </Button>
        </div>
      </div>

      {audiobooks && audiobooks.length > 0 ? (
        <div className="space-y-4">
          {audiobooks.map((audiobook) => (
            <Card key={audiobook.id} className="shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  {/* PDF Thumbnail */}
                  <div className="w-16 h-20 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-file-pdf text-2xl text-red-500"></i>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-lg font-semibold text-slate-900 truncate">
                          {audiobook.title}
                        </h4>
                        <p className="text-sm text-slate-600 mt-1">
                          {audiobook.pages ? `${audiobook.pages} pages` : ''} 
                          {audiobook.duration ? ` • ${formatDuration(audiobook.duration)}` : ''}
                          {audiobook.createdAt ? ` • Created ${new Date(audiobook.createdAt).toLocaleDateString()}` : ''}
                        </p>
                        <div className="flex items-center space-x-4 mt-3">
                          {getStatusBadge(audiobook.status)}
                          <span className="text-sm text-slate-500">
                            Voice: {audiobook.voice || 'alloy'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                        {audiobook.status === 'complete' && audiobook.videoPath ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-slate-400 hover:text-accent hover:bg-emerald-50"
                              onClick={() => handleDownload(audiobook)}
                            >
                              <i className="fas fa-download"></i>
                            </Button>
                          </>
                        ) : audiobook.status === 'processing' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="text-slate-300 cursor-not-allowed"
                          >
                            <i className="fas fa-download"></i>
                          </Button>
                        ) : null}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                          onClick={() => deleteMutation.mutate(audiobook.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <i className="fas fa-trash"></i>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Progress Bar for listening progress */}
                    {audiobook.status === 'complete' && audiobook.listeningProgress && (
                      <div className="mt-4">
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ 
                              width: `${(audiobook.listeningProgress.currentTime / audiobook.duration) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {formatProgress(audiobook)} listened
                        </p>
                      </div>
                    )}
                    
                    {audiobook.status === 'processing' && (
                      <div className="mt-4">
                        <div className="w-full bg-slate-200 rounded-full h-1.5">
                          <div 
                            className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${audiobook.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Processing: {audiobook.progress}% complete
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="shadow-sm border border-slate-200">
          <CardContent className="p-12 text-center">
            <i className="fas fa-headphones text-5xl text-slate-300 mb-4"></i>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No AudioBooks Yet</h3>
            <p className="text-slate-600 mb-6">Upload your first PDF to get started with AI-powered audiobooks.</p>
          </CardContent>
        </Card>
      )}
    </>
  );
}
