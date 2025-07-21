import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Router, Route, Switch } from "wouter";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Logout from "./pages/Logout";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import AlarmManagement from "./pages/AlarmManagement";
import Dispatch from "./pages/Dispatch";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import Supervisors from "./pages/Supervisors";
import ShiftScheduling from "./pages/ShiftScheduling";
import MapView from "./pages/MapView";
import StandaloneMapView from "./pages/StandaloneMapView";
import SupervisorPanel from "./pages/SupervisorPanel";
import SupervisorDashboard from "./pages/SupervisorDashboard";
import SupervisorDirectAccess from "./pages/SupervisorDirectAccess";
import SupervisorStandaloneDashboard from "./pages/SupervisorStandaloneDashboard";
import SupervisorOnlyPanel from "./pages/SupervisorOnlyPanel";
import SupervisorApp from "./pages/SupervisorApp";
import OperatorShifts from "./pages/OperatorShifts";
import OperatorShiftsNew from "./pages/OperatorShiftsNew";
import OperatorShiftsStandalone from "./pages/OperatorShiftsStandalone";
import SupervisorShifts from "./pages/SupervisorShifts";
import SupervisorShiftsNew from "./pages/SupervisorShiftsNew";
import WeeklyShiftSchedule from "./pages/WeeklyShiftSchedule";
import MobileLogin from "./pages/MobileLogin";
import MobileDashboard from "./pages/MobileDashboard";
import MobileReport from "./pages/MobileReport";
import MobileEvidence from "./pages/MobileEvidence";
import MobileNotifications from "./pages/MobileNotifications";
import MobileScanQR from "./pages/MobileScanQR";
import MobileAssignmentDetail from "./pages/MobileAssignmentDetail";
import TimeBoxDemo from "./pages/TimeBoxDemo";
import ModernTimeBoxDemo from "./pages/ModernTimeBoxDemo";
import MobileTimeBoxDemo from "./pages/MobileTimeBoxDemo";
import VisualDemo from "./pages/VisualDemo";
import TestNotifications from "./pages/TestNotifications";
import VoiceNotificationTest from "./pages/VoiceNotificationTest";
import SimplePanel from "./pages/SimplePanel";
import ModernSupervisorDashboard from "./pages/ModernSupervisorDashboard";
import SmartUrban from "./pages/SmartUrban";
import CompletedReportView from "./pages/CompletedReportView";
import NotFound from "./pages/not-found";

