import Header from './Header.jsx';
import Navbar from './Navbar.jsx';
import Toggles from './Toggles.jsx';

export default function Sider({ sessionData, settings, onToggle }) {
  return (
    <aside className='sider'>
      <Header player={sessionData?.player} />
      <Navbar />
      <Toggles settings={settings} onToggle={onToggle} />
    </aside>
  );
}
