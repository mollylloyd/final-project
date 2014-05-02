var activeSlide = "4", subSlide = "", fullSlide = "4", updateSurveyVis, surveyQuestion, numSurveySlides = 4, numEarthquakeSlides = 3, numNuclearSlides = 2, numTsunamiSlides = 2, fullScreen = false, yCoord, slideQuestion;
var slides = Array("4", "4-2", "4-3", "4-4");

// This code was originally built for the full website and contains some of those non-survey visualization elements

$(document).ready(function(){

    $(window).resize(function () {
        location.reload();
    });

    var setSlide = function (goSlide) {
        if (goSlide != 5) {
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
        }
    };

    $(".slide1Nav, .slide2Nav, .slide3Nav, .slide4Nav, .slide4Nav, .slide5Nav").click(function() {
        var slide = $(this).attr('rel');
        setSlide(slide);
    });

    var scrollingNav = function() {
        $('.scrolling.up, .scrolling.down').remove();
        switch(fullSlide)
        {
            case "4":
            case "4-1":
                $('.slide'+activeSlide).append("<div class='scrolling down'><div class='icon-down-open'></div></div>");
                break;
            case "4-2":
            case "4-3":
                $('.slide'+activeSlide).append("<div class='scrolling up'><div class='icon-up-open'></div></div><div class='scrolling down'><div class='icon-down-open'></div></div>");
                break;
            case "4-4":
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

    $('.slide1-1, .slide1-2, .slide1-3, .slide-1, .slide2-1, .slide2-2, .slide4, .slide4-1, .slide4-2, .slide4-3, .slide4-4, .slide5').css('height', $.waypoints('viewportHeight') + "px");
    $('#earthquakeVis, #radiationVis').css('height', ($.waypoints('viewportHeight')-100) + "px");
    $('#survey').css('height', ($.waypoints('viewportHeight')*numSurveySlides)+"px");

    /*
     *
     * =Survey
     -------------------------------------------------------------- */

    d3.json("../data/surveyData.json", function (error, json) {

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

    $.waypoints('refresh');
    scrollingNav();
    easeScroll('slide4');
    Cufon.now();

});