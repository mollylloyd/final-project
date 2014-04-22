var width = 950,
    height = 920,
    radius = 2.546,
    dx = radius * 2 * 7 * 2 * Math.sin(Math.PI / 3),
    dy = radius * 2 * 11 * 1.5;

/*var projection = d3.geo.mercator()
    .scale(175)
    .translate([width / 2, height / 2])
    .center([10, 50])
    .precision(.1);
*/
var projection = d3.geo.conicEqualArea()
    .scale(250)
    .translate([width / 2, height / 2])
    .center([0, 22])
    .rotate([0,0,0])
    .precision(.1);

var path = d3.geo.path()
    .projection(projection);

var formatWholePercent = d3.format("+.0%"),
    formatPercent = d3.format("+.1%"),
    formatInteger = d3.format(",.0f"),
    formatDecimal = d3.format(".1f"),
    formatThousands = function(d) { return formatInteger(d * 1e-3); },
    formatUsdBillion = function(d) { return "$" + (d < 1e10 ? formatDecimal : formatInteger)(d / 1e9) + " billion"; },
    formatUsd = function(d) { return "$" + formatInteger(d); },
    formatPop = function(d) { return (d < 1e7 ? formatDecimal : formatInteger)(d / 1e6) + " million"; };

var colorGrowth = d3.scale.threshold()
    .domain([.02, .04, .06, .08, .10])
    .range(["#f6f7b9", "#d9f0a3", "#addd8e", "#78c679", "#31a354", "#006837"]);
var colorCapita = d3.scale.threshold()
    .domain([1000, 2000, 5000, 10000, 20000,30000])
    .range(["#edf8fb", "#ccece6", "#99d8c9", "#66c2a4", "#41ae76", "#238b45","#005824"]);

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
    .datum(function() { return this.getAttribute("data-key");})
    .append("svg")
    .attr("width", width)
    .attr("height", height);

d3.selectAll(".g-hexagon").append("path")
    .attr("d", hexbin.hexagon());


queue()
    .defer(d3.json, "hexData.json")
    .defer(d3.csv, "disasters.csv")
    .await(ready);

function ready(error,topology, disasters) {
    
   
    disasters =disasters.map(function(d){
	return {
	    year: new Date(+d.year,0,1),
	    lat:+d.lat,
	    lon:+d.long,
	    loss: +d.overallLosses,
	    deaths: +d.fatalities,
	    disaster: d.disaster
	};
    });

    topology.objects.gdp.geometries.forEach(rescale);
    topology.objects.pop.geometries.forEach(rescale);

    function rescale(d) {
    //	if (d.properties.gdpCap === null) d.properties.gdpCap = NaN;
	   //if (d.properties.pop === null) d.properties.pop = NaN;
	   //if (d.properties.gdpGrowth === null) d.properties.gdpGrowth = NaN;
	     d.properties.gdpGrowth *= 1e-2;
    };

    svg.datum(function(d){
      var object = topology.objects[d];
      var countries = {type: "GeometryCollection", geometries: object.geometries};
      var countryCollection = topojson.object(topology, countries);

      countryCollection.geometries.forEach(measure);
      countryCollection.geometries.sort(descendingArea);

    function measure(o,i) {
    
      o.properties.centroid = path.centroid(o);
      o.properties.area = path.area(o);
    }

    function descendingArea(a, b) {
      return b.properties.area - a.properties.area;
    }

    return {
      key: d,
      countryCollection: countryCollection,
      countryMesh: topojson.mesh(topology, object, function(a, b) { return a !== b; })
    };
	
	
  }); //closes svg.datum

var map = svg.append("g");

var defs = map.append("defs");

defs.append("filter")
      .attr("id", "g-blur")
    .append("feGaussianBlur")
      .attr("stdDeviation", 3);

  defs.append("path")
	    .attr("id", function(d) { return "g-countries-" + d.key; })
      .attr("d", function(d) { return path(d.countryCollection); });

  defs.append("clipPath")
      .attr("id", function(d) { return "g-clip-" + d.key; })
    .append("use")
      .attr("xlink:href", function(d) { return "#g-countries-" + d.key; });

defs.append("pattern")
      .attr("id", "g-grid")
      .attr("width", dx)
      .attr("height", dy)
      .attr("patternUnits", "userSpaceOnUse")
      .append("path")
      .attr("d", hexbin.mesh());

  map.append("g")
      .attr("class", "g-halo")
    .selectAll("path")
      .data(function(d) { return d.countryCollection.geometries; })
    .enter().append("path")
      .attr("d", path)
      //.on("mouseenter", showTooltip)
      //.on("mouseleave", hideTooltipSoon);

  map.append("g")
      .attr("class", "g-feature")
    .selectAll("path")
      .data(function(d) { return d.countryCollection.geometries; })
    .enter().append("path")
	 .attr("d", path);
      //.on("mouseenter", showTooltip)
      //.on("mouseleave", hideTooltipSoon);

  map.append("g")
      .attr("clip-path", function(d) { return "url(#g-clip-" + d.key + ")"; })
    .append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "url(#g-grid)")
      .style("pointer-events", "none");

  map.append("path")
      .datum(function(d) { return d.countryMesh; })
      .attr("class", "g-boundary")
      .attr("d", path);

    map.selectAll(".dot")
	.data(disasters)
	.enter()
	.append("circle",".dot")
        .attr("r",15)
	.attr("transform",function(d){return "translate(" + projection([d.lon, d.lat])+")"})
        .style("fill","#fed976")
        .style("opacity",.75)
        .style("stroke", "#fc4e2a");

