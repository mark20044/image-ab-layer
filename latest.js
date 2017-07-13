module.exports = function(callback) {
  var mongo = require("mongodb").MongoClient;
  var dbUrl = process.env.MongoDB_URL;
  
  mongo.connect(dbUrl, function (err, db) {
        if (err) callback('Unable to connect to the mongoDB server. Error:' + err, null);
        else {
          var collection = db.collection('searches');

          collection.find({}, {_id:0} ).sort({$natural:-1}).limit(10).toArray((e,d) => {
            console.log("docs: " + d);
            if (e) callback(e, null);
            callback(null, JSON.stringify(d));
          });

          db.close();
        }
        
      });
  
}