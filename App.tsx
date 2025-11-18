
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AdminLayout from './components/layout/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import JobApplications from './pages/JobApplications';
import AdmissionApplications from './pages/AdmissionApplications';
import ContactMessages from './pages/ContactMessages';
import Gallery from './pages/Gallery';
import HomePageVideo from './pages/HomePageVideo';
import HomePageBanner from './pages/HomePageBanner';

const AppRoutes: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();
    
    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }
    
    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }
    
    return (
        <Routes>
            <Route element={<AdminLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/job-applications" element={<JobApplications />} />
                <Route path="/admission-applications" element={<AdmissionApplications />} />
                <Route path="/contact-messages" element={<ContactMessages />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/homepage-video" element={<HomePageVideo />} />
                <Route path="/homepage-banner" element={<HomePageBanner />} />
                <Route path="*" element={<Navigate to="/" />} />
            </Route>
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <HashRouter>
                <AppRoutes />
            </HashRouter>
        </AuthProvider>
    );
}

export default App;
