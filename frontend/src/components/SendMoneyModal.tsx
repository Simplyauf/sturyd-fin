import { useState } from 'react';
import { api } from '../api/fintech-api';
import type { Beneficiary } from '../api/fintech-api';
import { X, Send, CreditCard, ChevronRight, Globe, IndianRupee, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  beneficiaries: Beneficiary[];
}

const SendMoneyModal: React.FC<Props> = ({ onClose, onSuccess, beneficiaries }) => {
  const [step, setStep] = useState(1);
  const [selectedBen, setSelectedBen] = useState<Beneficiary | null>(null);
  const [amountUsd, setAmountUsd] = useState('100');
  const [quote, setQuote] = useState<{ exchangeRate: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.getQuote().then(setQuote);
  }, []);

  const handleInitiate = async () => {
    if (!selectedBen) return;
    setIsSubmitting(true);
    try {
      const res = await api.initiateTransfer(selectedBen.id, parseFloat(amountUsd));
      setResult(res);
      setStep(3);
    } catch (err) {
      alert('Failed to initiate transfer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateCompletion = async () => {
    if (!result) return;
    setIsSubmitting(true);
    try {
      await api.simulatePaymentSuccess(result.transactionId);
      setStep(4);
      setTimeout(onSuccess, 2000);
    } catch (err) {
      alert('Simulation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white border border-gray-200 rounded-3xl overflow-hidden relative shadow-lg"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10">
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Send className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Transfer Money</h3>
              <p className="text-xs text-gray-500">United States → India (USD → INR)</p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                 <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-primary-500' : 'bg-gray-200'}`} />
              </div>
            ))}
          </div>

          {/* Step 1: Recipient */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Recipient</label>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {beneficiaries.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50 rounded-2xl text-gray-500 text-sm border border-gray-100">
                      Please add a beneficiary in the dashboard first.
                    </div>
                  ) : (
                    beneficiaries.map((ben) => (
                      <button
                        key={ben.id}
                        onClick={() => setSelectedBen(ben)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          selectedBen?.id === ben.id 
                            ? 'bg-primary-50 border-primary-500' 
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-sm text-gray-900">{ben.name}</p>
                          <p className="text-xs text-gray-500">{ben.bankName} · {ben.ifscCode}</p>
                        </div>
                        {selectedBen?.id === ben.id && <ChevronRight className="w-5 h-5 text-primary-500" />}
                      </button>
                    ))
                  )}
                </div>
              </div>
              <button
                disabled={!selectedBen}
                onClick={() => setStep(2)}
                className="w-full bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-700 text-white font-semibold py-4 rounded-2xl shadow-sm transition-all"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Amount */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">You send</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <span className="font-bold text-gray-900">USD</span>
                      <span className="text-gray-300">|</span>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={amountUsd}
                      onChange={(e) => setAmountUsd(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-2xl py-5 pl-28 pr-6 text-2xl font-bold text-gray-900 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                    <IndianRupee className="w-3 h-3 text-primary-500" />
                    <span>1 USD = <strong className="text-gray-900">{quote?.exchangeRate || '...'}</strong> INR</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200"></div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Recipient gets</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                      <IndianRupee className="w-5 h-5 text-gray-400" />
                      <span className="font-bold text-gray-900">INR</span>
                      <span className="text-gray-300">|</span>
                    </div>
                    <div className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-5 pl-28 pr-6 text-2xl font-bold text-primary-600">
                      {quote ? (parseFloat(amountUsd || '0') * quote.exchangeRate).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '...'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm border border-gray-200">
                <div className="flex justify-between text-gray-500">
                  <span>Transfer fee</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Arrival time</span>
                  <span className="text-gray-900 font-medium">Within minutes</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Provider</span>
                  <span className="text-gray-900 font-medium">Nium</span>
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-4 rounded-2xl transition-all">
                  Back
                </button>
                <button
                  onClick={handleInitiate}
                  disabled={isSubmitting || !quote}
                  className="flex-[2] bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirm Transfer'}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Payment Pending */}
          {step === 3 && result && (
            <div className="space-y-6 text-center">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                <CreditCard className="w-10 h-10 text-primary-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Funding Required</h3>
                <p className="text-gray-500 mt-2 text-sm">Please follow the instructions below to fund your transfer via your Nium Wallet.</p>
              </div>
              
              <div className="bg-primary-50 border border-primary-200 p-4 rounded-2xl text-xs font-mono text-primary-700 text-left whitespace-pre-wrap">
                {result.paymentInstructions}
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={handleSimulateCompletion}
                  disabled={isSubmitting}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : '⚡ Simulate Nium Pay-in Success'}
                </button>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Demo only · Nium triggers this via webhook in production</p>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm animate-bounce">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold mb-3 text-gray-900">Money Sent!</h3>
              <p className="text-gray-500">
                ₹{result && quote ? (parseFloat(amountUsd) * quote.exchangeRate).toLocaleString('en-IN', { maximumFractionDigits: 0 }) : ''} dispatched to <strong className="text-gray-900">{selectedBen?.name}</strong> via Nium IMPS. Closing in a moment...
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default SendMoneyModal;
