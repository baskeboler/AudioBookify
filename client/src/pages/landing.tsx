import Navigation from "@/components/navigation";
import { Button } from "@/components/ui/button";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation isAuthenticated={false} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold text-slate-900 mb-6">
              Convert PDFs to AudioBooks
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Transform your documents into engaging audio experiences using AI-powered text-to-speech technology.
            </p>
            
            <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-primary hover:bg-blue-600 text-white px-8 py-4 text-lg"
              >
                Get Started
              </Button>
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-upload text-primary text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Easy Upload
              </h3>
              <p className="text-slate-600">
                Simply drag and drop your PDF files. We support documents up to 50MB.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-microphone text-accent text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                AI Voice Selection
              </h3>
              <p className="text-slate-600">
                Choose from 6 different AI voices with customizable speed settings.
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-video text-secondary text-xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                MP4 Output
              </h3>
              <p className="text-slate-600">
                Get your audiobooks as downloadable MP4 files with visual elements.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
