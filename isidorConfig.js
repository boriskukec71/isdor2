const config = {
    tokenExpiresIn: 10000,
    jwtSecretKey : 'A1b2C334sdk9349Qfg',
    port: 4000,
    accessLogger: {
        methods : [{'GET' : 'Čitanje'}, {'POST': 'Kriranje'}, {'PUT': 'Promjena'}, {'DELETE': 'Brisanje'}],
        paths: [{'/end-users': 'Korisnička mjesta'}]
    }

}

module.exports = config;