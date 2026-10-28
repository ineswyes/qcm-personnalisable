import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Police Nunito incluse dans le site (fonctionne aussi sans connexion internet)
import '@fontsource/nunito/latin-600.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/nunito/latin-800.css'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
