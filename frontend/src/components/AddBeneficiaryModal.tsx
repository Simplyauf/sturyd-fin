import { useState } from 'react';
import { api } from '../api/fintech-api';
import { X, UserPlus, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

const AddBeneficiaryModal: React.FC<Props> = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    address: '',
    city: '',
    postcode: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.bankName || !form.accountNumber || !form.ifscCode || !form.address || !form.city || !form.postcode) {
      setError('All fields are required.');
      return;
    }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifscCode.toUpperCase())) {
      setError('IFSC code must be 11 characters (e.g. HDFC0001234).');
      return;
    }
    if (form.ifscCode.toUpperCase().startsWith('HDFC') && form.accountNumber.length !== 14) {
      setError('HDFC Bank account numbers must be exactly 14 digits.');
      return;
    }
    if (!/^\d{9,18}$/.test(form.accountNumber)) {
      setError('Account number must be 9–18 digits.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await api.addBeneficiary({ ...form, ifscCode: form.ifscCode.toUpperCase() });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to add beneficiary');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white border border-gray-200 rounded-3xl overflow-hidden relative shadow-lg"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Add Recipient</h3>
              <p className="text-xs text-gray-500">India bank account (INR)</p>
            </div>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h4 className="text-xl font-bold mb-2 text-gray-900">Recipient Added!</h4>
              <p className="text-gray-500 text-sm">{form.name} has been saved to your recipients.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Full Name', name: 'name', placeholder: 'e.g. Rahul Sharma' },
                { label: 'Bank Name', name: 'bankName', placeholder: 'e.g. HDFC Bank' },
                { label: 'Account Number', name: 'accountNumber', placeholder: 'e.g. 50200012345678' },
                { label: 'IFSC Code', name: 'ifscCode', placeholder: 'e.g. HDFC0001234' },
                { label: 'Street Address', name: 'address', placeholder: 'e.g. 123 Main St' },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    name={field.name}
                    value={form[field.name as keyof typeof form]}
                    onChange={handleChange}
                    placeholder={field.placeholder}
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    placeholder="e.g. Mumbai"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Postcode</label>
                  <input
                    type="text"
                    name="postcode"
                    value={form.postcode}
                    onChange={handleChange}
                    placeholder="e.g. 400001"
                    className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-2 rounded-xl">{error}</p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Save Recipient'
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AddBeneficiaryModal;
