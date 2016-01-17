(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.CONFIG = exports.EE = undefined;

var _menu = require('./menu');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var EventEmitter = require('events').EventEmitter;
var EE = exports.EE = new EventEmitter();
var CONFIG = exports.CONFIG = {};

var App = (function (_React$Component) {
    _inherits(App, _React$Component);

    function App(props) {
        _classCallCheck(this, App);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(App).call(this, props));

        _this.state = {
            menuitems: []
        };
        return _this;
    }

    _createClass(App, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
            this.init();
        }
    }, {
        key: 'init',
        value: function init() {
            var _this2 = this;

            chrome.storage.local.get({ token: '', apiSite: '' }, function (obj) {
                CONFIG.TOKEN = obj.token;
                var site = obj.apiSite;
                CONFIG.API_SITE = site;
                CONFIG.API_URL_MENU = site + '/api/menu/';
                CONFIG.API_URL_KEYWORDS = site + '/api/keywords/';
                CONFIG.API_URL_JOBS = site + '/api/jobs/';
                CONFIG.API_URL_JOB = site + '/api/job/';
                CONFIG.API_URL_JOB_DELETED = site + '/api/job/mark/deleted/';
                CONFIG.API_URL_JOB_VIEWED = site + '/api/job/mark/viewed/';
                CONFIG.API_URL_JOB_FEATURED = site + '/api/job/mark/featured/';
                _this2.loadMenu();
            });
        }
    }, {
        key: 'loadMenu',
        value: function loadMenu() {
            var _this3 = this;

            var params = new FormData();
            params.append('token', CONFIG.TOKEN);

            fetch(CONFIG.API_URL_MENU, { method: 'POST', body: params }).then(function (response) {
                return response.json();
            }).then(function (data) {
                return _this3.setState({ menuitems: data });
            });
        }
    }, {
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                { className: 'app' },
                React.createElement(_menu.Menu, { items: this.state.menuitems })
            );
        }
    }]);

    return App;
})(React.Component);

ReactDOM.render(React.createElement(App, null), document.getElementById('content'));

},{"./menu":7,"events":1}],3:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.JobUpworkItem = exports.JobIndeedItem = undefined;

var _app = require('./app');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var JobItem = (function (_React$Component) {
    _inherits(JobItem, _React$Component);

    function JobItem(props) {
        _classCallCheck(this, JobItem);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(JobItem).call(this, props));

        _this.handleDescriptionClick = _this.handleDescriptionClick.bind(_this);
        _this.handleDeleteClick = _this.handleDeleteClick.bind(_this);
        _this.handleFeaturedClick = _this.handleFeaturedClick.bind(_this);

        return _this;
    }

    _createClass(JobItem, [{
        key: 'handleDescriptionClick',
        value: function handleDescriptionClick(e) {
            var yCoord = e.target.offsetTop;
            _app.EE.emit('descriptionClick', this.props.item, yCoord);
        }
    }, {
        key: 'handleDeleteClick',
        value: function handleDeleteClick() {
            _app.EE.emit('deleteClick', this.props.item);
        }
    }, {
        key: 'handleFeaturedClick',
        value: function handleFeaturedClick() {
            _app.EE.emit('featuredClick', this.props.item);
        }
    }, {
        key: 'getMixins',
        value: function getMixins(item) {
            var mixins = [];
            mixins.push(React.createElement(
                'td',
                { className: 'ico', key: '2' },
                React.createElement('i', { className: 'fa fa-star featured', onClick: this.handleFeaturedClick })
            ));

            mixins.push(React.createElement(
                'td',
                { className: 'ico', key: '3' },
                React.createElement(
                    'a',
                    { href: item.url, target: '_blank' },
                    React.createElement('i', { className: 'fa fa-external-link url' })
                )
            ));

            mixins.push(React.createElement(
                'td',
                { className: 'ico', key: '4' },
                React.createElement('i', { className: 'fa fa-trash-o del', onClick: this.handleDeleteClick })
            ));
            return mixins;
        }
    }, {
        key: 'getClassName',
        value: function getClassName(item) {
            var className = 'item';
            className += item.is_viewed ? '' : ' notviewed';
            className += item.is_featured ? ' featured' : '';
            return className;
        }
    }, {
        key: 'getTdJobTitle',
        value: function getTdJobTitle() {
            return React.createElement(
                'td',
                { className: 'jobtitle', onClick: this.handleDescriptionClick },
                this.props.item.jobtitle
            );
        }
    }]);

    return JobItem;
})(React.Component);

