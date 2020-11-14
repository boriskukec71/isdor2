
db.files.createIndex( { name: 1 });

db.files.createIndex( { parentFolder: 1 });

db.endusers.createIndex( { idNumber: 1 });

db.runCommand({applyOps: [{ "ts" : Timestamp(1505396756, 1), "t" : NumberLong(1), "h" : NumberLong("3117262685112057819"), "v" : 2, "op" : "i", "ns" : "termoplinArhiva.system.indexes", "o" : { "v" : 2, "key" : { "_fts" : "text", "_ftsx" : 1 }, "name" : "EndUsersIndex", "ns" : "termoplinArhiva.endusers", "weights" : { "idNumber" : 1,  "name" : 1, "municipality" : 1, "city" : 1, "street" : 1 }, "default_language" : "english", "language_override" : "language", "textIndexVersion" : 3 } }]})

db.appusers.createIndex( { username: 1 });