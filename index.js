process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
var http = require('http');
var https = require('https');
var fs = require('fs');
var express = require('express');
var cors = require('cors');
var app = express();
app.use(cors({
    'origin' : '*',
    'Access-Control-Allow-Origin' : '*'
}));

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

var httpsServerOptions = {
    key : fs.readFileSync('./https/selfsigned.key'),
    cert : fs.readFileSync('./https/selfsigned.crt')
};

var serverHttps = https.createServer(httpsServerOptions, app);
var serverHttp = http.createServer(app);
var ioHttps = require('socket.io')(serverHttps);
var ioHttp = require('socket.io')(serverHttp);
var config = require('./config');

const { SerialPort, ReadlineParser } = require('serialport');
// var Readline  = require('@serialport/parser-readline');
//const { serialize } = require('v8');
const port = new SerialPort({path: '/dev/cu.usbserial-1420', baudRate: 9600 });

var parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }));
parser.on('data', console.log) // Terminal Serial no Console

app.engine('ejs', require('ejs').__express);

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.get('/', function (req,res) {
    res.render('index');
});

port.on('open', function() {
    console.log('serial port opened');
});

// Conexão Socket HTTP
ioHttp.on('connection', function(socket){
    console.log('socket.io connection');

    /* RECEBE DADOS DO ARDUINO
    */
    parser.on('data', function (data) {
        data = data.trim();
        socket.emit('data', data);
    });

    /*ENVIA DADOS PARA O ARDUINO
    */
    socket.on('a', function(data) {
        port.write(data + '\r\n');
    });

    socket.on('b', function(data) {
        port.write(data + '\r\n');
    });

    socket.on('c', function(data) {
        port.write(data + '\r\n');
    });

    socket.on('disconnect', function() {
        console.log('disconnected');
    });
});

// Conexão Socket HTTPS
ioHttps.on('connection', function(socket){
    console.log('socket.io connection');

    /* RECEBE DADOS DO ARDUINO */
    parser.on('data', function (data) {
        data = data.trim();
        socket.emit('data', data);
    });

    /*ENVIA DADOS PARA O ARDUINO
    */
    socket.on('a', function(data) {
        port.write(data + '\r\n');
    });

    socket.on('b', function(data) {
        port.write(data + '\r\n');
    });

    socket.on('c', function(data) {
        port.write(data + '\r\n');
    });

    socket.on('disconnect', function() {
        console.log('disconnected');
    });
});

serverHttp.listen(config.httpPort, function() {
    console.log('Listening Htpp on port '+config.httpPort+' in '+config.envName+' mode');
})

serverHttps.listen(config.httpsPort, function() {
    console.log('Listening Https on port '+config.httpsPort+' in '+config.envName+' mode');
});
