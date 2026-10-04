import type { ReactNode } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import CustomersPage from "./pages/Customers/CustomersPage";
import LoginPage from "./pages/Login/LoginPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import OrdersPage from "./pages/Orders/OrdersPage";
import MachinesPage from "./pages/Machines/MachinesPage";
import DeliveriesPage from "./pages/Deliveries/DeliveriesPage";
import InventoryPage from "./pages/Inventory/InventoryPage";
import ExpensesPage from "./pages/Expenses/ExpensesPage";
import ServicesPage from "./pages/Services/ServicesPage";
import OperationsPage from "./pages/Operations/OperationsPage";
import FinancePage from "./pages/Finance/FinancePage";
import SettingsPage from "./pages/Settings/SettingsPage";
import UsersPage from "./pages/Users/UsersPage";

function AdminRoute({ children }: { children: ReactNode }) {
  return <ProtectedRoute allowedRoles={["ADMIN"]}><AppLayout>{children}</AppLayout></ProtectedRoute>;
}

export default function App() {
  return <AuthProvider><BrowserRouter><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<AdminRoute><DashboardPage /></AdminRoute>} />
    <Route path="/orders" element={<AdminRoute><OrdersPage /></AdminRoute>} />
    <Route path="/customers" element={<AdminRoute><CustomersPage /></AdminRoute>} />

    <Route path="/operations" element={<AdminRoute><OperationsPage /></AdminRoute>} />
    <Route path="/operations/services" element={<AdminRoute><ServicesPage /></AdminRoute>} />
    <Route path="/operations/inventory" element={<AdminRoute><InventoryPage /></AdminRoute>} />
    <Route path="/operations/deliveries" element={<AdminRoute><DeliveriesPage /></AdminRoute>} />
    <Route path="/operations/machines" element={<AdminRoute><MachinesPage /></AdminRoute>} />

    <Route path="/finance" element={<AdminRoute><FinancePage /></AdminRoute>} />
    <Route path="/finance/expenses" element={<AdminRoute><ExpensesPage /></AdminRoute>} />

    <Route path="/settings" element={<AdminRoute><SettingsPage /></AdminRoute>} />
    <Route path="/settings/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
  </Routes></BrowserRouter></AuthProvider>;
}
