import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminApp } from "./admin/AdminApp.jsx";
import { AgentReserveLanding } from "./components/landing/AgentReserveLanding.jsx";
import { ReservedPage } from "./pages/ReservedPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AgentReserveLanding />} />
        <Route path="/reserved" element={<ReservedPage />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}
