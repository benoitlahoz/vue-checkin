<script setup lang="ts">
import { useCheckIn } from '#vue-airport';
import {
  createActiveItemPlugin,
  createHistoryPlugin,
  createValidationPlugin,
  createDebouncePlugin,
} from '@vue-airport/plugins-base';
import MetricWidget from './MetricWidget.vue';
import ChartWidget from './ChartWidget.vue';
import ActivityWidget from './ActivityWidget.vue';
import NotificationWidget from './NotificationWidget.vue';
import { type MetricWidget as MetricWidgetType, DASHBOARD_DESK_KEY, type DashboardState } from '.';

/**
 * Analytics Dashboard Example - Professional Dashboard
 *
 * Demonstrates VueAirport at its maximum potential:
 * - Multiple widget types with dynamic check-in/check-out
 * - Active item plugin for widget selection and focus
 * - History plugin with full undo/redo stack (50 operations)
 * - Validation plugin ensuring data integrity
 * - Debounce plugin for optimized updates
 * - Real-time data streaming with auto-refresh
 * - Complex computed aggregations from desk
 * - Event lifecycle hooks (onCheckIn, onCheckOut, onUpdate)
 * - DevTools integration for debugging
 * - TypeScript type safety throughout
 * - Tailwind CSS for professional UI
 */

// Create plugins - showcasing plugin composition
const activeItemPlugin = createActiveItemPlugin<MetricWidgetType>();
const historyPlugin = createHistoryPlugin<MetricWidgetType>({ maxHistory: 50 });
const debouncePlugin = createDebouncePlugin<MetricWidgetType>({
  checkInDelay: 300,
  checkOutDelay: 200,
  maxWait: 1000,
});
const validationPlugin = createValidationPlugin<MetricWidgetType>({
  required: ['id', 'type', 'title'],
  validate: (data: MetricWidgetType) => {
    if (!data.title || data.title.trim().length === 0) {
      return 'Widget title is required';
    }
    if (data.type === 'metric' && typeof data.value === 'undefined') {
      return 'Metric widgets must have a value';
    }
    if (data.type === 'notification' && !data.priority) {
      return 'Notifications must have a priority level';
    }
    return true;
  },
});

// Create the dashboard desk with ALL plugins
const { createDesk } = useCheckIn<MetricWidgetType>();
const { desk } = createDesk(DASHBOARD_DESK_KEY, {
  devTools: true,
  debug: false,
  plugins: [validationPlugin, debouncePlugin, activeItemPlugin, historyPlugin],
  onCheckIn: (_id, data) => {
    addActivity(`✓ Widget added: ${data.title}`, 'success');
  },
  onCheckOut: (id) => {
    const widget = desk.get(id);
    if (widget) {
      addActivity(`✗ Widget removed: ${widget.data.title}`, 'warning');
    }
  },
});

// Extended type for plugin methods
type DeskWithPlugins = typeof desk & {
  activeItemId?: Ref<string | number | null>;
  setActiveItem?: (id: string | number | null) => void;
  undo?: () => boolean;
  redo?: () => boolean;
  canUndo?: Ref<boolean>;
  canRedo?: Ref<boolean>;
  historySize?: Ref<number>;
};

const deskWithPlugins = desk as DeskWithPlugins;

// Dashboard state
const dashboardState = ref<DashboardState>({
  totalRevenue: 0,
  activeUsers: 0,
  conversionRate: 0,
  serverLoad: 0,
  alerts: 0,
});

const activities = ref<Array<{ id: string; message: string; type: string; time: Date }>>([]);
const isRefreshing = ref(false);
const autoRefresh = ref(true);
const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null);

// Computed dashboard metrics
const allWidgets = computed(() => desk.getAll());
const metricWidgets = computed(() => allWidgets.value.filter((w) => w.data.type === 'metric'));
const chartWidgets = computed(() => allWidgets.value.filter((w) => w.data.type === 'chart'));
const notificationWidgets = computed(() =>
  allWidgets.value.filter((w) => w.data.type === 'notification')
);
const criticalAlerts = computed(
  () => notificationWidgets.value.filter((w) => w.data.priority === 'critical').length
);
const activeWidgetId = computed(() => deskWithPlugins.activeItemId?.value);

