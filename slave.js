import Broadcast from "absol/src/Network/Broadcast";

var url = location.href.split('?');
var GET = {};
if (url.length > 1) {
    GET = url[1].split('&').reduce(function (ac, cr) {
        var p = cr.split('=');
        if (p.length == 2) {
            var name = p[0].trim();
            var value = p[1].trim();
            ac[name] = value;
        }
        return ac;
    }, GET);
}

var mBroadcast = new Broadcast(GET.channel || "NOT_LISTENING", Math.random()+"");

var scriptElt = document.createElement('script');
var cssElt = document.createElement('style');

function handleJS(code) {
    var b = new Blob([code], { type: 'text/javascript' });
    scriptElt.src = URL.createObjectURL(b);
}

function handleCss(code) {
    cssElt.innerHTML = code;
}

function handleHTML(code) {
    var temp = document.createElement('div');
    temp.innerHTML = code;
    while (temp.firstChild) {
        document.body.appendChild(temp.firstChild);
    }
}


mBroadcast.once("RECEIVE_ALL", function (data) {
    handleHTML(data.html);
    handleCss(data.css);
    handleJS(data.js);
});

mBroadcast.on("RELOAD", function () {

    location.reload();
});

function loadPage() {
    mBroadcast.emit("GET_ALL", {});
    console.log("loadpage")
    document.head.appendChild(cssElt);
    document.body.appendChild(scriptElt);
}


window.addEventListener("load", loadPage);