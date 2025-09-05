var http = require('http');
var dateTime = require('./Module');

 http.createServer(function (req, res) {
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(dateTime.myDateTime());
        res.end();
    }).listen(8080);