import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SuccessPage from "./pages/SuccessPage";
import CancelPage from "./pages/CancelPage";
import { CartProvider } from "./context/CartContext";
import { Toaster } from "sonner";

function App() {
    return (
        <div className="App">
            <CartProvider>
                <BrowserRouter>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/success" element={<SuccessPage />} />
                        <Route path="/cancel" element={<CancelPage />} />
                    </Routes>
                </BrowserRouter>
                <Toaster
                    position="bottom-center"
                    toastOptions={{
                        style: {
                            background: "#FFFFFF",
                            color: "#2E2825",
                            border: "1px solid rgba(138,115,104,0.15)",
                            borderRadius: "20px",
                            fontFamily: "Outfit, sans-serif",
                            boxShadow:
                                "0 20px 40px rgba(138,115,104,0.15), inset 0 -3px 6px rgba(138,115,104,0.08), inset 0 3px 6px rgba(255,255,255,0.9)",
                        },
                    }}
                />
            </CartProvider>
        </div>
    );
}

export default App;
