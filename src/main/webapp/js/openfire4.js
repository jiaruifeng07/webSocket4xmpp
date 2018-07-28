
var serverIP="server3";
var wsURL = "ws://"+serverIP+":7070/ws/";
var currentUserId = "";
var webSocket = null;

var username="";
var password="";

var id="";
var iqSiId="";
var fileSize=0;
var content="";
/**
 * 将websocket重置
 */
window.onbeforeunload = function() {
    if (webSocket != null) {
        webSocket.onclose = function () {}; // disable onclose handler first
        webSocket.close();
    }
};

/**
 * 页面中点击connect按钮，创建连接
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
        // debugger
        console.log("")
        //打印接收的信息
        console.log("receive<<<<<<<:"+evt.data)
        var $data = $(evt.data);
        processMessage($data);
    }
    
    return false;
}

//开启
function sendOpen(){
    var message = "<open to='"+serverIP+"' from='"+currentUserId+"@"+serverIP+"'  xmlns='urn:ietf:params:xml:ns:xmpp-framing' xml:lang='zh' version='1.0'/>";
    console.log("send>>>>"+message)
    webSocket.send(message);
}

/**
 * 认证
 * @param username
 * @param password
 */
function auth(username,password) {
    var token=base64Util.encode(username+'\0'+password)
    var message = "<auth xmlns='urn:ietf:params:xml:ns:xmpp-sasl' mechanism='PLAIN'>" + token + "</auth>";
    console.log("send>>>>"+message);
    webSocket.send(message);
}

/**
 * 处理接收到的消息
 * @param $data
 */
function processMessage($data) {
    if($data.length>0){
        var $first=$data.get(0);
        if($first.nodeName=="OPEN"){
                id=$first.getAttribute("id");
        }else if($first.nodeName=="STREAM:FEATURES"){
            if($first.firstChild.localName=="mechanisms"){
                auth(username,password);
            }else if ($first.firstChild.localName="bind"){
                handleBind();
            }
        }else if($first.localName=="success"){
            handleSuccess();
        }else if($first.localName=="failure"){
            console.log("failure");
        }else if($first.localName=="iq"){
            if($first.firstChild.localName=="bind"){
                sendPresence();
            }else if($first.firstChild.localName=="query"){
                // if($first.getAttribute("type")=="get"){
                //     handleGet()
                // }
            }else if($first.firstChild.localName=="si"){
                iqSiId=$first.getAttribute("id");
                var $si=$first.firstChild;
                var $file=$si.firstChild;
                fileSize=$file.getAttribute("size");
                content="";
                blocks=fileSize/
                console.log("fileSize:"+fileSize);
                handleSi()
            }else if($first.firstChild.localName=="open"){
                iqSiId=$first.getAttribute("id");
                handleIqOpen()
            }if($first.firstChild.localName=="data"){
                iqSiId=$first.getAttribute("id");
                fileSize=fileSize-4096;
                var $data=$first.firstChild;
                content=content+$data.content
                if(fileSize>0){
                    handleIqOpen()
                }
                console.log(content)
            }

        }

    }
}

/**
 * 处理IqOpen
 */
function handleIqOpen(){
    var message = "<iq from='"+currentUserId+"@"+serverIP+"'  id='"+iqSiId+"' to='test1@"+serverIP+"/Spark 2.8.3.579' type='result'/>";
    console.log("send>>>>"+message)
    webSocket.send(message);
}
// function handleSi() {
//     var message = "<iq type='result' to='test1@server3/Spark 2.8.3.579' from='"+currentUserId+"@"+serverIP+"'  id='"+iqSiId+"'><si xmlns='http://jabber.org/protocol/si'><feature xmlns='http://jabber.org/protocol/feature-neg'><x xmlns='jabber:x:data' type='submit'><field var='stream-method'><value>http://jabber.org/protocol/bytestreams</value><value>http://jabber.org/protocol/ibb</value></field></x></feature></si></iq>";
//     console.log("send>>>>"+message)
//     webSocket.send(message);
// }
//可以用于传小图片
function handleSi() {
    var message = "<iq type='result' to='test1@"+serverIP+"/Spark 2.8.3.579' from='"+currentUserId+"@"+serverIP+"'  id='"+iqSiId+"'><si xmlns='http://jabber.org/protocol/si'><feature xmlns='http://jabber.org/protocol/feature-neg'><x xmlns='jabber:x:data' type='submit'><field var='stream-method'><value>http://jabber.org/protocol/bytestreams</value><value>http://jabber.org/protocol/ibb</value></field></x></feature></si></iq>";
    console.log("send>>>>"+message)
    webSocket.send(message);
}
// function handleSi() {
//     debugger
//     //发送建立流请求
//     var message = "<iq type='result' to='test1@server3/Spark 2.8.3.579' id='"+id+"'><si xmlns='http://jabber.org/protocol/si'><feature xmlns='http://jabber.org/protocol/feature-neg'><x xmlns='jabber:x:data' type='submit'><field var='stream-method'><value>http://jabber.org/protocol/bytestreams</value></field></x></feature></si></iq>";
//     console.log("send>>>>"+message)
//     webSocket.send(message);
// }

/**
 * 绑定资源
 */
function handleBind() {
    var message = "<iq type='set' id='"+id+"'><bind xmlns='urn:ietf:params:xml:ns:xmpp-bind'/></iq>";
    console.log("send>>>>"+message)
    webSocket.send(message);
}

/**
 * 发送出席
 */
function sendPresence(){
    var message="<presence><c xmlns='http://jabber.org/protocol/caps' node='http://www.igniterealtime.org/projects/smack' /></presence>"
    console.log("send>>>>"+message)
    webSocket.send(message)

}

/**
 * 认证成功后，第二次发送open
 */
function handleSuccess() {
    console.log(id);
    //发送建立流请求
    var message = "<open to='"+serverIP+"' id='"+id+"' from='"+currentUserId+"@"+serverIP+"'  xmlns='jabber:client' xml:lang='zh' version='1.0'/>";
    console.log("send>>>>"+message)
    webSocket.send(message);
}

/**
 * 点击页面中的"send message"按钮，发送文本聊天内容
 */
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
}

/**
 * 发送文件
 *
 */
function sendFile() {
    if (checkWebSocket() == false)
        return;
    var recipientId = document.getElementById("recipientId");
    var recipientIdValue = trimString(recipientId.value)

    var inputElement = document.getElementById("fileInput");
    var fileList = inputElement.files;
    var file=fileList[0];
    if(!file) return;
    webSocket.send(file.name+":fileStart");
    var reader = new FileReader();
    //以二进制形式读取文件
    reader.readAsArrayBuffer(file);
    //文件读取完毕后该函数响应
    reader.onload = function loaded(evt) {
        var blob = evt.target.result;
        //发送二进制表示的文件
        webSocket.send(blob);
        // if(isWithText){
        //     webSocket.send(file.name+":fileFinishWithText");
        // }else{
            webSocket.send(file.name+":fileFinishSingle");
        // }
        console.log("finnish");
    }
    inputElement.outerHTML=inputElement.outerHTML; //清空<input type="file">的值
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

