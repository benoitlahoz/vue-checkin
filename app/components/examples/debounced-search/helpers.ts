import type { Ref } from 'vue';

export const addEventLog = (
  message: string,
  log: Ref<{ time: string; message: string }[]>,
  max = 10
) => {
  const time = new Date().toLocaleTimeString();
  log.value.unshift({ time, message });
  if (log.value.length > max) {
    log.value = log.value.slice(0, max);
  }
};