var outline = map.append("g")
      .attr("class", "g-outline")
    .selectAll("path")
      .data(function(d) { return d.countryCollection.geometries; })
    .enter().append("path")
      .attr("d", path);

  map.append("g")
      .attr("class", "g-label")
    .selectAll("text")
      .data(function(d) { return d.countryCollection.geometries; })
    .enter().append("text")
      .attr("transform", function(d) {
        var c = d.properties.centroid,
            b = path.bounds(d);
        if (b[1][1] - b[0][1] < 20) c[1] -= 12;
        return "translate(" + c + ")";
      })
      .attr("dy", ".35em")
	//.text(function(d) { return d.properties.name; });
      //.on("mouseenter", showTooltip)
      //.on("mouseleave", hideTooltipSoon);

    var gdp = map.filter(function(d) { return d.key === "gdp"; }).attr("transform", "translate(0,40)");
    var  pop = map.filter(function(d) { return d.key === "pop"; }).attr("transform", "translate(0,70)");

  gdp.selectAll(".g-feature path")
      .style("fill", function(d) { return isNaN(d.properties.gdpCap) ? null : colorCapita(d.properties.gdpCap); });

// pop.selectAll(".g-feature path")
//       .style("fill", function(d) { return isNaN(d.properties.gdpCap) ? null : colorCapita(d.properties.gdpCap2); });

  var key = svg.append("g")
      .attr("class", "g-key")
      .attr("transform", function(d) { return "translate(720,20)"; });

  key.each(function(d) {
    var key = d3.select(this);

    var color;
    if (d.key === "usd") {
      color = colorGrowth;
      x.domain([0, .12]);
      xAxis.tickFormat(function(d) { return d === .10 ? formatWholePercent(d) : formatInteger(100 * d); });
    } else {
      color = colorCapita;
      x.domain([0, 40000]);
      xAxis.tickFormat(function(d) { return d === 30000 ? "$" + formatThousands(d) + "K" : formatThousands(d); });
    }

    xAxis.tickValues(color.domain());

    key.selectAll("rect")
        .data(color.range().map(function(d, i) {
          return {
            x0: i ? x(color.domain()[i - 1]) : x.range()[0],
            x1: i < color.domain().length ? x(color.domain()[i]) : x.range()[1],
            z: d
          };
        }))
      .enter().append("rect")
        .attr("height", 8)
        .attr("x", function(d) { return d.x0; })
        .attr("width", function(d) { return d.x1 - d.x0; })
        .style("fill", function(d) { return d.z; });

    key.call(xAxis).append("text")
        .attr("class", "g-caption")
        .attr("y", -6)
        .text(function(d, i) {
          return d.key === "usd"
              ? "G.D.P. growth, 2011 to 2012"
              : "G.D.P. per capita, 2012";
        });
  });

}; // closes function ready()
// function hexProjection(radius) {
//   var dx = radius * 2 * Math.sin(Math.PI / 3),
//       dy = radius * 1.5;
//   return {
//     stream: function(stream) {
//       return {
//         point: function(x, y) { stream.point(x * dx / 2, (y - (2 - (y & 1)) / 3) * dy / 2); },
//         lineStart: function() { stream.lineStart(); },
//         lineEnd: function() { stream.lineEnd(); },
//         polygonStart: function() { stream.polygonStart(); },
//         polygonEnd: function() { stream.polygonEnd(); }
//       };
//     }
//   };
// }
