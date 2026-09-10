import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminApp } from "./admin/AdminApp.jsx";
import { AudienceChooser } from "./components/AudienceChooser.jsx";
import { AgentReserveLanding } from "./components/landing/AgentReserveLanding.jsx";
import { HomeownerLandingPage } from "./components/homeowner/HomeownerLandingPage.jsx";
import { ReservedPage } from "./pages/ReservedPage.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AudienceChooser />} />
        <Route path="/agents" element={<AgentReserveLanding />} />
        <Route path="/homeowners" element={<HomeownerLandingPage />} />
        <Route path="/reserved" element={<ReservedPage />} />
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    </BrowserRouter>
  );
}