// Dashboard statistics
const stats = computed(() => ({
  totalWidgets: allWidgets.value.length,
  activeMetrics: metricWidgets.value.length,
  activeCharts: chartWidgets.value.length,
  totalAlerts: notificationWidgets.value.length,
  criticalAlerts: criticalAlerts.value,
  canUndo: deskWithPlugins.canUndo?.value || false,
  canRedo: deskWithPlugins.canRedo?.value || false,
  historySize: deskWithPlugins.historySize?.value || 0,
}));

// Add activity log entry
const addActivity = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
  activities.value.unshift({
    id: `activity-${Date.now()}-${Math.random()}`,
    message,
    type,
    time: new Date(),
  });
  if (activities.value.length > 20) {
    activities.value = activities.value.slice(0, 20);
  }
};

// Update dashboard state based on widgets
const updateDashboardState = () => {
  const revenueWidget = metricWidgets.value.find((w) => w.data.id === 'revenue');
  const usersWidget = metricWidgets.value.find((w) => w.data.id === 'users');
  const conversionWidget = metricWidgets.value.find((w) => w.data.id === 'conversion');
  const serverWidget = metricWidgets.value.find((w) => w.data.id === 'server');

  dashboardState.value = {
    totalRevenue: revenueWidget ? Number(revenueWidget.data.value) : 0,
    activeUsers: usersWidget ? Number(usersWidget.data.value) : 0,
    conversionRate: conversionWidget ? Number(conversionWidget.data.value) : 0,
    serverLoad: serverWidget ? Number(serverWidget.data.value) : 0,
    alerts: criticalAlerts.value,
  };
};

// Simulate real-time updates
const simulateDataUpdate = () => {
  const widgets = allWidgets.value;

  widgets.forEach((widget) => {
    if (widget.data.type === 'metric' && typeof widget.data.value === 'number') {
      const variation = (Math.random() - 0.5) * 10;
      const newValue = Math.max(0, widget.data.value + variation);
      const previousValue = widget.data.value;

      desk.update(widget.id, {
        ...widget.data,
        previousValue,
        value: Math.round(newValue * 100) / 100,
        trend: newValue > previousValue ? 'up' : newValue < previousValue ? 'down' : 'stable',
      });
    }
  });

  updateDashboardState();
};

// Manual refresh
const refreshDashboard = async () => {
  isRefreshing.value = true;
  addActivity('Dashboard refreshed', 'info');

  await new Promise((resolve) => setTimeout(resolve, 500));
  simulateDataUpdate();

  isRefreshing.value = false;
};

// Toggle auto-refresh
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;

  if (autoRefresh.value) {
    refreshInterval.value = setInterval(simulateDataUpdate, 3000);
    addActivity('Auto-refresh enabled', 'success');
  } else {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value);
      refreshInterval.value = null;
    }
    addActivity('Auto-refresh disabled', 'warning');
  }
};

// History operations
const handleUndo = () => {
  if (deskWithPlugins.undo?.()) {
    addActivity('Action undone', 'info');
    updateDashboardState();
  }
};

const handleRedo = () => {
  if (deskWithPlugins.redo?.()) {
    addActivity('Action redone', 'info');
    updateDashboardState();
  }
};

// Select widget
const selectWidget = (id: string | number | null) => {
  deskWithPlugins.setActiveItem?.(id);
  if (id) {
    const widget = desk.get(id);
    if (widget) {
      addActivity(`Widget selected: ${widget.data.title}`, 'info');
    }
  }
};

// Clear all widgets
const clearDashboard = () => {
  if (confirm('Clear all widgets from dashboard?')) {
    desk.clear();
    addActivity('Dashboard cleared', 'warning');
    updateDashboardState();
  }
};

// Initialize dashboard
onMounted(() => {
  addActivity('Dashboard initialized', 'success');
  updateDashboardState();

  if (autoRefresh.value) {
    refreshInterval.value = setInterval(simulateDataUpdate, 3000);
  }
});

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
  }
});

// Watch for widget changes
watch(
  allWidgets,
  () => {
    updateDashboardState();
  },
  { deep: true }
);

