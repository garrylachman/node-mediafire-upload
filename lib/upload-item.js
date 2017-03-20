module.exports = class UploadItem {
  static get default() {
    return {
      item: {
        file: '',
        dest: ''
      }
    };
  }
  constructor(options) {
    this.options = Object.assign(UploadItem.default, options);
  }
  get uploadItemJob() {
    return this.options.item;
  }
};
