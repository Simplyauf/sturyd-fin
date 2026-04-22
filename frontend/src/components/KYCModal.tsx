import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserCheck, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../api/fintech-api';

interface KYCModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface KYCFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  mobile: string;
  address1: string;
  city: string;
  state: string;
  zipCode: string;
  ssn: string;
  document?: string; // Base64
}

const KYCModal: React.FC<KYCModalProps> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState<KYCFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    mobile: '',
    address1: '',
    city: '',
    state: '',
    zipCode: '',
    ssn: '',
    document: '',
  });
  const [documentName, setDocumentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const set = (field: keyof KYCFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }

    setDocumentName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data:image/png;base64, prefix
      const base64Data = base64String.split(',')[1];
      setForm((prev) => ({ ...prev, document: base64Data }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.address1.length > 40) {
      setError('Street address must be 40 characters or less.');
      return;
    }
    if (!/^[a-zA-Z0-9]{3,10}$/.test(form.zipCode)) {
      setError('ZIP code must be 3–10 alphanumeric characters (e.g. 10013).');
      return;
    }

    setIsLoading(true);
    try {
      await api.verifyKyc(form);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'KYC verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Identity Verification</h2>
              <p className="text-xs text-gray-400">Required to send money internationally</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 px-6 gap-4"
            >
              <motion.div
                className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <CheckCircle className="w-8 h-8 text-green-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-gray-900">Verification Complete</h3>
              <p className="text-gray-400 text-sm text-center">Your identity has been verified successfully.</p>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              onSubmit={handleSubmit}
              className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
            >
              {/* Name Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={form.firstName}
                    onChange={set('firstName')}
                    placeholder="John"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={form.lastName}
                    onChange={set('lastName')}
                    placeholder="Doe"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 text-gray-900"
                  />
                </div>
              </div>

              {/* DOB + Phone Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={form.dateOfBirth}
                    onChange={set('dateOfBirth')}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={form.mobile}
                    onChange={set('mobile')}
                    placeholder="2125551234"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Street Address <span className="text-gray-400">(max 40 chars)</span></label>
                <input
                  type="text"
                  required
                  maxLength={40}
                  value={form.address1}
                  onChange={set('address1')}
                  placeholder="223 Grand St"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 text-gray-900"
                />
              </div>

              {/* City / State / Zip */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">City</label>
                  <input
                    type="text"
                    required
                    value={form.city}
                    onChange={set('city')}
                    placeholder="New York"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">State</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    value={form.state}
                    onChange={set('state')}
                    placeholder="NY"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">ZIP Code</label>
                  <input
                    type="text"
                    required
                    value={form.zipCode}
                    onChange={set('zipCode')}
                    placeholder="10013"
                  maxLength={10}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 text-gray-900"
                  />
                </div>
              </div>

              {/* SSN */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Social Security Number</label>
                <input
                  type="text"
                  required
                  value={form.ssn}
                  onChange={set('ssn')}
                  pattern='[0-9]{3}-[0-9]{2}-[0-9]{4}'
                  placeholder="123-45-6789"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-primary-500 text-gray-900"
                />
                <p className="text-[11px] text-gray-400 mt-1">Your SSN is encrypted and used only for identity verification.</p>
              </div>

              {/* Document Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Identification Document (Photo ID)</label>
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full border-2 border-dashed border-gray-200 group-hover:border-primary-300 rounded-xl px-4 py-4 text-center transition-colors bg-gray-50 group-hover:bg-primary-50">
                    {documentName ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-900 truncate max-w-[200px] font-medium">{documentName}</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-600 font-medium">Click to upload photo of ID</p>
                        <p className="text-[11px] text-gray-400 mt-1">PNG, JPG up to 2MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    Verify My Identity
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default KYCModal;
