import { useState, useEffect, useCallback, InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchInput Component - Debounced search input for filtering
 * Requirements: 4.1 - Display a search input field for glossary filtering
 */

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  /** Current search value */
  value: string;
  /** Callback when search value changes (debounced) */
  onChange: (value: string) => void;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Show clear button when input has value */
  showClear?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  debounceMs = 300,
  placeholder = 'Search...',
  showClear = true,
  className = '',
  ...inputProps
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with external value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange callback
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
    },
    []
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <Search className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Input */}
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-10 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        {...inputProps}
      />

      {/* Clear Button */}
      {showClear && localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
