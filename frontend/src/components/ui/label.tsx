import React from 'react';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ children, required, className = '', ...props }: LabelProps) {
  return (
    <label 
      className={`block text-sm font-medium text-foreground ${className}`}
      {...props}
    >
      {children}
      {required && <span className="text-red-600 dark:text-red-500 ml-1 font-bold">*</span>}
    </label>
  );
}
