/**
 * The preload script runs before. It has access to web APIs
 * as well as Electron's renderer process modules and some
 * polyfilled Node.js functions.
 * 
 * https://www.electronjs.org/docs/latest/tutorial/sandbox
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ordersApi", {
  listAll: (order_status, callback) => {
    ipcRenderer.invoke("orders:list-all", order_status);
    ipcRenderer.on("orders:list-all-handle", (event, result) => {
      callback(result)
    });
  },
  update: (data, callback) => {
    ipcRenderer.invoke("orders:update", data);
    ipcRenderer.on("orders:update-handle", (event, result) => {
      callback(result)
    });
  },
  delete: (data, callback) => {
    ipcRenderer.invoke("orders:delete", data);
    ipcRenderer.on("orders:delete-handle", (event, result) => {
      callback(result)
    });
  },
  print: (data, callback) => {
    ipcRenderer.invoke("orders:print-pdf", data);
    ipcRenderer.on("orders:print-pdf-handler", (event, result) => {
      callback(result)
    })
  }
});
