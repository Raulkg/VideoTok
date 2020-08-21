const express = require('express');
// eslint-disable-next-line no-use-before-define
const router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

module.exports = router;
