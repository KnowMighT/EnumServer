
module.exports = router => {
  require('./user').Router(router);
  require('./project').Router(router);
};
