function getTitle() {
    return document.title;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'getTitle') {
        sendResponse({ title: getTitle() });
    }
});
