import { useState } from "react";
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const PaymentForm = ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) => {
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
        description: "You are now subscribed to Pro!",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Card Information
        </label>
        <div className="border border-slate-300 rounded-lg p-3 bg-slate-50">
          <PaymentElement />
        </div>
      </div>
      
      <div className="flex space-x-3">
        <Button 
          type="button" 
          variant="outline" 
          className="flex-1"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="flex-1 bg-primary text-white hover:bg-blue-600"
          disabled={!stripe}
        >
          Start Pro Subscription
        </Button>
      </div>
    </form>
  );
};

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientSecret: string;
}

export default function PaymentModal({ isOpen, onClose, clientSecret }: PaymentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 text-center">
            Upgrade to Pro
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-primary to-accent p-6 rounded-xl text-white">
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
          
          {clientSecret && (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm onSuccess={onClose} onCancel={onClose} />
            </Elements>
          )}
          
          <p className="text-xs text-slate-500 text-center">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
