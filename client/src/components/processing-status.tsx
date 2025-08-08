import { Card, CardContent } from "@/components/ui/card";

interface ProcessingStatusProps {
  audiobook: any;
}

export default function ProcessingStatus({ audiobook }: ProcessingStatusProps) {
  if (!audiobook || audiobook.status !== 'processing') {
    return null;
  }

  const getProcessingStep = (progress: number) => {
    if (progress < 20) return { step: 0, text: 'Extracting text from PDF' };
    if (progress < 80) return { step: 1, text: 'Converting text to speech' };
    return { step: 2, text: 'Creating MP4 video' };
  };

  const currentStep = getProcessingStep(audiobook.progress);
  
  const steps = [
    'Extracting text from PDF',
    'Converting text to speech',
    'Creating MP4 video'
  ];

  return (
    <Card className="mb-12 shadow-sm border border-slate-200">
      <CardContent className="p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <i className="fas fa-cog fa-spin text-2xl text-primary"></i>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Converting Your PDF</h3>
          <p className="text-slate-600 mb-6">Please wait while we process "{audiobook.title}"...</p>
          
          {/* Progress Steps */}
          <div className="max-w-md mx-auto space-y-4 mb-6">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  index < currentStep.step ? 'bg-accent' :
                  index === currentStep.step ? 'bg-primary' : 'bg-slate-300'
                }`}>
                  {index < currentStep.step ? (
                    <i className="fas fa-check text-white text-xs"></i>
                  ) : index === currentStep.step ? (
                    <i className="fas fa-spinner fa-spin text-white text-xs"></i>
                  ) : null}
                </div>
                <span className={`text-sm ${
                  index <= currentStep.step ? 'text-slate-700' : 'text-slate-500'
                }`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500" 
              style={{ width: `${audiobook.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-slate-500">
            Progress: {audiobook.progress}% complete
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
