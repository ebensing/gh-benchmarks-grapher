
var fs = require('fs');
var ncp = require('ncp').ncp;
var utils = require('util');
var jade = require('jade');

exports.buildGraphs = function (runs, job, repo_loc, callback) {
  var data = [];
  var charts = job.charts;
  var w = charts.length;
  // get the data for the charts
  for (var i=0; i < w; i++) {
    var chart = charts[i];
    switch(chart.type) {
      case "singleBar":
        var chartData = [];
        var l = runs.length;
        for (var i=0; i < l; i++) {
          var r = runs[i];
          var o = {};
          o.x = r.lastCommit.substr(r.lastCommit.length - 6);
          o.y = r.output[chart.config.taskTitle][chart.config.field];
          chartData.push(o);
        }
        data.push(chartData);
        break;
      case "multiBar":
        var chartData = [];
        var l = runs.length;
        for (var i=0; i < l; i++) {
          var run = runs[i];
          var o = {};
          for (var x=0; x < chart.config.values.length; x++) {
            var val = chart.config.values[x];
            o[x] = run[val.taskTitle][val.field];
          }
          o.x = run.lastCommit.substr(run.lastCommit.length - 6);
          chartData.push(o);
        }
        break;
      case "line":
        break;
    }
  }
  // save this data to a json file for use on github
  var writeObj = { data : data, charts : charts };
  var saveLoc = utils.format("%s/%s/data.json", repo_loc, job.saveLoc);
  fs.writeFileSync(saveLoc, JSON.stringify(writeObj));

  // generate the html page
  var locals = {};
  locals.projectName = job.projectName;
  locals.title = job.title;
  locals.charts = charts;

  fs.readFile(__dirname + '/static/index.jade', 'utf-8', function (err, data) {
    if (err) return callback(err);

    var fn = jade.compile(data);
    var html = fn(locals);
    var saveLocation = utils.format("%s/%s/index.html", repo_loc, job.saveLoc);
    fs.writeFile(saveLocation, html, function (err) {
      if (err) return callback(err);
      // copy the dependencies into the repo
      var saveDir = utils.format("%s/%s/", repo_loc, job.saveLoc);
      ncp(__dirname + "/static", saveDir, { clobber : true }, function (err) {
        var files = ["index.html", "data.json", "graphs.js", "style.css", "bootstrap/"];
        callback(err, repo_loc, files);
      });
    });
  });
}
