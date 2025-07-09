import React, { ReactNode } from 'react';
import Navbar from './Navbar';
import ProfileSection from './ProfileSection';

interface MainLayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  showProfile?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  activeTab, 
  onTabChange,
  showProfile = false
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      {/* Navigation */}
      <Navbar 
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showProfile ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
              {children}
            </div>
            <div className="lg:col-span-1">
              <ProfileSection />
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};

export default MainLayout;