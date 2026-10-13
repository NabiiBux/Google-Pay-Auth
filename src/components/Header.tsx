import React from 'react';
import { ArrowLeft, Shield, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onReturnToStore: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReturnToStore }) => {
  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Wordmark & Official Verification */}
          <div className="flex items-center gap-3">
            <a
              href="https://gnbmentor.com/shop"
              className="flex items-center gap-2.5 text-slate-900 group"
              title="Return to GNB Mentor Shop"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-sm group-hover:bg-slate-800 transition-colors">
                G
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight text-slate-900 font-sans">
                    GNB Mentor
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 hidden sm:block">
                  pay.gnbmentor.com · Official Checkout
                </span>
              </div>
            </a>
          </div>

          {/* Security & Encryption Reassurance (Center) */}
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>256-Bit SSL Encrypted & PCI-DSS Compliant</span>
          </div>

          {/* Customer Action: Back to store */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onReturnToStore}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-950 bg-slate-100 hover:bg-slate-200/80 py-2 px-3.5 rounded-xl transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Store</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
