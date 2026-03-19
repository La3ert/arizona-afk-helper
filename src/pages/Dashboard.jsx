import { useState } from 'react';
import { sessionData } from '../sessionData.js';
import Cards from '../components/dashboard/Cards.jsx';
import Analytics from '../components/dashboard/Analytics.jsx';

export default function Dashboard() {
  const [session, setSession] = useState(sessionData.session);
  const [lastPayDay, setLastPayDay] = useState(sessionData.lastPayDay);
  const [player, setPlayer] = useState(sessionData.player);

  return (
    <div className='dashboard-page'>
      <span className={'dashboard-page__title'}>Session Monitoring</span>
      <Cards session={session} lastPayDay={lastPayDay} player={player} />
      <Analytics session={session} lastPayDay={lastPayDay} />
    </div>
  );
}
