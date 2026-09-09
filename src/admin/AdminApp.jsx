import { Navigate, Route, Routes } from "react-router-dom";
import { AdminShell } from "./AdminShell.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { PricingPage } from "./pages/PricingPage.jsx";
import { WaitlistPage } from "./pages/WaitlistPage.jsx";

export function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<LoginPage />} />
      <Route element={<AdminShell />}>
        <Route index element={<Navigate to="waitlist" replace />} />
        <Route path="waitlist" element={<WaitlistPage />} />
        <Route path="pricing" element={<PricingPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin/waitlist" replace />} />
    </Routes>
  );
}
