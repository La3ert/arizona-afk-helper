import Header from './Header.jsx';
import Navbar from './Navbar.jsx';
import Toggles from './Toggles.jsx';

export default function Sider({ sessionData, settings, onToggle, isOpen, onClose }) {
  return (
    <aside className={`sider ${isOpen ? 'is-open' : ''}`}>
      <Header player={sessionData?.player} />
      <Navbar />
      <Toggles settings={settings} onToggle={onToggle} />
    </aside>
  );
}
