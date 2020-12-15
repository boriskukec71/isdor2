const correlator = require('express-correlation-id');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileService = require('./services/fileService');
const endUserService = require('./services/endUserService'); // TODO 
const appUserService = require('./services/appUserService'); 
const appUserAccessLogService = require('./services/appUserAccessLogService'); 
const ObjectId = require('mongoose').Types.ObjectId;
const authenticate = require('./services/authenticateService')
const authorize = require('./services/authorizationService')
const log4js = require('./log4js-config');
const logger = log4js.getLogger('index');
const config = require('./isidorConfig');
const importService = require('./services/importService'); 

const UPLOAD_PATH = './uploads'

// Multer Settings for file upload
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_PATH)
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + '-' + file.originalname);
    }
})
const upload = multer({ storage: storage })
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(log4js.connectLogger(logger, {
    level: 'info', format: (req, res, format) => format(`${req.correlationId()}|${(req.user) ? req.user.username : ''}|${(req.user) ? req.user.role : ''}|:remote-addr|:method|:url|${JSON.stringify(req.body)}|:status`)
}));


app.use(correlator({ header: "x-isidor-correlation" }));

function isValidId(id) {
    return ObjectId.isValid(id);
}

// REST paths //
app.get('/', (req, res) => {
    res.json({
        message: 'isidor2 MEVN Stack!'
    });
});

app.post('/login', authenticate.logIn);
app.all('*', authenticate.authenticateToken);
app.all('*', authorize.auathorizeUser);

app.get('/imports/locations', (req, res) => {
    importService.getAllImportLocations(function (err, folders) {
        if (!err) {
            res.json(folders);
        } else {
            res.sendStatus(500);
        }
    });
});

app.get('/imports', async (req, res) => {
    try {
        var query = req.query;
        let docs = await importService.getAll(query);
        res.json(docs);
    } catch (err) {
        res.sendStatus(500);
    };
});

app.post('/imports', async (req, res) => {
    try {
        var importLocation = req.body.importLocation;
        const token = req.headers['authorization']
        importService.start(importLocation, token, req.user.username);
        res.sendStatus(200);
    } catch (err) {
        res.sendStatus(500);
    };
});

app.get('/folders', (req, res) => {
    fileService.getAllFolders({}, function (err, docs) {
        if (!err) {
            res.json(docs);
        } else {
            console.log(err);
            next(err);
        }
    });
});

app.get('/folders/:id', async (req, res) => {
    try {
        if (isValidId(req.params.id)) {
            let doc = await fileService.getOne(req.params.id);
            res.json(doc);
            return;
        }
        let doc = await fileService.getOneByName(req.params.id); 
        res.json(doc);
    }catch (err) {
        console.log(err);
        next(err);
    }
});

app.post('/folders', (req, res) => {
    fileService.createFolder(req.body, function (err, docs) {
        if (!err) {
            res.json(docs);
        } else {
            console.log(err);
            res.send(500);
        }
    })
});

// End user
app.get('/end-users', async (req, res) => {
    try {
        let docs = await endUserService.getAll(req.query);
        res.json(docs);
    } catch (err) {
        console.log(err);
        next(err);
    };
});

app.get('/end-users/:id', async (req, res) => {
    try {
        let doc = await endUserService.getOne(req.params.id);
        res.json(doc);
    }  catch (err) {
        console.log(err);
        res.send(500);
    };
});

app.post('/end-users', (req, res) => {
    endUserService.create(req.body, function (err, docs) {
        if (!err) {
            res.json(docs);
        } else {
            console.log(err);
            next(err);
        }
    })
});

app.put('/end-users/:id', async (req, res) => {
    try {
        let doc = await endUserService.update(req.params.id, req.body);
        res.json(doc);
    }  catch (err) {
        console.log(err);
        res.send(500);
    };
});

app.get('/folders/:id/files', async (req, res) => {
    try {
        var query = req.query;
        ///query.parentFolder = ObjectId(req.params.id);
        let docs = await fileService.getAllFilesByFolder(req.params.id, query, false);
        res.json(docs);
    } catch (err) {
        res.sendStatus(500);
    };
});

