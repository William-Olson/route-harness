

module.exports = class Info {

  constructor({ router, tester })
  {

    this._tester = tester;
    router.get('/', this.getInfo);

  }

  getInfo()
  {

    return {
      try: [
        '/users',
        '/users/1',
        '/users/2'
      ]
    };

  }

}
