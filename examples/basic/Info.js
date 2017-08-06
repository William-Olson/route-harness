

module.exports = class Info {

  constructor({ harness, tester })
  {

    this._tester = tester;

    harness.get('/', this.getInfo);
    harness.get('/test', this.testMessage);

  }

  getInfo()
  {

    return {
      try: [
        '/test',
        '/users',
        '/users/1',
        'users/2'
      ]
    };

  }

  testMessage()
  {

    return { message: this._tester.test() };

  }

}
