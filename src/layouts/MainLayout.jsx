import { Outlet } from 'react-router-dom';
import Sider from '../components/sider/Sider.jsx';

export default function MainLayout() {
  return (
    <div className='main-layout'>
      <Sider />

      <div className='content-area'>
        <Outlet />
      </div>
    </div>
  );
}
