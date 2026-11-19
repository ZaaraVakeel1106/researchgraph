import React, { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { ResearchWorkspace } from './pages/ResearchWorkspace';
import { ToastProvider } from './components/common/ToastProvider';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>('landing');
  const [searchQuery, setSearchQuery] = useState('');

  const handleStartSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('workspace');
  };

  return <ToastProvider><>
    <div className="rg-app w-full h-full min-h-screen">
      {currentView === 'landing' ? (
        <LandingPage onSearchTopic={handleStartSearch} />
      ) : (
        <ResearchWorkspace
          initialQuery={searchQuery}
          onBackToHome={() => setCurrentView('landing')}
        />
      )}
    </div>
  </></ToastProvider>;
};

export default App;