var JobIndeedItem = exports.JobIndeedItem = (function (_JobItem) {
    _inherits(JobIndeedItem, _JobItem);

    function JobIndeedItem(props) {
        _classCallCheck(this, JobIndeedItem);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(JobIndeedItem).call(this, props));
    }

    _createClass(JobIndeedItem, [{
        key: 'render',
        value: function render() {
            var mixins = this.getMixins(this.props.item);
            var className = this.getClassName(this.props.item);
            var tdJobTitle = this.getTdJobTitle();

            return React.createElement(
                'tr',
                { className: className },
                React.createElement(
                    'td',
                    null,
                    this.props.item.id
                ),
                React.createElement(
                    'td',
                    null,
                    this.props.item.dt
                ),
                React.createElement(
                    'td',
                    null,
                    this.props.item.country
                ),
                React.createElement(
                    'td',
                    null,
                    this.props.item.city
                ),
                tdJobTitle,
                mixins
            );
        }
    }]);

    return JobIndeedItem;
})(JobItem);

var JobUpworkItem = exports.JobUpworkItem = (function (_JobItem2) {
    _inherits(JobUpworkItem, _JobItem2);

    function JobUpworkItem(props) {
        _classCallCheck(this, JobUpworkItem);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(JobUpworkItem).call(this, props));
    }

    _createClass(JobUpworkItem, [{
        key: 'render',
        value: function render() {
            var mixins = this.getMixins(this.props.item);
            var className = this.getClassName(this.props.item);
            var tdJobTitle = this.getTdJobTitle();

            return React.createElement(
                'tr',
                { className: className },
                React.createElement(
                    'td',
                    null,
                    this.props.item.id
                ),
                React.createElement(
                    'td',
                    null,
                    this.props.item.dt
                ),
                React.createElement(
                    'td',
                    null,
                    this.props.item.country
                ),
                tdJobTitle,
                React.createElement(
                    'td',
                    null,
                    this.props.item.total_spent
                ),
                React.createElement(
                    'td',
                    null,
                    this.props.item.budget
                ),
                React.createElement(
                    'td',
                    null,
                    this.props.item.avg_hour_price
                ),
                React.createElement(
                    'td',
                    null,
                    this.props.item.hours
                ),
                React.createElement(
                    'td',
                    null,
                    this.props.item.jobs_posted
                ),
                React.createElement(
                    'td',
                    null,
                    this.props.item.hire_rate
                ),
                React.createElement(
                    'td',
                    null,
                    this.props.item.active_hires
                ),
                React.createElement(
                    'td',
                    null,
                    this.props.item.stars
                ),
                mixins
            );
        }
    }]);

    return JobUpworkItem;
})(JobItem);

