import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { configureTroikaText } from './utils/troikaText'

configureTroikaText()

const app = <App />

createRoot(document.getElementById('root')!).render(
  import.meta.env.DEV ? app : (
    <StrictMode>
      {app}
    </StrictMode>
  ),
)
