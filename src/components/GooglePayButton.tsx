import React from 'react';

interface GooglePayButtonProps {
  amount: number;
  currency: string;
  onClick: () => void;
  isLoading: boolean;
  disabled?: boolean;
  className?: string;
}

export const GooglePayButton: React.FC<GooglePayButtonProps> = ({
  amount,
  currency,
  onClick,
  isLoading,
  disabled = false,
  className = '',
}) => {
  return (
    <div className={`w-full space-y-2.5 ${className}`}>
      {/* Official Google Pay Brand Compliant Button - Color #000, High-Contrast, Rounded Edges, Subtle Hover Scale Animation */}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || isLoading}
        aria-label={`Buy with Google Pay ${currency} ${amount.toFixed(2)}`}
        style={{ backgroundColor: '#000000' }}
        className="group relative w-full h-14 bg-[#000] hover:bg-[#111111] active:bg-[#1a1a1a] text-white font-medium rounded-2xl flex items-center justify-center transition-all duration-200 ease-out transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl hover:shadow-black/30 border border-neutral-900 ring-1 ring-black/10 hover:ring-black/25 cursor-pointer overflow-hidden select-none disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
      >
        {/* High-contrast specular sheen */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />

        {isLoading ? (
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-sm font-semibold tracking-wide text-white">
              Connecting to Google Pay...
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-3 px-5 w-full">
            {/* Google Brand 'Buy with' Prefix */}
            <span className="text-[15px] sm:text-base font-medium tracking-tight text-white/95">
              Buy with
            </span>

            {/* Official Google Pay Logo Lockup */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Official 4-Color Google 'G' Mark */}
              <svg
                className="w-5 h-5 shrink-0 filter drop-shadow-sm"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M23.49 12.275c0-.85-.076-1.666-.218-2.455H12v4.643h6.44c-.277 1.492-1.121 2.756-2.386 3.603v2.996h3.864c2.261-2.082 3.572-5.147 3.572-8.787z"
                  fill="#4285F4"
                />
                <path
                  d="M12 24c3.24 0 5.957-1.074 7.942-2.915l-3.864-2.996c-1.075.72-2.45 1.145-4.078 1.145-3.136 0-5.79-2.118-6.738-4.969H1.27v3.093C3.255 21.282 7.33 24 12 24z"
                  fill="#34A853"
                />
                <path
                  d="M5.262 14.265A7.17 7.17 0 0 1 4.886 12c0-.785.136-1.55.376-2.265V6.642H1.27A11.966 11.966 0 0 0 0 12c0 1.933.464 3.764 1.27 5.358l3.992-3.093z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 4.77c1.762 0 3.344.606 4.587 1.794l3.44-3.44C17.952 1.22 15.235 0 12 0 7.33 0 3.255 2.718 1.27 6.642l3.992 3.093C6.21 6.888 8.864 4.77 12 4.77z"
                  fill="#EA4335"
                />
              </svg>

              {/* Official 'Pay' Typography Wordmark */}
              <svg
                className="h-4.5 w-auto"
                viewBox="0 0 45 18"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* P */}
                <path
                  d="M0 0h5.7c2.9 0 5.1 1.9 5.1 4.7 0 2.8-2.2 4.7-5.1 4.7H2.8v8.6H0V0zm2.8 6.9h2.9c1.4 0 2.4-.9 2.4-2.2 0-1.3-1-2.2-2.4-2.2H2.8v4.4z"
                  fill="#FFFFFF"
                />
                {/* a */}
                <path
                  d="M19.9 5.6v2.3c-.9-.8-2.1-1.3-3.4-1.3-2.6 0-4.6 2-4.6 4.8 0 2.8 2 4.8 4.6 4.8 1.3 0 2.5-.5 3.4-1.3v1.3h2.6V5.6h-2.6zm-2.5 8.3c-1.4 0-2.5-1.1-2.5-2.6s1.1-2.6 2.5-2.6 2.5 1.1 2.5 2.6-1.1 2.6-2.5 2.6z"
                  fill="#FFFFFF"
                />
                {/* y */}
                <path
                  d="M32.8 5.6l-4.5 11.2c-.7 1.8-1.9 2.6-3.7 2.6-.7 0-1.4-.2-1.9-.4l.6-2.2c.4.2.8.3 1.3.3.9 0 1.5-.4 1.9-1.5l.3-.8-4.5-9.2h2.9l3 6.8 3-6.8h2.9z"
                  fill="#FFFFFF"
                />
              </svg>
            </div>

            {/* High-contrast Separator dot */}
            <span className="text-neutral-500 font-normal">·</span>

            {/* High-contrast Price Badge */}
            <span className="text-[15px] sm:text-base font-bold tracking-tight text-white font-mono tabular-nums">
              {currency} {amount.toFixed(2)}
            </span>
          </div>
        )}
      </button>

      {/* Trust & compliance caption */}
      <div className="flex items-center justify-between px-1.5 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Direct Biometric / 1-Tap Authorization
        </span>
        <span className="text-slate-400 font-medium">Encrypted Google token</span>
      </div>
    </div>
  );
};
