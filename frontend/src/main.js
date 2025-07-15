import './style.css'
import { createChart } from './lineChart.js'

// Wait for DOM to be loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', async () => {
  document.querySelector('#pelletEntry-form').addEventListener('submit', handleFormSubmit)

  // Set today's date as default
  setFormDateToToday()
  
  // Load entries when page loads
  await updateTableAndChart()
})

/**
 * Handles the form submission event for adding new data.
 * Prevents the default form submission, extracts form data,
 * sends the data using sendFetch, and updates the table and chart on success.
 *
 * @param {Event} event - The form submission event.
 * @returns {Promise<void>}
 */
const handleFormSubmit = async (event) => {
  event.preventDefault() // Prevent default form submission
  
  const formData = new FormData(event.target)
  const date = formData.get('date')
  const numberOfSacks = parseInt(formData.get('numberOfSacks'))
  
  const success = await sendFetch(date, numberOfSacks)
  
  // If successful, reload the table and chart
  if (success) {
    updateTableAndChart()
  }
}

/**
 * Sends a POST request to the pellets API with the provided date and number of sacks.
 *
 * @async
 * @function
 * @param {string} date - The date of the pellet entry in YYYY-MM-DD format.
 * @param {number} numberOfSacks - The number of sacks to record.
 * @returns {Promise<boolean>} Returns true if the request was successful, otherwise false.
 */
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

/**
 * Asynchronously fetches all pellet entries from the backend API.
 *
 * Sends a GET request to 'http://localhost:3000/api/pellets' and returns the data property
 * from the JSON response if the request is successful.
 *
 * @async
 * @function
 * @returns {Promise<Array|undefined>} A promise that resolves to an array of entries if successful, or undefined if an error occurs.
 */
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

      return entries.data

    } else {
      console.error('Error loading entries:', response.statusText)
    }
  } catch (error) {
    console.error('Network error:', error)
  }
}

/**
 * Displays a list of pellet entries in the table body with id 'pelletEntries-tbody'.
 * Clears existing rows, sorts entries by date (descending), and adds a row for each entry.
 * If no entries are found, displays a message indicating no entries.
 *
 * @param {Array<{date: string, numberOfSacks: number}>} data - Array of pellet entry objects to display.
 */
const displayEntries = (data) => {
  const tbody = document.querySelector('#pelletEntries-tbody')
  
  // Clear existing rows
  tbody.innerHTML = ''
  
  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="2" class="border border-gray-300 px-4 py-2 text-center text-gray-500">No entries found</td></tr>'
    return
  }

  // Sort the entries by date in descending order
  data.sort((a, b) => new Date(b.date) - new Date(a.date))
  
  // Add rows for each entry
  data.forEach(entry => {
    const row = document.createElement('tr')
    row.className = 'hover:bg-gray-50'

    const dateWithTimeStripped = stripTimeFromDate(entry.date)
    
    row.innerHTML = `
      <td class="border border-gray-300 px-4 py-2">${dateWithTimeStripped}</td>
      <td class="border border-gray-300 px-4 py-2">${entry.numberOfSacks}</td>
    `
    
    tbody.appendChild(row)
  })
}

/**
 * Asynchronously loads all entries, updates the displayed entries table,
 * and creates or updates the chart with the loaded data.
 *
 * @async
 * @function updateTableAndChart
 * @returns {Promise<void>} A promise that resolves when the table and chart have been updated.
 */
async function updateTableAndChart() {
  const entriesData = await loadAllEntries()
  displayEntries(entriesData)
  createChart(entriesData)
}

/**
 * Sets the value of the input element with the ID 'pelletEntry-date' to today's date
 * in the format 'YYYY-MM-DD'.
 *
 */
function setFormDateToToday() {
  const today = new Date().toISOString().split('T')[0]
  document.querySelector('#pelletEntry-date').value = today
}

/**
 * Removes the time component from an ISO date string, returning only the date part.
 *
 * @param {string} dateString - The ISO date string (e.g., "2024-06-01T12:34:56Z").
 * @returns {string} The date part of the string in "YYYY-MM-DD" format.
 */
export function stripTimeFromDate(dateString) {
  return dateString.split('T')[0]
}