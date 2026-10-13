import React from 'react';
import { Header } from './components/Header';
import { CheckoutPortal } from './components/CheckoutPortal';

export default function App() {
  const handleReturnToStore = () => {
    const params = new URLSearchParams(window.location.search);
    const returnUrl = params.get('return_url');
    if (returnUrl && !returnUrl.startsWith('http://gnbmentor.com') && !returnUrl.startsWith('https://gnbmentor.com/')) {
      window.location.href = returnUrl;
    } else {
      window.location.href = 'https://gnbmentor.com/shop';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 flex flex-col font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 antialiased">
      {/* Clean Top Navigation */}
      <Header onReturnToStore={handleReturnToStore} />

      {/* Dedicated Customer Checkout Experience for pay.gnbmentor.com */}
      <main className="flex-1">
        <CheckoutPortal />
      </main>

      {/* Customer Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} GNB Mentor.</span>
            <span aria-hidden="true">·</span>
            <span>All rights reserved.</span>
            <span aria-hidden="true">·</span>
            <a
              href="https://gnbmentor.com/shop"
              className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
            >
              gnbmentor.com/shop
            </a>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-slate-600 font-medium">Google Pay & Stripe Certified</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60 font-medium">
              256-Bit Bank-Grade Encryption
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
