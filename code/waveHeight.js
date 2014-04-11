var jsonRows ={};

d3.csv("../data/waveHeight.csv", function(data) {
	data.forEach(function(d,i){
		jsonRows[i] = {"country":d.Country,"state":d.State,"name":d.Name,"distance":+d.DistanceFromSource,"lat":+d.Latitude, "lon":+d.Longitude,
					"waveHeight":+d.MaxWaveHeight, "waveHeight":+d.MaxWaveHeight,"arrivalDate":  new Date(2011,03,+d.ArrivalDay,+d.ArrivalHour, +d.ArrivalMin),
					"maxWaveDate":new Date(2011,03,+d.MaxWaveDay,+d.MaxWaveHour,+d.MaxWaveMin)};	
	});	
});

