// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const carbone = require('carbone');
const fs = require('fs');
const { print, getPrinters } = require('pdf-to-printer')

const WooCommerceAPI = require('woocommerce-api');
const path = require('path')
const toml = require('toml');

require('update-electron-app')()

let orders = {};

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  })

  let configs = toml.parse(fs.readFileSync("./config.toml"));

  console.log("configs: \n", configs);
  const woo = new WooCommerceAPI({
    url: "https://100habbah.com",
    consumerKey: configs['woocommerce-api'].consumerKey,
    consumerSecret: configs['woocommerce-api'].consumerSecret,
    wpAPI: true,
    version: 'wc/v3'
  });

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  ipcMain.handle("orders:update", (event, data) => {
    woo.putAsync(`orders/${data.id}`, { status: data.status })
      .then((_response) => {
        event.sender.send('orders:update-handle', { success: true, result: null })
      })
      .catch((error) => {
        event.sender.send("orders:update-handle", { success: false, result: error })
      });
  })
  ipcMain.handle("orders:delete", (event, data) => {
    woo.deleteAsync(`orders/${data.id}`)
      .then((_response) => {
        event.sender.send('orders:delete-handle', { success: true, result: null })
      })
      .catch((error) => {
        event.sender.send("orders:delete-handle", { success: false, result: error })
      });
  })

  ipcMain.handle("orders:print-pdf", (event, order) => {


    let d = new Date();

    let numFixedWidth = (num, width) => {
      return ("      " + Number(num)).slice(-width);
    }
    let products = order.line_items.map((item) => {
      return { q: numFixedWidth(item.quantity, 6), t: numFixedWidth(item.total, 6), p: item.name };
    });

    let data = {
      id: order.id,
      name: order.name,
      date: d.toDateString(),
      time: d.toLocaleTimeString(),
      p: products,
      deliveryCost: order.shipping_total,
      discount: '0',
      total: order.total,
      note: order.customer_note,
      addr: order.address
    };
    var options = {
      convertTo: 'pdf',
      lang: 'ar-EG',

    };
    carbone.render('invoice-template.odt', data, options, function (err, result) {
      if (err) {
        event.sender.send('orders:print-pdf-handle', { success: false });
        return;
      }

      let filepath = `./../${order.name}#${order.id}.pdf`;
      fs.writeFileSync(filepath, result);
      const options = {
        printer: configs['printer'].name,
        copies: configs['printer'].copies,
      }
      print(filepath, options).then(console.log);
      event.sender.send('orders:print-pdf-handle', { success: true });
    })
  })

  ipcMain.handle("orders:list-all", (event, order_status) => {
    woo.getAsync("orders?status=" + order_status)
      .then((response) => {

        let result = JSON.parse(response.toJSON().body);

        let newOrders = {};
        for (id in result) {
          if (orders[result[id].id] && orders[result[id].id].date_modified == result[id].date_modified) {
            console.log("order is already up to date");
            continue;
          }
          let ord = {};
          ord.id = result[id].id;
          ord.name = result[id].billing.first_name;
          ord.status = result[id].status;
          ord.date_created = result[id].date_created;
          ord.date_modified = result[id].date_modified;
          ord.line_items = result[id].line_items.map((item) => {
            return {
              sku: item.sku,
              name: item.name,
              quantity: item.quantity,
              total: item.total,
            }
          });
          // console.log("line_items\n", ord.line_items);
          ord.shipping_total = result[id].shipping_total;
          ord.total = result[id].total;
          ord.customer_note = result[id].customer_note;
          ord.address = `المنطقة ${result[id].meta_data[4].value} عمارة ${result[id].meta_data[5].value} شقة ${result[id].meta_data[6].value}`;
          orders[ord.id] = { date_modified: ord.date_modified };
          // console.log("orders", orders)
          newOrders[id] = ord;
        }
        console.log('orders', newOrders);
        event.sender.send("orders:list-all-handle", { success: true, result: newOrders })
        // event.sender.send("orders:list-all-handle", { success: true, result: result })
      })
      .catch((error) => {
        event.sender.send("orders:list-all-handle", { success: false, result: error })
      });
  })


  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