app.get('/files/:id/:what', async (req, res) => {
    fileService.getBinary(req.params.id, req.params.what, res);
});

app.put('/files/:id', (req, res) => {
    fileService.updateFileData(req.params.id, req.body, function (err, docs) {
        if (!err) {
            res.json(docs);
        } else {
            res.send(500);
        }
    })
})

app.post('/end-users/:id/folder', async (req, res) => {
    try {
        let folder = await endUserService.createEndUserFolder(req.params.id);
        res.send(folder);
    } catch (err) {
        res.sendStatus(500);
    }
});

app.post('/folders/:id', upload.single('image'), async (req, res) => {
    try {
        await fileService.saveFile(req.params.id, req.file, req.body);
        res.sendStatus(200);
    } catch (err) {
        res.sendStatus(500);
    };
});

app.post('/folders/:id/multiple', upload.fields([
    {name : 'image', maxCount: 10}]), async (req, res) => {
    try {
        await fileService.saveFiles(req.params.id, req.files.image, req.body);
        res.sendStatus(200);
    } catch (err) {
        logger.error(err);
        res.sendStatus(500);
    };
});

app.delete('/files/:id', async (req, res) => {
    try {
        await fileService.deleteFile(req.params.id);
        res.sendStatus(200);
    } catch (err) {
        logger.error(err);
        res.sendStatus(500);
    }
})

app.delete('/files', async (req, res) => {
    try {
        await fileService.deleteFiles(req.query.id, undefined);
        res.sendStatus(200);
    } catch (err) {
        logger.error(err);
        res.sendStatus(500);
    }
})

app.delete('/folders/:id/files', async (req, res) => {
    try {
        await fileService.deleteFiles(undefined, req.params.id);
        res.sendStatus(200);
    } catch (err) {
        logger.error(err);
        res.sendStatus(500);
    }
})

// app user acrss logs
app.get('/app-user-access-logs', async (req, res) => {
    try {
        let docs = await appUserAccessLogService.getAll(req.query);
        res.json(docs);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    };
});

// App user
app.get('/app-users', async (req, res) => {
    try {
        let docs = await appUserService.getAll(req.query);
        res.json(docs);
    } catch (err) {
        console.log(err);
        next(err);
    };
});

app.get('/app-users/:id', async (req, res) => {
    try {
        let doc = await appUserService.getOne(req.params.id);
        res.json(doc);
    }  catch (err) {
        console.log(err);
        res.send(500);
    };
});

app.post('/app-users', (req, res) => {
    appUserService.create(req.body, function (err, docs) {
        if (!err) {
            res.json(docs);
        } else {
            console.log(err);
            res.send(500);
        }
    })
});

app.put('/app-users/:id', (req, res) => {
    delete req.body.password2;
    appUserService.update(req.params.id, req.body, function (err, docs) {
        if (!err) {
            res.json(docs);
        } else {
            console.log(err);
            res.send(500);
        }
    })
});

var server;

var http = require('http');
if (!config.https) {
    server = http.createServer(app);
    server.listen(config.port, () => {
        console.log(`isidor2 http server listening on ${config.port}`);
    }); 
} else {
    var fs = require('fs');
    var https = require('https');
    var privateKey  = fs.readFileSync('sslcrt/isidor2-selfsigned.key', 'utf8');
    var certificate = fs.readFileSync('sslcrt/isidor2-selfsigned.crt', 'utf8');
    var credentials = {key: privateKey, cert: certificate};

    server = https.createServer(credentials, app);
    server.listen(config.port, () => {
        console.log(`isidor2 https server listening on ${config.port}`);
    }); 
}

var terminate = require('./connection/terminate');
const exitHandler = terminate(server, {
    coredump: false,
    timeout: 1000
  })

  process.on('uncaughtException', exitHandler(1, 'Unexpected Error'))
  process.on('unhandledRejection', exitHandler(1, 'Unhandled Promise'))
  process.on('SIGTERM', exitHandler(0, 'SIGTERM'))
  process.on('SIGINT', exitHandler(0, 'SIGINT'))

