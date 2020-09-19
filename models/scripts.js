db.endusers.createIndex({idNumber: "text", name:"text", municipality: "text", street: "text", city:"text"},  {collation: {locale: "simple"} });

db.files.createIndex( { name: 1 });

db.endusers.createIndex( { idNUmber: 1 });