# This is a data dump of opensensemap.org.

Please make sure, you've made yourself familiar with the LICENSE. (Public Domain Dedication and License 1.0)

The data is organized by date with each sensor station registered on opensensemap.org having a folder below the data folder. Each sensor station folder contains a <boxid>-<boxname>-<date>.json file with metadata and <sensor_id>.csv files for each sensor of the sensor station.

Example:

```
/data
  /2017-01-05
    /571e05e051171e3c17786fe7-SenseBox_Home_ifgi
      571e05e051171e3c17786fe7-SenseBox_Home_ifgi-2017-01-05.json
      571e05e051171e3c17786fec.csv
      571e05e051171e3c17786fed.csv
      575fe40f72ee762c186f2b2a.csv
```

Each csv file contains two columns: createdAt, value.
All timestamps are in UTC.
The json file contains metadata of the sensor station such as location, name, exposure etc.
It also contains information about the sensors.

Example:

```json
{
  "name": "SenseBox:Home@ifgi",
  "id": "571e05e051171e3c17786fe7",
  "boxType": "fixed",
  "exposure": "outdoor",
  "model": null,
  "loc": {
    "geometry": {
      "coordinates": [
        7.595694065093995,
        51.96915799162825
      ],
      "type": "Point"
    }
  },
  "sensors": [
    {
      "title": "rel. Luftfeuchte",
      "unit": "%",
      "sensorType": "HDC1008",
      "id": "571e05e051171e3c17786fec"
    },
    {
      "title": "Temperatur",
      "unit": "°C",
      "sensorType": "HDC1008",
      "id": "571e05e051171e3c17786fed"
    },
    {
      "title": "Wifi-Stärke",
      "unit": "dBm",
      "sensorType": "WiFi",
      "id": "575fe40f72ee762c186f2b2a"
    }
  ]
}
```

The data you find here is dumped directly from the database using this script:\
<https://github.com/sensebox/osem-archiver>

The data is hosted on sciebo.de and is also accessible through\
<https://uni-muenster.sciebo.de/index.php/s/HyTbguBP4EkqBcp>

You can access the archive also through webdav.\
<https://uni-muenster.sciebo.de/public.php/webdav/>\
Username: HyTbguBP4EkqBcp\
Leave password blank
