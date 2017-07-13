module.exports = function(query, offset, callback) {
  var https = require("https");
  var mongo = require("mongodb").MongoClient;
  var dbUrl = process.env.MongoDB_URL;
  var serverData = '';
  var results = [];
  if (offset == null) offset = 0;
  if (query == "") callback(null, {"error": "No query submitted"});
  
  var url = "https://www.googleapis.com/customsearch/v1?q=" + query 
    + "&cx=" + process.env.Engine_ID
    + "&num=10&start=" + Number(1 + parseInt(offset)*10)
    + "&fileType=bmp,png,gif,jpg,jpeg"
    + "&key=" + process.env.Google_API_key;
  console.log(url);
  
  const result = (item) => {
    var url = item.hasOwnProperty("pagemap") && item.pagemap.hasOwnProperty("cse_image") ? item.pagemap.cse_image[0].src : null;
    var snippet = item.hasOwnProperty("snippet") ? item.snippet : null;
    var thumbnail = item.hasOwnProperty("pagemap") && item.pagemap.hasOwnProperty("cse_thumbnail") ? item.pagemap.cse_thumbnail[0].src : null;
    var context = item.hasOwnProperty("link") ? item.link : null;
    
    return {"url": url, "snippet": snippet, "thumbnail": thumbnail, "context": context};
  }
  
  https.get(url, r => {
    r.on("data", d => {
      serverData += d;
    });
    
    r.on("end", () => {
      mongo.connect(dbUrl, function (err, db) {
        if (err) callback('Unable to connect to the mongoDB server. Error:' + err, null);
        else {
          var collection = db.collection('searches');

          // console.log("New search: " + query);
          collection.insert({search: query, time: new Date()}, (err, data) => {
              if (err) callback(err, null);
          });

          db.close();
        }
      });
      var items = JSON.parse(serverData).items;
      for (var i = 0; i < 10; i++) {
        results.push(result( items[i] ))
      }
      // console.log("Results: " + JSON.stringify(results))
      
      callback(null, JSON.stringify(results));
    });
    
    r.on("error", () => callback("GET Error", null));
  }).on("error", () => callback("HTTP Error", null));
  
}