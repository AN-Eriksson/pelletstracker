import React, { useEffect, useRef } from 'react'
import { LineChartManager } from '../lib/LineChartManager.js'

export default function LineChart({ entries = [] }) {
  const canvasIdRef = useRef(`linechart-${Math.random().toString(36).slice(2, 9)}`)
  const managerRef = useRef(null)

  useEffect(() => {
    managerRef.current = new LineChartManager(canvasIdRef.current)
    managerRef.current.createChart(entries)
    return () => {
      managerRef.current.destroy()
    }
  }, [])

  useEffect(() => {
    managerRef.current.updateChart(entries)
  }, [entries])

  return (
    <div className="mt-6">
      <canvas id={canvasIdRef.current} />
    </div>
  )
}