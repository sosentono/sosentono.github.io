import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { executeRecaptcha } from '../../utils/recaptcha';

interface AdminLoginPortalProps {
  onBackToHome: () => void;
}

export const AdminLoginPortal: React.FC<AdminLoginPortalProps> = ({ onBackToHome }) => {
  const { login, authError, clearAuthError } = useAuth();

  const [emailInput, setEmailInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearAuthError();
    try {
      // Execute reCAPTCHA Enterprise protection
      await executeRecaptcha('LOGIN');
      const success = await login(emailInput, password);
      if (!success) {
        setIsSubmitting(false);
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-12">
      {/* Back Button at top */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 font-semibold text-xs transition-colors shadow-2xs group"
        >
          <ArrowLeft className="w-4 h-4 text-stone-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Kembali ke Halaman Sebelumnya</span>
        </button>
      </div>

      {/* Main Login Card - Secret & Secure */}
      <div className="bg-white rounded-3xl border-2 border-[#C9A84C]/35 shadow-lg p-6 sm:p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold mb-3.5 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Panel Administrator Trah Sosentono</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-serif-title text-stone-900">
            Pusat Akses & Pengelolaan Keluarga
          </h1>
          <div className="w-12 h-0.5 bg-[#C9A84C] mx-auto my-2.5 rounded-full" />
          <p className="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
            Silakan masukkan kredensial pengurus terdaftar untuk mengakses wit silsilah, arsip kabar, agenda Pon, dan piweling leluhur.
          </p>
        </div>

        {/* Error notification */}
        {authError && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed font-medium">{authError}</div>
            <button
              onClick={clearAuthError}
              className="text-rose-400 hover:text-rose-700 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email or Username */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Email Pengurus *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                autoComplete="username"
                placeholder="cth. nama@domain.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C] transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
              Kata Sandi Pengurus *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Masukkan password admin"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-300 text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50 focus:border-[#C9A84C] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 transition-colors"
                title={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-[#20150b] hover:bg-[#322013] text-[#E8D4A0] font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
          >
            <ShieldCheck className="w-4 h-4 text-[#C9A84C]" />
            <span>{isSubmitting ? 'Memverifikasi...' : 'Verifikasi & Masuk Panel'}</span>
          </button>
        </form>
      </div>

      {/* Back button at bottom */}
      <div className="text-center mt-6">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-900 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Utama</span>
        </button>
      </div>
    </div>
  );
};
