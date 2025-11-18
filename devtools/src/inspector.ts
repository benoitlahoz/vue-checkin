import { INSPECTOR_ID, ICONS, COLORS } from './constants';
import { getGlobalHook } from './hook';

interface InspectorNodeTag {
  label: string;
  textColor: number;
  backgroundColor: number;
}

export function setupInspector(api: any) {
  // Add inspector
  api.addInspector({
    id: INSPECTOR_ID,
    label: 'Airport Registry',
    icon: ICONS.desk,
    treeFilterPlaceholder: 'Search registry...',
  });

  // Provide inspector tree
  api.on.getInspectorTree((payload: any) => {
    if (payload.inspectorId === INSPECTOR_ID) {
      payload.rootNodes = getRegistryTree();
    }
  });

  // Provide inspector state
  api.on.getInspectorState((payload: any) => {
    if (payload.inspectorId === INSPECTOR_ID) {
      payload.state = getNodeState(payload.nodeId);
    }
  });

  // Handle node actions
  api.on.editInspectorState((payload: any) => {
    if (payload.inspectorId === INSPECTOR_ID) {
      // Handle state editing
      console.log('Edit state:', payload);
    }
  });

  // Listen to hook events and refresh inspector
  const hook = getGlobalHook();
  if (hook) {
    hook.on((event) => {
      // Refresh inspector tree whenever registry changes
      api.sendInspectorTree(INSPECTOR_ID);

      // If event has a desk ID, refresh its state
      if (event.deskId) {
        api.sendInspectorState(INSPECTOR_ID);
      }
    });
  }
}

function getRegistryTree(): Array<{
  id: string;
  label: string;
  children?: unknown[];
  tags?: InspectorNodeTag[];
}> {
  const hook = getGlobalHook();
  if (!hook || hook.desks.size === 0) {
    return [
      {
        id: 'empty',
        label: 'No desks registered',
        tags: [
          {
            label: 'waiting...',
            textColor: 0x999999,
            backgroundColor: 0x333333,
          },
        ],
      },
    ];
  }

  return Array.from(hook.desks.values()).map((desk) => {
    const childCount = desk.registry.size;

    return {
      id: desk.deskId,
      label: desk.metadata?.label ? String(desk.metadata.label) : `Desk: ${desk.deskId}`,
      tags: [
        {
          label: `${childCount} ${childCount === 1 ? 'child' : 'children'}`,
          textColor: 0xffffff,
          backgroundColor: childCount > 0 ? COLORS.checkIn : 0x999999,
        },
      ],
      children: Array.from(desk.registry.entries()).map(([id, item]) => ({
        id: `${desk.deskId}:${id}`,
        label: item.meta?.label ? String(item.meta.label) : `Item: ${id}`,
        tags: item.meta?.active
          ? [
              {
                label: 'active',
                textColor: 0xffffff,
                backgroundColor: COLORS.update,
              },
            ]
          : undefined,
      })),
    };
  });
}

function getNodeState(nodeId: string) {
  const hook = getGlobalHook();
  if (!hook) {
    return { Info: [{ key: 'status', value: 'DevTools not ready', editable: false }] };
  }

  // Check if it's a desk or child node
  if (nodeId.includes(':')) {
    // Child node: deskId:childId
    const [deskId, childId] = nodeId.split(':');
    const desk = hook.desks.get(deskId);
    if (!desk) return {};

    const item = desk.registry.get(childId);
    if (!item) return {};

    const result: Record<string, any[]> = {
      'Basic Info': [
        { key: 'id', value: childId, editable: false },
        { key: 'type', value: 'child', editable: false },
        {
          key: 'checked in at',
          value: item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A',
          editable: false,
        },
      ],
    };

    // Metadata section
    if (item.meta && Object.keys(item.meta).length > 0) {
      result.Metadata = Object.entries(item.meta).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value, null, 2) : value,
        editable: false,
      }));
    }

    // Data section - display with better formatting
    if (item.data && Object.keys(item.data).length > 0) {
      result.Data = Object.entries(item.data).map(([key, value]) => {
        let displayValue = value;
        if (typeof value === 'object' && value !== null) {
          displayValue = JSON.stringify(value, null, 2);
        }
        return {
          key,
          value: displayValue,
          editable: false,
        };
      });
    }

    return result;
  } else {
    // Desk node
    const desk = hook.desks.get(nodeId);
    if (!desk) return {};

    const stats = desk.stats || {
      totalCheckIns: 0,
      totalCheckOuts: 0,
      totalUpdates: 0,
    };

    const result: Record<string, any[]> = {
      'Basic Info': [
        { key: 'id', value: desk.deskId, editable: false },
        { key: 'type', value: 'desk', editable: false },
        { key: 'children', value: desk.registry.size, editable: false },
      ],
    };

    // Statistics
    result.Statistics = [
      { key: 'total check-ins', value: stats.totalCheckIns, editable: false },
      { key: 'total check-outs', value: stats.totalCheckOuts, editable: false },
      { key: 'total updates', value: stats.totalUpdates, editable: false },
      { key: 'current items', value: desk.registry.size, editable: false },
    ];

    // Lifecycle
    if (desk.metadata) {
      const createdAt = desk.metadata.createdAt as string;
      if (createdAt) {
        result.Lifecycle = [{ key: 'created at', value: createdAt, editable: false }];

        if (desk.metadata.lastCheckIn) {
          result.Lifecycle.push({
            key: 'last check-in',
            value: new Date(desk.metadata.lastCheckIn as number).toLocaleString(),
            editable: false,
          });
        }

        if (desk.metadata.lastCheckOut) {
          result.Lifecycle.push({
            key: 'last check-out',
            value: new Date(desk.metadata.lastCheckOut as number).toLocaleString(),
            editable: false,
          });
        }

        if (desk.metadata.lastUpdate) {
          result.Lifecycle.push({
            key: 'last update',
            value: new Date(desk.metadata.lastUpdate as number).toLocaleString(),
            editable: false,
          });
        }
      }
    }

    // Plugins
    if (desk.metadata?.plugins && Array.isArray(desk.metadata.plugins)) {
      result.Plugins = (desk.metadata.plugins as string[]).map((name) => ({
        key: name,
        value: '✓ installed',
        editable: false,
      }));
    }

    // Other metadata
    if (desk.metadata) {
      const otherMetadata = Object.entries(desk.metadata).filter(
        ([key]) =>
          !['createdAt', 'lastCheckIn', 'lastCheckOut', 'lastUpdate', 'plugins'].includes(key)
      );

      if (otherMetadata.length > 0) {
        result.Metadata = otherMetadata.map(([key, value]) => ({
          key,
          value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
          editable: false,
        }));
      }
    }

    return result;
  }
}
