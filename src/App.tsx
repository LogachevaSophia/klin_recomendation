// import React from 'react'; // Not needed in newer React versions
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@gravity-ui/uikit';
import { Recommendations } from './components/Recommendations/Recommendations';
import { FlowEditorPage } from './pages/FlowEditorPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ExecutionPage } from './pages/ExecutionPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';
import './App.css';

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recommendations"
              element={
                <ProtectedRoute>
                  <Recommendations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flow-editor/:id"
              element={
                <ProtectedRoute>
                  <FlowEditorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/execution/:id"
              element={
                <ProtectedRoute>
                  <ExecutionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/compare"
              element={
                <ProtectedRoute>
                  <ComparisonPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;