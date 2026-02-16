import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import Layout from "./layouts/Layout";
import LoginPage from "./pages/LoginPage";
import MessengerPage from "./pages/MessengerPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import PeoplePage from "./pages/PeoplePage";
import SettingsPage from "./pages/SettingsPage";
import TeamPage from "./pages/TeamPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { navigation } from "./navigation";

export default function App() {
  const allNavigationRoutes = navigation.flatMap((item) => [item, ...(item.children ?? [])]);
  const uniqueNavigationRoutes = allNavigationRoutes.filter(
    (item, index, items) => items.findIndex((candidate) => candidate.href === item.href) === index
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="/messenger" element={<MessengerPage />} />
            <Route path="/people" element={<PeoplePage />} />
            <Route path="/people/:serviceUserId" element={<PeoplePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/team" element={<TeamPage />} />
            {uniqueNavigationRoutes
              .filter(
                (item) =>
                  item.href !== "/" &&
                  item.href !== "/people" &&
                  item.href !== "/settings" &&
                  item.href !== "/team" &&
                  item.href !== "/messenger"
              )
              .map((item) => (
                <Route key={item.href} path={item.href} element={<PlaceholderPage title={item.name} />} />
              ))}
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
