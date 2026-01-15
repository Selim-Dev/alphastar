import { ReactNode } from 'react';
import { FieldError } from 'react-hook-form';

interface FormFieldProps {
  label: ReactNode;
  error?: FieldError;
  children: ReactNode;
  required?: boolean;
}

export function FormField({ label, error, children, required }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </label>
      {children}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      className={`w-full px-3 py-2.5 border-2 rounded-lg bg-background text-foreground shadow-sm
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 focus:shadow-md focus:shadow-primary/10
        hover:border-primary/40 hover:shadow-md
        transition-all duration-200 ease-out
        placeholder:text-muted-foreground/70
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-input disabled:hover:shadow-sm
        ${error ? 'border-destructive focus:ring-destructive/30 focus:border-destructive/60' : 'border-input'} ${className}`}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options: { value: string; label: string }[];
}

export function Select({ error, options, className = '', ...props }: SelectProps) {
  return (
    <select
      className={`w-full px-3 py-2.5 border-2 rounded-lg bg-background text-foreground shadow-sm
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 focus:shadow-md focus:shadow-primary/10
        hover:border-primary/40 hover:shadow-md
        transition-all duration-200 ease-out cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-input disabled:hover:shadow-sm
        ${error ? 'border-destructive focus:ring-destructive/30 focus:border-destructive/60' : 'border-input'} ${className}`}
      {...props}
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}


interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className = '', ...props }: TextareaProps) {
  return (
    <textarea
      className={`w-full px-3 py-2.5 border-2 rounded-lg bg-background text-foreground shadow-sm resize-none
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 focus:shadow-md focus:shadow-primary/10
        hover:border-primary/40 hover:shadow-md
        transition-all duration-200 ease-out
        placeholder:text-muted-foreground/70
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-input disabled:hover:shadow-sm
        ${error ? 'border-destructive focus:ring-destructive/30 focus:border-destructive/60' : 'border-input'} ${className}`}
      rows={3}
      {...props}
    />
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'aviation';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

// Loading spinner component
function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin h-4 w-4 ${className}`}
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
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // Modern variant styles with gradient backgrounds, shadows, and smooth transitions
  const variants = {
    primary: [
      'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground',
      'border border-primary/20',
      'shadow-sm shadow-primary/10',
      'hover:from-primary/95 hover:to-primary/85 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5',
      'active:from-primary/90 active:to-primary/80 active:scale-[0.98] active:shadow-sm active:translate-y-0',
      'focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2',
      'disabled:from-primary/40 disabled:to-primary/30 disabled:cursor-not-allowed disabled:hover:shadow-sm disabled:hover:translate-y-0',
    ].join(' '),
    secondary: [
      'bg-gradient-to-r from-secondary to-secondary/90 text-secondary-foreground',
      'border border-secondary/30',
      'shadow-sm',
      'hover:from-secondary/95 hover:to-secondary/85 hover:shadow-md hover:-translate-y-0.5',
      'active:from-secondary/90 active:to-secondary/80 active:scale-[0.98] active:translate-y-0',
      'focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2',
      'disabled:from-secondary/40 disabled:to-secondary/30 disabled:cursor-not-allowed',
    ].join(' '),
    destructive: [
      'bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground',
      'border border-destructive/20',
      'shadow-sm shadow-destructive/10',
      'hover:from-destructive/95 hover:to-destructive/85 hover:shadow-lg hover:shadow-destructive/20 hover:-translate-y-0.5',
      'active:from-destructive/90 active:to-destructive/80 active:scale-[0.98] active:translate-y-0',
      'focus-visible:ring-2 focus-visible:ring-destructive/50 focus-visible:ring-offset-2',
      'disabled:from-destructive/40 disabled:to-destructive/30 disabled:cursor-not-allowed',
    ].join(' '),
    outline: [
      'bg-secondary/50 text-foreground',
      'border border-border/80',
      'shadow-sm',
      'hover:bg-secondary hover:border-primary/40 hover:text-foreground hover:shadow-md hover:-translate-y-0.5',
      'active:bg-secondary/80 active:scale-[0.98] active:translate-y-0',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:bg-secondary/30 disabled:text-muted-foreground disabled:border-border/50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
    ].join(' '),
    ghost: [
      'bg-transparent text-foreground',
      'border border-transparent',
      'hover:bg-accent/80 hover:text-accent-foreground hover:border-accent/20',
      'active:bg-accent active:scale-[0.98]',
      'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:text-muted-foreground disabled:cursor-not-allowed disabled:hover:bg-transparent',
    ].join(' '),
    aviation: [
      'bg-gradient-to-r from-aviation to-aviation/90 text-aviation-foreground',
      'border border-aviation/20',
      'shadow-sm shadow-aviation/10',
      'hover:from-aviation/95 hover:to-aviation/85 hover:shadow-lg hover:shadow-aviation/25 hover:-translate-y-0.5',
      'active:from-aviation/90 active:to-aviation/80 active:scale-[0.98] active:translate-y-0',
      'focus-visible:ring-2 focus-visible:ring-aviation/50 focus-visible:ring-offset-2',
      'disabled:from-aviation/40 disabled:to-aviation/30 disabled:cursor-not-allowed disabled:hover:shadow-sm',
    ].join(' '),
  };

  const sizes = {
    sm: 'h-8 px-3 text-sm gap-1.5',
    md: 'h-10 px-5 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
    icon: 'h-10 w-10 p-0',
  };

  const isDisabled = disabled || isLoading;

  return (
    <button
      className={`
        inline-flex items-center justify-center
        rounded-lg font-semibold
        transition-all duration-200 ease-out
        focus-visible:outline-none
        cursor-pointer
        disabled:pointer-events-none disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner className={children ? 'mr-2' : ''} />
          {children && <span>{children}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}
