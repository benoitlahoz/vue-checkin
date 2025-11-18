import { LAYER_ID, COLORS } from './constants';
import { getGlobalHook } from './hook';
import type { AirportEvent } from './types';

export function setupTimeline(api: any) {
  // Add timeline layer
  api.addTimelineLayer({
    id: LAYER_ID,
    label: 'Airport Events',
    color: COLORS.checkIn,
    screenshotOverlayRender: (event: any, ctx: any) => {
      // Show event details on timeline screenshot
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.font = '12px monospace';
      ctx.fillText(`${event.title}: ${event.subtitle}`, 10, 20);
    },
  });

  // Listen to events from the global hook
  const hook = getGlobalHook();
  if (!hook) {
    console.warn('[Airport DevTools] Global hook not found');
    return;
  }

  hook.on((event: AirportEvent) => {
    addTimelineEvent(api, event);
  });
}

function addTimelineEvent(api: any, event: AirportEvent) {
  const colorMap: Record<string, number> = {
    'check-in': COLORS.checkIn,
    'check-out': COLORS.checkOut,
    update: COLORS.update,
    'plugin-execute': COLORS.plugin,
    clear: COLORS.warning,
  };

  const titleMap: Record<string, string> = {
    'check-in': '✓ Check In',
    'check-out': '✗ Check Out',
    update: '↻ Update',
    'plugin-execute': '⚡ Plugin',
    clear: '🗑 Clear',
  };

  // Build subtitle with more context
  let subtitle = '';
  if (event.childId !== undefined) {
    subtitle = `ID: ${event.childId}`;
  } else if (event.pluginName) {
    subtitle = `Plugin: ${event.pluginName}`;
  } else if (event.type === 'clear') {
    subtitle = `Cleared ${event.registrySize || 0} items`;
  } else {
    subtitle = event.deskId;
  }

  // Build detailed data payload
  const eventData: Record<string, any> = {
    deskId: event.deskId,
    timestamp: new Date(event.timestamp).toLocaleTimeString(),
  };

  if (event.childId !== undefined) {
    eventData.childId = event.childId;
  }

  if (event.pluginName) {
    eventData.plugin = event.pluginName;
  }

  if (event.duration !== undefined) {
    eventData.duration = `${event.duration}ms`;
  }

  if (event.registrySize !== undefined) {
    eventData.registrySize = event.registrySize;
  }

  if (event.meta) {
    eventData.metadata = event.meta;
  }

  if (event.data) {
    eventData.data = event.data;
  }

  if (event.previousData) {
    eventData.previousData = event.previousData;
  }

  api.addTimelineEvent({
    layerId: LAYER_ID,
    event: {
      time: event.timestamp,
      data: eventData,
      title: titleMap[event.type] || event.type,
      subtitle,
      groupId: event.deskId,
      meta: {
        color: colorMap[event.type] || COLORS.checkIn,
      },
      logType:
        event.type === 'clear' ? 'warning' : event.type === 'check-out' ? 'error' : 'default',
    },
  });
}