// Format number with K/M suffix
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(0);
};

// Format time ago (reserved for future use)
const _timeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
};
</script>

<template>
  <div class="w-full max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8">
    <!-- Header with gradient background -->
    <div
      class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-1 shadow-2xl mb-8"
    >
      <div class="bg-white dark:bg-gray-900 rounded-xl p-6">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1
              class="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
            >
              Analytics Dashboard
            </h1>
            <p class="text-gray-600 dark:text-gray-400">
              Real-time metrics powered by VueAirport with {{ stats.totalWidgets }} active widgets
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <UButton
              :disabled="!stats.canUndo"
              icon="i-heroicons-arrow-uturn-left"
              color="neutral"
              variant="soft"
              size="sm"
              @click="handleUndo"
            >
              Undo
            </UButton>
            <UButton
              :disabled="!stats.canRedo"
              icon="i-heroicons-arrow-uturn-right"
              color="neutral"
              variant="soft"
              size="sm"
              @click="handleRedo"
            >
              Redo
            </UButton>
            <UButton
              :color="autoRefresh ? 'primary' : 'neutral'"
              :icon="autoRefresh ? 'i-heroicons-pause' : 'i-heroicons-play'"
              variant="soft"
              size="sm"
              @click="toggleAutoRefresh"
            >
              {{ autoRefresh ? 'Pause' : 'Start' }}
            </UButton>
            <UButton
              :loading="isRefreshing"
              icon="i-heroicons-arrow-path"
              color="primary"
              size="sm"
              @click="refreshDashboard"
            >
              Refresh
            </UButton>
          </div>
        </div>

        <!-- Stats Bar with badges -->
        <div class="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <UBadge color="primary" variant="subtle" size="lg">
            <UIcon name="i-heroicons-chart-bar" class="mr-1" />
            {{ stats.activeMetrics }} Metrics
          </UBadge>
          <UBadge color="secondary" variant="subtle" size="lg">
            <UIcon name="i-heroicons-chart-pie" class="mr-1" />
            {{ stats.activeCharts }} Charts
          </UBadge>
          <UBadge :color="stats.totalAlerts > 0 ? 'error' : 'neutral'" variant="subtle" size="lg">
            <UIcon name="i-heroicons-bell-alert" class="mr-1" />
            {{ stats.totalAlerts }} Alerts
          </UBadge>
          <UBadge color="neutral" variant="subtle" size="lg">
            <UIcon name="i-heroicons-clock" class="mr-1" />
            {{ stats.historySize }} History
          </UBadge>
          <UBadge v-if="activeWidgetId" color="success" variant="subtle" size="lg">
            <UIcon name="i-heroicons-cursor-arrow-rays" class="mr-1" />
            Selected
          </UBadge>
        </div>
      </div>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
      <!-- Metrics Section (2/3 width) -->
      <div class="xl:col-span-2 space-y-6">
        <div>
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-chart-bar-square" class="text-blue-500" />
            Key Performance Indicators
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MetricWidget
              id="revenue"
              title="Total Revenue"
              :value="152847"
              :previous-value="145230"
              unit="$"
              color="green"
              icon="i-heroicons-currency-dollar"
              :is-active="activeWidgetId === 'revenue'"
              @select="selectWidget"
            />
            <MetricWidget
              id="users"
              title="Active Users"
              :value="8234"
              :previous-value="7891"
              unit=""
              color="blue"
              icon="i-heroicons-users"
              :is-active="activeWidgetId === 'users'"
              @select="selectWidget"
            />
            <MetricWidget
              id="conversion"
              title="Conversion Rate"
              :value="3.42"
              :previous-value="3.18"
              unit="%"
              color="purple"
              icon="i-heroicons-arrow-trending-up"
              :is-active="activeWidgetId === 'conversion'"
              @select="selectWidget"
            />
            <MetricWidget
              id="server"
              title="Server Load"
              :value="67.8"
              :previous-value="71.2"
              unit="%"
              color="orange"
              icon="i-heroicons-server"
              :is-active="activeWidgetId === 'server'"
              @select="selectWidget"
            />
          </div>
        </div>

        <!-- Charts Section -->
        <div>
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-chart-pie" class="text-purple-500" />
            Performance Analytics
          </h2>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartWidget
              id="revenue-chart"
              title="Revenue Trend"
              :data="[
                { label: 'Mon', value: 12500 },
                { label: 'Tue', value: 15200 },
                { label: 'Wed', value: 18900 },
                { label: 'Thu', value: 21400 },
                { label: 'Fri', value: 24300 },
                { label: 'Sat', value: 29800 },
                { label: 'Sun', value: 30747 },
              ]"
              color="green"
              :is-active="activeWidgetId === 'revenue-chart'"
              @select="selectWidget"
            />
            <ChartWidget
              id="traffic-chart"
              title="Traffic Sources"
              :data="[
                { label: 'Organic', value: 42 },
                { label: 'Direct', value: 28 },
                { label: 'Social', value: 18 },
                { label: 'Referral', value: 12 },
              ]"
              color="blue"
              chart-type="donut"
              :is-active="activeWidgetId === 'traffic-chart'"
              @select="selectWidget"
            />
          </div>
        </div>
      </div>

      <!-- Sidebar (1/3 width) -->
      <div class="space-y-6">
        <!-- Notifications -->
        <div>
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-bell-alert" class="text-red-500" />
            System Alerts
          </h2>
          <div class="space-y-3">
            <NotificationWidget
              id="notification-1"
              title="High Traffic Alert"
              description="Traffic increased by 145% in the last hour"
              priority="high"
              category="Performance"
              icon="i-heroicons-arrow-trending-up"
              :timestamp="new Date(Date.now() - 300000)"
              :is-active="activeWidgetId === 'notification-1'"
              @select="selectWidget"
            />
            <NotificationWidget
              id="notification-2"
              title="New User Milestone"
              description="Reached 10,000 active users!"
              priority="medium"
              category="Growth"
              icon="i-heroicons-trophy"
              :timestamp="new Date(Date.now() - 900000)"
              :is-active="activeWidgetId === 'notification-2'"
              @select="selectWidget"
            />
            <NotificationWidget
              id="notification-3"
              title="Server Optimization"
              description="CPU usage reduced by 23%"
              priority="low"
              category="System"
              icon="i-heroicons-bolt"
              :timestamp="new Date(Date.now() - 1800000)"
              :is-active="activeWidgetId === 'notification-3'"
              @select="selectWidget"
            />
          </div>
        </div>

        <!-- Activity Feed -->
        <div>
          <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
            <UIcon name="i-heroicons-list-bullet" class="text-gray-500" />
            Activity Log
          </h2>
          <ActivityWidget :activities="activities" />
        </div>
      </div>
    </div>

    <!-- Footer Dashboard State -->
    <div
      class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-blue-200 dark:border-gray-700"
    >
      <div class="flex flex-col lg:flex-row items-center justify-between gap-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 w-full">
          <div class="text-center lg:text-left">
            <p class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Total Revenue
            </p>
            <p class="text-2xl font-bold text-green-600">
              {{ formatNumber(dashboardState.totalRevenue) }}
            </p>
          </div>
          <div class="text-center lg:text-left">
            <p class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Active Users
            </p>
            <p class="text-2xl font-bold text-blue-600">
              {{ formatNumber(dashboardState.activeUsers) }}
            </p>
          </div>
          <div class="text-center lg:text-left">
            <p class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Conversion
            </p>
            <p class="text-2xl font-bold text-purple-600">
              {{ dashboardState.conversionRate.toFixed(2) }}%
            </p>
          </div>
          <div class="text-center lg:text-left">
            <p class="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">
              Server Load
            </p>
            <p
              class="text-2xl font-bold"
              :class="dashboardState.serverLoad > 80 ? 'text-red-600' : 'text-orange-600'"
            >
              {{ dashboardState.serverLoad.toFixed(1) }}%
            </p>
          </div>
        </div>
        <UButton
          color="error"
          variant="soft"
          icon="i-heroicons-trash"
          size="lg"
          @click="clearDashboard"
        >
          Clear Dashboard
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Minimal animations */
</style>
