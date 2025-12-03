import React from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const ProjectProgressBarChart = ({ projects, width, height, onProjectPress }) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.min(width || screenWidth - 48, screenWidth - 48);
  const chartHeight = height || 220;

  if (!projects || projects.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIllustration}>
          <View style={styles.emptyCircle} />
          <View style={styles.emptyLine} />
          <View style={[styles.emptyLine, { width: '60%' }]} />
        </View>
        <Text style={styles.emptyTitle}>No Projects Yet</Text>
        <Text style={styles.emptySubtitle}>Add projects to track progress</Text>
      </View>
    );
  }

  
  const sortedProjects = [...projects].sort((a, b) => b.progress - a.progress);
  const displayProjects = sortedProjects.slice(0, 5);

  
  const getBarColor = (progress) => {
    if (progress >= 90) return '#10B981'; 
    if (progress >= 70) return '#3B82F6'; 
    if (progress >= 50) return '#8B5CF6'; 
    if (progress >= 30) return '#F59E0B'; 
    return '#EF4444'; 
  };

  const chartData = {
    labels: displayProjects.map((p, index) => `P${index + 1}`),
    datasets: [{
      data: displayProjects.map(p => p.progress || 0),
      colors: displayProjects.map(p => 
        (opacity = 1) => getBarColor(p.progress)
      )
    }]
  };

  const chartConfig = {
    backgroundColor: '#FFFFFF',
    backgroundGradientFrom: '#FFFFFF',
    backgroundGradientTo: '#FFFFFF',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(55, 65, 81, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    fillShadowGradient: '#8B5CF6',
    fillShadowGradientOpacity: 0.3,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#F3F4F6',
      strokeWidth: 1,
    },
    propsForLabels: {
      fontSize: 11,
      fontWeight: '500',
    },
    propsForVerticalLabels: {
      fontSize: 10,
      fontWeight: '400',
    },
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    barRadius: 6,
  };

  return (
    <View style={[styles.container, { maxWidth: chartWidth }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Project Progress</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{projects.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {Math.round(projects.reduce((acc, p) => acc + (p.progress || 0), 0) / projects.length) || 0}%
            </Text>
            <Text style={styles.statLabel}>Avg</Text>
          </View>
        </View>
      </View>

      <View style={[styles.chartContainer, { maxWidth: chartWidth, overflow: 'hidden' }]}>
        <View style={{ width: chartWidth, alignItems: 'center' }}>
          <BarChart
            data={chartData}
            width={chartWidth - 16}
            height={chartHeight}
            yAxisSuffix="%"
            yAxisInterval={1}
            chartConfig={chartConfig}
            style={styles.chart}
            showValuesOnTopOfBars={true}
            fromZero={true}
            showBarTops={false}
            withInnerLines={true}
            withHorizontalLabels={true}
            withVerticalLabels={true}
            withCustomBarColorFromData={true}
            flatColor={true}
            segments={5}
          />
        </View>
        
        {/* Legend untuk project labels */}
        <View style={[styles.legendContainer, { maxWidth: chartWidth }]}>
          {displayProjects.map((project, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: getBarColor(project.progress) }]} />
              <Text style={styles.legendText} numberOfLines={1}>
                {project.name || `Project ${index + 1}`}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.projectsList, { maxWidth: chartWidth }]}>
        {displayProjects.map((project, index) => (
          <TouchableOpacity
            key={project.id || index}
            style={styles.projectCard}
            onPress={() => onProjectPress && onProjectPress(project.id)}
            activeOpacity={0.6}
          >
            <View style={styles.projectHeader}>
              <View style={styles.projectBadge}>
                <Text style={styles.projectBadgeText}>
                  {String.fromCharCode(65 + index)} {/* A, B, C, ... */}
                </Text>
              </View>
              <View style={styles.projectInfo}>
                <Text style={styles.projectName} numberOfLines={1}>
                  {project.name || 'Untitled Project'}
                </Text>
                <View style={styles.projectMeta}>
                  <Text style={styles.projectManager}>
                    {project.manager_name || 'No manager assigned'}
                  </Text>
                  <View style={styles.projectStatus}>
                    <View 
                      style={[
                        styles.statusDot, 
                        { backgroundColor: getBarColor(project.progress) }
                      ]} 
                    />
                    <Text style={styles.statusText}>
                      {project.progress >= 90 ? 'Completed' : 
                       project.progress >= 70 ? 'On Track' : 
                       project.progress >= 50 ? 'In Progress' : 
                       project.progress >= 30 ? 'Delayed' : 'Critical'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>Progress</Text>
                <Text style={styles.progressValue}>
                  {project.progress?.toFixed(0) || 0}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { 
                      width: `${Math.min(project.progress || 0, 100)}%`,
                      backgroundColor: getBarColor(project.progress)
                    }
                  ]} 
                />
              </View>
              <View style={styles.progressMarks}>
                <Text style={styles.progressMark}>0%</Text>
                <Text style={styles.progressMark}>50%</Text>
                <Text style={styles.progressMark}>100%</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  emptyContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    margin: 16,
    padding: 20,
  },
  emptyIllustration: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    marginBottom: 16,
  },
  emptyLine: {
    width: '40%',
    height: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    marginBottom: 8,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    width: '100%',
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    maxWidth: 80,
  },
  projectsList: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  projectBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  projectBadgeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  projectMeta: {
    gap: 4,
  },
  projectManager: {
    fontSize: 13,
    color: '#6B7280',
  },
  projectStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressSection: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMark: {
    fontSize: 10,
    color: '#9CA3AF',
  },
});

export default ProjectProgressBarChart;