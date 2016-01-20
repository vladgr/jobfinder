/**
 * Set DEBUG = false in production.
  */
let DEBUG = false;

if (DEBUG){
    // liveReload();
} else {
    console.log = function(){};
}
 
/**
 * Run extension index.html by clicking on icon
 */
chrome.browserAction.onClicked.addListener(function(tab) {
    startExtension();
});

function startExtension(){
    chrome.tabs.create({ url: 'index.html' });
}

/**
 * Use in development.
 */
function liveReload(){
    let sock;
    
    try{
        sock = new WebSocket('ws://localhost:9090');    
    } catch (err){
        return;
    }
        
    sock.onopen = function (event) {
        startExtension();    
    };

    sock.onmessage = function (event) {
        let message = event.data;
        if (message === 'reload'){
            chrome.runtime.reload();
        }
    }
}

/**
 * Initiates alarm for receiving periodic tasks from 
 * server.
 * Receives results from content script and sends data to server.
 * "this.tasks" - Array of urls to fetch
 * "this.tabId" - Working chrome tab to fetch urls.
 */
class Task {
    constructor(){
        this.homeUrl = 'https://www.upwork.com'
        this.tasks = [];
        this.tabId = -1;
        this.time = 0;
        chrome.storage.local.get({token: '', apiSite: ''}, obj => this.init(obj));    
        // initial url may be redirected, we need mapping initial url -> loaded url
        this.urlMap = new Map();
    }

    init(obj){
        this.token = obj.token;
        this.apiSite = obj.apiSite;
        this.apiUrlGetTasks = this.apiSite + '/api/upwork/get/tasks/';
        this.apiUrlProcessItem = this.apiSite + '/api/upwork/process/item/';
        this.apiUrlCheckNewJobs = this.apiSite + '/api/jobs/check/new/';

        this.createAlarm();
        this.listenAlarm();
        this.waitResults();    
        
    }
    
    /**
     * Returns working chrome tab id for fetching. Create tab if it doesn't exists.
     */
    getTabId(){
        return new Promise((resolve, reject) => {
            chrome.tabs.query({}, tabs => {
                for (let tab of tabs){
                    if (tab.id === this.tabId){
                        resolve(tab.id);
                        return;
                    }
                }

                // create tab, if no match
                chrome.tabs.create({index: 0, active: false}, tab => {
                    this.tabId = tab.id
                    resolve(tab.id);
                });
            });
        });
    }

    hasTasks(){
        if (this.tasks.length > 0) {
            return true;
        }
        return false;
    }
    
    /**
     * Start periodic alarm to get tasks from server
     */
    createAlarm(){
        chrome.alarms.create('getTasks', {periodInMinutes: 1});  
        chrome.alarms.create('checkNewJobs', {periodInMinutes: 3});  
    }

    
    listenAlarm(){
        chrome.alarms.onAlarm.addListener(obj => {
            switch (obj.name) {
                case 'getTasks':
                    this.getTasks()
                    break;
                case 'checkNewJobs':
                    this.checkNewJobs()
                    break;
            }
        });
    }

    /**
     * Get tasks from server. Do nothing if there are
     * some previous tasks.
     */
    getTasks(){
        if (this.hasTasks())
            return;
                
        let params = new FormData()
        params.append('token', this.token);
    
        fetch(this.apiUrlGetTasks, {method: 'POST', body: params})
            .then(response => response.json())
            .then(data => this.tasks = data)
            .then(() => this.processTasks());
    }

    checkNewJobs(){
        let params = new FormData()
        params.append('token', this.token);
    
        fetch(this.apiUrlCheckNewJobs, {method: 'POST', body: params})
            .then(response => response.json())
            .then(data => {
                console.log(data);
                if (data.result){
                    this.playSound();
                }
            });
    }

    playSound(){
        document.write('<audio id="soundSignal"><source src="sound/sound.mp3" type="audio/mpeg"></audio>');
        document.getElementById('soundSignal').play();
    }

    /**
     * Recursive task processing until processes all urls
     * in "this.tasks". Result will be sent by content script.
     */
    processTasks(){
        console.log('Processing tasks...');
        console.log(`Num tasks: ${this.tasks.length}`);    
        
        if (!this.hasTasks())
            return;
        
        this.getTabId().then(tabId => {
            // If browser visits job page directly without visiting home page
            // Upwork (for some reason) may redirect to home page.
            // Also the same situation happens if too much time passed 
            // from last visit of any Upwork page.
            // So, current time stored in "this.time" and if more than 
            // 90 seconds passed - browser visits home page first and then visits 
            // job page.

            let url;
            let t = parseInt((Date.now() - this.time)/1000);
            if (t > 90){
                url = this.homeUrl;
            } else {
                url = this.tasks.pop();    
            }
            
            chrome.tabs.update(tabId, {url: url, active: false}, tab => {
                this.urlMap.set(tab.url, url);
                this.time = Date.now(); 
                setTimeout(() => this.processTasks(), 10000);    
            });  
        });
    }

    /**
     * Waits results from content script.
     * Sends result to server 
     * Message object: type (string), url (string), html (string)
     * Server expects: token, url, html.
     */
    waitResults(){
        chrome.runtime.onMessage.addListener((msg, sender) => {
            if (msg.type !== 'result'){
                return;    
            }
            
            let url = this.urlMap.get(msg.url);
            this.urlMap.delete(msg.url);

            console.log(msg.url);
            console.log(url);    
            
            let params = new FormData()
            params.append('token', this.token);
            params.append('url', url);
            params.append('html', msg.html);
            
            console.log('Sending data to server.');    
                        
            fetch(this.apiUrlProcessItem, {method: 'POST', body: params});
        });
    }
}

new Task();
