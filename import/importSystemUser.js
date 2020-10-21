require('../connection/connection')
const appUserService = require('../services/appUserService');
const { exit } = require("process");
const AppUsers = require('../models/appUserModel');

appUserService.getOne('system', function(err, data) {
    if (err) {
        console.log(err);
        exit(0);
    }
    if (data != null) {
        console.log('Deleting exiting system app user...');
        AppUsers.deleteOne({username: 'system'}, function (err) {
            if (err) {
                console.log(err);
                exit(0);
            }
            console.log('Creating fresh system app user...');
            appUserService.create({username: "system", password: "system2020", role: "admin"}, function (err) {
                if (err) {
                    console.log(err);
                    exit(0);
                }
                exit(0);
            })
        })
        return;
    }
    console.log('Creating new system app user...');
    appUserService.create({username: "system", password: "system2020", role: "admin"}, function (err) {
        if (err) {
            console.log(err);
            exit(0);
        }
        exit(0);
    })
    exit(0);
})

