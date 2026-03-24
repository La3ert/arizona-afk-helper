import { useState } from 'react';
import { sessionData } from '../sessionData.js';
import Cards from '../components/dashboard/Cards.jsx';
import Analytics from '../components/dashboard/Analytics.jsx';
import DetailedStats from '../components/dashboard/DetailedStats.jsx';
import Title from '../components/Title.jsx';

export default function Dashboard() {
  const [session] = useState(sessionData.session);
  const [lastPayDay] = useState(sessionData.lastPayDay);
  const [player] = useState(sessionData.player);

  return (
    <div className='dashboard-page'>
      <Title title={'Session Monitoring'} />
      <Cards session={session} lastPayDay={lastPayDay} player={player} />
      <Analytics session={session} lastPayDay={lastPayDay} />
      <DetailedStats session={session} lastPayDay={lastPayDay} />
    </div>
  );
}
