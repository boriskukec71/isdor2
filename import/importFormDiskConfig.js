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
            importSkipped : "skipped"
        },
        hasLeadingPrefix : true,
        sortBy: 'filename',
        oridnalInPrefix: false,
        debugOnly: false
    }
};