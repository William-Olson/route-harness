

module.exports = class Info {

  constructor({ restHarness, tester, logger })
  {

    this._tester = tester;
    this._logger = logger('info-routes');
    const harness = restHarness(this);

    harness.get('/', this.getInfo);
    harness.get('/test', this.testMessage);

  }

  getInfo()
  {

    this._logger('returning list of routes');

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
