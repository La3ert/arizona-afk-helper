import Title from '../Title.jsx';

export default function DetailedStats({ session, lastPayDay }) {
  const tableData = [
    { name: 'Deposit', payDay: lastPayDay.deposit, session: session.totalDeposit },
    { name: 'Fraction Salary', payDay: lastPayDay.salary, session: session.totalSalary },
    { name: 'Dividends', payDay: lastPayDay.dividends, session: session.totalDividends },
  ];

  const formatMoney = (amount) => {
    return '$' + amount.toLocaleString('en-US');
  };

  return (
    <section className='detailed-stats'>
      <Title title={'Detailed Stats'} />
      <div className='detailed-stats__table-wrapper'>
        <table className='table-stats'>
          <thead>
            <tr>
              <th className='align-left'>Source</th>
              <th>Current PD ($)</th>
              <th>Per Session ($)</th>
            </tr>
          </thead>

          <tbody>
            {tableData.map((item, index) => (
              <tr key={index}>
                <td className='align-left'>{item.name}</td>
                <td>{formatMoney(item.payDay)}</td>
                <td>{formatMoney(item.session)}</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td className='align-left'>TOTAL</td>
              <td>{formatMoney(lastPayDay.totalEarned)}</td>
              <td>{formatMoney(session.totalEarned)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
