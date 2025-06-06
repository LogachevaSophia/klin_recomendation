import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@gravity-ui/uikit';
import { Recommendations } from './components/Recommendations/Recommendations';
import { FlowEditorPage } from './pages/FlowEditorPage';
import '@gravity-ui/uikit/styles/fonts.css';
import '@gravity-ui/uikit/styles/styles.css';
import './App.css';

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Recommendations />} />
            <Route path="/flow-editor/:id" element={<FlowEditorPage />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;