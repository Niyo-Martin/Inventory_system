import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import { User } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="content-area">
        <div className="user-profile">
          <User size={24} />
          <span>Admin User</span>
        </div>
        {children}
      </div>
    </div>
  );
};

export default MainLayout;