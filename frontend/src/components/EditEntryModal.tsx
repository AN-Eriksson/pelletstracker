import React, { useState, useEffect } from 'react';

type Entry = {
  id: string | number;
  date: string;
  numberOfSacks: number;
};

interface Props {
  isOpen: boolean,
  entry: Entry,
  onClose: () => void,
  onSave: (entry: Entry) => Promise<void>,
  onDelete: (entry: Entry) => Promise<void>
}

const EditEntryModal = ({ isOpen, entry, onClose, onSave, onDelete }: Props) => {
  const [date, setDate] = useState('');
  const [numberOfSacks, setNumberOfSacks] = useState('');

  const toInputDate = (date?: string | Date): string => {
    if (!date) {
      return '';
    }

    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    const dateObject = new Date(date);
    return `${dateObject.getFullYear()}-${String(dateObject.getMonth() + 1).padStart(2, '0')}-${String(
      dateObject.getDate(),
    ).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!entry) {
      setDate('');
      setNumberOfSacks('');
      return;
    }

    setDate(toInputDate(entry.date));
    setNumberOfSacks(String(entry.numberOfSacks ?? ''));
  }, [entry]);

  if (!isOpen) {
    return null;
  }

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSave({
      ...entry,
      date,
      numberOfSacks: Number(numberOfSacks) || 0,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!entry) return;

    onDelete(entry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <form
        onSubmit={handleSave}
        className="relative bg-white rounded-md shadow-lg w-full max-w-md mx-4 p-6 z-10"
      >
        <h3 className="text-lg font-semibold mb-4">Redigera post</h3>

        <label className="block mb-3">
          <div className="text-xs text-gray-600 mb-1">Datum</div>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </label>

        <label className="block mb-4">
          <div className="text-xs text-gray-600 mb-1">Antal säckar</div>
          <input
            type="number"
            min="0"
            step="1"
            value={numberOfSacks}
            onChange={e => setNumberOfSacks(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
        </label>

        <div className="flex justify-between items-center gap-2">
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Spara
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border px-4 py-2 rounded hover:bg-gray-100"
            >
              Avbryt
            </button>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className="text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-50"
          >
            Ta bort
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEntryModal;
