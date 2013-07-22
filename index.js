
var fs = require('fs');
var ncp = require('ncp').ncp;
var utils = require('util');
var jade = require('jade');

// helper function to get object property by string
Object.byString = function(o, s) {
  s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  s = s.replace(/^\./, '');           // strip a leading dot
  var a = s.split('.');
  while (a.length) {
      var n = a.shift();
      if (n in o) {
          o = o[n];
      } else {
          return;
      }
  }
  return o;
}

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
        for (var x=0; x < l; x++) {
          var r = runs[x];
          var o = {};
          o.x = r.lastCommit.substr(r.lastCommit.length - 6);
          o.y = Object.byString(r.output[chart.config.taskTitle], chart.config.field);
          chartData.push(o);
        }
        data.push(chartData);
        break;
      case "multiBar":
        var chartData = [];
        var l = runs.length;
        for (var a=0; a < l; a++) {
          var run = runs[a];
          var o = {};
          for (var x=0; x < chart.config.values.length; x++) {
            var val = chart.config.values[x];
            var n = {};
            n.name = val.taskTitle + "-" + val.field;
            n.val = Object.byString(run.output[val.taskTitle], val.field);
            o[x] = n;
          }
          o.x = run.lastCommit.substr(run.lastCommit.length - 6);
          chartData.push(o);
        }
        data.push(chartData);
        break;
      case "line":
        var chartData = [];
        var l = runs.length;
        for (var x=0; x < l; x++) {
          var run = runs[x];
          var o = {};
          o.x = run.lastCommit.substr(run.lastCommit.length - 6);
          for (var y=0; y < chart.config.lines.length; y++) {
            var line = chart.config.lines[y];
            o[line.taskTitle + "-" + line.field] = Object.byString(run.output[line.taskTitle], line.field);
          }
          chartData.push(o);
        }
        data.push(chartData);
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
        files = files.map(function (item) {
          return utils.format("%s/%s", job.saveLoc, item);
        });
        callback(err, files);
      });
    });
  });
}
