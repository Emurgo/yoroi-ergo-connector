// sets up RPC communication with the connector + access check/request functions
const initialInject = `

var rpcUid = 0;
var rpcResolver = new Map();

function _ergo_rpc_call(func, params) {
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

function ergo_request_read_access() {
    return _ergo_rpc_call("ergo_request_read_access", []);
}

// RPC set-up
window.addEventListener("message", function(event) {
    if (event.data.type == "connector_rpc_response") {
        console.log("page received from connector: " + JSON.stringify(event.data) + " with source = " + event.source + " and origin = " + event.origin);
        const rpcPromise = rpcResolver.get(event.data.uid);
        if (rpcPromise !== undefined) {
            const ret = event.data.return;
            if (ret.err !== undefined) {
                rpcPromise.reject(ret.err);
            } else {
                rpcPromise.resolve(ret.ok);
            }
        }
    }
});
`

// client-facing ergo object API
const apiInject = `
class ErgoAPI {
    get_balance(token_id = 'ERG') {
        return _ergo_rpc_call("get_balance", [token_id]);
    }

    sign_tx(tx) {
        return _ergo_rpc_call("sign_tx", [tx]);
    }
}

const ergo = Object.freeze(new ErgoAPI());
`

function injectIntoPage(code) {
    try {
        const container = document.head || document.documentElement;
        const scriptTag = document.createElement('script');
        scriptTag.setAttribute("async", "false");
        scriptTag.textContent = code;
        container.insertBefore(scriptTag, container.children[0]);
        container.removeChild(scriptTag);
        console.log("injection succeeded");
    } catch (e) {
        console.log("injection failed: " + e);
    }
}

injectIntoPage(initialInject);

window.addEventListener("message", function(event) {
    if (event.data.type == "connector_rpc_request") {
        console.log("connector received from page: " + JSON.stringify(event.data) + " with source = " + event.source + " and origin = " + event.origin);
        chrome.runtime.sendMessage(
            "eegbdfmlofnpgiiilnlboaamccblbobe",
            event.data,
            {},
            function(response) {
                console.log("connector received from Yoroi: " + JSON.stringify(response));
                // inject full API here
                if (event.data.function == "ergo_request_read_access" && response.ok === true) {
                    injectIntoPage(apiInject);
                }
                window.postMessage({
                    type: "connector_rpc_response",
                    uid: event.data.uid,
                    return: response
                }, location.origin);
            });
    }
});