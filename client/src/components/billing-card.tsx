import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface BillingCardProps {
  user: any;
}

export default function BillingCard({ user }: BillingCardProps) {
  const handleManageSubscription = () => {
    // TODO: Implement Stripe customer portal
    window.open('https://billing.stripe.com/p/login/test_28o7sUgby', '_blank');
  };

  const handleUpgradePlan = () => {
    window.location.href = '/subscribe';
  };

  // Mock usage data - in a real app, this would come from the API
  const usage = {
    audiobooks: 8,
    maxAudiobooks: 50,
    storage: 2.4, // GB
    maxStorage: 10, // GB
  };

  const audiobookProgress = (usage.audiobooks / usage.maxAudiobooks) * 100;
  const storageProgress = (usage.storage / usage.maxStorage) * 100;

  return (
    <Card className="shadow-sm border border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">
          Your Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">
              {user?.stripeSubscriptionId ? 'Pro Plan' : 'Free Trial'}
            </span>
            <span className="text-sm font-semibold text-accent">
              {user?.stripeSubscriptionId ? '$19/month' : 'Free'}
            </span>
          </div>
          {user?.stripeSubscriptionId && (
            <p className="text-xs text-slate-500">
              Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <div className="border-t border-slate-200 pt-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">AudioBooks this month</span>
              <span className="text-sm font-medium">
                {usage.audiobooks} / {usage.maxAudiobooks}
              </span>
            </div>
            <Progress value={audiobookProgress} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-600">Storage used</span>
              <span className="text-sm font-medium">
                {usage.storage} GB / {usage.maxStorage} GB
              </span>
            </div>
            <Progress value={storageProgress} className="h-2" />
          </div>
        </div>
        
        <div className="pt-4 space-y-2">
          {user?.stripeSubscriptionId ? (
            <>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleManageSubscription}
              >
                Manage Subscription
              </Button>
            </>
          ) : (
            <Button 
              className="w-full bg-primary hover:bg-blue-600 text-white"
              onClick={handleUpgradePlan}
            >
              Upgrade to Pro
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
