//dependencies
var express = require('express')
  , mongoStore = require('connect-mongo')(express)
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , mongoose = require('mongoose')
  , socketIo = require('socket.io')
  , passportSocketIo = require("passport.socketio")
  , Eventbrite = require('eventbrite');

//create express app
var app = express();

//mongo uri
app.set('mongodb-uri', process.env.MONGOLAB_URI || 'localhost/starter');

//setup mongoose
app.db = mongoose.createConnection(app.get('mongodb-uri'));
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function () {
  console.log('mongoose open for business');
});

//config data models
require('./models')(app, mongoose);

//config passport
require('./passport')(app, passport);

//config all
app.configure(function(){
  //settings
  app.disable('x-powered-by');
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('strict routing', true);
  app.set('project-name', "nerdclustr");
  app.set('company-name', 'jessecravens.com');
  app.set('admin-email', 'webdev.jdcravens@gmail.com');
  app.set('email-from-name', app.get('project-name')+ ' Website');
  app.set('email-from-address', 'webdev.jdcravens@gmail.com');

  mySessionStore = new mongoStore({ url: app.get('mongodb-uri') });
  mySecret = 'Sup3rS3cr3tK3y';

  //middleware
  app.use(express.favicon(__dirname + '/public/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ 
    secret: mySecret,
    store: mySessionStore
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  
  //locals
  app.locals.projectName = app.get('project-name');
  app.locals.copyrightYear = new Date().getFullYear();
  app.locals.copyrightName = app.get('company-name');
});

//config dev
app.configure('development', function(){
  app.use(express.errorHandler());
});

//route requests
require('./routes')(app);

//utilities
require('./utilities')(app);

//listen up

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

var io = require('socket.io').listen(server);

io.set('loglevel',10) // set log level to get all debug messages

io.set("authorization", passportSocketIo.authorize({
  key: 'connect.sid', //the cookie where express (or connect) stores its session id.
  secret: mySecret, //the session secret to parse the cookie
  store:   mySessionStore, //the session store that express uses
  fail: function(data, accept) { // *optional* callbacks on success or fail
    console.log('fail');
    accept(null, false); // second param takes boolean on whether or not to allow handshake
  },
  success: function(data, accept) {
    console.log('success');
    accept(null, true);
  }
}));

// Clients is a list of users who have connected
var clients = [];
var count = 0;
///////////////////////////////////////////////////////////////////// SEND() UTILITY
function send(message) {   
  clients.forEach(function(client) {
      client.send(message);
  });
}

io.on('connection',function(socket){

  count++;
  clients.push(socket);

  io.sockets.emit('count', {
      number: count
  });

  // var nerdtype = .....
  // switch(nerdtype){
  //   case developer:
  //     console.log('emit developer count');
  //     io.sockets.emit('count', {
  //       number: count
  //     });
  //   break;
  //   case designer:
  //     console.log('emit designer count');
  //   break;
  //   case manager:
  //     console.log('emit manager count');
  //   break;
  //   default:
  //     console.log('user is of no nerdtype');
  // };

  socket.on('send:coords', function (data) {
    socket.broadcast.emit('load:coords', data);
  });

  socket.on('disconnect', function (client) {
    var index = clients.indexOf(client);
    clients.splice(index,1);
    count--;
    io.sockets.emit('count', {
        number: count
    });
  });


})

