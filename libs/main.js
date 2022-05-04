var log = {
        text: function(text, message_id, first=false){
        var a = document.createElement("p")
        a.id = `message-${message_id}`
        a.innerText = text;
        if(!first){
        document.getElementById("chat").appendChild(a)
        } else {
        document.getElementById("chat").prepend(a)
        }
        },
        image: function(src, first=false){
            var a = document.createElement("img")
            a.src = src;
            a.style.width = "80%";
            a.style.height = "80%";
            if(!first){
                document.getElementById("chat").appendChild(a)
            } else {
                document.getElementById("chat").prepend(a)
            }
        },
        video: function(src, first=false){
            var a = document.createElement("video")
            a.src = src;
            a.controls = true;
            a.style.width = "80%";
            a.style.height = "80%";
                if(!first){
                    document.getElementById("chat").appendChild(a)
                } else {
                    document.getElementById("chat").prepend(a)
                }
        },
        audio: function(src, first=false){
            var a = document.createElement("audio")
            a.src = src;
            a.controls = true;
            if(!first){
                document.getElementById("chat").appendChild(a)
            } else{
                document.getElementById("chat").prepend(a)
            }
        },
        file: function(src, text, first=false, download=false){
            var a = document.createElement("a")
            a.href = src;
            a.download = download;
            a.innerText = text;
            a.target = "_blank"
            if(!first){
                document.getElementById("chat").appendChild(a)
            } else{
                document.getElementById("chat").prepend(a)
            }
        },
        badge: function(elem, text) {
            var a = document.createElement("sub")
            a.className = 'small-message-badge'
            a.innerText = text
            elem.appendChild(a)
        }
    }
    var Client = {
        clientIds: [],
        clientName: {},
        intervalIds: {},
        reconnectAttempts: 0,
        start: function(clientName, token, channelid){
            if(Client.clientIds.length > 0){
                for(i of Client.clientIds) {
                    Client.close(i)
                }
            }
        Client.clientIds.push(clientName)
        Client.clientName[clientName] = new WebSocket("wss://gateway.discord.gg/?v=9&encoding=json")
        var interval = 0;
        var payload = {
            op:2,
            d: {
                token: token,
                properties: {
                    $os: "windows",
                    $browser: 'chrome',
                    $device: "pc"
                }
            }
        }
        Client.clientName[clientName].onopen = function() {
            Client.reconnectAttempts = 0
            Client.clientName[clientName].send(JSON.stringify(payload))
        }
        Client.clientName[clientName].onclose = function() {
            console.log("Reconnecting client...")
            clearInterval(Client.intervalIds[clientName])
            delete Client.clientName[clientName]
            Client.clientIds.splice(Client.clientIds.indexOf(clientName), 1)
            delete Client.intervalIds[clientName]
            Client.reconnectAttempts += 1
            if(Client.reconnectAttempts>=5){
                console.log("Reconnect failed!")
                Client.reconnectAttempts = 0
            } else{
            window.setTimeout(function() {
                Client.start(clientName, token, channelid, true)
            }, 10)
        }
        }
        Client.clientName[clientName].onmessage = function(data){
            var payload = JSON.parse(data.data)
            const {t, s, op, d} = payload;
            switch (op) {
                case 10:
                    const {heartbeat_interval} = d;
                    interval = heartbeat(heartbeat_interval)
                    break
            }
            switch (t) {
                case 'MESSAGE_CREATE':
                    let author = d.author.username
                    let content = d.content
                    if (channelid.toLowerCase() != 'all'){
                        if (d.channel_id === channelid) {
                            log.text(`${d.author.username}#${d.author.discriminator}: ${d.content}`, d.id)
                            if(d.attachments.length > 0){
                                for(i of d.attachments){
                                    if(i.content_type.includes("image")){
                                        log.image(i.url)
                                    } else if(i.content_type.includes("video")){
                                        log.video(i.url)
                                    } else if (i.content_type.includes("audio")) {
                                        log.audio(i.url)
                                    } else {
                                        log.file(i.url, i.filename)
                                    }
                                }
                            }
                        }
                    } else {
                        log.text(`${d.author.username}#${d.author.discriminator}: ${d.content}`, d.id)
                        if(d.attachments.length > 0){
                            for(i of d.attachments){
                                if(i.content_type.includes("image")){
                                    log.image(i.url)
                                } else if(i.content_type.includes("video")) {
                                    log.video(i.url)
                                } else if (i.content_type.includes("audio")) {
                                    log.audio(i.url)
                                } else {
                                    log.file(i.url, i.filename)
                                }
                            }
                        }
                    }
                    break;
                case 'MESSAGE_DELETE':
                    if (channelid.toLowerCase() != 'all'){
                        if(d.channel_id==channelid){
                            if(document.querySelector("#message-"+d.id)){
                                log.badge(document.querySelector("#message-"+d.id), " (deleted)")
                            }
                        }
                    } else {
                        if(document.querySelector("#message-"+d.id)){
                            log.badge(document.querySelector("#message-"+d.id), " (deleted)")
                        }
                    }
                    break;
                case 'MESSAGE_UPDATE':
                    if (channelid.toLowerCase() != 'all'){
                        if(d.channel_id==channelid){
                            console.log(d)
                            if(document.querySelector("#message-"+d.id)){
                                document.querySelector("#message-"+d.id).innerText = `${d.author.username}#${d.author.discriminator}: ${d.content}`
                                log.badge(document.querySelector("#message-"+d.id), " (edited)")
                            }
                        }
                    } else {
                        if(document.querySelector("#message-"+d.id)){
                            document.querySelector("#message-"+d.id).innerText = `${d.author.username}#${d.author.discriminator}: ${d.content}`
                            log.badge(document.querySelector("#message-"+d.id), " (edited)")
                        }
                    }
                    break;
            }
        }
        
        const heartbeat = (ms) => {
            Client.intervalIds[clientName] = setInterval(()=>{
                Client.clientName[clientName].send(JSON.stringify({op:1, d: null}))
            }, ms)
            return Client.intervalIds[clientName]
        }
        },
        close: function(clientName) {
            for(i in Client.clientIds){
                if(clientName==Client.clientIds[i]){
                    Client.clientName[clientName].onclose = function(){}
                    Client.clientName[clientName].close()
                    clearInterval(Client.intervalIds[clientName])
                    delete Client.clientName[clientName]
                    Client.clientIds.splice(Client.clientIds.indexOf(clientName), 1)
                    delete Client.intervalIds[clientName]
                    break
                } else{
                    console.warn("Unknown Client Id!")
                    break
                }
            }
        }
        }
