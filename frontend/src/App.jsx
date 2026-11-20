import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import About from './pages/About.jsx';
import Features from './pages/Features.jsx';
import VideoLibrary from './pages/VideoLibrary.jsx';
import VideoLesson from './pages/VideoLesson.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import TrainerDashboard from './pages/TrainerDashboard.jsx';
import TraineeDashboard from './pages/TraineeDashboard.jsx';
import Documents from './pages/Documents.jsx';
import MicrodataLab from './pages/MicrodataLab.jsx';
import QuizTake from './pages/QuizTake.jsx';
import Courses from './pages/Courses.jsx';
import CourseView from './pages/CourseView.jsx';
import Profile from './pages/Profile.jsx';
import OfflineLibrary from './pages/OfflineLibrary.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<Features />} />
            <Route path="/videos" element={<VideoLibrary />} />
            <Route path="/videos/:id" element={<VideoLesson />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:id" element={<CourseView />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/trainer" element={<TrainerDashboard />} />
            <Route path="/trainee" element={<TraineeDashboard />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/quizzes" element={<MicrodataLab />} />
            <Route path="/quizzes/:id" element={<QuizTake />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/offline" element={<OfflineLibrary />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </SettingsProvider>
  );
}