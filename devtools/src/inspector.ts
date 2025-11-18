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

    return {
      'Basic Info': [
        { key: 'id', value: childId, editable: false },
        { key: 'type', value: 'child', editable: false },
        {
          key: 'timestamp',
          value: item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A',
          editable: false,
        },
      ],
      Metadata: Object.entries(item.meta || {}).map(([key, value]) => ({
        key,
        value,
        editable: false,
      })),
      Data: Object.entries(item.data || {}).map(([key, value]) => ({
        key,
        value: JSON.stringify(value),
        editable: false,
      })),
    };
  } else {
    // Desk node
    const desk = hook.desks.get(nodeId);
    if (!desk) return {};

    return {
      'Basic Info': [
        { key: 'id', value: desk.deskId, editable: false },
        { key: 'type', value: 'desk', editable: false },
        { key: 'children', value: desk.registry.size, editable: false },
      ],
      Metadata: desk.metadata
        ? Object.entries(desk.metadata).map(([key, value]) => ({
            key,
            value: JSON.stringify(value),
            editable: false,
          }))
        : [{ key: 'none', value: 'No metadata', editable: false }],
    };
  }
}
