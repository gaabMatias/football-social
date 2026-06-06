import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { LoginPage } from "@/pages/LoginPage";
import { FeedPage } from "@/pages/FeedPage";
import { AnalysisDetailPage } from "@/pages/AnalysisDetailPage";
import { NewAnalysisPage } from "@/pages/NewAnalysisPage";
import { AdminPage } from "@/pages/AdminPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <LoginPage initialTab="register" /> },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/feed" replace /> },
      { path: "/feed", element: <FeedPage /> },
      { path: "/analyses/new", element: <NewAnalysisPage /> },
      { path: "/analyses/:id", element: <AnalysisDetailPage /> },
      { path: "/admin", element: <AdminPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/feed" replace /> },
]);
