var _ = require('underscore');
var path = require('path');
var csvStringify = require('csv').stringify;
var express = require('express');
var router = express.Router();

var logger = require('../../logger');
var sqldb = require('../../sqldb');
var sqlLoader = require('../../sql-loader');

var sql = sqlLoader.load(path.join(__dirname, 'adminUsers.sql'));

var csv_filename = function(locals) {
    return locals.course.short_name.replace(/\s+/g, '')
        + '_'
        + locals.semester.short_name
        + '_'
        + 'user_scores.csv';
};

router.get('/', function(req, res, next) {
    var params = [req.locals.courseInstanceId];
    sqldb.query(sql.course_tests, params, function(err, result) {
        if (err) {logger.error('adminUsers course_tests_sql query failed', err); return res.status(500).end();}
        var course_tests = result.rows;
        sqldb.query(sql.user_scores, params, function(err, result) {
            if (err) {logger.error('adminUsers user_scores_sql query failed', err); return res.status(500).end();}
            var user_scores = result.rows;
            var locals = _.extend({
                course_tests: course_tests,
                user_scores: user_scores,
                csv_filename: csv_filename(req.locals),
            }, req.locals);
            res.render('pages/adminUsers/adminUsers', locals);
        });
    });
});

router.get('/:filename', function(req, res, next) {
    var params = [req.locals.courseInstanceId];
    sqldb.query(sql.course_tests, params, function(err, result) {
        if (err) {logger.error('adminUsers course_tests_sql query failed', err); return res.status(500).end();}
        var course_tests = result.rows;
        sqldb.query(sql.user_scores, params, function(err, result) {
            if (err) {logger.error('adminUsers user_scores_sql query failed', err); return res.status(500).end();}
            var user_scores = result.rows;

            var csvHeaders = ['UID', 'Name', 'Role'].concat(_(course_tests).pluck('label'));
            var csvData = _(user_scores).map(function(row) {
                return [row.uid, row.user_name, row.role].concat(row.scores);
            });
            csvData.splice(0, 0, csvHeaders);
            csvStringify(csvData, function(err, csv) {
                if (err) throw Error("Error formatting CSV", err);
                res.attachment(req.params.filename);
                res.send(csv);
            });
        });
    });
});

module.exports = router;
