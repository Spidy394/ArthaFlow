import React, { ReactElement, ReactNode } from 'react';
import { 
  LineChart, BarChart, PieChart, 
  Line, Bar, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend 
} from 'recharts';

export interface ChartConfig {
  type: 'line' | 'bar' | 'pie';
  options?: Record<string, any>;
  data?: any[];
}

interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children?: ReactNode;
}

export const Chart: React.FC<ChartProps> = ({ config, children, ...props }) => {
  // If children are provided, render them directly
  // This allows for maximum flexibility when custom chart configurations are needed
  if (children) {
    return <div className="w-full h-full" {...props}>{children}</div>;
  }

  // No children, so we should render a chart based on config
  // (This path is currently not used by the app but could be helpful in the future)
  if (!config.data || config.data.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-muted-foreground">No data available</div>;
  }

  return (
    <div className="w-full h-full" {...props}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChartByType(config)}
      </ResponsiveContainer>
    </div>
  );
};

// Helper function to render the appropriate chart based on type
function renderChartByType(config: ChartConfig) {
  const { type, data = [], options = {} } = config;

  switch (type) {
    case 'line':
      return (
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} {...options}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {/* This is simplified - in real usage you would need to specify which lines to render */}
          {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
            <Line 
              key={key}
              type="monotone" 
              dataKey={key} 
              stroke={getColorByIndex(index)} 
              strokeWidth={2} 
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      );

    case 'bar':
      return (
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }} {...options}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {Object.keys(data[0] || {}).filter(key => key !== 'name').map((key, index) => (
            <Bar 
              key={key}
              dataKey={key} 
              fill={getColorByIndex(index)} 
            />
          ))}
        </BarChart>
      );

    case 'pie':
      return (
        <PieChart {...options}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry: any, index: number) => (
              <Cell key={`cell-${index}`} fill={getColorByIndex(index)} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      );

    default:
      return <div>Unsupported chart type</div>;
  }
}

// Helper function to get color by index
function getColorByIndex(index: number): string {
  const colors = [
    '#6E59A5', '#0EA5E9', '#9B87F5', '#4A3D7C',
    '#F97316', '#10B981', '#F43F5E', '#8B5CF6'
  ];
  return colors[index % colors.length];
}
