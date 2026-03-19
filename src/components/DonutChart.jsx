import { PieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';

export default function DonutChart({ data, title, totalValue }) {
  return (
    <div className='donut-chart'>
      <span className='donut-chart__title'>{title}</span>

      <div className='donut-chart__container'>
        <div className='donut-chart__center-text'>{totalValue}</div>

        <ResponsiveContainer width='100%' height={250}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey='value'
              stroke='none'
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e1e24',
                borderColor: '#333',
                borderRadius: '1rem',
              }}
              itemStyle={{ color: '#fff' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
