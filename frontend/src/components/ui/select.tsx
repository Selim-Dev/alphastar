import React, { createContext, useContext, useState } from 'react';

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue | undefined>(undefined);

function useSelectContext() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select');
  }
  return context;
}

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  defaultValue?: string;
  children: React.ReactNode;
}

export function Select({ value: controlledValue, onValueChange, defaultValue = '', children }: SelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);

  const value = controlledValue !== undefined ? controlledValue : internalValue;
  
  const handleValueChange = (newValue: string) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
    setOpen(false);
  };

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps {
  className?: string;
  children?: React.ReactNode;
  placeholder?: string;
}

export function SelectTrigger({ className = '', children, placeholder }: SelectTriggerProps) {
  const { value, open, setOpen } = useSelectContext();

  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={`w-full px-3 py-2.5 border-2 rounded-lg bg-background text-foreground shadow-sm
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/60 focus:shadow-md focus:shadow-primary/10
        hover:border-primary/40 hover:shadow-md
        transition-all duration-200 ease-out
        flex items-center justify-between
        ${className}`}
    >
      {children || <SelectValue placeholder={placeholder} />}
      <svg
        className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );
}

interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder = 'Select...' }: SelectValueProps) {
  const { value } = useSelectContext();
  return <span className={value ? '' : 'text-muted-foreground'}>{value || placeholder}</span>;
}

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ children, className = '' }: SelectContentProps) {
  const { open } = useSelectContext();

  if (!open) return null;

  return (
    <div
      className={`absolute z-50 w-full mt-1 bg-background border-2 border-border rounded-lg shadow-lg max-h-60 overflow-auto ${className}`}
    >
      {children}
    </div>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectItem({ value, children, className = '' }: SelectItemProps) {
  const { value: selectedValue, onValueChange } = useSelectContext();
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={`w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground transition-colors
        ${isSelected ? 'bg-accent/50 font-medium' : ''}
        ${className}`}
    >
      {children}
    </button>
  );
}
