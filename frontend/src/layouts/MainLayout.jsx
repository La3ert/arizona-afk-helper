import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sider from '../components/sider/Sider.jsx';
import { MobileHeader } from '../components/mobileHeader/MobileHeader.jsx'; // Убедись, что путь правильный

export default function MainLayout({ sessionData, settings, onToggle }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isOnline = sessionData?.isOnline ?? true;
  const isAuthorized = sessionData?.isAuthorized ?? true;

  return (
    <div className='main-layout'>
      <MobileHeader
        isOnline={isOnline}
        isAuthorized={isAuthorized}
        onOpenSidebar={() => setIsSidebarOpen(true)}
      />

      <Sider
        sessionData={sessionData}
        settings={settings}
        onToggle={onToggle}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className='content-area'>
        <Outlet />
      </div>

      {isSidebarOpen && <div className='mobile-overlay' onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
}