JobItem.propTypes = {
    item: React.PropTypes.object.isRequired
};

},{"./app":2}],4:[function(require,module,exports){
'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Jobs = undefined;

var _jobitem = require('./jobitem');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Jobs = exports.Jobs = (function (_React$Component) {
    _inherits(Jobs, _React$Component);

    function Jobs(props) {
        _classCallCheck(this, Jobs);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Jobs).call(this, props));
    }

    _createClass(Jobs, [{
        key: 'render',
        value: function render() {
            var jobItems = [];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.props.jobs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var _step$value = _slicedToArray(_step.value, 2);

                    var item = _step$value[1];

                    item.className = item.id === this.props.active ? 'item active' : 'item';
                    item.country = this.props.countries.get(item.country_id);
                    var dt = new Date(Date.parse(item.dt));
                    item.dt = dt.toDateString();

                    switch (this.props.jobModel) {
                        case 'JobIndeed':
                            jobItems.push(React.createElement(_jobitem.JobIndeedItem, { item: item, key: item.id }));
                            break;
                        case 'JobUpwork':
                            jobItems.push(React.createElement(_jobitem.JobUpworkItem, { item: item, key: item.id }));
                            break;
                    }
                }
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

            var tHeader = null;
            if (this.props.jobModel && this.props.jobModel === 'JobUpwork') {
                tHeader = React.createElement(
                    'tr',
                    null,
                    React.createElement('td', null),
                    React.createElement('td', null),
                    React.createElement('td', null),
                    React.createElement('td', null),
                    React.createElement(
                        'td',
                        { title: 'Total Spent' },
                        'Spent, $'
                    ),
                    React.createElement(
                        'td',
                        { title: 'Budget' },
                        'Budget, $'
                    ),
                    React.createElement(
                        'td',
                        { title: 'Average Hour Price' },
                        'AHP, $'
                    ),
                    React.createElement(
                        'td',
                        { title: 'Hours' },
                        'HH'
                    ),
                    React.createElement(
                        'td',
                        { title: 'Jobs Posted' },
                        'JoPo'
                    ),
                    React.createElement(
                        'td',
                        { title: 'Hire Rate' },
                        'HiRa, %'
                    ),
                    React.createElement(
                        'td',
                        { title: 'Active Hires' },
                        'AcHi, $'
                    ),
                    React.createElement(
                        'td',
                        { title: 'Stars' },
                        'Stars'
                    ),
                    React.createElement('td', null),
                    React.createElement('td', null),
                    React.createElement('td', null)
                );
            }

            return React.createElement(
                'div',
                null,
                React.createElement(
                    'div',
                    { className: 'jobs' },
                    React.createElement(
                        'table',
                        null,
                        React.createElement(
                            'tbody',
                            null,
                            tHeader,
                            jobItems
                        )
                    )
                )
            );
        }
    }]);

    return Jobs;
})(React.Component);

Jobs.propTypes = {
    active: React.PropTypes.number.isRequired,
    countries: React.PropTypes.instanceOf(Map).isRequired,
    jobModel: React.PropTypes.string.isRequired,
    jobs: React.PropTypes.instanceOf(Map).isRequired
};

},{"./jobitem":3}],5:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.KeywordItem = undefined;

var _app = require('./app');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var KeywordItem = exports.KeywordItem = (function (_React$Component) {
    _inherits(KeywordItem, _React$Component);

    function KeywordItem(props) {
        _classCallCheck(this, KeywordItem);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(KeywordItem).call(this, props));

        _this.handleClick = _this.handleClick.bind(_this);
        return _this;
    }

    _createClass(KeywordItem, [{
        key: 'handleClick',
        value: function handleClick() {
            _app.EE.emit('keywordItemClick', this.props.item.id);
        }
    }, {
        key: 'render',
        value: function render() {
            return React.createElement(
                'div',
                {
                    className: this.props.item.className,
                    onClick: this.handleClick },
                this.props.item.phrase,
                React.createElement(
                    'span',
                    { className: 'quantity' },
                    this.props.item.quantity_nv_jobs
                )
            );
        }
    }]);

    return KeywordItem;
})(React.Component);

KeywordItem.propTypes = {
    item: React.PropTypes.object.isRequired
};

},{"./app":2}],6:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Keywords = undefined;

var _keyworditem = require('./keyworditem');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Keywords = exports.Keywords = (function (_React$Component) {
    _inherits(Keywords, _React$Component);

    function Keywords(props) {
        _classCallCheck(this, Keywords);

        return _possibleConstructorReturn(this, Object.getPrototypeOf(Keywords).call(this, props));
    }

    _createClass(Keywords, [{
        key: 'render',
        value: function render() {
            var _this2 = this;

            var keywordItems = this.props.keywords.map(function (item) {
                item.className = item.id === _this2.props.active ? 'item active' : 'item';
                return React.createElement(_keyworditem.KeywordItem, { item: item, key: item.id, ref: 'ki' });
            });

            return React.createElement(
                'div',
                { className: 'keywords' },
                keywordItems
            );
        }
    }]);

    return Keywords;
})(React.Component);

