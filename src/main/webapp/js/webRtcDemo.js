
var wsHostname = window.location.hostname;
var wsURL = "ws://"+wsHostname+":"+"5678";
console.log("window.location.hostname:"+window.location.hostname)
var currentUserId = "";
var selectedParticipant = "";
var webSocket = null;

window.onbeforeunload = function() {
    if (webSocket != null) {
        webSocket.onclose = function () {}; // disable onclose handler first
        webSocket.close();
    }
};

/**
 * 创建连接
 * @param connectForm
 * @returns {boolean}
 */
function connect(connectForm) {

    if (connectForm.UserId.value == "") {
        reportStatusMessage("ERROR", "Cannot connect with an empty ID");
        return false;
    }
    if (!connectForm.UserId.value.match(/^[0-9a-zA-Z_]+$/)) {
        reportStatusMessage("ERROR", "Invalid userId: only alphanumeric and underscore chars allowed");
        return false;
    }
    //如果原有的webSocket存在，则需要将原有的socket
    if (webSocket != null) {
        webSocket.onclose = function () {};
        webSocket.onopen = function () {};
        webSocket.onerror = function () {};
        webSocket.onmessage = function () {};
        if (webSocket.readyState == 0 || webSocket.readyState == 1)
            webSocket.close();
    }
    reportStatusMessage("INFO", "Connection in progress ");
    currentUserId = connectForm.UserId.value;
    //创建webSocket
    webSocket = new WebSocket(wsURL);
    //如果webSocket关闭了，则进行提示
    webSocket.onclose = function(evt) {
        reportStatusMessage("INFO", "Connection closed: "+evt.reason);
    }
    //如果webSocket开启了，则进行提示
    webSocket.onopen = function(evt) {
        reportStatusMessage("INFO", "WebSocket connected");
        webSocket.send("{command:'connect', fromUserId:'"+currentUserId+"'}")
    }
    //如果webSocket错误了，则进行提示
    webSocket.onerror = function(evt) {
        reportStatusMessage("ERROR", "WebSocket Error");
    }
    //通过 onmessage 事件来接收服务器返回的数据
    webSocket.onmessage = function(evt) {
        var data = JSON.parse(evt.data);
        processMessage(data);
    } 
    
    return false;
}

function processMessage(data) {
    if (data.hasOwnProperty("type")) {
        if (data.command == "listUsers") {
            setParticipantList(JSON.parse(data.message));
        }
        else {
            reportStatusMessage("INFO", data.message);
            if (data.command == "connect")
                webSocket.send("{command:'listUsers', fromUserId:'"+currentUserId+"'}")
        }
        if (data.type == "OP_SUCCESS") {
        } else if (data.type == "OP_ERROR") {
            reportStatusMessage("ERROR", data.message);
        } else {
            reportStatusMessage("ERROR", "Unknown message received: "+JSON.stringify(data));
        }
    } else if (data.hasOwnProperty("eventType")) {
        if (data.eventType == "ConnectedUser") {
            addParticipant(data.userId);
        }
        else if (data.eventType == "DisconnectedUser") {
            removeParticipant(data.userId);
        }
        else if (data.eventType == "MessageReceived") {
            addMessage(data.userId, data.message);
        }
        else {
            reportStatusMessage("ERROR", "Unknown message received: "+JSON.stringify(data));
        }
    } else {
        reportStatusMessage("ERROR", "Unknown message received: "+JSON.stringify(data));
    }
}

function sendMessage() {
    if (checkWebSocket() == false)
        return;
    if (selectedParticipant == "" || selectedParticipant.innerHTML == "") {
        reportStatusMessage("ERROR", "No recipient selected");
        return;
    }
    var message = document.getElementById("Message");
    var msgValue = trimString(message.value)
    if ( msgValue == '') {
        reportStatusMessage("ERROR", "No message to send");
        return;
    }
    message.value = "";
    escapedMsgValue = msgValue.replace(/'/g, "\\'");
    //通过 send() 方法来向服务器发送数据
    webSocket.send("{command:'sendMessage', fromUserId:'"+currentUserId+"', toUserId:'"+selectedParticipant.innerHTML+"', message:'"+escapedMsgValue+"'}")
    addMessage(currentUserId, msgValue);
}

function checkWebSocket() {
    if (webSocket == null) {
        reportStatusMessage("ERROR", "Not connected");
        return false;
    } else if (webSocket.readyState == 0) {
        reportStatusMessage("ERROR", "connection in progress");
        return false;
    } else if (webSocket.readyState != 1) {
        reportStatusMessage("ERROR", "Not connected");
        return false;
    }
    return true;
}

function addMessage(user, msg) {
    var msgDiv = document.getElementById("TransferedMessage");
    msgDiv.innerHTML += "<br/><b>"+user+":</b> "+msg;
    msgDiv.scrollTop = msgDiv.scrollHeight;
}

function setParticipantList(users) {
    var htmldata = "";
    users.sort();
    users.unshift("*ALL*");
    var nUsers = users.length;
    for (var i = 0; i < nUsers; i++) {
        htmldata += "<li onclick='participantSelected(this)' id='"+users[i]+"'>"+users[i]+"</li>";
    }
    var plist = document.getElementById("ParticipantList");
    plist.innerHTML = htmldata;
}

function addParticipant(user) {
    var plist = document.getElementById("ParticipantList");
    var newLi = document.createElement("li");
    newLi.appendChild(document.createTextNode(user));
    newLi.setAttribute("id", user);
    newLi.setAttribute("onclick", "participantSelected(this)");
    plist.appendChild(newLi);

    if (selectedParticipant != "") {
        var sel = document.getElementById(selectedParticipant.innerHTML);
        sel.style.backgroundColor = selectedParticipant.style.backgroundColor;
        selectedParticipant = sel;
    }

    addMessage("####", user+" has joined the discussion");
}

function removeParticipant(user) {
    var plist = document.getElementById("ParticipantList");
    var item = document.getElementById(user);
    plist.removeChild(item);
    addMessage("####", user+" has left the discussion");
}

function participantSelected(listElt) {
    if (selectedParticipant != "") {
        selectedParticipant.style.backgroundColor  = "white";
    }
    selectedParticipant = listElt;
    selectedParticipant.style.backgroundColor  = "lightblue";
    
    var recipientName = document.getElementById("RecipientName");
    recipientName.innerHTML = selectedParticipant.innerHTML;
}

function reportStatusMessage(msgType, message) {
    var myObj = document.getElementById("StatusMessage");
    if (msgType == "ERROR") {
        message = "<font color='red'>Error: "+message+"</font>";
        //alert(message);
    } else if (msgType == "WARNING") {
        message = "<font color='orange'>Warning: "+message+"</font>";
    } else {
        message = "<font color='green'>Info: "+message+"</font>";
    }
    myObj.innerHTML += "<br/>"+message;
    myObj.scrollTop = myObj.scrollHeight;
}

function trimString(str) {
    str = (str.trim) ? str.trim() : str.replace(/^\s+/,'');
    return str;
}

