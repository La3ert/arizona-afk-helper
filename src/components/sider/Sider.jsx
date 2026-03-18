import Header from './Header.jsx';
import Navbar from './Navbar.jsx';
import Toggles from './Toggles.jsx';

export default function Sider() {
  return (
    <aside className='sider'>
      <Header />
      <Navbar />
      <Toggles />
    </aside>
  );
}
