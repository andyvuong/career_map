$(document).ready(function() {
    
    function getMassData(data) {
        var dataMap = {};
        for (var i = 0; i < data.length; i++) {
            point = data[i];
            if (!(point.location in dataMap)) {
                dataMap[point.location] = [point];
            }
            else {
                arr = dataMap[point.location];
                arr.push(data[i]);
                dataMap[point.location] = arr
            }
        }
        return dataMap;
    }

    run();

    function run() {
        console.log("running");

        d3.json("./data/final_filtered_data_geo.json", function(error, data) {
            var og = { // UIUC coordinates
                latitude: 40.1105,
                longitude: -88.2284
            };

            var locBasedMap = getMassData(data);

            /****************************************
                Configure General Map Settings
            *****************************************/

            var map = new Datamap({
                scope: 'usa',
                element: document.getElementById('map'),
                fills: {
                    defaultFill: 'rgba(0,0,0,0.3)',
                    lt50: 'rgba(0,244,244,0.9)',
                    gt50: 'red',
                    pt: '#9FD6D2'
                },
                data: {
                    '071': {fillKey: 'lt50' },
                    '001': {fillKey: 'gt50' }       
                },
                bubblesConfig: {

                },
                done: function(datamap) {
           datamap.svg.call(d3.behavior.zoom().on("zoom", redraw));

           function redraw() {
                datamap.svg.selectAll("g").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
           }
        }
            });

            var inSync = {};
            var currentAtleast = 0;
            var currentYear1 = "1900";
            var currentYear2 = "2020";
            /****************************************
                Configure Bubbles
            *****************************************/
            // create the array of objects
            var dataArr = generateBubbles(locBasedMap, 0, currentYear1, currentYear2);

            map.bubbles(dataArr, {
                popupTemplate: function (geo, data) {
                    //console.log("highlight");
                    $("#info-ind").text(data.industries);
                    $("#info-maj").text(data.majors);
                    console.log(data.loc);
                    return '<div class="hoverinfo"><p class="color-black">Popular Major: ' + data.most_popular_major + '</p></div>';
                } 
            });

            function generateBubbles(locBasedMap, atleast, year1, year2) {
                var locationArrays = [];
                for (var k in locBasedMap) {
                    arr = locBasedMap[k];
                    if (arr.length > 0 && arr.length >= atleast) {
                        inSync[k] = arr; // current

                        var bubble = {}
                        bubble.loc = k;
                        bubble.longitude = arr[0].lon; // they should all have same
                        bubble.latitude = arr[0].lat;

                        var stats = getLocationStats(arr, year1, year2);                    
                        var maxKey = Object.keys(getTopMajor(arr)).reduce(function(a, b){ return getTopMajor(arr)[a] > getTopMajor(arr)[b] ? a : b });    
                        if (Object.keys(stats.count_map).length > 0) {
                            maxKey = Object.keys(stats.count_map).reduce(function(a, b){ return stats.count_map[a] > stats.count_map[b] ? a : b });    
                        }
                        bubble.most_popular_major = maxKey;
                        bubble.majors = stats.major_list.join();


                        bubble.radius = scaleRadius(stats.major_list.length); // radius of bubble
                        if (stats.major_list.length == 0) {
                            bubble.radius = 0;
                        }
                        bubble.industries = stats.industry_list.join();
                        bubble.fillKey = 'pt';
                        locationArrays.push(bubble);
                    }
                }

                return locationArrays;   
            }

            function scaleRadius(val) {
                var radiusRanges = [4,8,12,16,20,24,28,32];
                for (var i = 0; i < radiusRanges.length; i++) {
                    if (Math.abs(val - radiusRanges[i]) < 5) {
                        return radiusRanges[i];
                    }
                }
                return 32;
            }

                        /**
            *   Get the statistical information for this location
            */
            function getTopMajor(data) {
                var countMap = {};
                for (var j = 0; j < data.length; j++) {
                    if (!(data[j].major in countMap)) {
                        countMap[data[j].major] = 1;
                    }
                    else {
                        countMap[data[j].major] += 1;
                    }
                }
                return countMap;
            }

            /**
            *   Get the statistical information for this location
            */
            function getLocationStats(data, year1, year2) {
                var stat = {};
                // count majors ~ most popular
                var countMap = {};
                majorList = [];
                industryList = [];
                for (var j = 0; j < data.length; j++) {
                    if ((parseInt(data[j].graduation_year) >= parseInt(year1)) && (parseInt(data[j].graduation_year) <= parseInt(year2))) {
                        if (!(data[j].major in countMap)) {
                            countMap[data[j].major] = 1;
                        }
                        else {
                            countMap[data[j].major] += 1;
                        }
                        majorList.push(data[j].major);
                        industryList.push(data[j].industry);
                    }
                }
                
                stat.count_map = countMap;
                stat.major_list = majorList;
                stat.industry_list = industryList;
                return stat;
            }

            /****************************************
                Slider
            *****************************************/
            
            $( "#slider-range-max" ).slider({
                range: "max",
                min: 0,
                max: 22,
                step: 2,
                value: 0,
                slide: function( event, ui ) {
                    var pop = $( "#amount" ).val( ui.value );
                    newArr = generateBubbles(locBasedMap, ui.value, currentYear1, currentYear2);
                    currentAtleast = ui.value;
                    map.bubbles(newArr, {
                        popupTemplate: function (geo, data) {
                            //console.log("highlight");
                            $("#info-ind").text(data.industries);
                            $("#info-maj").text(data.majors);
                            return '<div class="hoverinfo"><p class="color-black">Popular Major: ' + data.most_popular_major + '</p></div>';
                        } 
                    });
                }
            });
            $( "#amount" ).val( $( "#slider-range-max" ).slider( "value" ) );


            $( "#slider-range" ).slider({
                range: true,
                min: 1980,
                max: 2017,
                values: [ 1980, 2015],
                step: 9,
                slide: function( event, ui ) {
                    $( "#year" ).val( ui.values[ 0 ] + " - " + ui.values[ 1 ] );
                    currentYear1 = ui.values[0];
                    currentYear2 = ui.values[1];

                    // insights
                    if (parseInt(currentYear1) >= 1989) {
                        $("#info-in").text("Notice that many industries change as the time period changes. Points of interest include the Vegas area and DC. We see that many majors started out differently from the industries they end up in given the region.");
                    }

                    if (parseInt(currentYear2) <= 1989) {
                        $("#info-in").text("Chemistry was a very popular major around this time period (1980 or 1990s). Many chemsitry majors ended up in Silicon Valley. Further research shows that the many manufacturing and semiconductor companies were present in the valley around that time.");
                    }
                    if (parseInt(currentYear2) == 2017) {
                        $("#info-in").text("Today, we see that the Chicago area remains one of the top locations where our graduates end up. Further research shows that almost 75% of students enrolled are in-state students (24k vs 9k undergrads in 2015). Computer and technology related majors are studied the most and most people studying those end up in Illinois or the Bay Area.");
                    }

                    newArr = generateBubbles(locBasedMap, parseInt(currentAtleast), currentYear1, currentYear2);
                    map.bubbles(newArr, {
                        popupTemplate: function (geo, data) {
                            //console.log("highlight");
                            $("#info-ind").text(data.industries);
                            $("#info-maj").text(data.majors);
                            return '<div class="hoverinfo"><p class="color-black">Popular Major: ' + data.most_popular_major + '</p></div>';
                        } 
                    });
                }

            });
            $( "#year" ).val($( "#slider-range" ).slider( "values", 0 ) +
                " - " + $( "#slider-range" ).slider( "values", 1 ) );

        });
    }

     //basic map config with custom fills, mercator projection

});

$("#info-in").text("Today, we see that the Chicago area remains one of the top locations where our graduates end up. Further research shows that almost 75% of students enrolled are in-state students (24k vs 9k undergrads in 2015). Computer and technology related majors are studied the most and most people studying those end up in Illinois or the Bay Area.");
