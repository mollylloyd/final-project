var activeSlide = "0", subSlide = "", fullSlide = "0", updateSurveyVis, surveyQuestion, numSurveySlides = 4, numEarthquakeSlides = 3, numNuclearSlides = 2, numTsunamiSlides = 2, fullScreen = false, yCoord, slideQuestion;
var slides = Array("0", "1", "1-2", "1-3", "2", "3", "3-2", "4", "4-2", "4-3", "4-4", "5");

$(document).ready(function(){

    $(window).resize(function () {
        location.reload();
    });

    var setSlide = function (goSlide) {
        var index = slides.indexOf(fullSlide);
        switch (goSlide) {
            case "-":
                goSlide = slides[(index - 1)];
                break;
            case "+":
                goSlide = slides[(index + 1)];
                break;
        }
        if (fullSlide == "4" && goSlide == "3-2") {
            $('#survey').stop().fadeIn().fadeOut(500);
            setTimeout(function () {
                $('.slide3').animate({opacity: 1}, 600);
            }, 600);
        }
        if (fullSlide == "3-2" && goSlide == "4") {
            $('.slide3').animate({opacity: 0}, 500);
            $('#survey').fadeIn(5000);
        }
        activeSlide = goSlide.substring(0, 1) || "0";
        subSlide = goSlide.substring(2, 3) || "";
        fullSlide = activeSlide + (subSlide ? "-" + subSlide : "");
        $(".homeNav, .slide1Nav, .slide2Nav, .slide3Nav, .slide4Nav, .slide4Nav, .slide5Nav").css("background-color", "transparent");
        $(".slide" + activeSlide + "Nav").css("background-color", "#FFF");
        updateSurveyVis();
        scrollingNav();
        var timeout = 0;
        if (fullSlide == "5" || fullSlide == "4-4") {
            timeout = 300;
        }
        easeScroll('slide' + fullSlide, timeout);
    };

    $(".slide1Nav, .slide2Nav, .slide3Nav, .slide4Nav, .slide4Nav, .slide5Nav").click(function() {
        var slide = $(this).attr('rel');
        setSlide(slide);
    });

    var scrollingNav = function() {
        $('.scrolling.up, .scrolling.down').remove();
        switch(activeSlide)
        {
            case "1":
            case "2":
            case "3":
            case "4":
                $('.slide'+activeSlide).append("<div class='scrolling up'><div class='icon-up-open'></div></div><div class='scrolling down'><div class='icon-down-open'></div></div>");
                break;
            case "5":
                $('.slide'+activeSlide).append("<div class='scrolling up'><div class='icon-up-open'></div></div>");
                break;
        }
    };

    var easeScroll = function(slideName, timeout) {
        setTimeout(function () {
            $('html, body').stop().animate({
                scrollTop: ($('.'+slideName).offset().top)
            }, 1000,'easeInOutExpo');
        }, timeout);
    };

    $('body')
        .on('click', '.slide .down', function(){
            setSlide("+");
        })
        .on('click', '.slide .up', function(){
            setSlide("-");
        })
        .on('mousewheel', function(event) {
            switch (event.deltaY) {
                case -1:
                    if (activeSlide != "0") {
                        setSlide("+");
                    }
                    break;
                case 1:
                    setSlide("-");
                    break;
            }
        });

    $('.inner')
        .waypoint(function (direction) {
        if (direction == "down" && activeSlide == "0") {
            setSlide("1");
        }
    });

    $('.slide1').css('height', ($.waypoints('viewportHeight')*numEarthquakeSlides)+"px")
        .waypoint(function (direction) {
        if (direction == "up") {
            // Slide1 -> Home
            $(".navWrapper").css("display", "none");
            setSlide("0");
            $('.slide1, .slide2, .slide3').css("background-attachment", "scroll");
        } else {
            // Home -> Slide1
            activeSlide = "1";
            $(".navWrapper").css("display", "block");
            $('.slide1, .slide2, .slide3').css("background-attachment", "fixed");
        }
    });

    $('.slide2').css('height', ($.waypoints('viewportHeight')*numTsunamiSlides)+"px");
    $('.slide3').css('height', ($.waypoints('viewportHeight')*numNuclearSlides)+"px");

    $('.slide1-1, .slide1-2, .slide1-3, .slide2, .slide2-2, .slide4, .slide4-1, .slide4-2, .slide4-3, .slide4-4, .slide5').css('height', $.waypoints('viewportHeight') + "px");
    $('#earthquakeVis, #radiationVis').css('height', ($.waypoints('viewportHeight')-100) + "px");
    $('#survey').css('height', ($.waypoints('viewportHeight')*numSurveySlides)+"px").hide();

    $('.homeNav, .slide1Nav, .slide2Nav, .slide3Nav, .slide4Nav, .slide5Nav').bind('click', function (event) {
        var slideName = ($(this).attr('class')).replace("Nav", "");
        $('#survey').hide();
        easeScroll(slideName);
        event.preventDefault();
    });

    $('.slide1 img, .slide2 img, .slide3 img').each(function() {
        var imgWidth = $(this).width();
        var imgHeight = $(this).height();
        var widthRatio = $(window).width()/imgWidth;
        var heightRatio = $.waypoints('viewportHeight')/imgHeight;
        var parentClass = $(this).parent().attr('class');
        if (fullScreen) {
            if (widthRatio > heightRatio) {
                $(this).width($(window).width());
                $(this).height(widthRatio*imgHeight);
            } else {
                $(this).height($.waypoints('viewportHeight'));
                $(this).width(heightRatio*imgWidth);
            }
        } else {
            var navHeight = 55;
            var parentHeight = $(this).parent().height() - navHeight;
            var marginTop = ((parentHeight - $(this).height())/2);
            if (parentClass == 'slide slide1-2') {
                marginTop = marginTop + navHeight;
            }
            $(this).css("margin-top", marginTop + "px");
            var imgWidthDiff = ($(window).width()-imgWidth);
            if (imgWidthDiff < 500) {
                $(this).width($(window).width()-500);
                imgWidth = $(this).width();
                var imgChngRatio = ($(window).width()-500)/imgWidth;
                $(this).height(imgChngRatio*imgHeight);
            }
            $('.slide2 img').css("width", "auto");
            $(this).css("margin-left", "450px");
        }
    });

    /*
     *
     * =Survey
     -------------------------------------------------------------- */

    d3.json("http://beta.fukushimajapan.org/data/surveyData.json", function (error, json) {

        updateSurveyVis = function() {
            switch(fullSlide)
            {
                case "4":
                    showResponseCircle();
                    break;
                case "4-2":
                    slideQuestion = 'sufficientNuclearResponse';
                    dotVis(slideQuestion);
                    resetQuotes(0);
                    break;
                case "4-3":
                    slideQuestion = 'agreeLiftOrder';
                    dotVis(slideQuestion);
                    resetQuotes(0);
                    break;
                case "4-4":
                    $('.slide5').animate({opacity: 0}, 1500);
                    setTimeout(function () {
                        $('#survey').animate({opacity: 1}, 1500);
                    }, 800);
                    slideQuestion = 'sufficientSurvivorResponse';
                    dotVis(slideQuestion);
                    resetQuotes(0);
                    break;
                case "5":
                    $('.slide5').animate({opacity: 1}, 1500);
                    $('#survey').animate({opacity: 0}, 500);
                    resetQuotes(0);
                    break;
            }
        };

        surveyQuestion = function(field) {
            var headline = headlines[field];
            $('.surveyHeadline').text(headline);
            dotVis(field);
            $('.slide'+fullSlide+' .text, .surveyVis').animate({opacity: 1}, 0);
        };

        $('#displaced, #income, #injured, #dead, #notinvolved, #other').click(function() {
            $(this).toggleClass("active");
            dotVis(slideQuestion);
        });

        var showToolTip = function (d) {
            if (fullSlide == "4") {
                resetQuotes(1);
                showResponseQuote(d[2]);
                responseQuoteCycle();
            } else {
                resetQuotes(0);
                tooltip
                    .style("display", null)
                    .style("left", d.x+47+"px")
                    .style("top", d.y+112+"px");
                tooltip.select(".g-i1 .g-number").text(d[fields['involvement1']] == 1 ? "Yes" : "No");
                tooltip.select(".g-i2 .g-number").text(d[fields['involvement2']] == 1 ? "Yes" : "No");
                tooltip.select(".g-i3 .g-number").text(d[fields['involvement3']] == 1 ? "Yes" : "No");
                tooltip.select(".g-i4 .g-number").text(d[fields['involvement4']] == 1 ? "Yes" : "No");
                tooltip.select(".surveySmallTT").text(d[fields['thoughts']]);
                tooltip.select(".g-title").text(d[fields['displacedPrefecture']] != '' ? d[fields['currentPrefecture']]+" Prefecture (Displaced from "+d[fields['displacedPrefecture']]+")" : d[fields['currentPrefecture']]+" Prefecture");
            }
        };

        var hideToolTip = function() {
            tooltip.style("display", "none");
        };

        var responsePopularityColor = d3.scale.linear()
                .domain([0, 50])
                .interpolate(d3.interpolateRgb)
                .range(["#666", "#b6001f"]);

        // Response popularity legend
        var colorLegend = "<div class='legend'><div class='float'>-</div><div class='color'></div><div class='float'>+</div><br>Comment popularity</div>";
        $('.legend').remove();
        $('.survey').append(colorLegend);


        /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random */
        var getRandomInt = function(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        var responseQuoteCycle = function() {
            responseQuoteCycleId = window.setInterval(function () {
                showResponseQuote("random");
            }, 7000);
        };

        var resetQuotes = function(addQuads) {
            clearInterval(responseQuoteCycleId);
            circle
                .selectAll(".responseQuote")
                .remove();
            $('.responseQuote').remove();
            $('.quadrant.one, .quadrant.two, .quadrant.three, .quadrant.four').remove();
            if (addQuads === 1) {
                addQuadrants();
            }
        };

        var addQuadrants = function() {
            var freeWidth = $(window).width() - (($.waypoints('viewportHeight') * circlePct) + 80);
            var quoteLeft = (freeWidth / 2) - 175 - (160 / 2);
            var quoteRight = (freeWidth / 2) + ($.waypoints('viewportHeight') * circlePct) + 175 - (160 / 2);

            $('#surveyIntro').append("<div class='quadrant one'></div><div class='quadrant two'></div><div class='quadrant three'></div><div class='quadrant four'></div>");

            $('.quadrant.one')
                .css("margin-left", quoteRight);
            $('.quadrant.two')
                .css("margin-left", quoteRight)
                .css("margin-top", "-" + (($.waypoints('viewportHeight') * circlePct) / 1.5) + "px");
            $('.quadrant.three')
                .css("margin-left", quoteLeft)
                .css("margin-top", "-" + (($.waypoints('viewportHeight') * circlePct) / 1.5) + "px");
            $('.quadrant.four')
                .css("margin-left", quoteLeft);
        };

        var showResponseQuote = function(num) {

            if (num == "random") {
                var quoteResponses = _.reject(json.data, { thoughts: '' });
                var numQuoteResponses = _.size(quoteResponses);
                var thisNum = getRandomInt(1, numQuoteResponses);
                var thoughts = quoteResponses[thisNum].thoughts;
                num = quoteResponses[thisNum].id;
            } else {
                var thoughts = json.data[num].thoughts;
            }

            if (thoughts.length > 0) {
                $('.quadrant').css("display", "none");

                circle
                    .append("circle")
                    .classed("responseQuote", true)
                    .attr("cx", function () {
                        return circleLeft + (circleWidth * circleResponses[num][0]);
                    })
                    .attr("cy", function () {
                        return ($.waypoints('viewportHeight') * circlePct) * circleResponses[num][1]
                    })
                    .attr("fill", "white")
                    .attr("r", 2)
                    .style("stroke", "#b6001f")
                    .transition()
                    .ease("linear")
                    .duration(7000)
                    .style("stroke-width", 3.5)
                    .attr("r", Math.pow(2, 5.5))
                    .remove();

                if (num <= (responses / 4)) {
                    var quadrant = "one";
                } else if (num > (responses / 4) && num <= (responses / 2)) {
                    var quadrant = "two";
                } else if (num > (responses / 2) && num <= ((responses / 4) * 3)) {
                    var quadrant = "three";
                } else if (num > ((responses / 4) * 3)) {
                    var quadrant = "four";
                }

                if (quadrant == "one" || quadrant == "four") {
                    if (thoughts.length > 100) {
                        $('.quadrant.' + quadrant).css("margin-top", "-" + ((($.waypoints('viewportHeight') * circlePct) / 1.5)+100) + "px");
                    }
                    if (thoughts.length > 200) {
                        $('.quadrant.' + quadrant).css("margin-top", "-" + (($.waypoints('viewportHeight') * circlePct) / 1.5) + "px");
                    }
                }

                $('.quadrant.' + quadrant).html(thoughts).fadeIn(7000); //'&ldquo;' + thoughts + '&rdquo;'
            }
        };

        var showSurveyPcts = function(x,zero,one,two,three,four,five) {
            $('.surveyPct').remove();
            var xPosition = (fiveVisLeft + fiveVisSpc + (dotPadding * dotsPerRow)) - 21;
            if (zero) {
                $('.slide'+fullSlide).append("<div class='surveyPct'><div style='margin-left:"+xPosition+"px'><span class='num'>"+zero+"</span><br><span class='desc'>No</span></div><div><span class='num'>"+one+"</span><br><span class='desc'>Yes</span></div><div>");
            } else {
                $('.slide'+fullSlide).append("<div class='surveyPct'><div style='margin-left:"+xPosition+"px'><span class='num'>"+one+"</span><br><span class='desc'>1 = No, not at all</span></div><div><span class='num'>"+two+"</span></div><div><span class='num'>"+three+"</span></div><div><span class='num'>"+four+"</span></div><div><span class='num'>"+five+"</span><br><span class='desc'>5 = Yes, fully</span></div></div>");
            }
            Cufon.replace('.surveyPct .num', { fontFamily: 'Frutiger LT Std' });
            Cufon.refresh();
        };

        var initResponseCircle = function() {
            var coordinates = Array();
            for (var id = 0; id < responses; id++) {
                var x = .5 + .5 * Math.sin(id * 2 * Math.PI / responses);
                var y = .5 + .5 * Math.cos(id * 2 * Math.PI / responses);
                coordinates.push([x, y, id]);
            }
            return coordinates;
        };

        var showResponseCircle = function() {
            if (!responseCircleInit) {
                dots = circle
                    .selectAll(".dot")
                    .data(circleResponses)
                    .enter()
                    .append("circle")
                    .classed("dot", true)
                    .attr("id", function (d) {
                        return "response-" + d[2];
                    })
                    .attr("cx", function (d) {
                        return circleLeft + (circleWidth * d[0]);
                    })
                    .attr("cy", function (d) {
                        return ($.waypoints('viewportHeight') * circlePct) * d[1];
                    })
                    .attr("fill", function (d) {
                        return responsePopularityColor(json.data[d[2]].simulatedPopularity);
                    })
                    .attr("r", "3")
                    .on('mouseover', function (d) {
                        showToolTip(d);
                    })
                    .on('mouseout', function () {
                        hideToolTip();
                    })
                    .on('click', function (d) {
                        showToolTip(d);
                    });
                responseCircleInit = true;
            } else {
                dots.data(circleResponses).transition().duration(1500).delay(function (c, b) {
                    return 5 * b
                })
                    .attr("cx", function (d) {
                        return circleLeft + (circleWidth * d[0]);
                    })
                    .attr("cy", function (d) {
                        return ($.waypoints('viewportHeight') * circlePct) * d[1]
                    })
                    .attr("r", "3");
                resetQuotes(1);
                setTimeout(function () {
                    showResponseQuote("random");
                    responseQuoteCycle();
                }, 1500);
            }
        };

        $('.surveyMenu.dynamic').mouseover(function() {
            $('.slide'+fullSlide+' .text, .surveyVis').animate({opacity:.05}, 0);
        });

        $('.survey.slide .text, .surveyVis, .survey .scrolling').mouseover(function() {
            $('.slide'+fullSlide+' .text, .surveyVis').animate({opacity: 1}, 0);
        });

        var subMenu = function(d) {
            $('.surveyMenu').html('');
            var subMenus = '';
            _.forEach(headlines, function(d, a) {
                subMenus += '<li><a href="javascript:surveyQuestion(\''+a+'\');">'+d+'</a></li>';
            });
            var headline = headlines[d];
            var surveyMenu = '<ul><li><a href="javascript:void();" class="surveyHeadline">'+headline+'</a><ul class="surveySubMenu">'+subMenus+'</ul></li></ul>';
            $('.surveyMenu').html(surveyMenu);
            Cufon.replace('.surveyMenu', { fontFamily: 'Frutiger LT Std' });
            Cufon.refresh();
        };

        var dotVis = function(fieldToSort) {
            slideQuestion = fieldToSort;
            subMenu(fieldToSort);
            var displaced = $('#displaced').hasClass('active');
            var income = $('#income').hasClass('active');
            var injured = $('#injured').hasClass('active');
            var dead = $('#dead').hasClass('active');
            var notinvolved = $('#notinvolved').hasClass('active');
            var other = $('#other').hasClass('active');
            var sortedData = _.map(_.sortBy(json.data.slice(0), fieldToSort), _.values);
            var x = 0, yPos = ($.waypoints('viewportHeight') * circlePct *.7), y = 0, currentCase = 0, one=0, two=0, three=0, four=0, five= 0, zero=0;
            var setPos = function (num, d, zero) {
                var padLeft=0;
                if (zero) {
                    padLeft=125;
                }
                if (x > dotsPerRow) {
                    x = 0;
                    y++;
                }
                if (num > currentCase) {
                    x = 0;
                    y = 0;
                    currentCase++;
                }
                d.x = padLeft + fiveVisLeft + (fiveVisSpc * num) + (x * dotPadding);
                d.y = yPos - (y * dotPadding);
            };
            _.forEach(sortedData, function (d) {
                if (notinvolved && d[fields['notInvolved']] == "1" || displaced && d[fields['involvement1']] == "1" || income && d[fields['involvement2']] == "1" || injured && d[fields['involvement3']] == "1" || dead && d[fields['involvement4']] == "1" || other && d[fields['involvement5']] == "1") {
                    if (d[fields[fieldToSort]] == "0") {zero++;}
                    if (d[fields[fieldToSort]] == "1") {one++;}
                    if (d[fields[fieldToSort]] == "2") {two++;}
                    if (d[fields[fieldToSort]] == "3") {three++;}
                    if (d[fields[fieldToSort]] == "4") {four++;}
                    if (d[fields[fieldToSort]] == "5") {five++;}
                    setPos(d[fields[fieldToSort]], d, zero);
                    x++;
                } else {
                    d.x=-500;
                    d.y=-500;
                }
            });
            showSurveyPcts(x,zero,one,two,three,four,five);
            dots.data(sortedData).transition().duration(1000).delay(function (d, a) {
                return 3 * a
            }).attr("cx",function (d) {
                return d.x
            }).attr("cy",function (d) {
                return d.y
            }).attr("r", function (d) {
                    return 5;
            })
                .attr("class",function (d) {
                    return "dot-"+d[17];
                })
                .attr("fill", function (d) {
                    return responsePopularityColor(d[fields['simulatedPopularity']]);
                })
                .transition(1000);
        };

        var calcLeft = function(d) {
            return (($(window).width()*visPct) - d)/2;
        };

        var fields = {"currentPrefecture" : 0, "involvement1" : 1, "involvement2" : 2, "involvement3" : 3, "involvement4" : 4, "involvement5" : 5, "displacedPrefecture" : 6, "sufficientNuclearResponse" : 7, "wasteWaterTreatment" : 8, "trustTEPCO" : 9, "sufficientSurvivorResponse" : 10, "agreeLiftOrder" : 11, "buyProduce" : 12, "buySeafood" : 13, "earthquakeDebris" : 14, "supportNuclear" : 15, "supportNuclearFukushima" : 16, "thoughts" : 17, "id" : 18, "simulatedPopularity" : 19, "notInvolved" : 20};
        var headlines = {"sufficientNuclearResponse" : "Do you believe the Japanese government has been taking sufficient measures to control the nuclear accident?", "wasteWaterTreatment" : "Do you believe TEPCO has been taking proper measures to treat and contain the radioactive waste water at Fukushima?", "trustTEPCO" : "Do you trust TEPCO to help meet Japan's current and future energy needs?", "sufficientSurvivorResponse" : "Do you believe the Japanese government is taking sufficient measures for people affected by the nuclear accident?", "agreeLiftOrder" : "Do you agree with the government’s recent decision to lift the evacuation order of the no-entry zone around Fukushima?", "buyProduce" : "Do you or would you buy grains, vegetables and/or fruits produced in the Fukushima area?", "buySeafood" : "Do you or would you buy seafood imported from the Fukushima area?", "supportNuclear" : "Do you support the continued production of nuclear energy in Japan?", "supportNuclearFukushima" : "Do you support the future production of nuclear energy in Fukushima?"};
        var circle, dots, circleResponses, dotPadding = 13, dotsPerRow = 7, circlePct = .77, responses = _.size(json.data), responseCircleInit = false, visPct = .9, fiveVisSpc = 125, responseQuoteCycleId;
        var fiveVisWidth = (dotPadding*dotsPerRow) + (fiveVisSpc*4);
        var circleWidth = ($.waypoints('viewportHeight')) * circlePct;
        var circleLeft = calcLeft(circleWidth);
        var fiveVisLeft = calcLeft(fiveVisWidth) + ($(window).width()*.1);

        var tooltip = d3.select(".surveyVis").append("svg")
            .attr("stroke-width", ".5")
            .attr("width","550")
            .attr("height","350")
            .attr("viewBox","-120,-20,240,140")
            .style("margin-left","-225px")
            .attr("class","g-tooltip survey")
            .style("position", "fixed")
            .style("display","none");

        tooltip.append("path")
            .attr("class", "g-shadow")
            .attr("d", "M-100,0h90l10,-10l10,10h90v110h-200z");

        tooltip.append("path")
            .attr("class","g-box")
            .attr("d", "M-100,0h90l10,-10l10,10h90v110h-200z");

        tooltip.append("text")
            .attr("class", "g-title survey")
            .attr("x", -90)
            .attr("y", 14);

        var tooltipRow = tooltip.selectAll(".g-row")
            .data([
                {name: "Displaced From or Lost Home", key: "i1"},
                {name: "Income Loss From Disaster", key: "i2"},
                {name: "Injured Friend/Family", key: "i3"},
                {name: "Missing/Dead Friend/Family", key: "i4"}
            ])
            .enter().append("g")
            .attr("class", function(d) { return "g-row g-" + d.key; })
            .attr("transform", function(d, i) {
                yCoord = (i * 11 + 25.5);
                return "translate(-90," + yCoord + ")"; });

        tooltipRow.append("text")
            .attr("class", "g-name")
            .text(function(d) { return d.name; });

        tooltipRow.append("text")
            .attr("x", 180)
            .attr("class", "g-number");

        tooltipRow.append("line")
            .attr("stroke-width", ".5")
            .attr("y1", 4)
            .attr("y2", 4)
            .attr("x2", 180);

        tooltip.append("foreignObject")
            .attr("width", "180")
            .attr("height", "30")
            .attr("transform", "translate(-90, "+(yCoord+10)+")")
            .append("xhtml:body")
            .html("<p class='surveySmallTT'></p><!--<div class='icon-thumbs-up''></div>-->");

        // Draw Response Circle
        circleResponses = initResponseCircle();
        circle = d3
            .select(".svgContainer")
            .append("svg").classed("svgVis", true)
            .attr("width", $.waypoints('viewportHeight') * circlePct);
        showResponseCircle();
        addQuadrants();
        showResponseQuote("random");
        responseQuoteCycle();
    });


    /*
     *
     * =Global Disaster
     -------------------------------------------------------------- */

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
    queue()
        .defer(d3.json, "data/hexData.json")
        .defer(d3.csv, "data/disasters.csv")
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
        }

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

        defs.append("pattern")
            .attr("id", "g-grid")
            .attr("width", dx)
            .attr("height", dy)
            .attr("patternUnits", "userSpaceOnUse")
            .append("path");

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
            .attr("transform", function (d,i) {
                var y = 0;
                switch(i) {
                    case 0: y = 10; break;
                    case 1: y = 55; break;
                    case 2: y = 110; break;
                    case 3: y = 185; break;
                }
                return "translate ("+ y + "," + (-1*econScale(d))+")";})
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
                var y = 0;
                switch(i) {
                    case 0: y = 0; break;
                    case 1: y = 40; break;
                    case 2: y = 93; break;
                    case 3: y = 168; break;
                }
                return "translate ("+ y + ",0)";})
            .text(function(d){
                return "$" + (d/1000) + "B";})
            .style("display","none");

        var deathLabels = circleKey.selectAll(".dot")
            .data([1000,50000,100000,200000])
            .enter()
            .append("circle",".dot")
            .attr("transform", function (d,i) {
                var y = 0;
                switch(i) {
                    case 0: y = 10; break;
                    case 1: y = 55; break;
                    case 2: y = 110; break;
                    case 3: y = 187; break;
                }
                return "translate ("+ y + "," + (-1*deathScale(d))+")";})
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
                var y = 0;
                switch(i) {
                    case 0: y = 0; break;
                    case 1: y = 45; break;
                    case 2: y = 97; break;
                    case 3: y = 175; break;
                }
                return "translate ("+ y + ",0)";})
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
            }
            $('#econButton').addClass( "active" );
            $('#deathButton').removeClass( "active" );
            click = "econ";

        }

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
            }
            $('#econButton').removeClass( "active" );
            $('#deathButton').addClass( "active" );
            click = "death";
        }

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
            .attr("transform", function(d, i) {
                return "translate(-90," + (i * 17 + 38.5) + ")"; });

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
            .attr("transform", function(d,i){
                return "translate(-90,"  + (i * 17 + 38.5) + ")"; });
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

        }

        function hideTooltip() {
            tooltip.style("display", "none");
            outline.classed("g-active", false);
        }

    }

    $.waypoints('refresh');
    Cufon.now();

    //Preloader
    $(window).load(function () {
        $("#loader").fadeOut();
        $("#mask").delay(1000).fadeOut("slow");
    });

});