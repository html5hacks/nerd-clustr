//dependencies
var express = require('express')
  , mongoStore = require('connect-mongo')(express)
  , http = require('http')
  , path = require('path')
  , passport = require('passport')
  , mongoose = require('mongoose')
  , socketIo = require('socket.io')
  , passportSocketIo = require("passport.socketio");

//create express app
var app = express();

//mongo uri
app.set('mongodb-uri', process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'localhost/starter');

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
  app.set('project-name', 'SXSW HTML5 Real-time Geo-Social Network App');
  app.set('company-name', 'frog');
  app.set('admin-email', 'webdev.jdcravens@gmail.com');
  app.set('email-from-name', app.get('project-name')+ ' Website');
  app.set('email-from-address', 'webdev.jdcravens@gmail.com');
  app.set('email-credentials', {
    user: 'html5hacksbook@gmail.com',
    password: 'html5432',
    host: 'smtp.gmail.com',
    ssl: true
  });

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


  //except for the optional fail and success the parameter object has the 
  //same attribute than the session middleware http://www.senchalabs.org/connect/middleware-session.html

io.set('loglevel',10) // set log level to get all debug messages

io.set("authorization", passportSocketIo.authorize({
  key: 'connect.sid',       //the cookie where express (or connect) stores its session id.
  secret: mySecret, //the session secret to parse the cookie
  store:   mySessionStore,     //the session store that express uses
  fail: function(data, accept) {     // *optional* callbacks on success or fail
    console.log('fail');
    accept(null, false);             // second param takes boolean on whether or not to allow handshake
  },
  success: function(data, accept) {
    console.log('success');
    accept(null, true);
  }
}));


io.on('connection',function(socket){
  socket.emit('init',{msg:"test"})

    console.log("user connected");
    console.log("user connected: ", socket.handshake.user.username);

    //filter sockets by user...
    var userGender = socket.handshake.user.gender, 
        opposite = userGender === "male" ? "female" : "male";

    passportSocketIo.filterSocketsByUser(io, function (user) {
      return user.gender === opposite;
    }).forEach(function(s){
      s.send("a " + userGender + " has arrived!");
    });


})

  // io.set("authorization", passportSocketIo.authorize({
  //   key:    'express.sid',       //the cookie where express (or connect) stores its session id.
  //   secret: 'Sup3rS3cr3tK3y', //the session secret to parse the cookie
  //   store:   mySessionStore,     //the session store that express uses
  //   fail: function(data, accept) {     // *optional* callbacks on success or fail
  //     console.log('fail');
  //     accept(null, false);             // second param takes boolean on whether or not to allow handshake
  //   },
  //   success: function(data, accept) {
  //     console.log('success');
  //     accept(null, true);
  //   }
  // }));

  // io.sockets.on("connection", function(socket){
  //   console.log("user connected");
  //   // console.log("user connected: ", socket.handshake.user.name);

  //   //filter sockets by user...
  //   // var userGender = socket.handshake.user.gender, 
  //   //     opposite = userGender === "male" ? "female" : "male";

  //   // passportSocketIo.filterSocketsByUser(sio, function (user) {
  //   //   return user.gender === opposite;
  //   // }).forEach(function(s){
  //   //   s.send("a " + userGender + " has arrived!");
  //   // });

  // });
