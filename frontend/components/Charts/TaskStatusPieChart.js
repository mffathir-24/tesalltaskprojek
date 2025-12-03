import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import Animated, { FadeInDown } from 'react-native-reanimated';

const TaskStatusPieChart = ({ data, width, height }) => {
  const screenWidth = Dimensions.get('window').width;
  const isMobile = screenWidth < 768;
  const chartWidth = Math.min(width || screenWidth - 48, screenWidth - 48);
  const chartHeight = height || 280;

  if (!data || Object.keys(data).length === 0) {
    return (
      <Animated.View 
        entering={FadeInDown.delay(200).springify()}
        style={styles.emptyContainer}
      >
        <LinearGradient
          colors={['#f3f4f6', '#e5e7eb']}
          style={styles.emptyCircle}
        />
        <Text style={styles.emptyTitle}>No Task Data</Text>
        <Text style={styles.emptySubtitle}>Add tasks to see distribution</Text>
      </Animated.View>
    );
  }

  const totalTasks = data.total_tasks || 
    (data.todo_tasks || 0) + 
    (data.in_progress_tasks || 0) + 
    (data.done_tasks || 0) + 
    (data.overdue_tasks || 0);

  const chartData = [
    {
      name: 'To Do',
      population: data.todo_tasks || data.todo || 0,
      color: '#EF4444',
      legendFontColor: '#374151',
      legendFontSize: 12,
      gradient: ['#EF4444', '#DC2626']
    },
    {
      name: 'In Progress',
      population: data.in_progress_tasks || data.in_progress || 0,
      color: '#3B82F6',
      legendFontColor: '#374151',
      legendFontSize: 12,
      gradient: ['#3B82F6', '#2563EB']
    },
    {
      name: 'Done',
      population: data.done_tasks || data.done || 0,
      color: '#10B981',
      legendFontColor: '#374151',
      legendFontSize: 12,
      gradient: ['#10B981', '#059669']
    },
    {
      name: 'Overdue',
      population: data.overdue_tasks || data.overdue || 0,
      color: '#F59E0B',
      legendFontColor: '#374151',
      legendFontSize: 12,
      gradient: ['#F59E0B', '#D97706']
    }
  ];

  const hasData = chartData.some(item => item.population > 0);
  
  if (!hasData) {
    return (
      <Animated.View 
        entering={FadeInDown.delay(200).springify()}
        style={styles.emptyContainer}
      >
        <LinearGradient
          colors={['#f3f4f6', '#e5e7eb']}
          style={styles.emptyCircle}
        />
        <Text style={styles.emptyTitle}>No Tasks Yet</Text>
        <Text style={styles.emptySubtitle}>Start creating tasks</Text>
      </Animated.View>
    );
  }

  const getPercentage = (value) => {
    return totalTasks > 0 ? Math.round((value / totalTasks) * 100) : 0;
  };

  return (
    <View style={[styles.container, { maxWidth: chartWidth }]}>
      {/* Pie Chart */}
      <Animated.View 
        entering={FadeInDown.delay(100).springify()}
        style={[styles.chartContainer, { maxWidth: chartWidth }]}
      >
        <View style={{ width: chartWidth, alignItems: 'center', overflow: 'hidden' }}>
          <PieChart
            data={chartData}
            width={chartWidth - 32}
            height={chartHeight * 0.6}
            chartConfig={{
              backgroundColor: 'transparent',
              backgroundGradientFrom: 'transparent',
              backgroundGradientTo: 'transparent',
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              }
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft={isMobile ? "10" : "15"}
            absolute
            hasLegend={false}
            center={[chartWidth / 4, 0]}
          />
        </View>
      </Animated.View>

      {/* Stats Grid */}
      <Animated.View 
        entering={FadeInDown.delay(150).springify()}
        style={[styles.statsContainer, { maxWidth: chartWidth }]}
      >
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>Task Distribution</Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalText}>{totalTasks} Total</Text>
          </View>
        </View>

        <View style={[styles.statsGrid, { maxWidth: chartWidth }]}>
          {chartData.map((item, index) => (
            <Animated.View 
              key={index}
              entering={FadeInDown.delay(200 + (index * 50)).springify()}
              style={styles.statCard}
            >
              <View style={styles.statHeader}>
                <LinearGradient
                  colors={item.gradient}
                  style={styles.statColor}
                />
                <Text style={styles.statName}>{item.name}</Text>
              </View>
              <Text style={styles.statValue}>{item.population}</Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <LinearGradient
                    colors={item.gradient}
                    style={[
                      styles.progressFill,
                      { width: `${getPercentage(item.population)}%` }
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                </View>
                <Text style={styles.statPercentage}>{getPercentage(item.population)}%</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Summary Stats */}
        <Animated.View 
          entering={FadeInDown.delay(300).springify()}
          style={styles.summaryContainer}
        >
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Completion Rate</Text>
            <Text style={[styles.summaryValue, { color: '#10B981' }]}>
              {getPercentage(chartData[2].population)}%
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Active Tasks</Text>
            <Text style={[styles.summaryValue, { color: '#3B82F6' }]}>
              {chartData[1].population}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Overdue</Text>
            <Text style={[styles.summaryValue, { color: '#F59E0B' }]}>
              {chartData[3].population}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    width: '100%',
  },
  statsContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  totalBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  totalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#F3F4F6',
    borderRadius: 2,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  statPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
  },
  emptyContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.5)',
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

export default TaskStatusPieChart;