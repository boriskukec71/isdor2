Start MongoDb 3.4 as a service
sc.exe create MongoDB34 binPath="H:\isidor\system\mongoDB\server\3.4\bin\mongod.exe --service --config=H:\isidor\system\mongoDB\server\3.4\mongod.cfg" DisplayName="MongoDB34" start="auto"

Config for mongo 3.4
systemLog:
    destination: file
    path: H:\isidor\system\mongoDB\server\3.4\data\log\mongod.log
storage:
    dbPath: H:\isidor\system\mongoDB\server\3.4\data\db