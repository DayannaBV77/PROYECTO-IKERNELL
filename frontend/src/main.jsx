import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './estilos/tokens.css';
import './estilos/base.css';
import App from './App.jsx';

createRoot(document.getElementById('raiz')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
