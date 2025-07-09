import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'

// Wait for DOM to be loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#add-pellet').addEventListener('click', () => sendFetch())
})


const sendFetch = async () => {
  const response = await fetch('http://localhost:3000/api/pellets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      {
         date: new Date().toISOString(),
         numberOfSacks: 1, 
        }
      )
  })

  if (response.ok) {
    const data = await response.json()
    console.log('Response:', data)
  } else {
    console.error('Error:', response.statusText)
  }
}