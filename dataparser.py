import json
from collections import defaultdict
from geopy.geocoders import Nominatim

# This margin of error is used during longitude and latitude calculations.
margin_of_error = 0.1
file_path = "sample.json"

output_dict = {}
location_data_list = []
location_seen = False

with open(file_path) as json_file:
    for line in json_file:
        location_seen = False
        try:
            json_object = json.loads(line)
        except:
            continue

        # Part 1: Calculate longitude and latitude.
        geolocator = Nominatim()
        try:
            location = json_object["location"]
        except KeyError, e:
            location = None

        if location:
            # Try to get location.
            geopylocation = geolocator.geocode(location)
            if not geopylocation:
                # If unable, it is probably an area - extract the city name instead.
                substrings = location.split()
                if substrings[len(substrings) - 1] == "Area":
                    location = substrings[len(substrings) - 2]
                    geopylocation = geolocator.geocode(location)

            if geopylocation:
                latitude = geopylocation.latitude
                longitude = geopylocation.longitude
        
        if not latitude or not longitude:
            continue

        # Part 2: Extract major and graduation year data.
        try:
            education = json_object["education"]
            for school in education:
                if school["name"] == "University of Illinois at Urbana-Champaign":
                    major = school["major"]
                    break
        except KeyError, e:
            major = None
        
        try:
            education = json_object["education"]
            for school in education:
                if school["name"] == "University of Illinois at Urbana-Champaign":
                    grad_year = school["end_date"]
                    break
        except KeyError, e:
            grad_year = None

        # Part 3: See if the location already exists in the data.
        for existing_location in location_data_list:
            selected_lat = existing_location["latitude"]
            selected_long = existing_location["longitude"]
            lower_lat = selected_lat - margin_of_error
            upper_lat = selected_lat + margin_of_error
            lower_long = selected_long - margin_of_error
            upper_long = selected_long + margin_of_error

            # Part 3A: It already exists. Increment the values for major and graduation dates.
            if lower_lat <= latitude <= upper_lat and lower_long <= longitude <= upper_long:
                location_seen = True
                existing_location["total"] += 1

                if major and grad_year:
                    existing_location[major] += 1
                    existing_location[str(grad_year)] += 1
                    existing_location[major + str(grad_year)] += 1
                elif major:
                    existing_location[major] += 1
                    existing_location["unknown_grad_year"] += 1
                elif grad_year:
                    existing_location[str(grad_year)] += 1
                    existing_location["unknown_major"] += 1
                else:
                    existing_location["unknown_major"] += 1
                    existing_location["unknown_grad_year"] += 1

                break

        # Part 3B: It doesn't exist. Create a new dictionary and add the values for major and graduation dates.
        if not location_seen:
            newdict = defaultdict(int)
            newdict["location_name"] = str(location)
            newdict["latitude"] = latitude
            newdict["longitude"] = longitude
            newdict["total"] = 1

            if major and grad_year:
                newdict[major] = 1
                newdict[str(grad_year)] = 1
                newdict[major + str(grad_year)] = 1
            elif major:
                newdict[major] = 1
                newdict["unknown_grad_year"] = 1
            elif grad_year:
                newdict[str(grad_year)] = 1
                newdict["unknown_major"] = 1
            else:
                newdict["unknown_major"] = 1
                newdict["unknown_grad_year"] = 1

            location_data_list.append(newdict) 
    
output_dict["destinations"] = location_data_list

with open('outputtogary.json', 'w') as outfile:
    json.dump(output_dict, outfile)

