import React, { useState, useEffect } from 'react';

interface DebouncedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export const DebouncedInput: React.FC<DebouncedInputProps> = ({
  value,
  onChange,
  debounceMs = 300,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync from parent when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce updates to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  return (
    <input
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
};

interface DebouncedTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export const DebouncedTextarea: React.FC<DebouncedTextareaProps> = ({
  value,
  onChange,
  debounceMs = 300,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync from parent when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounce updates to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange, value]);

  return (
    <textarea
      {...props}
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  );
};
