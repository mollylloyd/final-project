var width = 950,
    height = 550,
    radius = 2.546,
    dx = radius * 2 * 7 * 2 * Math.sin(Math.PI / 3),
    dy = radius * 2 * 11 * 1.5;


var projection = d3.geo.robinson()
    .scale(150)
    .translate([width / 2, height / 2])
    .center([0,22])
    .precision(.1);

var path = d3.geo.path()
    .projection(projection);

var formatWholePercent = d3.format("+.0%"),
    formatPercent = d3.format("+.1%"),
    formatInteger = d3.format(",.0f"),
    formatDecimal = d3.format(".1f"),
    formatThousands = function(d) { return formatInteger(d * 1e-3); },
    formatUsdBillion = function(d) { return "$" + (d < 1e10 ? formatDecimal : formatInteger)(d / 1e9) + " billion"; },
    formatUsdMillion = function(d) { return "$" + formatInteger(d) + " mil"; },
    formatUsd = function(d) { return "$" + formatInteger(d); },
    formatPop = function(d) { return (d < 1e7 ? formatDecimal : formatInteger)(d / 1e6) + " million"; };


var colorCapita = d3.scale.threshold()
    .domain([1000, 2000, 5000, 10000, 20000])
    .range(["#fee5d9","#fcbba1","#fc9272","#fb6a4a","#de2d26","#a50f15"]);

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

// d3.selectAll(".g-hexagon").append("path")
//     .attr("d", hexbin.hexagon());


queue()
    .defer(d3.json, "hexData.json")
    .defer(d3.csv, "disasters.csv")
    .await(ready);

