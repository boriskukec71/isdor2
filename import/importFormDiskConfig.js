const { sortBy } = require("../services/pageService");

module.exports = {
    host : "localhost",
    port : 4000,
    protocol: "http",
    import : {
        skipUnexistingFolders : false,
        validateFolderNameAsNumber : true,
        importFolder: "/home/boris/dev/Termoplin/importFolder",
        subFolders: {
            readyForImport: "readyForImport",
            importDone : "importDone",
            importError: "error",
            importSkipped : "skipped",
            temp: "temp"
        },
        sortBy: "filename",
        ordinalInPrefix: false,
        debugOnly: false,
        pngerExecutable: "java -jar -Dlog4j.configurationFile=/home/boris/git2/pnger/src/main/resources/log4j2.xml /home/boris/git2/pnger/target/pnger-1.0-SNAPSHOT.jar"
    }
};