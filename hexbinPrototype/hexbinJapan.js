// http://bl.ocks.org/mbostock/4330486 >> example used as a guide

var width = 950,
    height = 800;

var projection = d3.geo.mercator()
    .scale(1400)
    .translate([width/2,height/2])
    .center([137,34])
    .precision(.1);

var path = d3.geo.path().projection(projection);

var color = d3.scale.linear().domain([0,5,10,20,25]).range(["#FFCC00","red"]).interpolate(d3.interpolateLab);

var hexbin = d3.hexbin()
    .size([width,height])
    .radius(4);

var svg = d3.select(".g-section").append("svg")
    .attr("width",width)
    .attr("height",height);
var  formatInteger = d3.format(",.0f");
queue()
    .defer(d3.json, "japanStates.json")
    .defer(d3.csv, "waveHeightJapan.csv")
    .defer(d3.csv, "deaths.csv")
    .await(ready);

function ready(error,japan, wave, deaths) {

    wave = wave.map(function(d){
	return{
	    country: d.Country,
	    distance: +d.DistanceFromSource,
	    lat: +d.Latitude,
	    lon: +d.Longitude,
	    height: +d.MaxWaveHeight,
	    state: d.State
	};
    });
 
    deaths = deaths.map(function(d){
	return {
	     buildingsDestroyed: +d.NonDwelling,
	    housesCollapsed: +d.BuildingCollapse,
	    housesPartiallyCollapsed:+d.PartialCollapse,
	    name: d.Prefecture,
	    deaths: +d.Killed,
	    missing: +d.Missing,
	    injured: +d.TotalPeople,
	    flooded: (+d.InnundatedAboveFloor + +d.InnundatedBelowFloor),
	    
	    housesDamaged: +d.PartiallyDamaged
	};
    })

    wave.forEach(function(d,i){
	var p = projection([ d.lon,d.lat ]);
	
	d[0] = p[0], d[1]=p[1];
	
    });

 //process topojson file
    var object = japan.objects.states;
    var states = {type:"GeometryCollection", geometries: object.geometries};
    var stateCollection = topojson.object(japan,states);
    var features = topojson.object(japan, japan.objects.states);
    
    
    //stateCollection.geometries.forEach(function(d){ d.properties ={};});
    
     stateCollection.geometries.forEach(measure);
     stateCollection.geometries.forEach(descendingArea);
     
    

    deaths.forEach(function(d) {
	stateCollection.geometries.forEach(function(e) {
	    if (d.name == e.properties.name) {
		e.detail = 1;
		e.properties.deaths = d.deaths;
		e.properties.missing = d.missing;
		e.properties.injured = d.injured;
		e.properties.flooded = d.flooded;
		e.properties.buildingsDestroyed = d.buildingsDestroyed;
		e.properties.housesCollapsed = d.housesCollapsed;
		e.properties.housesPartiallyCollapsed = d.housesPartiallyCollapsed;
		e.properties.housesDamaged = d.housesDamaged;
	    }
	})
    });

    function measure(o,i) {
    
      o.properties.centroid = path.centroid(o);
      o.properties.area = path.area(o);
    }

    function descendingArea(a, k) {
	function meep (b,i){ if (i != k) {
	
      return b.properties.area - a.properties.area;
	}}}
    
    japanStates = {key: "state",
		   stateCollection: stateCollection,
		   stateMesh: topojson.mesh(japan, object, function(a,b) {return a !== b;})
		  };

    
    svg.append("g")
	.attr("class", "g-feature")
	.selectAll("path")
	.data(stateCollection.geometries)
	.enter()
	.append("path")
	.attr("d",path)
    .attr("class", function(d) { if (d.properties.deaths) {return "g-detail"} else {return "g-feature"}})
	.style("fill",function(d) { if (d.properties.deaths) {return "#828282"} else {return "#ddd"}});

    svg.selectAll(".g-feature .g-detail")
	.on("mouseenter", showTT)
	.on("mouseleave", hideTT);
   
    svg.append("path")
	.datum(japanStates.stateMesh)
	.attr("class","states")
	.attr("d",path);

    
    svg.append("g")
	.attr("class","hexagons")
	.selectAll("path")
	.data(hexbin(wave).sort(function(a, b) { return b.length - a.length;}))
	.enter()
	.append("path")
	.attr("d",function(d){ return hexbin.hexagon(4)})
	.attr("transform", function(d){ return "translate(" +d.x+ "," +d.y+ ")";})
	.style("fill",function(d){ return color(d3.mean(d, function(d) {return d.height})); });

    var damageVis = svg.append("g")
	.attr("height", 500)
	.attr("width", 300)
        .attr("class","g-damage")
	.attr("transform","translate(30,30)");

    damageVis.append("text")
	.attr("class","g-caption")
	.attr("y", 10)
	.text("Total Earthquake and Tsunami Casualties");

    var peopleScale = d3.scale.pow().exponent(1.5).domain([1000,16000]).range([10, 50]);
    var colorCircles  = d3.scale.category10().domain(d3.range(0,9));
    damageVis.selectAll("circle")
	.data([2633,6148,15884])
	.enter()
	.append("circle")
	.attr("r", function(d) {return peopleScale(d)})
	.attr("transform",function(d,i) { if (i<2) {return "translate(" + (i*70+20) +", 70)"} else {return "translate(" + (i*90+20) + ",70)"}})
	.style("opacity",0.75)
	.style("fill", function(d,i){ return colorCircles(i) ; });

    var humanData = [ ,{name: "Missing", number:2633},{name:"Injured", number:6148},{name: "Killed", number:15884}];

    damageVis.selectAll("text")
	.attr("class","g-label")
	.data(humanData)
	.enter()
	.append("text")
	.attr("y",50)
	.attr("transform",function(d,i) { if (i<2) {return "translate(" + (i*70-80) +", "+(30 + 20*i) + ")"} else if (i ==2) {return "translate(" +(i*70-83)+",23)"} else {return "translate(" + (i*70-48) + ",23)"}})
	.text(function(d) {console.log(d); return d.name + ": " + formatInteger(d.number)});

   var key = svg.append("g")
        .attr("height", 30)
        .attr("width", 30)
	.attr("class", "g-key")
	.attr("transform", function(d) { return "translate(720,30)"; });

      key.selectAll("path")
        .data([0,5,10,20,30])
        .enter()
        .append("path")
        .attr("d", function (d){ return hexbin.hexagon(8)})
        .attr("transform", function (d,i){ return "translate(" + 30*i + ", 0)";})
        .style("fill", function (d){return color(d);});
    key.selectAll("text")
        .attr("class","g-label")
        .data([0,5,10,20,30])
        .enter()
        .append("text")
        .attr("y",20)
        .attr("transform", function (d,i){ return "translate(" + (30*i-7) + ",0)";})
        .text(function (d) {return d + "m" ;});

    key.append("text")
        .attr("class","g-caption")
        .attr("y",-13)
        .attr("x", 4)
        .text("Maximum Wave Height");

var tooltip = d3.select("#map").append("svg")
    .attr("width","240")
    .attr("height","140")
    .attr("viewBox","-120,-20,240,140")
    .style("margin-left","-120px")
    .attr("class","g-tooltip")
    .style("display","none");

tooltip.append("path")
      .attr("class", "g-shadow")
      .attr("d", "M-100,0h90l10,-10l10,10h90v120h-200z");

tooltip.append("path")
  .attr("class","g-box")
  .attr("d", "M-100,0 h 90l10,-10l10,10h90v120h-200z");

tooltip.append("text")
      .attr("class", "g-title")
      .attr("x", -90)
      .attr("y", 20);

var tooltipRow = tooltip.selectAll(".g-row")
      .data([
        {name: "Total Deaths" , key: "deaths"},
        {name: "Total Missing", key: "missing"},
        {name: "Total Injured", key: "injured"},
	  {name: "Houses Collapsed", key: "collapsed"},
          {name: "Buildings Flooded / Destroyed", key: "buildings"}])
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

    function showTT(d) {
	var centroid = d.properties.centroid;
	
	tooltip.style("display", null)
	    .style("left", centroid[0] + "px")
	    .style("top",centroid[1] + "px");
	

	tooltip.select(".g-deaths .g-number").text(formatInteger(d.properties.deaths));
	tooltip.select(".g-missing .g-number").text(formatInteger(d.properties.missing));
	tooltip.select(".g-injured .g-number").text(formatInteger(d.properties.injured));
	tooltip.select(".g-collapsed .g-number").text(formatInteger(d.properties.housesCollapsed));
	tooltip.select(".g-buildings .g-number").text(formatInteger(d.properties.flooded));

	 tooltip.select(".g-title").text(d.properties.name);
    };

    function hideTT(d) {
	tooltip.style("display","none");
    };
}//closes function ready()