function sendMessage(token, channelId, message) {
return fetch(`https://discord.com/api/v9/channels/${channelId}/messages`, {method: 'POST', headers: {'Content-Type': 'application/json', 'Authorization': token, 'Origin': "https://discord.com"}, body: JSON.stringify({content: message})})
}
async function getMessage(token, channelId, limit=50) {
var messages = await fetch(`https://discord.com/api/v9/channels/${channelId}/messages?limit=${limit}`, {headers: {'Content-Type': 'application/json', 'authorization': token, 'Origin': "https://discord.com"}}).then(res=>res.json())
for(d of messages) {
if(d.attachments.length > 0){
for(i of d.attachments){
    if(i.content_type.includes("image")){
        log.image(i.url, true)
    } else if(i.content_type.includes("video")) {
        log.video(i.url, true)
    } else if (i.content_type.includes("audio")) {
        log.audio(i.url, true)
    } else {
        log.file(i.url, i.filename, true)
    }
}
}
log.text(`${d.author.username}#${d.author.discriminator}: ${d.content}`, d.id, true)
}
}
document.getElementById("start").onclick = async function(){
var token = document.getElementById("token").value
var channelId = document.getElementById("channelid").value
document.getElementById("chat").innerHTML = ``
if (token.includes("Bot ")){
document.getElementById("chatbox").disabled = true
document.getElementById("send").disabled = true
} else {
try {await getMessage(token, channelId)} catch { }
document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight-document.getElementById("chat").clientHeight
}
Client.start(Math.random(), token, channelId)
document.getElementById("send").disabled = false
document.getElementById("chatbox").disabled = false
}
document.getElementById("send").onclick = function(){
var message = document.getElementById("chatbox").value
var token = document.getElementById("token").value
var channelId = document.getElementById("channelid").value
if (!token.includes("Bot ")){
sendMessage(token, channelId, message).then(function(){document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight-document.getElementById("chat").clientHeight})
document.getElementById("chatbox").value = ""
}
}
window.onkeydown = function(e){
if(e.keyCode == 13){
document.getElementById("send").click();
}
}
