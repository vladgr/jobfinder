'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Set DEBUG = false in production.
  */
var DEBUG = false;

if (DEBUG) {
    // liveReload();
} else {
        console.log = function () {};
    }

/**
 * Run extension index.html by clicking on icon
 */
chrome.browserAction.onClicked.addListener(function (tab) {
    startExtension();
});

function startExtension() {
    chrome.tabs.create({ url: 'index.html' });
}

/**
 * Use in development.
 */
function liveReload() {
    var sock = undefined;

    try {
        sock = new WebSocket('ws://localhost:9090');
    } catch (err) {
        return;
    }

    sock.onopen = function (event) {
        startExtension();
    };

    sock.onmessage = function (event) {
        var message = event.data;
        if (message === 'reload') {
            chrome.runtime.reload();
        }
    };
}

/**
 * Initiates alarm for receiving periodic tasks from 
 * server.
 * Receives results from content script and sends data to server.
 * "this.tasks" - Array of urls to fetch
 * "this.tabId" - Working chrome tab to fetch urls.
 */

var Task = (function () {
    function Task() {
        var _this = this;

        _classCallCheck(this, Task);

        this.homeUrl = 'https://www.upwork.com';
        this.tasks = [];
        this.tabId = -1;
        this.time = 0;
        chrome.storage.local.get({ token: '', apiSite: '' }, function (obj) {
            return _this.init(obj);
        });
        // initial url may be redirected, we need mapping initial url -> loaded url
        this.urlMap = new Map();
    }

    _createClass(Task, [{
        key: 'init',
        value: function init(obj) {
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

    }, {
        key: 'getTabId',
        value: function getTabId() {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                chrome.tabs.query({}, function (tabs) {
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = tabs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var tab = _step.value;

                            if (tab.id === _this2.tabId) {
                                resolve(tab.id);
                                return;
                            }
                        }

                        // create tab, if no match
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion && _iterator.return) {
                                _iterator.return();
                            }
                        } finally {
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }

                    chrome.tabs.create({ index: 0, active: false }, function (tab) {
                        _this2.tabId = tab.id;
                        resolve(tab.id);
                    });
                });
            });
        }
    }, {
        key: 'hasTasks',
        value: function hasTasks() {
            if (this.tasks.length > 0) {
                return true;
            }
            return false;
        }

        /**
         * Start periodic alarm to get tasks from server
         */

    }, {
        key: 'createAlarm',
        value: function createAlarm() {
            chrome.alarms.create('getTasks', { periodInMinutes: 1 });
            chrome.alarms.create('checkNewJobs', { periodInMinutes: 3 });
        }
    }, {
        key: 'listenAlarm',
        value: function listenAlarm() {
            var _this3 = this;

            chrome.alarms.onAlarm.addListener(function (obj) {
                switch (obj.name) {
                    case 'getTasks':
                        _this3.getTasks();
                        break;
                    case 'checkNewJobs':
                        _this3.checkNewJobs();
                        break;
                }
            });
        }

        /**
         * Get tasks from server. Do nothing if there are
         * some previous tasks.
         */

    }, {
        key: 'getTasks',
        value: function getTasks() {
            var _this4 = this;

            if (this.hasTasks()) return;

            var params = new FormData();
            params.append('token', this.token);

            fetch(this.apiUrlGetTasks, { method: 'POST', body: params }).then(function (response) {
                return response.json();
            }).then(function (data) {
                return _this4.tasks = data;
            }).then(function () {
                return _this4.processTasks();
            });
        }
    }, {
        key: 'checkNewJobs',
        value: function checkNewJobs() {
            var _this5 = this;

            var params = new FormData();
            params.append('token', this.token);

            fetch(this.apiUrlCheckNewJobs, { method: 'POST', body: params }).then(function (response) {
                return response.json();
            }).then(function (data) {
                console.log(data);
                if (data.result) {
                    _this5.playSound();
                }
            });
        }
    }, {
        key: 'playSound',
        value: function playSound() {
            document.write('<audio id="soundSignal"><source src="sound/sound.mp3" type="audio/mpeg"></audio>');
            document.getElementById('soundSignal').play();
        }

        /**
         * Recursive task processing until processes all urls
         * in "this.tasks". Result will be sent by content script.
         */

    }, {
        key: 'processTasks',
        value: function processTasks() {
            var _this6 = this;

            console.log('Processing tasks...');
            console.log('Num tasks: ' + this.tasks.length);

            if (!this.hasTasks()) return;

            this.getTabId().then(function (tabId) {
                // If browser visits job page directly without visiting home page
                // Upwork (for some reason) may redirect to home page.
                // Also the same situation happens if too much time passed
                // from last visit of any Upwork page.
                // So, current time stored in "this.time" and if more than
                // 90 seconds passed - browser visits home page first and then visits
                // job page.

                var url = undefined;
                var t = parseInt((Date.now() - _this6.time) / 1000);
                if (t > 90) {
                    url = _this6.homeUrl;
                } else {
                    url = _this6.tasks.pop();
                }

                chrome.tabs.update(tabId, { url: url, active: false }, function (tab) {
                    _this6.urlMap.set(tab.url, url);
                    _this6.time = Date.now();
                    setTimeout(function () {
                        return _this6.processTasks();
                    }, 10000);
                });
            });
        }

        /**
         * Waits results from content script.
         * Sends result to server 
         * Message object: type (string), url (string), html (string)
         * Server expects: token, url, html.
         */

    }, {
        key: 'waitResults',
        value: function waitResults() {
            var _this7 = this;

            chrome.runtime.onMessage.addListener(function (msg, sender) {
                if (msg.type !== 'result') {
                    return;
                }

                var url = _this7.urlMap.get(msg.url);
                _this7.urlMap.delete(msg.url);

                console.log(msg.url);
                console.log(url);

                var params = new FormData();
                params.append('token', _this7.token);
                params.append('url', url);
                params.append('html', msg.html);

                console.log('Sending data to server.');

                fetch(_this7.apiUrlProcessItem, { method: 'POST', body: params });
            });
        }
    }]);

    return Task;
})();

new Task();