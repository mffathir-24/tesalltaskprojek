import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Text, View } from 'react-native';
import { Circle, G, Path, Svg, Text as SvgText } from 'react-native-svg';

const TaskStatusChart = ({ data, width = 300, height = 300 }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <View className="items-center justify-center p-6">
        <Text className="text-gray-500">No task data available</Text>
      </View>
    );
  }

  const chartData = {
    'todo': data.todo_tasks || data.todo || 0,
    'in-progress': data.in_progress_tasks || data.in_progress || 0,
    'done': data.done_tasks || data.done || 0,
    'overdue': data.overdue_tasks || data.overdue || 0
  };

  const totalTasks = Object.values(chartData).reduce((a, b) => a + b, 0);
  
  if (totalTasks === 0) {
    return (
      <View className="items-center justify-center p-6">
        <Text className="text-gray-500">No tasks to display</Text>
      </View>
    );
  }

  const colors = {
    'todo': '#FF6B6B',
    'in-progress': '#4ECDC4',
    'done': '#06D6A0',
    'overdue': '#FFD166'
  };

  const statusLabels = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'done': 'Done',
    'overdue': 'Overdue'
  };

  
  let cumulativeAngle = 0;
  const segments = Object.entries(chartData).map(([status, value]) => {
    const percentage = (value / totalTasks) * 100;
    const angle = (percentage / 100) * 360;
    
    const segment = {
      status,
      value,
      percentage,
      angle,
      startAngle: cumulativeAngle,
      endAngle: cumulativeAngle + angle,
      color: colors[status]
    };
    
    cumulativeAngle += angle;
    return segment;
  });

  
  if (Platform.OS !== 'web') {
    return (
      <View className="bg-white rounded-3xl p-6 shadow-xl">
        <Text className="text-2xl font-bold text-gray-800 mb-6">Task Status Distribution</Text>
        
        <View className="flex-row justify-between mb-8">
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-gradient-to-r from-red-500 to-red-400 items-center justify-center mb-2">
              <Text className="text-white text-lg font-bold">{chartData.todo}</Text>
            </View>
            <Text className="text-sm font-medium text-gray-600">To Do</Text>
            <Text className="text-xs text-gray-400">
              {((chartData.todo / totalTasks) * 100).toFixed(1)}%
            </Text>
          </View>
          
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-gradient-to-r from-teal-500 to-teal-400 items-center justify-center mb-2">
              <Text className="text-white text-lg font-bold">{chartData['in-progress']}</Text>
            </View>
            <Text className="text-sm font-medium text-gray-600">In Progress</Text>
            <Text className="text-xs text-gray-400">
              {((chartData['in-progress'] / totalTasks) * 100).toFixed(1)}%
            </Text>
          </View>
          
          <View className="items-center">
            <View className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-green-400 items-center justify-center mb-2">
              <Text className="text-white text-lg font-bold">{chartData.done}</Text>
            </View>
            <Text className="text-sm font-medium text-gray-600">Done</Text>
            <Text className="text-xs text-gray-400">
              {((chartData.done / totalTasks) * 100).toFixed(1)}%
            </Text>
          </View>
        </View>
        
        <LinearGradient
          colors={['#FF6B6B', '#4ECDC4', '#06D6A0', '#FFD166']}
          className="h-4 rounded-full w-full"
        >
          <View className="flex-row h-full">
            {segments.map((segment, index) => (
              <View
                key={segment.status}
                style={{
                  width: `${segment.percentage}%`,
                  backgroundColor: segment.color
                }}
              />
            ))}
          </View>
        </LinearGradient>
      </View>
    );
  }

  
  return (
    <View className="bg-white rounded-3xl p-6 shadow-xl">
      <Text className="text-2xl font-bold text-gray-800 mb-6">Task Status Distribution</Text>
      
      <View className="flex-row items-center">
        <View className="flex-1">
          <Svg width={width} height={height} viewBox="0 0 400 400">
            <G transform="translate(200, 200)">
              {segments.map((segment, index) => {
                if (segment.value === 0) return null;
                
                const startAngleRad = (segment.startAngle - 90) * (Math.PI / 180);
                const endAngleRad = (segment.endAngle - 90) * (Math.PI / 180);
                
                const x1 = Math.cos(startAngleRad) * 150;
                const y1 = Math.sin(startAngleRad) * 150;
                const x2 = Math.cos(endAngleRad) * 150;
                const y2 = Math.sin(endAngleRad) * 150;
                
                const largeArcFlag = segment.angle > 180 ? 1 : 0;
                
                const pathData = [
                  `M 0 0`,
                  `L ${x1} ${y1}`,
                  `A 150 150 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  `Z`
                ].join(' ');
                
                return (
                  <Path
                    key={segment.status}
                    d={pathData}
                    fill={segment.color}
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                );
              })}
              
              <Circle cx="0" cy="0" r="70" fill="white" />
              <SvgText
                x="0"
                y="-10"
                textAnchor="middle"
                fontSize="32"
                fontWeight="bold"
                fill="#374151"
              >
                {totalTasks}
              </SvgText>
              <SvgText
                x="0"
                y="20"
                textAnchor="middle"
                fontSize="14"
                fill="#6b7280"
              >
                Total Tasks
              </SvgText>
            </G>
          </Svg>
        </View>
        
        <View className="flex-1 pl-8">
          {segments.map((segment) => (
            <View key={segment.status} className="flex-row items-center mb-4">
              <View 
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: segment.color }}
              />
              <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="font-semibold text-gray-700 capitalize">
                    {statusLabels[segment.status] || segment.status}
                  </Text>
                  <Text className="font-bold text-gray-900">{segment.value}</Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${segment.percentage}%`,
                      backgroundColor: segment.color
                    }}
                  />
                </View>
                <Text className="text-xs text-gray-500 mt-1">
                  {segment.percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

export default TaskStatusChart;