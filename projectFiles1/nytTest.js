var width = 950,
    height = 920,
    radius = 3.546,
    dx = radius * 2 * 7 * 2 * Math.sin(Math.PI / 3),
    dy = radius * 2 * 11 * 1.5;

var formatWholePercent = d3.format("+.0%"),
    formatPercent = d3.format("+.1%"),
    formatInteger = d3.format(",.0f"),
    formatDecimal = d3.format(".1f"),
    formatThousands = function(d) { return formatInteger(d * 1e-3); },
    formatUsdBillion = function(d) { return "$" + (d < 1e10 ? formatDecimal : formatInteger)(d / 1e9) + " billion"; },
    formatUsd = function(d) { return "$" + formatInteger(d); },
    formatPop = function(d) { return (d < 1e7 ? formatDecimal : formatInteger)(d / 1e6) + " million"; };

var tooltipTimeout;

var path = d3.geo.path()
    .projection(hexProjection(radius));

var colorGrowth = d3.scale.threshold()
    .domain([.02, .04, .06, .08, .10])
    .range(["#f6f7b9", "#d9f0a3", "#addd8e", "#78c679", "#31a354", "#006837"]);

var colorCapita = d3.scale.threshold()
    .domain([1000, 2000, 5000, 10000, 20000])
    .range(["#edf8fb", "#ccece6", "#99d8c9", "#62c39a", "#2ca25f", "#006d2c"]);

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
    .datum(function() { console.log(this); return this.getAttribute("data-key"); })
  .append("svg")
    .attr("width", width)
    .attr("height", height);

d3.selectAll(".g-hexagon").append("path")
    .attr("d", hexbin.hexagon());

queue()
   .defer(d3.json, "http://graphics8.nytimes.com/newsgraphics/2013/03/07/china-population/19e97ff7ebd89ec13c66402d80c7c50a03f935bf/topology.json")
    //.defer(d3.json, "hexData.json")
    .await(ready);

