'use strict';

function process() {
    var url = window.location.href;
    if (url.includes('upwork.com')) {
        var html = document.all[0].outerHTML;
        chrome.runtime.sendMessage({ type: 'result', url: url, html: html });
    }
}

process();