import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const rootElement = document.getElementById('root')
const root = ReactDOM.createRoot(rootElement)

function showFatalError(error) {
  console.error(error)
  rootElement.innerHTML = `
    <div style="min-height:100vh;padding:32px;background:#080b14;color:#f1f2f6;font-family:Arial,sans-serif;white-space:pre-wrap;">
      <h1 style="margin:0 0 16px;font-size:28px;">STAZE failed to start</h1>
      <p style="margin:0 0 16px;color:#b8c0cc;">A runtime error blocked the app from rendering.</p>
      <pre style="padding:16px;border-radius:16px;background:rgba(255,255,255,0.06);overflow:auto;">${String(error?.stack || error?.message || error)}</pre>
    </div>
  `
}

window.addEventListener('error', (event) => {
  showFatalError(event.error || event.message)
})

window.addEventListener('unhandledrejection', (event) => {
  showFatalError(event.reason || 'Unhandled promise rejection')
})

import('./App.jsx')
  .then(({ default: App }) => {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  })
  .catch(showFatalError)
