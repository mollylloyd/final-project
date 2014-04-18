var myJson = {};
var worldJson = {};
queue()
    .defer(d3.json, "world-50m.json")
    .defer(d3.csv, "countryCodes.csv")
    .defer(d3.csv, "gdpCapita.csv")
    .await(ready);

function ready(error,world,codes,gdpCap) {
    //console.log(world.transform);
    //console.log(codes);
    //console.log(gdpCap[0]);
    
    

   
    myJson.transform = {"scale":[1,1],"translate":[0,0]}
	myJson.arcs = world.arcs;
	myJson.type = "Topology"
       myJson.objects = {"land": world.objects.land,
		      "gdp": world.objects.countries,
		      "pop": world.objects.countries}

	countries = world.objects.countries.geometries;

	myJson.objects.gdp.geometries.forEach(function(d,i){
		d.properties = {};
	});

	myJson.objects.gdp.geometries.forEach(function(d,i){
		codes.forEach(function(e,j){
			gdpCap.forEach(function(f,k){
				if (d.id == e.code && e.alpha3 == f.CountryCode){
					d.properties = {"country": e.name, "gdpGrowth":+f.gdpGrowth2012,"pop":+f.population2012,"gdpCap":+f.gdpPerCap2012}
					//d.properties = {"country": e.name, "gdpGrowth":0,"pop":0,"gdpCap":0}
				}
			})
		})
	});

	myJson.objects.pop.geometries.forEach(function(d,i){
		d.properties = {};
	});
	
	myJson.objects.pop.geometries.forEach(function(d,i){
		codes.forEach(function(e,j){
			gdpCap.forEach(function(f,k){
				if (d.id == e.code && e.alpha3 == f.CountryCode){
					d.properties = {"country": e.name, "gdpGrowth":+f.gdpGrowth2012,"pop":+f.population2012,"gdpCap":+f.gdpPerCap2012}
					//d.properties = {"country": e.name, "gdpGrowth":0,"pop":0,"gdpCap":0}
				}
			})
		})
	});

saveToFile(myJson,"hexData1.json")
console.log(myJson);
};

    var saveToFile = function(object, filename){
       
    var blob, blobText;
        blobText = [JSON.stringify(object)];
        blob = new Blob(blobText, {
            type: "text/plain;charset=utf-8"
        });
        saveAs(blob, filename);

    }


