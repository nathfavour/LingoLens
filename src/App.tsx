import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { HomeView } from './views/HomeView';
import { TrainingView } from './views/TrainingView';
import { PronunciationView } from './views/PronunciationView';
import { LiveView } from './views/LiveView';
import { ProfileView } from './views/ProfileView';

function AppContent() {
  const [activeTab, setActiveTab] = useState('home');

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'training':
        return <TrainingView />;
      case 'pronunciation':
        return <PronunciationView />;
      case 'live':
        return <LiveView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
