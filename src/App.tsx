import { MainLayout } from "@/components/layout/main-layout";
import { InstallPrompt } from "@/components/InstallPrompt";
import { AuthProvider } from "@/lib/auth-context";
import { EventFeedPage } from "@/pages/events-feed";
import { EventDetailPage } from "@/pages/event-detail";
import { CreateEventPage } from "@/pages/create-event";
import { ProfilePage } from "@/pages/profile";
import { SearchPage } from "@/pages/search";
import { SettingsPage } from "@/pages/settings";
import { CommunityGuidelinesPage } from "@/pages/community-guidelines";
import ResetPassword from "@/pages/ResetPassword"; // REMOVED BRACKETS
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router"; // Reverted to react-router for v7 compatibility
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@/components/ui/toast";

const queryClient = new QueryClient();

// Inner component — must be inside BrowserRouter to call useLocation
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <main key={location.pathname} className="tab-transition">
      <Routes>
        {/* Reset Password flow */}
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<EventFeedPage />} />
          <Route path="/events" element={<EventFeedPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/host" element={<CreateEventPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/community-guidelines" element={<CommunityGuidelinesPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </main>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <InstallPrompt />
          <BrowserRouter>
            <AnimatedRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
