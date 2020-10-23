const config = {
    tokenExpiresIn: 10000,
    jwtSecretKey : "A1b2C334sdk9349Qfg",
    port: 4000,
    accessLogger: {
        translations: {
            methods : {
                "GET" : "Čitanje", 
                "POST": "Kreiranje", 
                "PUT": "Promjena", 
                "DELETE": "Brisanje"
            },
            pathSegments: {
                "end-users": "Korisnička mjesta", 
                "folders": "Mape", 
                "files": "Datoteke",
                "app-user-access-logs": "Logovi",
                "app-users": "Korisnici"
            }
        }
    },
}

module.exports = config;