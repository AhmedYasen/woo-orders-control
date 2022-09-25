function showErrMsg(msg) {
    showMsg(msg, 'failure-msg')
}

function showSuccessMsg(msg) {
    showMsg(msg, 'success-msg')
}

function showMsg(msg, msgClass = 'info-msg') {
    
    let msgDom = document.createElement('div')
    let resultMsg = document.getElementById('result-msg')
    msgDom.className = msgClass
    msgDom.innerText = msg
    msgDom.style.position = 'relative'
    msgDom.style.transition = 'visibility 3s'
    msgDom.style.visibility = 'none'
    let close = document.createElement('div')
    close.innerHTML = "&times;"
    close.style.position = 'absolute'
    close.style.top = '0'
    close.style.left = '0.5em'
    close.style.fontSize = '1.125em'
    close.style.cursor = 'pointer'
    close.addEventListener('click', (event) => {
        msgDom.remove()
    })
    msgDom.appendChild(close)
    resultMsg.appendChild(msgDom)
}

