import React from 'react';

export type Option<T> = { value: T; label: string };

interface Props<T extends string> {
  options: Option<T>[];
  value: T; // no button is highlighted when value matches none of the options
  onChange: (value: T) => void;
  label: string;
  size?: 'sm' | 'md'; // md matches the height of the form inputs
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = 'sm',
}: Props<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex rounded-md border border-gray-300">
      {options.map(option => (
        <button
          key={option.value}
          type="button"
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
          className={`${size === 'md' ? 'min-w-10 py-2' : 'py-1'} px-3 text-sm first:rounded-l-md last:rounded-r-md ${
            option.value === value ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
