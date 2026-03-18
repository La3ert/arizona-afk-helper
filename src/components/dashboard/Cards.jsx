import Card from '../Card.jsx';
import levelIcon from '../../assets/star-prize-award.svg';
import moneyIcon from '../../assets/money-bag.svg';
import clockIcon from '../../assets/clock.svg';
import coin from '../../assets/banking-coin.svg';

export default function Cards({ session, lastPayDay, player }) {
  return (
    <div className='card-grid'>
      <Card
        image={levelIcon}
        title={'Level'}
        value={`${player.level} LvL`}
        footer={`EXP: ${player.curExp}/${player.maxExp} EXP`}
        withProgressBar={true}
        progressPercentage={(player.curExp / player.maxExp) * 100}
      />
      <Card
        image={coin}
        title={'AZ Coins'}
        value={`${session.totalEarnedAZCoins} AZ`}
        footer={'for this session'}
      />
      <Card
        image={moneyIcon}
        title={'Session Cash'}
        value={`$ ${session.totalEarned}`}
        footer={'Total earned'}
      />
      <Card
        image={clockIcon}
        title={'Last PayDay'}
        value={`$ ${lastPayDay.totalEarned}`}
        footer={`in ${lastPayDay.time}`}
      />
    </div>
  );
}
