import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import { useAuth } from "@/hooks/useAuth";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "You are subscribed!",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Card Information
        </label>
        <div className="border border-slate-300 rounded-lg p-3 bg-white">
          <PaymentElement />
        </div>
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-primary text-white py-3 hover:bg-blue-600"
        disabled={!stripe}
      >
        Start Pro Subscription
      </Button>
    </form>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    apiRequest("POST", "/api/get-or-create-subscription", {})
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error("Error creating subscription:", error);
      });
  }, []);

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navigation isAuthenticated={true} user={user} />
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navigation isAuthenticated={true} user={user} />
      
      <main className="max-w-md mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-slate-900 text-center">
              Upgrade to Pro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="bg-gradient-to-r from-primary to-accent p-6 rounded-xl text-white mb-4">
                <h4 className="text-lg font-semibold mb-2">Pro Plan</h4>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">$19</span>
                  <span className="text-sm opacity-90 ml-1">/month</span>
                </div>
              </div>
              
              <ul className="space-y-2 text-sm">
                <li className="flex items-center space-x-2">
                  <i className="fas fa-check text-accent"></i>
                  <span>50 AudioBooks per month</span>
                </li>
                <li className="flex items-center space-x-2">
                  <i className="fas fa-check text-accent"></i>
                  <span>10 GB storage</span>
                </li>
                <li className="flex items-center space-x-2">
                  <i className="fas fa-check text-accent"></i>
                  <span>Premium voice options</span>
                </li>
                <li className="flex items-center space-x-2">
                  <i className="fas fa-check text-accent"></i>
                  <span>Priority processing</span>
                </li>
              </ul>
            </div>
            
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <SubscribeForm />
            </Elements>
            
            <p className="text-xs text-slate-500 text-center mt-4">
              Secure payment powered by Stripe. Cancel anytime.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
