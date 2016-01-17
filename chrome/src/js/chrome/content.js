

function process(){
    let url = window.location.href;
    if (url.includes('upwork.com')){
        let html = document.all[0].outerHTML;
        chrome.runtime.sendMessage({type: 'result', url: url, html: html});    
    }
}

process();
