export const COMMON_IPC_CHANNELS = Object.freeze({
  DEVICE_MANAGER: Object.freeze({
    OPEN: "device_manager:open",
    LIST_SERIAL_PORTS: "device_manager:list_serial_ports",
  }),

  LOG: Object.freeze({
    PATH_SELECT: "log:path_select",
    PATH_OPEN: "log:path_open",
    PATH_GET_CURRENT: "log:path_current",
    EVT_STATUS: "log:status",
    START: "log:start",
    STOP: "log:stop",
    SET_TAG: "log:tag",
  }),

  APP: Object.freeze({
    GET_FLAGS: "app:get_flags",
    GET_VERSION: "app:get_version",
    GET_CONFIG: "app:get_config",
    GET_INFO: "app:get_info",
  }),

  WINDOW: Object.freeze({
    MINIMIZE: "window:minimize",
    MAXIMIZE: "window:maximize",
    CLOSE: "window:close",
  }),
});

function freezeChannelGroup(group) {
  return Object.freeze({ ...group });
}

export function createIpcChannels(appChannels = {}) {
  const channels = { ...COMMON_IPC_CHANNELS };

  for (const [name, group] of Object.entries(appChannels)) {
    channels[name] = freezeChannelGroup(group);
  }

  return Object.freeze(channels);
}

export default COMMON_IPC_CHANNELS;
