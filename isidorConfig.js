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
    pngerExecutable: "java -jar -Dlog4j.configurationFile=/home/boris/git2/pnger/src/main/resources/log4j2.xml /home/boris/git2/pnger/target/pnger-1.0.0.jar"
}

module.exports = config;