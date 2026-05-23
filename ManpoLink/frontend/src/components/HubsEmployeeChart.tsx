import React, { useMemo } from 'react';
import { BarChart } from '@mui/x-charts/BarChart';
import { Hub, Employee } from '@/types';
import { useTheme } from '@/context/ThemeContext';

interface Props {
  hubsData?: Hub[];
  employees?: Employee[];
}

export default function HubsEmployeeChart({ hubsData = [], employees = [] }: Props) {
  const { isDarkMode } = useTheme();

  const dataset = useMemo(() => {
    return hubsData.map((hub) => {
      const hubEmployees = employees.filter(emp => {
        if (emp.hub == null) return false;
        if (typeof emp.hub === 'number') return emp.hub === hub.id;
        return (emp.hub as Hub).id === hub.id;
      });

      const countByStatus = (status: string) =>
        hubEmployees.filter(e => ((e.status || '') as string).toLowerCase() === status).length;

      return {
        product: hub.name,

        active: countByStatus('active'),
        awol: countByStatus('awol'),
        resign: countByStatus('resign'),
        blacklist: countByStatus('blacklist'),
      };
    });
  }, [hubsData, employees]);

  const filteredDataset = dataset.filter(
    d => d.active || d.awol || d.resign || d.blacklist
  );

  if (!filteredDataset.length) {
    return <div style={{ padding: 20 }}>No employee data available</div>;
  }

  const textColor = isDarkMode ? '#F3F4F6' : '#374151';
  const gridColor = isDarkMode ? '#4B5563' : '#E5E7EB';

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <BarChart
        dataset={filteredDataset}

        xAxis={[
          {
            dataKey: 'product',
            scaleType: 'band',
            tickLabelStyle: {
              angle: -40,
              textAnchor: 'end',
              fontSize: 11,
              fill: textColor,
            },
          },
        ]}

        series={[
          { dataKey: 'active', label: 'Active', color: '#22C55E' },
          { dataKey: 'awol', label: 'AWOL', color: '#F59E0B' },
          { dataKey: 'resign', label: 'Resigned', color: '#3B82F6' },
          { dataKey: 'blacklist', label: 'Blacklist', color: '#EF4444' },
        ]}

        yAxis={[
          {
            label: 'Employee Count',
            labelStyle: {
              fill: textColor,
            },
            tickLabelStyle: {
              fill: textColor,
            },
          },
        ]}

        height={450}
        width={Math.max(300, filteredDataset.length * 100)}

        margin={{ top: 40, left: 60 }}

        slotProps={{
          legend: {
            direction: 'horizontal',
            position: { vertical: 'top', horizontal: 'center' },
          },
        }}

        sx={{
          // Axis lines & ticks
          '& .MuiChartsAxis-line': {
            stroke: gridColor,
          },
          '& .MuiChartsAxis-tick': {
            stroke: gridColor,
          },
          // Tick labels (fallbacks)
          '& .MuiChartsAxis-tickLabel': {
            fill: `${textColor} !important`,
          },
          // Axis title/label (fallbacks)
          '& .MuiChartsAxis-label': {
            fill: `${textColor} !important`,
          },
          // Legend texts (fallbacks)
          '& .MuiChartsLegend-root text': {
            fill: `${textColor} !important`,
          },
          '& .MuiChartsLegend-series text': {
            fill: `${textColor} !important`,
          },
          '& .MuiChartsLegend-root tspan': {
            fill: `${textColor} !important`,
          },
          // Legend marker border/colors if necessary
          '& .MuiChartsLegend-root': {
            fill: textColor,
          }
        }}
      />
    </div>
  );
}
