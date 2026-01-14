import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

// ============================================================================
// SCHEMA & TYPES
// ============================================================================

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// ============================================================================
// ICONS (inline SVG for zero dependencies)
// ============================================================================

const MailIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const LockIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const PlaneIcon = ({ className = '' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
  </svg>
);

const SpinnerIcon = ({ className = '' }: { className?: string }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

// ============================================================================
// FEATURE HIGHLIGHTS DATA
// ============================================================================

const features = [
  { icon: '📊', text: 'Availability Tracking' },
  { icon: '✈️', text: 'Utilization & Flight Cycles' },
  { icon: '🔧', text: 'Maintenance & AOG Insights' },
  { icon: '🔐', text: 'Role-based Secure Access' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LoginPage() {
  const [serverError, setServerError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Animation mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');

    try {
      await login(data);
      // Note: rememberMe can be used to extend token expiry on backend
      navigate(from, { replace: true });
    } catch (err) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Login failed. Please check your credentials and try again.');
      }
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-4">
          <SpinnerIcon className="w-10 h-10 text-cyan-400" />
          <p className="text-slate-400 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Don't render form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-slate-900">
      {/* ================================================================== */}
      {/* LEFT SIDE - Hero Section (hidden on mobile) */}
      {/* ================================================================== */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        {/* Background Image */}
        <img
          src="/aviation.jpg"
          alt="Aviation"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-slate-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/40" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          {/* Logo & Tagline */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/25">
                <PlaneIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">AlphaStar</h1>
                <p className="text-cyan-400 text-sm font-medium">KBOS Dashboard</p>
              </div>
            </div>
          </div>

          {/* Main Tagline */}
          <div className="max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Aircraft KPIs &<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Operational Intelligence
              </span>
            </h2>
            <p className="text-slate-300 text-lg mb-10 leading-relaxed">
              Real-time fleet performance monitoring, maintenance tracking, and data-driven insights for aviation excellence.
            </p>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 transition-all duration-300 hover:bg-white/10 hover:border-cyan-500/30"
                >
                  <span className="text-xl">{feature.icon}</span>
                  <span className="text-slate-200 text-sm font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Stats (optional visual flair) */}
          <div className="flex gap-8 pt-8 border-t border-white/10">
            <div>
              <p className="text-3xl font-bold text-white">17+</p>
              <p className="text-slate-400 text-sm">Aircraft Tracked</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">99.2%</p>
              <p className="text-slate-400 text-sm">System Uptime</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">24/7</p>
              <p className="text-slate-400 text-sm">Monitoring</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================== */}
      {/* RIGHT SIDE - Login Form */}
      {/* ================================================================== */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col">
        {/* Mobile Header (visible only on mobile) */}
        <div className="lg:hidden p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <PlaneIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">AlphaStar KBOS</h1>
              <p className="text-cyan-400 text-xs">Aviation KPI Dashboard</p>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div
            className={`w-full max-w-md transition-all duration-700 ease-out ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {/* Login Card */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 shadow-2xl shadow-black/20">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Sign in</h2>
                <p className="text-slate-400">Access your operations dashboard</p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                {/* Server Error */}
                {serverError && (
                  <div 
                    className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3"
                    role="alert"
                  >
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Email Field */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <MailIcon className={`w-5 h-5 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-500'}`} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@alphastarav.com"
                      className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border text-white placeholder-slate-500 transition-all duration-200 outline-none
                        ${errors.email 
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-600/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 hover:border-slate-500'
                        }`}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-red-400 text-sm flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-400" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <LockIcon className={`w-5 h-5 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-500'}`} />
                    </div>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className={`w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900/50 border text-white placeholder-slate-500 transition-all duration-200 outline-none
                        ${errors.password 
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-2 focus:ring-red-500/20' 
                          : 'border-slate-600/50 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 hover:border-slate-500'
                        }`}
                      {...register('password')}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-sm flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-red-400" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border border-slate-600 bg-slate-900/50 peer-checked:bg-cyan-500 peer-checked:border-cyan-500 transition-all peer-focus:ring-2 peer-focus:ring-cyan-500/20 group-hover:border-slate-500">
                        {rememberMe && <CheckIcon className="w-5 h-5 text-white p-0.5" />}
                      </div>
                    </div>
                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                      Remember me
                    </span>
                  </label>
                  
                  {/* 
                    TODO: Implement forgot password flow
                    - Create /forgot-password route
                    - Add email submission form
                    - Backend: POST /api/auth/forgot-password
                  */}
                  <button
                    type="button"
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors focus:outline-none focus:underline"
                    onClick={() => {
                      // Placeholder: navigate to forgot password page
                      alert('Forgot password feature coming soon. Contact your administrator.');
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <SpinnerIcon className="w-5 h-5" />
                      Signing in...
                    </span>
                  ) : (
                    'Sign in'
                  )}
                </button>

                {/* SSO Placeholder */}
                {/* 
                  TODO: SSO Integration
                  - Configure OAuth provider (Azure AD, Okta, etc.)
                  - Add callback route handling
                  - Backend: GET /api/auth/sso/:provider
                */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-slate-800/50 text-slate-500">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled
                  className="w-full py-3 px-4 rounded-xl font-medium text-slate-400 bg-slate-800/50 border border-slate-700/50 cursor-not-allowed opacity-60 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  SSO Login (Coming Soon)
                </button>
              </form>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-slate-500 mt-6">
              Need access? Contact your{' '}
              <a href="mailto:admin@alphastarav.com" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                system administrator
              </a>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center">
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} AlphaStar Aviation Services. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
