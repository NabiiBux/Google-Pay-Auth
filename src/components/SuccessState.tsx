import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Printer,
  ShoppingBag,
} from 'lucide-react';
import { OrderDetails } from '../types';

interface SuccessStateProps {
  order: OrderDetails;
  transactionId: string;
  paymentMethod: 'google_pay' | 'card';
  onReset: () => void;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  order,
  transactionId,
  paymentMethod,
  onReset,
}) => {
  const [countdown, setCountdown] = useState(5);
  const [redirected, setRedirected] = useState(false);

  // Compute clean return URL to WooCommerce order-received endpoint with success parameters
  const targetReturnUrl = React.useMemo(() => {
    let base =
      order.return_url ||
      `https://gnbmentor.com/checkout/order-received/${order.order_id}/?key=${order.order_key || 'wc_order'}`;

    const separator = base.includes('?') ? '&' : '?';
    return `${base}${separator}payment_status=success&transaction_id=${encodeURIComponent(transactionId || '')}&tx=${encodeURIComponent(transactionId || '')}`;
  }, [order, transactionId]);

  useEffect(() => {
    if (countdown <= 0) {
      setRedirected(true);
      window.location.href = targetReturnUrl;
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, targetReturnUrl]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-xl mx-auto py-10 sm:py-16 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgba(15,23,42,0.06)] p-6 sm:p-10 text-center">
        {/* Animated Checkmark Badge */}
        <div className="w-20 h-20 bg-emerald-50 border-4 border-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
          <CheckCircle2 className="w-11 h-11" />
        </div>

        <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full mb-2">
          Payment Confirmed
        </span>

        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Thank you for your order!
        </h2>

        <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto leading-relaxed">
          Your payment of{' '}
          <strong className="text-slate-900 font-semibold">
            {order.currency} {order.amount.toFixed(2)}
          </strong>{' '}
          has been authorized and securely processed.
        </p>

        {/* Luxury Receipt Slip */}
        <div className="mt-8 bg-slate-50/90 border border-slate-200/70 rounded-2xl p-5 sm:p-6 text-left relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/60">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-900 font-sans">GNB Mentor Receipt</span>
            </div>
            <span className="font-mono text-xs font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              #{order.order_id}
            </span>
          </div>

          <div className="py-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Customer</span>
              <span className="font-semibold text-slate-800">{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Receipt Email</span>
              <span className="font-mono text-slate-800 truncate max-w-[200px]">
                {order.customer_email || 'On file with GNB Mentor'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Payment Channel</span>
              <span className="font-semibold text-slate-800">
                {paymentMethod === 'google_pay' ? 'Google Pay (1-Click)' : 'Credit / Debit Card'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction ID</span>
              <span className="font-mono text-slate-700 text-[11px] truncate max-w-[190px]">
                {transactionId || `tx_${Date.now()}`}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200/60">
              <span className="font-bold text-slate-900">Total Paid</span>
              <span className="font-mono font-bold text-base text-slate-950 tabular-nums">
                {order.currency} {order.amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Sync badge */}
          <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-emerald-700">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              WooCommerce order status synced
            </span>
            <span className="text-slate-400 font-sans">Live</span>
          </div>
        </div>

        {/* Auto Transfer Banner */}
        <div className="mt-6 p-4 rounded-2xl bg-indigo-50/90 border border-indigo-100 text-indigo-950 text-xs sm:text-sm">
          {redirected ? (
            <p className="font-medium">
              Redirecting you back to your order on <strong className="font-semibold">gnbmentor.com</strong>...
            </p>
          ) : (
            <p>
              Returning to <strong className="font-semibold">gnbmentor.com</strong> in{' '}
              <span className="font-extrabold text-indigo-600 text-base tabular-nums">
                {countdown}
              </span>{' '}
              seconds...
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 justify-center">
          {/* High Priority Google Workspace Onboarding Button */}
          <a
            href={`https://portal.gnbmentor.com/?order_id=${encodeURIComponent(order.order_id)}&customer_email=${encodeURIComponent(order.customer_email || '')}&amount=${order.amount}&currency=${order.currency}&order_key=${encodeURIComponent(order.order_key || '')}&status=paid`}
            className="inline-flex items-center justify-center gap-2 px-6 py-4 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl transition-all shadow-lg hover:shadow-blue-500/20 cursor-pointer"
          >
            <span>Set Up Google Workspace Users Now</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <a
              href={targetReturnUrl}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              <span>Return to Store</span>
            </a>
            <button
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>256-Bit SSL Encrypted on pay.gnbmentor.com</span>
        </div>
      </div>
    </div>
  );
};
