"use client";

import React from 'react';

interface StableInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onFocus?: (e: React.FocusEvent) => void;
  onClick?: (e: React.MouseEvent) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
}

// Input complètement uncontrolled - aucune synchronisation avec React
const StableInput: React.FC<StableInputProps> = ({ 
  id, 
  value, 
  onChange, 
  onKeyDown, 
  onFocus, 
  onClick, 
  placeholder, 
  className, 
  multiline, 
  rows 
}) => {
  const handleInput = (e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.currentTarget.value;
    onChange(newValue);
  };

  const commonProps = {
    'data-block-id': id,
    className: className || "w-full bg-transparent border-none outline-none resize-none min-h-[1.5rem] focus:outline-none",
    defaultValue: value,
    onInput: handleInput,
    onKeyDown,
    onFocus,
    onClick,
    placeholder: placeholder || '',
  };

  if (multiline) {
    return (
      <textarea
        {...commonProps}
        rows={rows || 1}
      />
    );
  }

  return (
    <input
      {...commonProps}
      type="text"
    />
  );
};

export default StableInput;