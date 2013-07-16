
// this file contains all the graphing logic for the benchmark graphs


$("document").ready(function () {
  $.getJSON('data.json', function (jsonData) {
    var data = jsonData.data;
    var charts = jsonData.charts;
    // loop over the charts and create them
    for (var i=0; i < charts.length; i++) {
      var chartDesc = charts[i];
      var chartData = data[i];
      var container = "div.hero-unit";

      $("<div></div>").addClass("gContainer").attr("id", "div"+i).appendTo(container);
      var selector = "#div%id%".replace("%id%",i.toString());
      switch(chartDesc.type) {
        case "singleBar":
          buildBarGraph(selector, chartDesc, chartData);
          break;
        case "multiBar":
          buildMultiBarGraph(selector, chartDesc, chartData);
          break;
      }

    }
  });
});

function buildBarGraph(selector, chartDesc, chartData) {

  $("<h1 class='chartTitle'>%title%</h1>".replace("%title%",chartDesc.title))
    .appendTo(selector);

  var xData = chartData.map(function (item) {
    return item.x;
  });
  var yData = chartData.map(function (item) {
    return item.y;
  });

  var w = 100,
      h = 400;

  var x = d3.scale.linear()
    .domain([0, 1])
    .range([0, w]);

  var y = d3.scale.linear()
    .domain([0, d3.max(yData) * 1.25])
    .rangeRound([0,h]);


  var totalWidth = w * chartData.length - 1;

  // create the chart
  var chart = d3.select(selector).append("svg")
    .attr("class", "chart")
    .attr("width", totalWidth + 50)
    .attr("height", h + 50)
    .append("g").attr("transform", "translate(10,15)");

  // add the data rectangles (these are the bars)
  chart.selectAll("rect").data(chartData).enter().append("rect")
    .attr("x", function(d, i) { return x(i) - .5; })
    .attr("y", function(d, i) { return h - y(d.y) - .5; })
    .attr("width", w * .75)
    .attr("height", function(d) { return y(d.y); });

  // add the labels for each bar (essentially their x-value)
  chart.selectAll("text").data(chartData).enter().append("text")
    .attr("x", function(d, i) { return i * w + (w*.75/2); })
    .attr("y", h - 10)
    .attr("dx", -3)
    .attr("text-anchor", "middle")
    .text(function(d) { return d.x; });

  // add the value labels for each bar (essentially their y-value)
  chart.selectAll(".value").data(chartData).enter().append("text")
    .attr("class", "value")
    .attr("x", function(d, i) { return i * w + (w*.75/2); })
    .attr("y", function(d, i) { return h - y(d.y) - 5; })
    .attr("dx", -3)
    .attr("text-anchor", "middle")
    .text(function(d) { return d.y; });

  // add horizontal lines for scale
  chart.selectAll("line").data(y.ticks(10)).enter().append("line")
    .attr("x1", 0)
    .attr("x2", totalWidth - (w * .25) + 3)
    .attr("y1", y)
    .attr("y2", y)
    .style("stroke", "#ccc");

  // add the scale labels
  chart.selectAll(".rule").data(y.ticks(10)).enter().append("text")
    .attr("class", "rule")
    .attr("y", function(d,i) { return h - y(d);})
    .attr("x", totalWidth)
    .attr("dx", -(w/15))
    .attr("dy", 6)
    .attr("text-anchor", "middle")
    .text(String);

  // add a line at the base
  chart.append("line")
    .attr("x1", 0)
    .attr("x2", totalWidth - (w * .25) + 3)
    .attr("y1", h - .5)
    .attr("y2", h - .5)
    .style("stroke", "#000");

}

function buildMultiBarGraph(selector, chartDesc, chartData) {

  $("<h1 class='chartTitle'>%title%</h1>".replace("%title%",chartDesc.title))
    .appendTo(selector);

  var margin = { top : 20, right : 20, bottom : 30, left : 40 };
  var width = 960 - margin.left - margin.right;
  var height = 500 - margin.top - margin.bottom;

  var x0 = d3.scale.ordinal().rangeRoundBands([0, width], .1);
  var x1 = d3.scale.ordinal();

  var y = d3.scale.linear().range([height, 0]);

  var color = d3.scale.ordinal().range(["#98abc5", "#8a89a6", "#7b6888",
      "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

  var xAxis = d3.svg.axis().scale(x0).orient("bottom");
  var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(d3.format(".2s"));

  var graph = d3.select(selector).append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // get all of the keys that are actual values (ie. everything except x)
  var valKeys = d3.keys(chartData[0]).filter(function (key) {
    return key !== "x";
  });


  // this just makes later manipulation of the data easier
  var l = chartData.length;
  for (var i=0; i < l; i++) {
    chartData[i].values = valKeys.map(function (key) {
      return chartData[i][key];
    });
  }

  // get the names of the individual bars
  var barNames = chartData[0].values.map(function (item) {
    return item.name;
  });

  var commits = chartData.map(function (item) {
    return item.x;
  });

  // the groups are based off of the x key
  x0.domain(commits);

  // the names of the individual bars are based off of the name property on
  // each of the values
  console.log(commits);
  x1.domain(barNames).rangeRoundBands([0, x0.rangeBand()]);

  // get the maximum value out of any item in the set
  y.domain([0, d3.max(chartData, function (data) {
    return d3.max(data.values, function (item) {
      return item.val;
    });
  })]);

  graph.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height +")")
    .call(xAxis);

  graph.append("g")
    .attr("class", "y axis")
    .call(yAxis)
  .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 6)
    .attr("dy", ".71em")
    .style("text-anchor", "end")
    .text(chartDesc.yLabel)

  var group = graph.selectAll(".group")
    .data(chartData).enter().append("g")
    .attr("class", "g")
    .attr("transform", function (d) {
      return "translate(" + x0(d.x) + ",0)";
    });

  group.selectAll("rect")
    .data(function (d) {
      return d.values;
    }).enter().append("rect")
      .attr("width", x1.rangeBand())
      .attr("x", function(d) { return x1(d.name); })
      .attr("y", function(d) { return y(d.val); })
      .attr("height", function (d) { return height - y(d.val); })
      .style("fill", function(d) { return color(d.name); });

  var legend = graph.selectAll(".legend")
    .data(barNames).enter().append("g")
    .attr("class", "legend")
    .attr("transform", function (d, i) {
      return "translate(0," + (i*20) + ")";
    });

  legend.append("rect")
    .attr("x", width - 18)
    .attr("width", 18)
    .attr("height", 18)
    .style("fill", color);

  legend.append("text")
    .attr("x", width -24)
    .attr("y", 9)
    .attr("dy", ".35em")
    .style("text-anchor", "end")
    .text(function(d) { return d; });

}

