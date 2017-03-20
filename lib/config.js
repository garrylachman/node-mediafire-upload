module.exports = class Config {
  static get default() {
    return {
      auth: {
        username: '',
        password: ''
      }
    };
  }
  constructor(options) {
    this.options = Object.assign(Config.default, options);
  }
  get auth() {
    return this.options.auth;
  }
  set username(val) {
    this.options.auth.username = val;
  }
  set password(val) {
    this.options.auth.password = val;
  }
};