import "./index.css";
import { UserRole } from "./lib/constants";
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationManager } from "./components/NotificationManager";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <TooltipProvider>
          <Router>
            <Switch>
              {/* Rutas públicas */}
              <Route path="/login" component={Login} />
              <Route path="/logout" component={Logout} />
              <Route path="/" component={Home} />
              <Route path="/map-view" component={MapView} />
              <Route path="/mobile/login" component={MobileLogin} />
              
              {/* Rutas protegidas */}
              <Route path="/dashboard">
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              </Route>
              
              <Route path="/alarms">
                <ProtectedRoute allowedRoles={[UserRole.ALARM_OPERATOR, UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <AlarmManagement />
                </ProtectedRoute>
              </Route>
              
              <Route path="/dispatch">
                <ProtectedRoute allowedRoles={[UserRole.DISPATCHER, UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <Dispatch />
                </ProtectedRoute>
              </Route>
              
              <Route path="/reports">
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <Reports />
                </ProtectedRoute>
              </Route>
              
              <Route path="/settings">
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <Settings />
                </ProtectedRoute>
              </Route>
              
              <Route path="/users">
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <UserManagement />
                </ProtectedRoute>
              </Route>
              
              <Route path="/supervisors">
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <Supervisors />
                </ProtectedRoute>
              </Route>
              
              <Route path="/shifts">
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <ShiftScheduling />
                </ProtectedRoute>
              </Route>
              
              <Route path="/map-standalone">
                <ProtectedRoute>
                  <StandaloneMapView />
                </ProtectedRoute>
              </Route>
              
              <Route path="/supervisor-panel">
                <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <SupervisorPanel />
                </ProtectedRoute>
              </Route>
              
              <Route path="/supervisor-dashboard">
                <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <SupervisorDashboard />
                </ProtectedRoute>
              </Route>
              
              <Route path="/supervisor-direct">
                <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <SupervisorDirectAccess />
                </ProtectedRoute>
              </Route>
              
              <Route path="/supervisor-standalone">
                <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <SupervisorStandaloneDashboard />
                </ProtectedRoute>
              </Route>
              
              <Route path="/supervisor-only">
                <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR]}>
                  <SupervisorOnlyPanel />
                </ProtectedRoute>
              </Route>
              
              <Route path="/supervisor-app">
                <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR, UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <SupervisorApp />
                </ProtectedRoute>
              </Route>
              
              <Route path="/operator-shifts">
                <ProtectedRoute>
                  <OperatorShifts />
                </ProtectedRoute>
              </Route>
              
              <Route path="/operator-shifts-new">
                <ProtectedRoute>
                  <OperatorShiftsNew />
                </ProtectedRoute>
              </Route>
              
              <Route path="/operator-shifts-standalone">
                <ProtectedRoute>
                  <OperatorShiftsStandalone />
                </ProtectedRoute>
              </Route>
              
              <Route path="/supervisor-shifts">
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DIRECTOR, UserRole.DISPATCHER]}>
                  <SupervisorShifts />
                </ProtectedRoute>
              </Route>
              
              <Route path="/supervisor-shifts-new">
                <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.DIRECTOR, UserRole.DISPATCHER]}>
                  <SupervisorShiftsNew />
                </ProtectedRoute>
              </Route>
              
              <Route path="/weekly-schedule">
                <ProtectedRoute>
                  <WeeklyShiftSchedule />
                </ProtectedRoute>
              </Route>
              
              <Route path="/mobile/dashboard">
                <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR]}>
                  <MobileDashboard />
                </ProtectedRoute>
              </Route>
              
              <Route path="/mobile/report">
                <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR]}>
                  <MobileReport />
                </ProtectedRoute>
              </Route>
              
              <Route path="/mobile/evidence">
                <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR]}>
                  <MobileEvidence />
                </ProtectedRoute>
              </Route>
              
              <Route path="/mobile/notifications">
                <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR]}>
                  <MobileNotifications />
                </ProtectedRoute>
              </Route>
              
              <Route path="/mobile/scan-qr">
                <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR]}>
                  <MobileScanQR />
                </ProtectedRoute>
              </Route>
              
              <Route path="/mobile/assignment/:id">
                <ProtectedRoute allowedRoles={[UserRole.SUPERVISOR]}>
                  <MobileAssignmentDetail />
                </ProtectedRoute>
              </Route>
              
              <Route path="/demo/timebox">
                <ProtectedRoute>
                  <TimeBoxDemo />
                </ProtectedRoute>
              </Route>
              
              <Route path="/demo/modern-timebox">
                <ProtectedRoute>
                  <ModernTimeBoxDemo />
                </ProtectedRoute>
              </Route>
              
              <Route path="/demo/mobile-timebox">
                <ProtectedRoute>
                  <MobileTimeBoxDemo />
                </ProtectedRoute>
              </Route>
              
              <Route path="/demo/visual">
                <ProtectedRoute>
                  <VisualDemo />
                </ProtectedRoute>
              </Route>
              
              <Route path="/test/notifications">
                <ProtectedRoute>
                  <TestNotifications />
                </ProtectedRoute>
              </Route>
              
              <Route path="/test/voice">
                <ProtectedRoute>
                  <VoiceNotificationTest />
                </ProtectedRoute>
              </Route>
              
              <Route path="/simple-panel">
                <ProtectedRoute>
                  <SimplePanel />
                </ProtectedRoute>
              </Route>
              
              <Route path="/modern-supervisor">
                <ProtectedRoute>
                  <ModernSupervisorDashboard />
                </ProtectedRoute>
              </Route>
              
              <Route path="/smart-urban">
                <ProtectedRoute allowedRoles={[UserRole.ALARM_OPERATOR, UserRole.ADMIN, UserRole.DIRECTOR]}>
                  <SmartUrban />
                </ProtectedRoute>
              </Route>
              
              <Route path="/completed-report/:id">
                <ProtectedRoute>
                  <CompletedReportView />
                </ProtectedRoute>
              </Route>
              
              <Route component={NotFound} />
            </Switch>
            <NotificationManager />
          </Router>
        </TooltipProvider>
      </NotificationProvider>
    </QueryClientProvider>
  );
}

export default App;