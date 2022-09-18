/**
 * This file is loaded via the <script> tag in the index.html file and will
 * be executed in the renderer process for that window. No Node.js APIs are
 * available in this process because `nodeIntegration` is turned off and
 * `contextIsolation` is turned on. Use the contextBridge API in `preload.js`
 * to expose Node.js functionality from the main process.
 */


/***************************************************************************/
/***************************** Table Functions******************************/
/***************************************************************************/

let statusOptions = {
  pending: "بانتظار الدفع",
  processing: "قيد التنفيذ",
  completed: "مكتمل",
  canceled: "ملغى",
  refunded: "مرتجع",
  failed: "فشل",
};

let statusOptionsKeys = Object.keys(statusOptions);

let ordersTable = document.getElementById("orders-table");
ordersTable.appendOrder = (ord) => {

  let tr = document.createElement("tr");
  tr.id = `tr-${ord.id}`;

  let createAppendTd = (innerText) => {
    td = document.createElement("td");
    td.innerText = innerText;
    tr.appendChild(td);
    return td;
  }

  td = createAppendTd('❌');
  td.setAttribute('onclick', `orders.delete(${ord.id})`)
  td.style.cursor = 'pointer';
  createAppendTd(ord.id);
  createAppendTd(ord.name);

  /**** STATUS OPTIONS START*****/
  statusHTMLOptions = `<td><select name="status" id="st-${ord.id}">`
  statusHTMLOptions += `<option value="${ord.status}" selected>${statusOptions[ord.status]}</option>`
  let removedStatus = statusOptions[ord.status]; 
  delete statusOptions[ord.status]

  for (key in statusOptions) {
    statusHTMLOptions += `<option value="${key}">${statusOptions[key]}</option>`;
  }
  statusOptions[ord.status] = removedStatus;

  statusHTMLOptions += `</select></td>`;
  tr.innerHTML += statusHTMLOptions;
  // console.log(tr);
  /**** STATUS OPTIONS END*****/

  let date = (Date.now() - Date.parse(ord.date_created)) / 1000 / 3600;
  let hours = Math.trunc(date)
  let mins = Math.trunc((date - hours) * 60);
  createAppendTd(`منذ ${hours} ساعات و ${mins} دقيقة`);
  createAppendTd(ord.total);

  {
    let updateBtn = document.createElement('button');
    updateBtn.setAttribute('onclick', `orders.update(${ord.id})`);
    updateBtn.innerText = "تحديث";
    let td = document.createElement("td");
    td.appendChild(updateBtn)
    tr.appendChild(td);
  }

  {
    let exportPdfBtn = document.createElement('button');
    exportPdfBtn.setAttribute('onclick', `orders.print(${ord.id})`);
    exportPdfBtn.innerText = 'إطبع';
    exportPdfBtn.id = `pr-${ord.id})`
    let td = document.createElement("td");
    td.appendChild(exportPdfBtn)
    tr.appendChild(td);
  }

  ordersTable.appendChild(tr)
}








/***************************************************************************/
/*************************** Orders Controls *******************************/
/***************************************************************************/
let listOrders = document.getElementById('ListOrders');
let orders = {};

orders.print = (id) => {
  let ord = orders[id];
  // console.log(ord);
  // console.log(orders);
  window.ordersApi.print(ord, (data) => {
    console.log("print: ", data);
  })
}

orders.delete = (id) => {
  window.ordersApi.delete({id}, (data) => {
    let tr = document.getElementById(`tr-${id}`);
    tr.style.display = 'none';
    if(data.success) {
      tr.remove();
      console.log("TODO: success!");
      return;
    }
    tr.style.display = 'block';
    console.log("TODO: failed to delete the order");
  })
}

orders.update = (id) => {
  let statusElement = document.getElementById(`st-${id}`);
  let selectedStatus = statusElement.options[statusElement.selectedIndex].value;

  window.ordersApi.update({id, status: selectedStatus}, (data) => {
    if(data.success == false) {
      statusElement.options = statusOptionsKeys.indexOf(orders[id]);
      return;
    }
    console.log("TODO: success!")
  })
};

listOrders.onclick = async () => {
  let once = true;
  let order_request_type = document.getElementById("order-request-type");
  let order_type = order_request_type.options[order_request_type.selectedIndex].value;
  window.ordersApi.listAll(order_type, (data) => {
    
    if(!once) {
      return;
    }
    once = false;
    if(data.success == false) {
      console.log("TODO: [error]: ", data.result);
      return;
    }

    
    let result = data.result;
    
    for (id in result) {
      orders[result[id].id] = result[id];
      ordersTable.appendOrder(result[id]);
    }
  });
  
}

