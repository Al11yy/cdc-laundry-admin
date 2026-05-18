import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// INI KABEL UTAMANYA CUI! Wajib ada biar Tailwind & Shadcn jalan
import './index.css' 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)