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

const UPLOAD_PATH = './uploads'

// Multer Settings for file upload
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, UPLOAD_PATH)
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now())
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
        message: 'MEVN Stack!'
    });
});

app.post('/login', authenticate.logIn);
app.all('*', authenticate.authenticateToken);
app.all('*', authorize.auathorizeUser);

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

app.get('/folders/:id', (req, res) => {
    if (isValidId(req.params.id)) {
        fileService.getOne(req.params.id, function (err, docs) {
            if (!err) {
                res.json(docs);
            } else {
                console.log(err);
                next(err);
            }
        });
        return;
    }
    fileService.getOneByName(req.params.id, function (err, docs) {
        if (!err) {
            res.json(docs);
        } else {
            console.log(err);
            next(err);
        }
    });
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

app.get('/end-users/:id', (req, res) => {
    endUserService.getOne(req.params.id, function (err, doc) {
        if (!err) {
            res.json(doc);
        } else {
            console.log(err);
            next(err);
        }
    });
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

app.put('/end-users/:id', (req, res) => {
    endUserService.update(req.params.id, req.body, function (err, docs) {
        if (!err) {
            res.json(docs);
        } else {
            console.log(err);
            res.send(500);
        }
    })
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

app.get('/app-user-access-logs', async (req, res) => {
    try {
        let docs = await appUserAccessLogService.getAll(req.query);
        res.json(docs);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
        /*
        console.log(err);
        next(err); */
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

app.get('/app-users/:id', (req, res) => {
    appUserService.getOne(req.params.id, function (err, doc) {
        if (!err) {
            res.json(doc);
        } else {
            console.log(err);
            res.send(500);;
        }
    });
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


const port = 4000;
app.listen(port, () => {
    console.log(`isidor2 server listening on ${port}`);
});