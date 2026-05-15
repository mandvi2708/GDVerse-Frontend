import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './index.css';
import '@fontsource/inter';

const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID_HERE"; // User should replace this

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </BrowserRouter>
);

