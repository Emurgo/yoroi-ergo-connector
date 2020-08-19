let inject = `

var rpcUid = 0;
var rpcResolver = new Map();

class API {
    rpc(func, params) {
        return new Promise(function(resolve, reject) {
            window.postMessage({
                type: "connector_rpc_request",
                uid: rpcUid,
                function: func,
                params: params
            }, location.origin);
            rpcResolver.set(rpcUid, { resolve: resolve, reject: reject });
            rpcUid += 1;
        });
    }

    request_read_access() {
        return this.rpc("request_read_access", []);
    }

    get_balance(token_id = 'ERG') {
        return this.rpc("get_balance", [token_id]);
    }
}

const ergo = Object.freeze(new API());

window.addEventListener("message", function(event) {
    if (event.data.type == "connector_rpc_response") {
        console.log("page received from connector: " + JSON.stringify(event.data) + " with source = " + event.source + " and origin = " + event.origin);
        const rpcPromise = rpcResolver.get(event.data.uid);
        if (rpcPromise != undefined) {
            rpcPromise.resolve(event.data.return);
        }
    }
});
`

try {
    const container = document.head || document.documentElement;
    const scriptTag = document.createElement('script');
    scriptTag.setAttribute("async", "false");
    scriptTag.textContent = inject;
    container.insertBefore(scriptTag, container.children[0]);
    container.removeChild(scriptTag);
    alert("injection succeeded");
} catch (e) {
    alert("injection failed: " + e);
}


window.addEventListener("message", function(event) {
    if (event.data.type == "connector_rpc_request") {
        console.log("connector received from page: " + JSON.stringify(event.data) + " with source = " + event.source + " and origin = " + event.origin);
        chrome.runtime.sendMessage(
           "eegbdfmlofnpgiiilnlboaamccblbobe",
           event.data,
           {},
           function(response) {
               console.log("connector received from Yoroi: " + JSON.stringify(response));
               window.postMessage({
                    type: "connector_rpc_response",
                    uid: event.data.uid,
                    return: response
                }, location.origin);
           });
    }
});