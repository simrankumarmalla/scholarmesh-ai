import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateWorkspacePage from './pages/CreateWorkspacePage';
import WorkspaceDetailPage from './pages/WorkspaceDetailPage';
import SavedSynthesesPage from './pages/SavedSynthesesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
          <Navbar />
          
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspaces/new"
                element={
                  <ProtectedRoute>
                    <CreateWorkspacePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspaces/:id"
                element={
                  <ProtectedRoute>
                    <WorkspaceDetailPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/saved-syntheses"
                element={
                  <ProtectedRoute>
                    <SavedSynthesesPage />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Academic Footer */}
          <footer className="border-t border-slate-900 bg-slate-950/80 py-6 px-4 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-300">ScholarMesh AI</span>
                <span>•</span>
                <span>Multi-Source Literature Synthesis & Evidence Discovery</span>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span>Model: Google Gemini 2.5 Flash</span>
                <span>•</span>
                <span>Zero Unverified Hallucinations</span>
              </div>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
