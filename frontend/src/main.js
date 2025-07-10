import './style.css'

// Wait for DOM to be loaded before attaching event listeners
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#pellet-form').addEventListener('submit', handleFormSubmit)
})

const handleFormSubmit = async (event) => {
  event.preventDefault() // Prevent default form submission
  
  const formData = new FormData(event.target)
  const date = formData.get('date')
  const numberOfSacks = parseInt(formData.get('numberOfSacks'))
  
  await sendFetch(date, numberOfSacks)
}

const sendFetch = async (date, numberOfSacks) => {
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
    document.querySelector('#pellet-form').reset()
  } else {
    console.error('Error:', response.statusText)
  }
}