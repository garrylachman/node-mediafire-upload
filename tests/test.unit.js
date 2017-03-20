//process.env.DEBUG = true;
const App = require('../index');

exports.test = function(test) {
  const instance = new App();
  instance.setAuth('x', 'x');
  console.log("process.cwd()", process.cwd());
  instance.uploadFile(process.cwd() + '\\LICENSE', '63mv6ttnv4kv4')
  instance.on(App.events.EVENT_ON_RESULT, (res) => {
    console.log(res);
    test.done();
  });
  console.log(instance);
  test.expect(1);
  test.ok(true, "this assertion should pass");
  //test.done();
};
