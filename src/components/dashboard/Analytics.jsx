import DonutChart from '../DonutChart.jsx';
import Title from '../Title.jsx';

export default function Analytics({ session, lastPayDay }) {
  const payDayData = [
    { name: 'Deposit', value: lastPayDay.deposit, fill: '#f59e0b' },
    { name: 'Fraction Salary', value: lastPayDay.salary, fill: '#3b82f6' },
    { name: 'Dividends', value: lastPayDay.dividends, fill: '#22c55e' },
  ];

  const sessionData = [
    { name: 'Deposit', value: session.totalDeposit, fill: '#f59e0b' },
    { name: 'Fraction Salary', value: session.totalSalary, fill: '#3b82f6' },
    { name: 'Dividends', value: session.totalDividends, fill: '#22c55e' },
  ];

  return (
    <section className='analytics'>
      <Title title={'Income analytics'} />

      <div className='analytics__charts-wrapper'>
        <DonutChart
          title='THIS PAYDAY'
          data={payDayData}
          totalValue={`$ ${(lastPayDay.totalEarned / 1000000).toFixed(2)}M`}
        />

        <DonutChart
          title='TOTAL FOR SESSION'
          data={sessionData}
          totalValue={`$ ${(session.totalEarned / 1000000).toFixed(2)}M`}
        />
      </div>

      <div className='analytics__legend'>
        {payDayData.map((item, index) => (
          <span key={index} className='legend-title' style={{ '--dot-color': item.fill }}>
            {item.name}
          </span>
        ))}
      </div>
    </section>
  );
}
