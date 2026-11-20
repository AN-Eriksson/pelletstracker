import React from 'react';

export type Option<T> = { value: T; label: string };

interface Props<T extends string> {
  options: Option<T>[];
  value: T; // no button is highlighted when value matches none of the options
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md'; // md matches the height of the form inputs
  fullWidth?: boolean; // stretch the buttons across the row on mobile
}

// Every size is at least 44px tall on mobile (Apple's minimum tap target); sm shrinks from the sm breakpoint
const SIZE_CLASSES = {
  sm: 'min-h-11 sm:min-h-0 py-1',
  md: 'min-h-11 min-w-11 py-2',
};

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'sm',
  fullWidth = false,
}: Props<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className={`${fullWidth ? 'flex w-full sm:inline-flex sm:w-auto' : 'inline-flex'} rounded-md border border-gray-300 bg-white`}
    >
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`${SIZE_CLASSES[size]} ${fullWidth ? 'flex-1 sm:flex-none' : ''} px-3 text-sm first:rounded-l-md last:rounded-r-md ${
            option.value === value ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
