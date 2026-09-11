import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import VoiceAssistant from "./components/VoiceAssistant.jsx";

import FarmerHome from "./pages/farmer/FarmerHome.jsx";
import BookToken from "./pages/farmer/BookToken.jsx";
import MyToken from "./pages/farmer/MyToken.jsx";
import MyHistory from "./pages/farmer/MyHistory.jsx";
import BankDetails from "./pages/farmer/BankDetails.jsx";

import OperatorHome from "./pages/operator/OperatorHome.jsx";
import LiveQueue from "./pages/operator/LiveQueue.jsx";
import Procurement from "./pages/operator/Procurement.jsx";
import BookingRecords from "./pages/operator/BookingRecords.jsx";
import ScanCheckIn from "./pages/operator/ScanCheckIn.jsx";

import AdminHome from "./pages/admin/AdminHome.jsx";
import Centres from "./pages/admin/Centres.jsx";
import CropsMSP from "./pages/admin/CropsMSP.jsx";
import AllBookings from "./pages/admin/AllBookings.jsx";
import AuditLog from "./pages/admin/AuditLog.jsx";
import Analytics from "./pages/admin/Analytics.jsx";
import Payouts from "./pages/admin/Payouts.jsx";
import Profile from "./pages/Profile.jsx";
import Landing from "./pages/Landing.jsx";

function RoleRoute({ allow, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/app/home" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="empty">Loading KrishiQueue...</div>;

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Navigate to="/app/home" replace /> : <Login />} />

        <Route
          path="/app"
          element={
            <RoleRoute>
              <Layout />
            </RoleRoute>
          }
        >
          <Route path="home" element={<RoleHome />} />
          <Route path="profile" element={<Profile />} />

          {/* Farmer-only */}
          <Route path="book" element={<RoleRoute allow={["farmer"]}><BookToken /></RoleRoute>} />
          <Route path="bank" element={<RoleRoute allow={["farmer"]}><BankDetails /></RoleRoute>} />

          {/* Shared path, different component per role */}
          <Route path="queue" element={<RoleQueue />} />
          <Route path="history" element={<RoleHistory />} />

          {/* Operator-only */}
          <Route path="process" element={<RoleRoute allow={["operator"]}><Procurement /></RoleRoute>} />
          <Route path="scan" element={<RoleRoute allow={["operator"]}><ScanCheckIn /></RoleRoute>} />

          {/* Admin-only */}
          <Route path="centres" element={<RoleRoute allow={["admin"]}><Centres /></RoleRoute>} />
          <Route path="crops" element={<RoleRoute allow={["admin"]}><CropsMSP /></RoleRoute>} />
          <Route path="audit" element={<RoleRoute allow={["admin"]}><AuditLog /></RoleRoute>} />
          <Route path="analytics" element={<RoleRoute allow={["admin"]}><Analytics /></RoleRoute>} />
          <Route path="payouts" element={<RoleRoute allow={["admin"]}><Payouts /></RoleRoute>} />
        </Route>

        <Route path="*" element={<Navigate to={user ? "/app/home" : "/login"} replace />} />
      </Routes>
      {user && user.role === "farmer" && <VoiceAssistant />}
    </>
  );
}

function RoleHome() {
  const { user } = useAuth();
  if (user.role === "farmer") return <FarmerHome />;
  if (user.role === "operator") return <OperatorHome />;
  return <AdminHome />;
}

function RoleQueue() {
  const { user } = useAuth();
  if (user.role === "operator") return <LiveQueue />;
  if (user.role === "farmer") return <MyToken />;
  return <Navigate to="/app/home" replace />;
}

function RoleHistory() {
  const { user } = useAuth();
  if (user.role === "farmer") return <MyHistory />;
  if (user.role === "admin") return <AllBookings />;
  return <BookingRecords />;
}
