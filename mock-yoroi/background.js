function handler(message, sender, sendResponse) {
    if (sender.id == "egflibcdkfhnhdpbdlbgopagfdbkghbo") {
        console.log("mock-yoroi received: " + JSON.stringify(message))
        if (message.type == "connector_rpc_request") {
            switch (message.function) {
                case "request_read_access":
                    sendResponse(true);
                    break;
                case "get_balance":
                    if (message.params[0] == "ERG") {
                        sendResponse(100);
                    } else {
                        sendResponse(5);
                    }
                    break;
                default:
                    sendResponse("unknown RPC: " + message.function + "(" + message.params + ")")
                    break;
            }
            sendResponse("a response from the mock Yoroi extension!")
        }
    } else {
        alert("received message \"" + message + "\" from other sender: " + sender.id);
    }
}

chrome.runtime.onMessageExternal.addListener(handler);