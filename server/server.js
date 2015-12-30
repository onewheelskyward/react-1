var fs = require('fs');
//var path = require('path');
var express = require('express');
var busboy = require('connect-busboy');
//var exec = require('child_process').exec;
var app = express();
var pg = require('pg');
var bodyParser = require('body-parser')

var conString = "postgres://akreps@localhost/automatic-pancake";

app.set('port', 3456);
app.use(busboy());

//app.use('/', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:7999');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    next();
});

var db = new pg.Client(conString);
db.connect(function(err) {
    if(err) {
        return console.error('could not connect to postgres', err);
    }
    // Interesting way to check for success.
    db.query('SELECT NOW() AS "theTime"', function(err, result) {
        if(err) {
            return console.error('error running query', err);
        }
        console.log('Fun with postgres: ' + result.rows[0].theTime);
        //output: Tue Jan 15 2013 19:12:47 GMT-600 (CST)
        // what the what
        //db.end();
    });
});

var handleError = function(err) {
    // no error occurred, continue with the request
    if(!err) return false;

    // An error occurred, remove the client from the connection pool.
    // A truthy value passed to done will remove the connection from the pool
    // instead of simply returning it to be reused.
    // In this case, if we have successfully received a client (truthy)
    // then it will be removed from the pool.
    if(client){
        done(client);
    }
    res.writeHead(500, {'content-type': 'text/plain'});
    res.end('An error occurred');
    return true;
};

var play = function(word) {
    //command = "/usr/local/bin/mpg123 /Users/akreps/Dropbox/src/automatic-pancake/server/files/" + word;
    //console.log("Execing " + command);
    //
    //exec(command, function (error, stdout, stderr) {
    //    if (error !== null) {
    //        console.log('exec error: ' + error);
    //    }
    //});
}

app.get('/', function (req, res) {
    res.send('Hello World!');
});

app.get('/files', function (req, res) {
    db.query('SELECT * FROM files', [], function(err, result) {
        if(handleError(err)) return;
        res.send(result.rows);
    });
});

app.post('/play', function(req, res) {
    console.log(req.body.filename);
    play(req.body.filename);
    res.send();
});

app.post('/upload', function (req, res) {
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', function (fieldname, file) {
        console.log("Uploading: " + fieldname);
        fstream = fs.createWriteStream(__dirname + '/files/' + fieldname);
        file.pipe(fstream);
        db.query('INSERT INTO files (filename, created) VALUES ($1, $2)', [fieldname, new Date()], function(err, result) {
            if(handleError(err)) return;
        });
    });
});

app.listen(app.get('port'), function() {
    console.log('Server started: http://localhost:' + app.get('port') + '/');
});
