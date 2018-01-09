const Koa = require('koa'); // core
const Router = require('koa-router'); // routing
const bodyParser = require('koa-bodyparser'); // POST parser
const serve = require('koa-static'); // serves static files like index.html
const logger = require('koa-logger'); // optional module for logging

const passport = require('koa-passport'); //passport for Koa
const LocalStrategy = require('passport-local'); //local Auth Strategy
const JwtStrategy = require('passport-jwt').Strategy; // Auth via JWT
const ExtractJwt = require('passport-jwt').ExtractJwt; // Auth via JWT

const jwtsecret = "mysecretkey"; // signing key for JWT
const jwt = require('jsonwebtoken'); // auth via JWT for hhtp
const socketioJwt = require('socketio-jwt'); // auth via JWT for socket.io

const socketIO = require('socket.io');

const mongoose = require('mongoose'); // standard module for  MongoDB
const crypto = require('crypto'); // crypto module for node.js for e.g. creating hashes

const app = new Koa();
const router = new Router();
app.use(serve('public'));
app.use(logger());
app.use(bodyParser());

app.use(passport.initialize()); // initialize passport first
app.use(router.routes()); // then routes
const server = app.listen(3000);// launch server on port  3000

mongoose.Promise = Promise; // Ask Mongoose to use standard Promises
mongoose.set('debug', true);  // Ask Mongoose to log DB request to console
mongoose.connect('mongodb://localhost/test'); // Connect to local database
mongoose.connection.on('error', console.error);

//---------Use Schema and Module  ------------------//

const userSchema = new mongoose.Schema({
  displayName: String,
  email: {
    type: String,
    required: 'e-mail is required',
    unique: 'this e-mail already exist'
  },
  passwordHash: String,
  salt: String,
}, {
  timestamps: true
});

userSchema.virtual('password')
.set(function (password) {
  this._plainPassword = password;
  if (password) {
    this.salt = crypto.randomBytes(128).toString('base64');
    this.passwordHash = crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha1');
  } else {
    this.salt = undefined;
    this.passwordHash = undefined;
  }
})

.get(function () {
  return this._plainPassword;
});

userSchema.methods.checkPassword = function (password) {
  if (!password) return false;
  if (!this.passwordHash) return false;
  return crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha1') == this.passwordHash;
};

const User = mongoose.model('User', userSchema);

//----------Passport Local Strategy--------------//

passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    session: false
  },
  function (email, password, done) {
    User.findOne({email}, (err, user) => {
      if (err) {
        return done(err);
      }

      if (!user || !user.checkPassword(password)) {
        return done(null, false, {message: 'User does not exist or wrong password.'});
      }
      return done(null, user);
    });
  }
  )
);

//----------Passport JWT Strategy--------//

// Expect JWT in the http header

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: jwtsecret
};

passport.use(new JwtStrategy(jwtOptions, function (payload, done) {
    User.findById(payload.id, (err, user) => {
      if (err) {
        return done(err)
      }
      if (user) {
        done(null, user)
      } else {
        done(null, false)
      }
    })
  })
);

//------------Routing---------------//

// new user route

router.post('/user', async(ctx, next) => {
  try {
    ctx.body = await User.create(ctx.request.body);
  }
  catch (err) {
    ctx.status = 400;
    ctx.body = err;
  }
});

// local auth route. Creates JWT is successful

router.post('/login', async(ctx, next) => {
  await passport.authenticate('local', function (err, user) {
    if (user == false) {
      ctx.body = "Login failed";
    } else {
      //--payload - info to put in the JWT
      const payload = {
        id: user.id,
        displayName: user.displayName,
        email: user.email
      };
      const token = jwt.sign(payload, jwtsecret); //JWT is created here

      ctx.body = {user: user.displayName, token: 'JWT ' + token};
    }
  })(ctx, next);

});

// JWT auth route

router.get('/custom', async(ctx, next) => {

  await passport.authenticate('jwt', function (err, user) {
    if (user) {
      ctx.body = "hello " + user.displayName;
    } else {
      ctx.body = "No such user";
      console.log("err", err)
    }
  } )(ctx, next)

});

//---Socket Communication-----//
let io = socketIO(server);

io.on('connection', socketioJwt.authorize({
  secret: jwtsecret,
  timeout: 15000
})).on('authenticated', function (socket) {

  console.log('this is the name from the JWT: ' + socket.decoded_token.displayName);

  socket.on("clientEvent", (data) => {
    console.log(data);
  })
});
