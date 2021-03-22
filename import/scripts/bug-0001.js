var MongoClient = require('mongodb').MongoClient,
    ObjectID = require('mongodb').ObjectID; 
var url = "mongodb://localhost:27017?writeConcern=majority&useUnifiedTopology=true";

const parentsCursor = (db) => {
  return db.collection('files').aggregate(
    [
      {
        '$match': {
          'fileType': 'file'
        }
      }, {
        '$group': {
          '_id': '$parentFolder',
          'count': {
            '$sum': 1
          },
          'maxOrdinal': {
            '$max': '$ordinalNumber'
          }
        }
      }, {
        '$addFields': {
          'islt': {
            '$cond': [
              {
                '$lt': [
                  '$maxOrdinal', '$count'
                ]
              }, true, false
            ]
          }
        }
      }, {
        '$match': {
          'islt': true
        }
      }, {
        '$lookup': {
          'from': 'files',
          'localField': '_id',
          'foreignField': '_id',
          'as': 'parentFolder'
        }
      }, {
        '$addFields': {
          'name': {
            '$arrayElemAt': [
              '$parentFolder.name', 0
            ]
          }
        }
      }
    ]
  );
}

/* This function returns an ObjectId embedded with a given datetime */
/* Accepts both Date object and string input */

function objectIdWithTimestamp(timestamp) {
  /* Convert string date to Date object (otherwise assume timestamp is a date) */
  if (typeof(timestamp) == 'string') {
      timestamp = new Date(timestamp);
  }

  /* Convert date object to hex seconds since Unix epoch */
  var hexSeconds = Math.floor(timestamp/1000).toString(16);

  /* Create an ObjectId with that hex timestamp */
  var constructedObjectId = ObjectID(hexSeconds + "0000000000000000");

  return constructedObjectId
}

const logOne = async (db, doc) => {
  console.log(`START ----<${doc.name}>----`);
  const inError = await db.collection('files').find({parentFolder: doc._id, _id: {$gt: objectIdWithTimestamp('2020-12-01')}});
  console.log(`Parent: ${doc.name}`)
  while (await inError.hasNext()) {
    const next = await inError.next();
    const newOrdinal = next.ordinalNumber + doc.maxOrdinal;
    console.log(`file: ${next.name} old: ${next.ordinalNumber} new: ${newOrdinal}`);
  }
  console.log(`END   ----<${doc.name}>----`);
}

const fixOne = async (db, doc) => {
  console.log(`START ----<${doc.name}>----`);
  const inError = await db.collection('files').find({parentFolder: doc._id, _id: {$gt: objectIdWithTimestamp('2020-12-01')}});
  console.log(`Parent: ${doc.name}`)
  while (await inError.hasNext()) {
    const next = await inError.next();
    const newOrdinal = next.ordinalNumber + doc.maxOrdinal;
    console.log(`file: ${next.name} old: ${next.ordinalNumber} new: ${newOrdinal}`);
    await db.collection('files').findOneAndUpdate({_id:next._id}, {$set:{ordinalNumber: newOrdinal }}, {upsert:false});
  }
  console.log(`END   ----<${doc.name}>----`);
}

const logAll = async () => {
  const client = await MongoClient.connect(url);
  const cursor = await parentsCursor(client.db("termoplinArhiva"));
  while (await cursor.hasNext()) {
    const next = await cursor.next();
    await logOne(client.db("termoplinArhiva"), next)
  }
  client.close();
}

const fixAll = async () => {
  const client = await MongoClient.connect(url);
  const cursor = await parentsCursor(client.db("termoplinArhiva"));
  while (await cursor.hasNext()) {
    const next = await cursor.next();
    await fixOne(client.db("termoplinArhiva"), next)
  }
  client.close();
}

logAll();