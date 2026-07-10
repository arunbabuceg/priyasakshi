import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import HomePage from '@/pages/HomePage.jsx';
import SuccessPage from '@/pages/SuccessPage.jsx';
import CancelPage from '@/pages/CancelPage.jsx';
import { CartProvider } from '@/context/CartContext.jsx';
import './App.css';

export default function App() {
  return (
    <div className="App">
      <CartProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/cancel" element={<CancelPage />} />
        </Routes>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#FFFFFF',
              color: '#2E2825',
              border: '1px solid rgba(138,115,104,0.15)',
              borderRadius: '20px',
              fontFamily: 'Outfit, sans-serif',
              boxShadow:
                '0 20px 40px rgba(138,115,104,0.15), inset 0 -3px 6px rgba(138,115,104,0.08), inset 0 3px 6px rgba(255,255,255,0.9)',
            },
          }}
        />
      </CartProvider>
    </div>
  );
}
