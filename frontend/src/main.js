import './style.css'
import { createChart } from './lineChart.js'

// Wait for DOM to be loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#pelletEntry-form').addEventListener('submit', handleFormSubmit)
  document.querySelector('#refresh-btn').addEventListener('click', loadAllEntries)

  // Set today's date as default
  setFormDateToToday()
  
  // Load entries when page loads
  loadAllEntries()

  // Create the chart
  createChart()
})

const handleFormSubmit = async (event) => {
  event.preventDefault() // Prevent default form submission
  
  const formData = new FormData(event.target)
  const date = formData.get('date')
  const numberOfSacks = parseInt(formData.get('numberOfSacks'))
  
  const success = await sendFetch(date, numberOfSacks)
  
  // If successful, reload the table
  if (success) {
    loadAllEntries()
  }
}

const sendFetch = async (date, numberOfSacks) => {
  try {
    const response = await fetch('http://localhost:3000/api/pellets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: date,
        numberOfSacks: numberOfSacks
      })
    })

    if (response.ok) {
      const data = await response.json()
      console.log('Response:', data)
      
      // Clear the form after successful submission
      document.querySelector('#pelletEntry-form').reset()
      setFormDateToToday()

      return true
    } else {
      console.error('Error:', response.statusText)
      return false
    }
  } catch (error) {
    console.error('Network error:', error)
    return false
  }
}

const loadAllEntries = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/pellets', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const entries = await response.json()
      displayEntries(entries)
    } else {
      console.error('Error loading entries:', response.statusText)
    }
  } catch (error) {
    console.error('Network error:', error)
  }
}

const displayEntries = (entries) => {
  const tbody = document.querySelector('#pelletEntries-tbody')
  
  // Clear existing rows
  tbody.innerHTML = ''
  
  if (entries.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" class="border border-gray-300 px-4 py-2 text-center text-gray-500">No entries found</td></tr>'
    return
  }

  // Sort the entries by date in descending order
  entries.sort((a, b) => new Date(b.date) - new Date(a.date))
  
  // Add rows for each entry
  entries.forEach(entry => {
    const row = document.createElement('tr')
    row.className = 'hover:bg-gray-50'

    const dateWithTimeStripped = new Date(entry.date).toISOString().split('T')[0]
    
    row.innerHTML = `
      <td class="border border-gray-300 px-4 py-2">${dateWithTimeStripped}</td>
      <td class="border border-gray-300 px-4 py-2">${entry.numberOfSacks}</td>
    `
    
    tbody.appendChild(row)
  })
}

function setFormDateToToday() {
  const today = new Date().toISOString().split('T')[0]
  document.querySelector('#pelletEntry-date').value = today
}