function ready(error, topology) {
  topology.objects.usd.geometries.forEach(rescale);
  topology.objects.pop.geometries.forEach(rescale);
  console.log(topology);
  //console.log(topology.objects.usd.geometries[0].properties);

  function rescale(d) {
    if (d.properties.usd2012 === null) d.properties.usd2012 = NaN;
    if (d.properties.pop2012 === null) d.properties.pop2012 = NaN;
    if (d.properties.pct2012 === null) d.properties.pct2012 = NaN;
    d.properties.pop2012 *= 1e6;
    d.properties.usd2012 *= 1e9;
    d.properties.pct2012 *= 1e-2;
  }

  svg.datum(function(d) {
     
      var object = topology.objects[d];
      console.log(object);
      var countries = {type: "GeometryCollection", geometries: object.geometries};
      var countryCollection = topojson.object(topology, countries);
      //console.log(countryCollection);

    countryCollection.geometries.forEach(measure);
    countryCollection.geometries.sort(descendingArea);

    function measure(o) {
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
  });

  var map = svg.append("g");

  var defs = map.append("defs");

  defs.append("filter")
      .attr("id", "g-blur")
    .append("feGaussianBlur")
      .attr("stdDeviation", 3);

  defs.append("path")
	.attr("id", function(d) { console.log(d); return "g-countries-" + d.key; })
      .attr("d", function(d) { return path(d.countryCollection); });

  defs.append("clipPath")
      .attr("id", function(d) { return "g-clip-" + d.key; })
    .append("use")
      .attr("xlink:href", function(d) { return "#g-countries-" + d.key; });

  // Some browsers require integer-sized patterns, which is a bummer. :(
  // https://bugzilla.mozilla.org/show_bug.cgi?id=535185
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
      .on("mouseenter", showTooltip)
      .on("mouseleave", hideTooltipSoon);

  map.append("g")
      .attr("class", "g-feature")
    .selectAll("path")
      .data(function(d) { return d.countryCollection.geometries; })
    .enter().append("path")
      .attr("d", path)
      .on("mouseenter", showTooltip)
      .on("mouseleave", hideTooltipSoon);

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
      .text(function(d) { return d.properties.name; })
      .on("mouseenter", showTooltip)
      .on("mouseleave", hideTooltipSoon);

  var usd = map.filter(function(d) { return d.key === "usd"; }).attr("transform", "translate(0,40)"),
      pop = map.filter(function(d) { return d.key === "pop"; }).attr("transform", "translate(0,70)");

  usd.selectAll(".g-feature path")
      .style("fill", function(d) { return isNaN(d.properties.pct2012) ? null : colorGrowth(d.properties.pct2012); });

  pop.selectAll(".g-feature path")
      .style("fill", function(d) { return isNaN(d.properties.usd2012 / d.properties.pop2012) ? null : colorCapita(d.properties.usd2012 / d.properties.pop2012); });

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
      x.domain([0, 25000]);
      xAxis.tickFormat(function(d) { return d === 20000 ? "$" + formatThousands(d) + "K" : formatThousands(d); });
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

  var tooltip = d3.select("#g-graphic").append("svg")
      .attr("width", "240")
      .attr("height", "140")
      .attr("viewBox", "-120 -20 240 140")
      .style("margin-left", "-120px")
      .attr("class", "g-tooltip")
      .style("display", "none");

  tooltip.append("path")
      .attr("class", "g-shadow")
      .attr("d", "M-100,0h90l10,-10l10,10h90v100h-200z");

  tooltip.append("path")
      .attr("class", "g-box")
      .attr("d", "M-100,0h90l10,-10l10,10h90v100h-200z");

  tooltip.append("text")
      .attr("class", "g-title")
      .attr("x", -90)
      .attr("y", 20);

  var tooltipRow = tooltip.selectAll(".g-row")
      .data([
        {name: "G.D.P.", key: "gdp"},
        {name: "Change since \u201911", key: "change"},
        {name: "G.D.P. per capita", key: "capita"},
        {name: "Population", key: "pop"}
      ])
    .enter().append("g")
      .attr("class", function(d) { return "g-row g-" + d.key; })
      .attr("transform", function(d, i) { return "translate(-90," + (i * 17 + 38.5) + ")"; });

  tooltipRow.append("text")
      .attr("class", "g-name")
      .text(function(d) { return d.name; });

  tooltipRow.append("text")
      .attr("x", 180)
      .attr("class", "g-number");

  tooltipRow.append("line")
      .attr("y1", 4)
      .attr("y2", 4)
      .attr("x2", 180);

  function showTooltip(d) {
    clearTimeout(tooltipTimeout);
    var centroid = d.properties.centroid,
        offsetY = this.ownerSVGElement.parentNode.offsetTop + (usd.node().compareDocumentPosition(this) & 16 ? 60 : 90);

    outline
        .classed("g-active", function(p) { return p === d; });

    tooltip
        .style("display", null)
        .style("left", centroid[0] + "px")
        .style("top", centroid[1] + offsetY + "px");

    tooltip.select(".g-gdp .g-number").text(isNaN(d.properties.usd2012) ? "N/A" : formatUsdBillion(d.properties.usd2012));
    tooltip.select(".g-change .g-number").text(isNaN(d.properties.pct2012) ? "N/A" : formatPercent(d.properties.pct2012));
    tooltip.select(".g-capita .g-number").text(isNaN(d.properties.usd2012 / d.properties.pop2012) ? "N/A" : formatUsd(d.properties.usd2012 / d.properties.pop2012));
    tooltip.select(".g-pop .g-number").text(isNaN(d.properties.pop2012) ? "N/A" : formatPop(d.properties.pop2012));
    tooltip.select(".g-click").style("display", d.id === "CN" ? null : "none");
    tooltip.select(".g-title").text(d.properties.name);
  }

  function hideTooltipSoon() {
    clearTimeout(tooltipTimeout);
    tooltipTimeout = setTimeout(hideTooltip, 500);
  }

  function hideTooltip() {
    tooltip.style("display", "none");
    outline.classed("g-active", false);
  }
}

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


