import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import HomePage from './pages/Home'
import { AuthProvider } from './auth/AuthContext'

function App() {

  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  )
}

export default App
