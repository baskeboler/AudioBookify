import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/navigation";
import UploadSection from "@/components/upload-section";
import AudiobookList from "@/components/audiobook-list";
import BillingCard from "@/components/billing-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: audiobooks, isLoading: audiobooksLoading } = useQuery({
    queryKey: ["/api/audiobooks"],
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  const totalAudiobooks = Array.isArray(audiobooks) ? audiobooks.length : 0;
  const totalDuration = Array.isArray(audiobooks) ? audiobooks.reduce((acc: number, book: any) => acc + (book.duration || 0), 0) : 0;
  const hoursListened = Array.isArray(audiobooks) ? audiobooks.reduce((acc: number, book: any) => {
    const progress = book.listeningProgress;
    return acc + (progress ? progress.currentTime : 0);
  }, 0) : 0;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation isAuthenticated={true} user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <UploadSection />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AudiobookList audiobooks={Array.isArray(audiobooks) ? audiobooks : []} isLoading={audiobooksLoading} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <BillingCard user={user} />

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-book text-primary"></i>
                    <span className="text-sm text-slate-600">Total AudioBooks</span>
                  </div>
                  <span className="text-lg font-semibold">{totalAudiobooks}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-clock text-accent"></i>
                    <span className="text-sm text-slate-600">Total Duration</span>
                  </div>
                  <span className="text-lg font-semibold">{formatDuration(totalDuration)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-headphones text-amber-500"></i>
                    <span className="text-sm text-slate-600">Hours Listened</span>
                  </div>
                  <span className="text-lg font-semibold">{formatDuration(hoursListened)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(audiobooks) && audiobooks.length > 0 ? (
                  <div className="space-y-3">
                    {audiobooks.slice(0, 3).map((audiobook: any) => (
                      <div key={audiobook.id} className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                          audiobook.status === 'complete' ? 'bg-accent' : 
                          audiobook.status === 'processing' ? 'bg-primary' : 'bg-amber-500'
                        }`}></div>
                        <div className="min-w-0">
                          <p className="text-sm text-slate-900">
                            {audiobook.status === 'complete' ? 'Completed' : 
                             audiobook.status === 'processing' ? 'Processing' : 'Started'} "{audiobook.title}"
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(audiobook.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
