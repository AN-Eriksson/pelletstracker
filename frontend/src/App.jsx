import React, { useCallback, useEffect, useState } from 'react'
import PelletInputForm from './components/PelletInputForm'
import RecentInputsTable from './components/RecentInputsTable'
import LineChart from './components/LineChart'

export default function App() {
  const [entries, setEntries] = useState([])

  const loadAllEntries = useCallback(async () => {
    try {
      const res = await fetch('/api/pellets')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()

      setEntries(json?.data ?? json ?? [])
    } catch (err) {
      console.error('Failed to load entries', err)
    }
  }, [])

  useEffect(() => {
    loadAllEntries()
  }, [loadAllEntries])

  const addEntry = async (date, numberOfSacks) => {
    try {
      const res = await fetch('/api/pellets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, numberOfSacks })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      await loadAllEntries()
      return true
    } catch (err) {
      console.error(err)
      return false
    }
  }


  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Pellets Tracker</h1>

      <PelletInputForm onAddEntry={addEntry} />

      <RecentInputsTable entries={entries} />

      <LineChart entries={entries} />

    </div>
  )
}