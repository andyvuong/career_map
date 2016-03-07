# install pip: http://stackoverflow.com/questions/17271319/installing-pip-on-mac-os-x
# install requests : pip install requests

import requests
import json

#r = requests.get('https://github.com/')

# change parameters (limit this too 100 queries per every day ~ resets at midnight pacific time)
start = 2000
limit = 2100
filename = "data/data.json"


apiKey = ""
cxId = ""
query = "university of illinois at urbana-champaign "

for i in range(start, limit):
    apiQuery = query + str(i)
    r = requests.get(apiQuery)
    # parse the data
    data = json.loads(r.text)
    items = data["items"]
    for j in range(0, len(items)):
        with open("data.json", "a") as myfile:
            myfile.write(items[j]["link"])

