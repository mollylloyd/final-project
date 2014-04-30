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

queue()
    .defer(d3.json, "japanStates.json")
    .defer(d3.json, "us.json")
    .defer(d3.csv, "waveHeightJapan.csv")
    .defer(d3.json, "hexData.json")
    .await(ready);

function ready(error,japan, us, wave, world) {

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


    wave.forEach(function(d,i){
	var p = projection([ d.lon,d.lat ]);
	
	d[0] = p[0], d[1]=p[1];
	
    });
    //console.log(wave);

 //process topojson file
    var object = japan.objects.states;
    var states = {type:"GeometryCollection", geometries: object.geometries};
    var stateCollection = topojson.object(japan,states);
    var features = topojson.object(japan, japan.objects.states);
    
    //stateCollection.geometries.forEach(function(d){ d.properties ={};});
    
    stateCollection.geometries.forEach(measure);
    

    function measure(o,i) {
    
      o.properties.centroid = path.centroid(o);
      o.properties.area = path.area(o);
    }

    stateCollection.geometries.forEach(descendingArea);

    function descendingArea(a, k) {
	function meep (b,i){ if (i != k) {
	
      return b.properties.area - a.properties.area;
	}}}
    
    japanStates = {key: "state",
		   stateCollection: stateCollection,
		   stateMesh: topojson.mesh(japan, object, function(a,b) {return a !== b;})
		  };


    //svg.selectAll("path")
//	.data(features.geometries)
//	.enter()
//	.append("path")
//	.attr("class","land")
//	.attr("stroke", "black")
//	.attr("stroke-width","0.5")
//	.attr("d", path);
    
  svg.append("path")
	.datum(japanStates.stateCollection)
	.attr("class","land")
	.attr("d",path);

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
}//closes function ready()
