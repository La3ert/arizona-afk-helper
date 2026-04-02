import Cards from '../components/dashboard/Cards.jsx';
import Analytics from '../components/dashboard/Analytics.jsx';
import DetailedStats from '../components/dashboard/DetailedStats.jsx';
import Title from '../components/Title.jsx';

export default function Dashboard({ sessionData }) {
  if (!sessionData) {
    return (
      <div className='dashboard-page'>
        <Title title={'Session Monitoring'} />
        <div style={{ color: 'white', marginTop: '20px' }}>Waiting for session data... ⏳</div>
      </div>
    );
  }

  const { session, lastPayDay, player } = sessionData;

  return (
    <div className='dashboard-page'>
      <Title title={'Session Monitoring'} />
      <Cards session={session} lastPayDay={lastPayDay} player={player} />
      <Analytics session={session} lastPayDay={lastPayDay} />
      <DetailedStats session={session} lastPayDay={lastPayDay} />
    </div>
  );
}
