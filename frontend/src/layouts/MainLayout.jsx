import { Outlet } from 'react-router-dom';
import Sider from '../components/sider/Sider.jsx';

export default function MainLayout({ sessionData, settings, onToggle }) {
  return (
    <div className='main-layout'>
      <Sider sessionData={sessionData} settings={settings} onToggle={onToggle} />

      <div className='content-area'>
        <Outlet />
      </div>
    </div>
  );
}
