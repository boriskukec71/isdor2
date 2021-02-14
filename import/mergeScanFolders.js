const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const log4js = require('log4js');
let delimiter = '\\';

log4js.configure({
    appenders: {
        all: { type: 'multiFile', base: 'logs/', property: 'level', extension: '.log', maxLogSize: 10485760, backups: 3, compress: true }
    },
    categories: {
        default: { appenders: ['all'], level: 'debug' }
    }
});
log4js.getLogger().level = 'info';
const logger = log4js.getLogger();

function isIdentifier(folder) {
    const regex = /^[1-9]\d+$/g;
    const found = folder.match(regex);
    if (found === null || found.length === 0) {
        return false;
    }
    if (found[0].length<=6) {
        return true;
    }
}

function processCandidates(candidates) {
    var archiveIdentifiers = [];
    if (candidates.length > 1) {
        for(var candidate of candidates) {
            candidate = candidate.trim();
            var isId = isIdentifier(candidate);
            if (isId) {
                archiveIdentifiers.push(candidate);
            } else {
                break;
            }
        }

        if (archiveIdentifiers.length > 0) {
            return archiveIdentifiers;
        }
    }
    return [];
}

function getArchiveIdentifiers(folder) {

    if (isIdentifier(folder)) {
        return [folder];
    }

    var candidates = folder.split(';');
    var archiveIdentifiers = processCandidates(candidates);
    if (archiveIdentifiers.length > 0) {
        return archiveIdentifiers;
    }
    candidates = folder.split(',');
    archiveIdentifiers = processCandidates(candidates);
    if (archiveIdentifiers.length > 0) {
        return archiveIdentifiers;
    }

    candidates = folder.split(' ');
    archiveIdentifiers = processCandidates(candidates);
    if (archiveIdentifiers.length > 0) {
        return archiveIdentifiers;
    }

    return archiveIdentifiers;
}

function getDestinatinFilename(destination, index) {
    var exists = fs.existsSync(destination);
    if (!exists) {
        return destination;
    }
    var fileSegments = path.basename(destination).split('.');
    if (fileSegments.length !== 2) {
        return;
    }
    var newPath = path.dirname(destination) + delimiter + fileSegments[0] + '_' + index + '.' + fileSegments[1];
    return getDestinatinFilename(newPath, 'I')
}

function mergeFile(file, to) {
    var fileSegments = path.basename(file).split('.');
    if (fileSegments.length !== 2) {
        logger.error(file);
        return;
    }
    var archiveIdentifiers = getArchiveIdentifiers(fileSegments[0]);

    if (archiveIdentifiers.length === 1) {
        logger.info(file);
        fs.mkdirSync(to + delimiter + archiveIdentifiers[0], { recursive: true });
        const destination = getDestinatinFilename(to + delimiter + archiveIdentifiers[0] + delimiter + path.basename(file), 'I');
        console.log(destination);
        fs.copyFileSync(file , destination);
        return;
    }
    logger.error(file);
}

function mergeFolder(folder, to) {
    var archiveIdentifiers = getArchiveIdentifiers(path.basename(folder));

    var content = fs.readdirSync(folder);
    
    var subFolders = content.filter(file => {
        var stat = fs.statSync(folder + delimiter + file);
        return stat.isDirectory();
    })

    var files = content.filter(file => {
        var stat = fs.statSync(folder + delimiter + file);
        return !stat.isDirectory();
    });

    if (files.length !== 0 && subFolders.length !== 0 && archiveIdentifiers.length === 0) {
        // TODO idi dalje po folderima 
        for(const subFolder of subFolders) {
            mergeFolder(folder + delimiter + subFolder, to);
        }
        for(const file of files) {
            mergeFile(folder + delimiter + file, to);
        }
        return;
    }
    if (files.length === 0 && subFolders.length !== 0 && archiveIdentifiers.length === 0) {
        // TODO idi dalje po folderima 
        for(const subFolder of subFolders) {
            mergeFolder(folder + delimiter + subFolder, to);
        }
        return;
    }
    if (files.length !== 0 && subFolders.length === 0 && archiveIdentifiers.length !== 0) {
        logger.info(folder);
        for (const archiveIdentifier of archiveIdentifiers) {
            fs.mkdirSync(to + delimiter + archiveIdentifier, { recursive: true });
            for (const file of files) {
                const destination = getDestinatinFilename(to + delimiter + archiveIdentifier + delimiter + file, 'I');
                console.log(destination);
                fs.copyFileSync(folder + delimiter + file , destination);
            }
        }
        return;
    }
    if (files.length !== 0 && subFolders.length === 0 && archiveIdentifiers.length === 0) {
        for(const file of files) {
            mergeFile(folder + delimiter + file, to);
        }
        return;
    }
    logger.error(folder);
}

(async () => {

    console.log(`Merge folders from ${process.argv[2]} to ${process.argv[3]}`);
    var from = process.argv[2];
    var to = process.argv[3];
    if (process.argv[4] && process.argv[4] === 'linux') {
        delimiter = '/';
    }

    logger.info(`********** Merging files from: ${from} **********`);
    logger.error(`********** Merging files from: ${from} **********`);

    mergeFolder(from, to);

    logger.info(`********** Finished merging files from: ${from} **********`);
    logger.error(`********** Finished merging files from: ${from} **********`);
})();

