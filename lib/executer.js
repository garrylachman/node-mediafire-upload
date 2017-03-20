const EventEmitter = require('event-emitter-es6');
const phantom = require('phantom');
const async = require('asyncawait/async');
const await = require('asyncawait/await');

const MEDIAFIRE_BASE_URL = 'https://www.mediafire.com/';
const MEDIAFIRE_SELECTORS = {
  LOGIN_USERNAME: '#widget_login_email',
  LOGIN_PASSWORD: '#widget_login_pass',
  LOGIN_SUBMIT: '#form_login1 > button',
};

module.exports = class Executer extends EventEmitter {
  static get events() {
    return {
      "EVENT_PHANTOM_READY": "event_phantom_ready",
      "EVENT_ON_PAGE_LOAD_FINISH": "event_on_page_load_finish",
      "EVENT_LOGGED_IN": "event_logged_in",
    };
  }
  constructor(config) {
    super();
    this.config = config;
    this._isLoggedIn = false;
    this.init();
  }
  init() {
    return async(() => {
      this.instance = await(phantom.create());
      this.page = await(this.instance.createPage());

      this.page.on('onLoadFinished', false, async((status) => {
        console.log('onLoadFinished', status);
        const currentURL = await(this.page.evaluateJavaScript(`function(){ return location.href; }`));
        if (currentURL == "https://www.mediafire.com/#myfiles") {
          this.isLoggedIn = true;
        }
        this.emit(Executer.events.EVENT_ON_PAGE_LOAD_FINISH, status);
      }));

      /*this.page.on("onResourceRequested", (requestData) => {
        console.info('Requesting', requestData.url)
      });*/

      this.emit(Executer.events.EVENT_PHANTOM_READY);
    })();
  }
  set isLoggedIn(val) {
    console.log("isLoggedIn", val);
    this._isLoggedIn = val;
    if (val) {
      this.emit(Executer.events.EVENT_LOGGED_IN);
    }
  }
  get isLoggedIn() {
    return this._isLoggedIn;
  }
  doLogin() {
    //blX('Login')
    return new Promise((resolve, reject) => {
      this.page.open(MEDIAFIRE_BASE_URL)
        .then((status) => {
          if (status == 'success') {
            console.log('do login');
            this.page.evaluate(function() {
              // load login form
              blX('Login');
            })
            .then(() => {
              console.log('after login promise');
              this.once(Executer.events.EVENT_ON_PAGE_LOAD_FINISH, (login_status) => {
                console.log('onLoadFinished - login', login_status);
                // switch to login frame
                this.page.switchToFrame('modal_msg_iframe').then(async(() => {
                  // fill form & submit
                  console.log(await(this.page.evaluateJavaScript(`function(){ return location.href; }`)));
                  await(this.page.evaluateJavaScript(`function(){return document.querySelector('${MEDIAFIRE_SELECTORS.LOGIN_USERNAME}').value='${this.config.auth.username}';}`));
                  await(this.page.evaluateJavaScript(`function(){return document.querySelector('${MEDIAFIRE_SELECTORS.LOGIN_PASSWORD}').value='${this.config.auth.password}';}`));
                  await(this.page.evaluateJavaScript(`function(){return document.querySelector('${MEDIAFIRE_SELECTORS.LOGIN_SUBMIT}').click();}`));

                  await(this.page.switchToMainFrame());

                  const checkInterval = setInterval(() => {
                    if (this.isLoggedIn) {
                      clearInterval(checkInterval);
                      resolve();
                    }
                  }, 500);

                }));

              });
            })
            .catch(reject);
          } else {
            reject(status);
          }
        })
        .catch(reject);
    });
  }
  startUploadJob(uploadItem) {
    return new Promise(async((resolve, reject) => {
      await(this.page.switchToFrame('appFrame'));
      const destFolder = uploadItem.uploadItemJob.dest ? uploadItem.uploadItemJob.dest : "myfiles";
      await(this.page.evaluateJavaScript(`function(){ return Mj("${destFolder}"); }`));
      setTimeout(async(() => {
        //console.log(this.page);
        console.log("upload item", uploadItem.uploadItemJob);

        await(this.page.uploadFile('#step4_html5_big_file_input_0', uploadItem.uploadItemJob.file));
        await(this.page.evaluateJavaScript(`function(){ return document.querySelector('#step4_begin_upload_0').click(); }`));
        //resolve();
      }), 10*1000);

      const checkInterval = setInterval(async(() => {
        console.log("check");
        // check for replace confirm
        await(this.page.evaluateJavaScript(`function(){ try {document.querySelector("#confirm-replace").click(); } catch(er){} }`));

        // check if done
        let res = await(this.page.evaluateJavaScript(`function(){ var x=document.querySelector(".uploader_file_list .Uploader-copyLink input[type=hidden]"); return x?x.value:0; }`));
        console.log(res);
        if (res && res != 0)  {
          clearInterval(checkInterval);
          resolve(res);
        }
      }), 5*1000);

    }));
  }
};
