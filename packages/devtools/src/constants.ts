export const PLUGIN_ID = 'vue-checkin';
export const LAYER_ID = 'checkin-events';
export const INSPECTOR_ID = 'checkin-registry';

export const COLORS = {
  checkIn: 0x41b883,
  checkOut: 0xe74c3c,
  update: 0x3498db,
  switch: 0xf1c40f,
  plugin: 0x9b59b6,
  error: 0xe74c3c,
  warning: 0xf39c12,
} as const;

export const ICONS = {
  desk: 'folder_open',
  child: 'radio_button_checked',
  plugin: 'extension',
  state: 'inventory_2',
} as const;
