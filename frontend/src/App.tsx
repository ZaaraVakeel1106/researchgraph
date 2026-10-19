import React, { useState } from 'react';
import { LandingPage } from './pages/LandingPage';
import { ResearchWorkspace } from './pages/ResearchWorkspace';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'workspace'>('landing');
  const [searchQuery, setSearchQuery] = useState('Graph Neural Networks');

  const handleStartSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('workspace');
  };

  return (
    <div className="w-full h-full min-h-screen bg-[#fafafa]">
      {currentView === 'landing' ? (
        <LandingPage onSearchTopic={handleStartSearch} />
      ) : (
        <ResearchWorkspace
          initialQuery={searchQuery}
          onBackToHome={() => setCurrentView('landing')}
        />
      )}
    </div>
  );
};

export default App;
