// import React from 'react'; // Not needed in newer React versions
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@gravity-ui/uikit';
import { Recommendations } from './components/Recommendations/Recommendations';
import { FlowEditorPage } from './pages/FlowEditorPage';
import { ComparisonPage } from './pages/ComparisonPage';
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
            <Route path="/recommendations" element={<Recommendations />} />
            <Route path="/flow-editor/:id" element={<FlowEditorPage />} />
            <Route path="/compare" element={<ComparisonPage />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
};

export default App;