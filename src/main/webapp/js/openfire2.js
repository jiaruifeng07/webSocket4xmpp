// var serverIP="192.168.23.186";
var serverIP="server3";
// var serverIP="localhost";
var wsURL = "ws://"+serverIP+":7070/ws/";
// 7443/ws/
var currentUserId = "";
var webSocket = null;

var username="";
var password="";

var id="";
var openCount=0;
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
    openCount=0;
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
    username = connectForm.UserId.value;
    password = connectForm.password.value;
    //创建webSocket
    webSocket = new WebSocket(wsURL,"xmpp");
    //如果webSocket关闭了，则进行提示
    webSocket.onclose = function(evt) {

    }
    //如果webSocket开启了，则进行提示
    webSocket.onopen = function(evt) {
        sendOpen();
    }
    //如果webSocket错误了，则进行提示
    webSocket.onerror = function(evt) {
    }
    //通过 onmessage 事件来接收服务器返回的数据
    webSocket.onmessage = function(evt) {
        debugger
        console.log("receive<<<<<<<:"+evt.data)
        var $data = $(evt.data);
        if(evt.type=="message"){
            processMessage($data);
        }
    }
    
    return false;
}
function sendOpen(){
    //发送建立流请求
    var message = "<open to='"+serverIP+"' from='"+currentUserId+"@"+serverIP+"'  xmlns='urn:ietf:params:xml:ns:xmpp-framing' xml:lang='zh' version='1.0'/>";
    console.log("send>>>>"+message)
    webSocket.send(message);
}
function auth(username,password) {

    var token=base64Util.encode(username+'\0'+password)
    var message = "<auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl' mechanism='PLAIN'>" + token + "</auth>";
    console.log("send>>>>"+message);
    webSocket.send(message);
}

function processMessage($data) {
    if($data.length>0){
        var $first=$data.get(0);h
        // console.log("$first.nodeName"+$first.nodeName);
        if($first.nodeName=="OPEN"){
            // if(openCount==0){
                id=$first.getAttribute("id");
                // debugger
                // handleOpen();
                // openCount++;
            // }
        }else if($first.nodeName=="STREAM:FEATURES"){
            if($first.firstChild.localName=="mechanisms"){
                var $mechanisms=$($first.firstChild.children);
                $mechanisms.each(function(){
                    // console.log($(this).text());
                })
                auth(username,password);
            }else if ($first.firstChild.localName="bind"){
                handleBind();
            }
        }else if($first.localName=="success"){
            handleSuccess();
        }else if($first.localName=="failure"){
            console.log("failure");
        }else if($first.localName=="iq"){
            if($first.firstChild.localName="bind"){
                sendPresence();
            }else if($first.firstChild.localName="query"){

            }

        }

    }
}
function handleBind() {
    console.log(id);
    //发送建立流请求
    var message = "<iq type='set' id='"+id+"'><bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'/></iq>";
    console.log("send>>>>"+message)
    webSocket.send(message);
}
function sendQuery(){
    var message="<iq id='1r5T9-5' type='get'><query xmlns='jabber:iq:roster'></query></iq>";
    webSocket.send(message);
}
function sendPresence(){
    var message="<presence><c xmlns='http://jabber.org/protocol/caps' node='http://www.igniterealtime.org/projects/smack' /></presence>"
    console.log("send>>>>"+message)
    webSocket.send(message)

}
function handleSuccess() {
    console.log(id);
    //发送建立流请求
    var message = "<open to='"+serverIP+"' id='"+id+"' from='"+currentUserId+"@"+serverIP+"'  xmlns='jabber:client' xml:lang='zh' version='1.0'/>";
    console.log("send>>>>"+message)
    webSocket.send(message);
}

function sendMessage() {
    if (checkWebSocket() == false)
        return;
    var recipientId = document.getElementById("recipientId");
    var recipientIdValue = trimString(recipientId.value)

    var message = document.getElementById("Message");
    var msgValue = trimString(message.value)

    if ( msgValue == '') {
        // reportStatusMessage("ERROR", "No recipientId to send");
        return;
    }
    message.value = "";
    escapedMsgValue = msgValue.replace(/'/g, "\\'");

    var result='<message to="'+recipientIdValue+'@'+serverIP+""+'" type="chat"><body>'+escapedMsgValue +'</body></message>';
    console.log(result)
    webSocket.send(result);
    //
    // addMessage(currentUserId, msgValue);
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

