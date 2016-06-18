var _ = require('underscore');
var path = require('path');
var express = require('express');
var router = express.Router();

var logger = require('../../logger');
var sqldb = require('../../sqldb');
var sqlLoader = require('../../sql-loader');

var sql = sqlLoader.load(path.join(__dirname, 'adminHome.sql'));

router.get('/', function(req, res, next) {
    var params = [req.authUID];
    sqldb.query(sql.all, params, function(err, result) {
        if (err) {logger.error('index query failed', err); return res.status(500).end();}
        var locals = _.extend({
            rows: result.rows,
        }, req.locals);
        res.render(path.join(__dirname, 'adminHome'), locals);
    });
});

module.exports = router;
