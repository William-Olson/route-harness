const FAKE_USERS = [
  { id: 1, username: 'johndoe@example.com' },
  { id: 2, username: 'janedoe@example.com' }
];

module.exports = class Users {

  constructor(harnessDependency)
  {

    // get this class's specific router object
    const router = harnessDependency.getRouterForClass(this.constructor.name);

    router.get('/', this.getFakeUsers);
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

};
