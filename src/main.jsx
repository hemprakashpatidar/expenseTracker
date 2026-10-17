import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
// Global styles first, so component styles (loaded with App) can override them,
// e.g. fields that replace the global focus ring with their own focus border
import './styles/global.css';
import App from './App.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
