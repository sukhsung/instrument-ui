export function createDevicePreloadApi(ipcRenderer, channels, options = {}) {
  const api = {
    is_connected: () => ipcRenderer.invoke(channels.IS_CONNECTED),
    connect: (data) => ipcRenderer.send(channels.CONNECT, data),
    disconnect: () => ipcRenderer.send(channels.DISCONNECT),
    add_request: (data) => ipcRenderer.send(channels.ADD_REQUEST, data),

    start_comm: () => ipcRenderer.send(channels.START_COMM),

    evt_connection: (callback) =>
      ipcRenderer.on(channels.EVT_CONNECTION, (_evt, data) => callback(data)),
    evt_status: (callback) =>
      ipcRenderer.on(channels.EVT_STATUS, (_evt, data) => callback(data)),
    evt_settings: (callback) =>
      ipcRenderer.on(channels.EVT_SETTINGS, (_evt, data) => callback(data)),
  };

  if (options.includeMoving) {
    api.evt_moving = (callback) =>
      ipcRenderer.on(channels.EVT_MOVING, (_evt, data) => callback(data));
  }

  return api;
}

export function registerCommonPreloadApis({ contextBridge, ipcRenderer, CH }) {
  contextBridge.exposeInMainWorld("api_device_manager", {
    open: () => ipcRenderer.send(CH.DEVICE_MANAGER.OPEN),
    listSerialPorts: () =>
      ipcRenderer.invoke(CH.DEVICE_MANAGER.LIST_SERIAL_PORTS),
  });

  contextBridge.exposeInMainWorld("api_log", {
    select_path: () => ipcRenderer.invoke(CH.LOG.PATH_SELECT),
    open_path: () => ipcRenderer.invoke(CH.LOG.PATH_OPEN),
    get_current_path: () => ipcRenderer.invoke(CH.LOG.PATH_GET_CURRENT),

    log_start: () => ipcRenderer.send(CH.LOG.START),
    log_stop: () => ipcRenderer.send(CH.LOG.STOP),
    set_tag: (data) => ipcRenderer.send(CH.LOG.SET_TAG, data),

    evt_status: (callback) =>
      ipcRenderer.on(CH.LOG.EVT_STATUS, (_evt, data) => callback(data)),
  });

  contextBridge.exposeInMainWorld("api_flags", {
    get_flags: () => ipcRenderer.invoke(CH.APP.GET_FLAGS),
  });

  contextBridge.exposeInMainWorld("api_app", {
    get_version: () => ipcRenderer.invoke(CH.APP.GET_VERSION),
    get_config: () => ipcRenderer.invoke(CH.APP.GET_CONFIG),
    get_info: () => ipcRenderer.invoke(CH.APP.GET_INFO),
  });

  contextBridge.exposeInMainWorld("api_window", {
    minimize: () => ipcRenderer.send(CH.WINDOW.MINIMIZE),
    maximize: () => ipcRenderer.send(CH.WINDOW.MAXIMIZE),
    close: () => ipcRenderer.send(CH.WINDOW.CLOSE),
  });
}