function ready(error,topology, disasters) {
    disasters =disasters.map(function(d){
	   return {
	    year: +d.year,
	    lat:+d.lat,
	    lon:+d.long,
	    loss: +d.overallLosses,
	    deaths: +d.fatalities,
	    disaster: d.disaster
	     };
    });

    topology.objects.gdp.geometries.forEach(rescale);

    function rescale(d) {
    	if (d.properties.gdpCap === 0) d.properties.gdpCap = NaN;
	   if (d.properties.pop === 0) d.properties.pop = NaN;
	   if (d.properties.gdpGrowth === 0) d.properties.gdpGrowth = NaN;
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
      .append("path");
      //.attr("d", hexbin.mesh());


  map.append("g")
      .attr("class", "g-feature")
    .selectAll("path")
      .data(function(d) { return d.countryCollection.geometries; })
    .enter().append("path")
	 .attr("d", path)
      .on("mouseenter", showTooltip)
      .on("mouseleave", hideTooltip);

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

var deathScale = d3.scale.pow().exponent(2)
	.domain([d3.min(disasters.map(function(d) {return d.deaths;})),
	         d3.max(disasters.map(function(d) {return d.deaths;}))])
	.range([5,30]);

var econScale = d3.scale.pow().exponent(2)
	.domain([d3.min(disasters.map(function(d) {return d.loss;})),
	         d3.max(disasters.map(function(d) {return d.loss;}))])
        .range([5,30]);

    


var circles = map.selectAll(".dot")
	.data(disasters)
	.enter()
	.append("circle",".dot")
        .attr("r",5)
	.attr("transform",function(d){return "translate(" + projection([d.lon, d.lat])+")"})
        .style("fill","#666699")
        .style("opacity",.75)
        .style("stroke", "#FFFFFF")
  .on("mouseenter", showDisasterTT)
  .on("mouseleave", hideDisasterTT);

var circleKey = svg.append("g")
      .attr("class","g-key")
      .attr("transform","translate(100,55)");

var econFill = "#33AD5C";
var deathFill = "#66CCFF";

var econLabels = circleKey
      .selectAll(".dot")
      .data([1000,50000,100000,200000])
      .enter()
      .append("circle",".dot")
      .attr("transform", function (d,i) { return "translate ("+ (40 * i ) + "," + (-1*econScale(d))+")";})
      .style("fill", econFill)
      .style("opacity",.75)
      .attr("id","econ")
      .attr("r",function(d){
        return econScale(d);
        })
      .style("display","none");

var econText = circleKey.append("g")
    .selectAll("text")
    .attr("class","g-label")
    .attr("id","econText")
    .data([1000,50000,100000,200000])
    .enter()
    .append("text")
    .attr("y",20)
    .attr("transform", function (d,i) {
      return "translate ("+ (40*i - 13)+ ",0)";})
    .text(function(d){
       return "$" + (d/1000) + "B";})
    .style("display","none");

var deathLabels = circleKey.selectAll(".dot")
      .data([1000,50000,100000,200000])
      .enter()
      .append("circle",".dot")
      .attr("transform", function (d,i) { return "translate ("+ (40 * i ) + "," + (-1*deathScale(d))+")";})
      .style("fill", deathFill)
      .style("opacity",.75)
      .attr("r",function(d){
        return deathScale(d);
        })
      .style("display","none");

var deathText = circleKey.append("g")
    .selectAll("text")
    .attr("class","g-label")
    .data([1000,50000,100000,200000])
    .enter()
    .append("text")
    .attr("y",20)
    .attr("transform", function (d,i) {
      return "translate ("+ (40*i - 10)+ ",0)";})
    .text(function(d){
       return (d/1000) + "k";})
    .style("display","none");

var click;

d3.select("#econButton")
	.on("click", econClick);

d3.select("#deathButton")
	.on("click", deathClick);


function econClick(d){

  circles.transition()
       .attr("r",function(d){
        return econScale(d.loss)})
       .style("fill", econFill);

    econLabels.transition()
      .style("display", null);

    econText.transition()
      .style("display",null);

  if (click=="death"){
    deathText.transition()
      .style("display","none");
    deathLabels.transition()
      .style("display","none");
    };

  click = "econ";

};


function deathClick(d) {

  circles.transition()
       .attr("r",function(d){
        return deathScale(d.deaths)})
       .style("fill",deathFill);
  deathLabels.transition()
    .style("display",null);
  deathText.transition()
    .style("display",null);

  if (click == "econ"){
    econText.transition()
      .style("display","none");
    econLabels.transition()
      .style("display","none");
  };

  click = "death";
  
};


var outline = map.append("g")
      .attr("class", "g-outline")
    .selectAll("path")
      .data(function(d) { return d.countryCollection.geometries; })
    .enter().append("path")
      .attr("d", path);


    var gdp = map.filter(function(d) { return d.key === "gdp"; }).attr("transform", "translate(0,0)");
    

  gdp.selectAll(".g-feature path")
      .style("fill", function(d) { return isNaN(d.properties.gdpCap) ? null : colorCapita(d.properties.gdpCap); });

  var key = svg.append("g")
      .attr("class", "g-key")
      .attr("transform", function(d) { return "translate(720,20)"; });

  key.each(function(d) {

    var key = d3.select(this);

    var color;
    
      color = colorCapita;
      x.domain([0, 30000]);
      xAxis.tickFormat(function(d) { return d === 20000 ? "$" + formatThousands(d) + "K" : formatThousands(d); });
    

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
        .attr("x", function(d) {return d.x0; })
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
    .attr("width","240")
    .attr("height","140")
    .attr("viewBox","-120,-20,240,140")
    .style("margin-left","-120px")
    .attr("class","g-tooltip")
    .style("display","none");

tooltip.append("path")
      .attr("class", "g-shadow")
      .attr("d", "M-100,0h90l10,-10l10,10h90v110h-200z");

tooltip.append("path")
  .attr("class","g-box")
  .attr("d", "M-100,0 h 90l10,-10l10,10h90v110h-200z");

tooltip.append("text")
      .attr("class", "g-title")
      .attr("x", -90)
      .attr("y", 20);

var tooltipRow = tooltip.selectAll(".g-row")
      .data([
        {name: "G.D.P.", key: "gdp"},
        {name: "Change since \u201912", key: "change"},
        {name: "G.D.P. per capita", key: "capita"},
          {name: "Population", key: "pop"}])
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


var tooltipDisasters = d3.select("#g-graphic").append("svg")
    .attr("width","240")
    .attr("height","140")
    .attr("viewBox","-120,-20,240,100")
    .style("margin-left","-120px")
    .attr("class","g-tooltip")
    .style("display","none");

tooltipDisasters.append("path")
      .attr("class", "g-shadow")
      .attr("d", "M-100,0h90l10,-10l10,10h90v90h-200z");

tooltipDisasters.append("path")
  .attr("class","g-box")
  .attr("d", "M-100,0 h 90l10,-10l10,10h90v90h-200z");

tooltipDisasters.append("text")
      .attr("class", "g-title")
      .attr("transform", "translate(-90,20)");

var disasterTT = tooltipDisasters.selectAll(".g-row")
                  .data([
                    {name:"Year", key:"year"},
                    {name:"Total Fatalities", key:"deaths"},
                    {name:"Total Economic Losses", key:"loss"}])
                  .enter()
                  .append("g")
                  .attr("class",function(d){return "g-row g-" + d.key;})
                  .attr("transform", function(d,i){return "translate(-90,"  + (i * 17 + 38.5) + ")"; });
disasterTT.append("text")
    .attr("class","g-name")
    .text(function(d){ return d.name; });

disasterTT.append("text")
  .attr("x",180)
  .attr("class","g-number");
  
disasterTT.append("line")
  .attr("y1",4)
  .attr("y2",4)
  .attr("x2",180);

function showDisasterTT(d){
  var center = projection([d.lon,d.lat]);

  tooltipDisasters.style("display", null)
    .style("left", center[0] + "px")
    .style("top",  (center[1] + 14) + "px");

  tooltipDisasters.select(".g-year .g-number").text(d.year);
  tooltipDisasters.select(".g-deaths .g-number").text(formatInteger(d.deaths));
  tooltipDisasters.select(".g-loss .g-number").text(formatUsdMillion(d.loss));

  tooltipDisasters.select(".g-title").text(d.disaster);
}

function hideDisasterTT(d){
  tooltipDisasters.style("display","none");

}
function showTooltip(d){

  var centroid = d.properties.centroid,
      offsetY = this.ownerSVGElement.parentNode.offsetTop + (gdp.node().compareDocumentPosition(this) & 16 ? 60 : 90);

    outline.classed("g-active", function(p) { return p === d; }); 
       
  tooltip
        .style("display", null)
        .style("left", centroid[0] + "px")
        .style("top", centroid[1] + offsetY + "px");

    
    tooltip.select(".g-gdp .g-number").text(isNaN(d.properties.gdpCap*d.properties.pop) ? "N/A" : formatUsdBillion(d.properties.gdpCap*d.properties.pop));
    tooltip.select(".g-change .g-number").text(isNaN(d.properties.gdpGrowth) ? "N/A" : formatPercent(d.properties.gdpGrowth));
    tooltip.select(".g-capita .g-number").text(isNaN(d.properties.gdpCap) ? "N/A" : formatUsd(d.properties.gdpCap));
    tooltip.select(".g-pop .g-number").text(isNaN(d.properties.pop) ? "N/A" : formatPop(d.properties.pop));
    
    tooltip.select(".g-title").text(d.properties.country);

  };

function hideTooltip() {
    tooltip.style("display", "none");
    outline.classed("g-active", false);
  }
 
}; // closes function ready()

