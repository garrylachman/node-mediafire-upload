const EventEmitter = require('event-emitter-es6');
const Config = require('./lib/config');
const UploadItem = require('./lib/upload-item');
const Executer = require('./lib/executer');

const concat = list => Array.prototype.concat.bind(list);
const promiseConcat = f => x => f().then(concat(x));
const promiseReduce = (acc, x) => acc.then(promiseConcat(x));
/*
 * serial executes Promises sequentially.
 * @param {funcs} An array of funcs that return promises.
 * @example
 * const urls = ['/url1', '/url2', '/url3']
 * serial(urls.map(url => () => $.ajax(url)))
 *     .then(console.log.bind(console))
 */
const serial = funcs => funcs.reduce(promiseReduce, Promise.resolve([]));

module.exports = class Main extends EventEmitter {
  static get events() {
    return {
      "EVENT_ON_RESULT": "event_on_result"
    };
  }
  constructor() {
    super();
    this.properties = {};
    this.isPhantomReady = false;
    this.jobsQueue = [];

    this.config = new Config();
    this.executer = new Executer(this.config);
    this.executer.on(Executer.events.EVENT_PHANTOM_READY, () => this.phantomReady = true);
  }
  set phantomReady(val) {
    this.properties['phantom_ready'] = val;
    console.log("phantomReady", this.properties);
    if (val) {
      this.runJobsQueue();
    }
  }
  get phantomReady() {
    return this.properties['phantom_ready']|false;
  }
  setAuth(username, password) {
    this.config.username = username;
    this.config.password = password;
    this.jobsQueue.push(() => this.executer.doLogin());
  }
  uploadFile(file, folder) {
    const item = new UploadItem({
      item: {
        file: file,
        dest: '63mv6ttnv4kv4'
      }
    });
    this.jobsQueue.push(() => this.executer.startUploadJob(item));
  }
  runJobsQueue() {
    serial(this.jobsQueue)
    .then((value) => {
      this.emit(Main.events.EVENT_ON_RESULT, value.filter((x) => x!=undefined));
    })
  }
};
