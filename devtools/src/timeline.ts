import { LAYER_ID, COLORS } from './constants';
import { getGlobalHook } from './hook';
import type { AirportEvent } from './types';

export function setupTimeline(api: any) {
  // Add timeline layer
  api.addTimelineLayer({
    id: LAYER_ID,
    label: 'Airport Events',
    color: COLORS.checkIn,
  });

  // Listen to events from the global hook
  const hook = getGlobalHook();
  if (!hook) return;

  hook.on((event: AirportEvent) => {
    addTimelineEvent(api, event);
  });
}

function addTimelineEvent(api: any, event: AirportEvent) {
  const colorMap = {
    'check-in': COLORS.checkIn,
    'check-out': COLORS.checkOut,
    update: COLORS.update,
    'plugin-execute': COLORS.plugin,
  };

  const titleMap = {
    'check-in': '✓ Check In',
    'check-out': '✗ Check Out',
    update: '↻ Update',
    'plugin-execute': '⚡ Plugin',
  };

  api.addTimelineEvent({
    layerId: LAYER_ID,
    event: {
      time: event.timestamp,
      data: {
        deskId: event.deskId,
        childId: event.childId,
        pluginName: event.pluginName,
        duration: event.duration,
        ...event.data,
      },
      title: titleMap[event.type],
      subtitle: event.childId || event.pluginName || event.deskId,
      groupId: event.deskId,
      meta: {
        color: colorMap[event.type],
      },
    },
  });
}
