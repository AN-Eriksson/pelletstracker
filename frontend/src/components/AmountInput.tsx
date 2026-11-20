import React, { useId } from 'react';
import SegmentedControl, { Option } from './SegmentedControl';
import { Unit, amountToKg, formatKg } from '../lib/units';

interface Props {
  unit: Unit;
  onUnitChange: (unit: Unit) => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  quickPicks?: boolean; // 1–4 sack buttons, for daily consumption
}

const UNIT_OPTIONS: Option<Unit>[] = [
  { value: 'sacks', label: 'Säckar' },
  { value: 'kg', label: 'kg' },
];

const QUICK_PICKS: Option<string>[] = ['1', '2', '3', '4'].map(n => ({ value: n, label: n }));

/**
 * Amount in sacks or kg, shared by the consumption and delivery forms.
 * The parent keeps the state and converts with amountToKg.
 */
export default function AmountInput({
  unit,
  onUnitChange,
  amount,
  onAmountChange,
  quickPicks = false,
}: Props) {
  const amountId = useId();
  const amountKg = amountToKg(amount, unit);
  const showQuickPicks = quickPicks && unit === 'sacks';

  // The entered amount means something else in the other unit, so start over
  const handleUnitChange = (newUnit: Unit) => {
    onUnitChange(newUnit);
    onAmountChange('');
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label htmlFor={amountId} className="block text-sm font-medium text-gray-700">
          {unit === 'sacks' ? 'Antal säckar' : 'Mängd (kg)'}
        </label>
        {unit === 'sacks' && amountKg !== null && (
          <span className="text-xs text-gray-500 tabular-nums">= {formatKg(amountKg)}</span>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <SegmentedControl
          label="Enhet"
          options={UNIT_OPTIONS}
          value={unit}
          onChange={handleUnitChange}
          size="md"
          fullWidth
        />
        <div className="flex gap-2">
          {showQuickPicks && (
            <SegmentedControl
              label="Välj antal säckar"
              options={QUICK_PICKS}
              value={amount}
              onChange={onAmountChange}
              size="md"
              fullWidth
            />
          )}
          <input
            id={amountId}
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={e => onAmountChange(e.target.value)}
            min="1"
            step="1"
            required
            className={`${showQuickPicks ? '' : 'flex-1 sm:flex-none'} w-20 min-h-11 px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
      </div>
    </div>
  );
}