Keywords.propTypes = {
    active: React.PropTypes.number.isRequired,
    keywords: React.PropTypes.array.isRequired
};

},{"./keyworditem":5}],7:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.Menu = undefined;

var _menuitem = require('./menuitem');

var _keywords = require('./keywords');

var _jobs = require('./jobs');

var _app = require('./app');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Menu = exports.Menu = (function (_React$Component) {
    _inherits(Menu, _React$Component);

    function Menu(props) {
        _classCallCheck(this, Menu);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(Menu).call(this, props));

        _this.chooseMenu = _this.chooseMenu.bind(_this);
        _this.state = {
            active: 0,
            activeKeyword: 0,
            activeJob: 0,
            keywords: [],
            countries: new Map(),
            jobModel: '',
            jobs: new Map(),
            jobDescription: ''
        };
        return _this;
    }

    _createClass(Menu, [{
        key: 'componentDidMount',
        value: function componentDidMount() {
            var _this2 = this;

            _app.EE.addListener('keywordItemClick', function (id) {
                return _this2.chooseKeyword(id);
            });

            _app.EE.addListener('descriptionClick', function (item, yCoord) {
                var params = new FormData();
                params.append('keyword_id', item.keyword_id);
                params.append('job_id', item.id);
                params.append('token', _app.CONFIG.TOKEN);

                _this2.showDescription(item, yCoord);

                fetch(_app.CONFIG.API_URL_JOB_VIEWED, { method: 'POST', body: params }).then(function (response) {
                    return response.json();
                }).then(function (data) {
                    _this2.markViewed(item.id);

                    // reload Keywords to update quantity_nv_jobs
                    _this2.loadKeywords(_this2.state.active);
                });
            });

            _app.EE.addListener('deleteClick', function (item) {
                var params = new FormData();
                params.append('keyword_id', item.keyword_id);
                params.append('job_id', item.id);
                params.append('token', _app.CONFIG.TOKEN);

                fetch(_app.CONFIG.API_URL_JOB_DELETED, { method: 'POST', body: params }).then(function (response) {
                    return response.json();
                }).then(function (data) {
                    return _this2.markDeleted(item.id);
                });
            });

            _app.EE.addListener('featuredClick', function (item) {
                var params = new FormData();
                params.append('keyword_id', item.keyword_id);
                params.append('job_id', item.id);
                params.append('token', _app.CONFIG.TOKEN);

                fetch(_app.CONFIG.API_URL_JOB_FEATURED, { method: 'POST', body: params }).then(function (response) {
                    return response.json();
                }).then(function (data) {
                    return _this2.markFeatured(item.id);
                });
            });

            document.addEventListener('keydown', this.handleEscKey.bind(this));
        }
    }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
            _app.EE.removeAllListeners('keywordItemClick');
            _app.EE.removeAllListeners('descriptionClick');
            _app.EE.removeAllListeners('deleteClick');
            _app.EE.removeAllListeners('featuredClick');

            document.removeEventListener('keydown', this.handleEscKey.bind(this));
        }
    }, {
        key: 'chooseMenu',
        value: function chooseMenu(siteId) {
            this.setState({ active: siteId, jobs: new Map() });
            this.loadKeywords(siteId);
        }
    }, {
        key: 'handleEscKey',
        value: function handleEscKey(event) {
            if (event.keyCode === 27) {
                this.setState({ jobDescription: '' });
            }
        }
    }, {
        key: 'showDescription',
        value: function showDescription(item, yCoord) {
            var _this3 = this;

            this.setState({ jobDescription: item.description }, function () {
                var div = _this3.refs.jobDescriptionDiv;
                yCoord += 100;
                div.style.top = yCoord + 'px';
            });
        }
    }, {
        key: 'loadKeywords',
        value: function loadKeywords(siteId) {
            var _this4 = this;

            var params = new FormData();
            params.append('site_id', siteId);
            params.append('token', _app.CONFIG.TOKEN);
            fetch(_app.CONFIG.API_URL_KEYWORDS, { method: 'POST', body: params }).then(function (response) {
                return response.json();
            }).then(function (data) {
                return _this4.setState({ keywords: data });
            });
        }
    }, {
        key: 'chooseKeyword',
        value: function chooseKeyword(keywordId) {
            this.setState({ activeKeyword: keywordId });
            this.loadJobs(keywordId);
        }
    }, {
        key: 'loadJobs',
        value: function loadJobs(keywordId) {
            var _this5 = this;

            var params = new FormData();
            params.append('keyword_id', keywordId);
            params.append('token', _app.CONFIG.TOKEN);
            fetch(_app.CONFIG.API_URL_JOBS, { method: 'POST', body: params }).then(function (response) {
                return response.json();
            }).then(function (data) {
                return _this5.setState({
                    jobs: new Map(data.items),
                    jobModel: data.job_model,
                    countries: new Map(data.countries)
                });
            });
        }
    }, {
        key: 'markViewed',
        value: function markViewed(job_id) {
            var jobs = this.state.jobs;
            jobs.get(job_id).is_viewed = true;
            this.setState({ jobs: jobs });
        }
    }, {
        key: 'markDeleted',
        value: function markDeleted(job_id) {
            var jobs = this.state.jobs;
            jobs.delete(job_id);
            this.setState({ jobs: jobs });
        }
    }, {
        key: 'markFeatured',
        value: function markFeatured(job_id) {
            var jobs = this.state.jobs;
            var job = jobs.get(job_id);
            job.is_featured = !job.is_featured;
            this.setState({ jobs: jobs });
        }
    }, {
        key: 'render',
        value: function render() {
            var _this6 = this;

            var menuItems = this.props.items.map(function (item) {
                item.className = item.id === _this6.state.active ? 'item active' : 'item';
                return React.createElement(_menuitem.MenuItem, { chooseMenu: _this6.chooseMenu, item: item, key: item.id });
            });

            return React.createElement(
                'div',
                null,
                this.state.jobDescription.length > 0 ? React.createElement('div', { className: 'job_description',
                    dangerouslySetInnerHTML: { __html: this.state.jobDescription },
                    ref: 'jobDescriptionDiv' }) : null,
                React.createElement(
                    'div',
                    { className: 'menu' },
                    menuItems
                ),
                this.state.keywords.length > 0 ? React.createElement(_keywords.Keywords, {
                    active: this.state.activeKeyword,
                    keywords: this.state.keywords }) : null,
                this.state.jobs.size > 0 ? React.createElement(_jobs.Jobs, {
                    active: this.state.activeJob,
                    countries: this.state.countries,
                    jobModel: this.state.jobModel,
                    jobs: this.state.jobs }) : null
            );
        }
    }]);

    return Menu;
})(React.Component);

Menu.propTypes = {
    items: React.PropTypes.array.isRequired
};

},{"./app":2,"./jobs":4,"./keywords":6,"./menuitem":8}],8:[function(require,module,exports){
"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
    value: true
});

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MenuItem = exports.MenuItem = (function (_React$Component) {
    _inherits(MenuItem, _React$Component);

    function MenuItem(props) {
        _classCallCheck(this, MenuItem);

        var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(MenuItem).call(this, props));

        _this.handleClick = _this.handleClick.bind(_this);
        return _this;
    }

    _createClass(MenuItem, [{
        key: "handleClick",
        value: function handleClick() {
            this.props.chooseMenu(this.props.item.id);
        }
    }, {
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                {
                    className: this.props.item.className,
                    onClick: this.handleClick },
                this.props.item.name
            );
        }
    }]);

    return MenuItem;
})(React.Component);

MenuItem.propTypes = {
    chooseMenu: React.PropTypes.func.isRequired,
    item: React.PropTypes.object.isRequired
};

},{}]},{},[2])


//# sourceMappingURL=app.js.map
