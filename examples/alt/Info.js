

module.exports = class Info {

  constructor({ router, tester, logger })
  {

    // console.log('logger: ', logger);
    this._tester = tester;
    this._logger = logger('info-routes');

    router.get('/', this.getInfo);
    router.get('/test', this.testMessage);

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
