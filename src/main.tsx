import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// number inputs accept digits only (no e, +, -) and ignore the mouse wheel
document.addEventListener("keydown", e => {
  const t = e.target as HTMLInputElement;
  if (t.tagName === "INPUT" && t.type === "number" && ["e", "E", "+", "-"].includes(e.key)) e.preventDefault();
});
document.addEventListener("wheel", () => {
  const a = document.activeElement as HTMLInputElement | null;
  if (a?.tagName === "INPUT" && a.type === "number") a.blur();
}, { passive: true });
