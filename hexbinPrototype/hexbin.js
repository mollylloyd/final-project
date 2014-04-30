var width = 950,
    height = 920,
    radius = 3.546,
    dx = radius * 2 * 7 * 2 * Math.sin(Math.PI / 3),
    dy = radius * 2 * 11 * 1.5;

var path = d3.geo.path()
    .projection(hexProjection(radius));


var colorGrowth = d3.scale.threshold()
    .domain([.02, .04, .06, .08, .10])
    .range(["#f6f7b9", "#d9f0a3", "#addd8e", "#78c679", "#31a354", "#006837"]);

var hexbin = d3.hexbin()
    .radius(radius)
    .size([dx, dy]);

var x = d3.scale.linear()
    .range([0, 200]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(13);
var svg = d3.selectAll(".g-section")
    .datum(function() { return this.getAttribute("data-key"); })
    .append("svg")
    .attr("width", width)
    .attr("height", height);

d3.selectAll(".g-hexagon").append("path")
    .attr("d", hexbin.hexagon());


queue()
    .defer(d3.json, "world-50m.json")
    .await(ready);

function ready(error,topology) {
    console.log(topology);
    //console.log(topology.objects.usd.geometries);


    svg.datum(function(d){
	console.log(d);
    }); //closes svg.datum
}; // closes function ready()

function hexProjection(radius) {
  var dx = radius * 2 * Math.sin(Math.PI / 3),
      dy = radius * 1.5;
  return {
    stream: function(stream) {
      return {
        point: function(x, y) { stream.point(x * dx / 2, (y - (2 - (y & 1)) / 3) * dy / 2); },
        lineStart: function() { stream.lineStart(); },
        lineEnd: function() { stream.lineEnd(); },
        polygonStart: function() { stream.polygonStart(); },
        polygonEnd: function() { stream.polygonEnd(); }
      };
    }
  };
}
