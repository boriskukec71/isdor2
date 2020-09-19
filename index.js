const correlator = require('express-correlation-id');
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileService = require('./services/fileService');
const endUserService = require('./services/endUserService'); // TODO 
const ObjectId = require('mongoose').Types.ObjectId;
const logger = require('./log4js-config').getLogger();

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
app.use(correlator({ header: "x-isidor-correlation" }));

function formatPage(rows) {

}

function isValidId(id) {
    return ObjectId.isValid(id);
}

app.get('/', (req, res) => {
    res.json({
        message: 'MEVN Stack!'
    });
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
    console.log(req.params);
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
    logger.debug("POST /end-users:", req.body);
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
    logger.debug(req.correlationId() + " PUT /end-users:", req.body);
    endUserService.update(req.params.id, req.body, function (err, docs) {
        if (!err) {
            res.json(docs);
        } else {
            console.log(err);
            res.send(500);
        }
    })
});

app.get('/files/:id', async (req, res) => {
    try {
        var query = req.query;
        console.log(req.params);
        query.parentFolder = ObjectId(req.params.id);
        let docs = await fileService.getAll(query, false);
        res.json(docs);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    };
});

app.get('/files/:id/:what', async (req, res) => {
    fileService.getBinary(req.params.id, req.params.what, res);
});

app.post('/end-users/:id/folder', async (req, res) => {
    try {
        let folder = await endUserService.createEndUserFolder(req.params.id);
        res.send(folder);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

app.post('/folders/:id', upload.single('image'), async (req, res) => {
    try {
        await fileService.saveFile(req.params.id, req.file, req.body);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    };
});


const port = 4000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});