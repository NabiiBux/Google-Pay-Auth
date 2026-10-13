import React from 'react';
import { Wifi } from 'lucide-react';

interface CardPreviewProps {
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  brand: 'visa' | 'mastercard' | 'amex' | 'discover' | 'generic';
}

export const CardPreview: React.FC<CardPreviewProps> = ({
  cardNumber,
  cardName,
  cardExpiry,
  brand,
}) => {
  // Format card number to display 16 digits with bullet placeholders
  const cleanDigits = cardNumber.replace(/\D/g, '');
  const padded = (cleanDigits + '••••••••••••••••').slice(0, 16);
  const formattedNumber = `${padded.slice(0, 4)} ${padded.slice(4, 8)} ${padded.slice(8, 12)} ${padded.slice(12, 16)}`;

  const displayName = cardName.trim() ? cardName.toUpperCase() : 'YOUR NAME';
  const displayExpiry = cardExpiry.trim() ? cardExpiry : 'MM/YY';

  return (
    <div className="relative w-full aspect-[1.586/1] max-w-sm mx-auto rounded-2xl p-5 sm:p-6 text-white shadow-xl overflow-hidden transition-all duration-300 transform select-none bg-gradient-to-br from-slate-900 via-slate-800 to-zinc-900 border border-slate-700/60">
      {/* Subtle background radial glow */}
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Row: Chip, Contactless Icon, and Card Network Logo */}
      <div className="relative flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          {/* Gold EMV Chip Graphic */}
          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 p-0.5 shadow-inner border border-amber-300/60 flex flex-col justify-between overflow-hidden">
            <div className="h-1.5 border-b border-amber-600/40 flex">
              <div className="w-1/2 border-r border-amber-600/40"></div>
            </div>
            <div className="h-2 flex">
              <div className="w-1/3 border-r border-amber-600/40"></div>
              <div className="w-1/3 border-r border-amber-600/40"></div>
            </div>
            <div className="h-1.5 border-t border-amber-600/40 flex">
              <div className="w-1/2 border-r border-amber-600/40"></div>
            </div>
          </div>
          {/* Contactless Wave Icon */}
          <Wifi className="w-4 h-4 text-slate-400 rotate-90" />
        </div>

        {/* Brand Network Logo */}
        <div className="h-7 flex items-center justify-end">
          {brand === 'visa' && (
            <span className="text-xl font-black italic tracking-wider text-white font-sans">
              VISA
            </span>
          )}
          {brand === 'mastercard' && (
            <div className="flex items-center -space-x-2">
              <div className="w-6 h-6 rounded-full bg-rose-500 opacity-90 shadow-xs"></div>
              <div className="w-6 h-6 rounded-full bg-amber-400 opacity-90 shadow-xs"></div>
            </div>
          )}
          {brand === 'amex' && (
            <span className="text-xs font-bold uppercase tracking-widest bg-cyan-700/80 px-2 py-1 rounded text-white border border-cyan-500/40">
              AMEX
            </span>
          )}
          {brand === 'discover' && (
            <span className="text-xs font-extrabold uppercase tracking-widest text-orange-400">
              DISCOVER
            </span>
          )}
          {brand === 'generic' && (
            <span className="text-xs font-medium tracking-wider text-slate-400 uppercase">
              DEBIT / CREDIT
            </span>
          )}
        </div>
      </div>

      {/* Center: Card Number */}
      <div className="relative my-4 sm:my-5 z-10">
        <p className="font-mono text-base sm:text-lg tracking-widest text-slate-100 font-medium tabular-nums drop-shadow-xs">
          {formattedNumber}
        </p>
      </div>

      {/* Bottom Row: Cardholder Name & Expiry */}
      <div className="relative flex items-end justify-between z-10 pt-1">
        <div className="max-w-[190px]">
          <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans">
            Cardholder Name
          </span>
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-slate-100 truncate font-sans">
            {displayName}
          </p>
        </div>

        <div className="text-right">
          <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-sans">
            Expires
          </span>
          <p className="text-xs sm:text-sm font-mono tracking-wider text-slate-100 font-medium tabular-nums">
            {displayExpiry}
          </p>
        </div>
      </div>
    </div>
  );
};
