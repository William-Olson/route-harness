const FAKE_USERS = [
  { id: 1, username: 'johndoe@example.com' },
  { id: 2, username: 'janedoe@example.com' }
];

module.exports = class Users {

  constructor({ router, tester })
  {

    this._tester = tester;

    router.get('/', this.getFakeUsers);
    router.get('/test', this.test);
    router.get('/:id', this.getFakeUserById);

  }

  getFakeUsers(req, resp)
  {

    return FAKE_USERS;

  }

  getFakeUserById(req)
  {

    const id = req.params.id|0;

    if (id !== 1 && id !== 2) {
      throw new Error('Bad id');
    }

    return FAKE_USERS.find(u => u.id === id);

  }

  test()
  {

    return { message: this._tester.test() };

  }

};
