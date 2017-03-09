//Пример приложения для регистрации пользователя, генерации токена, авторизации по токену через http и websocket

const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const crypto = require('crypto');
const logger = require('koa-logger')
const jwt = require('jsonwebtoken');
const passport = require('koa-passport');
const LocalStrategy = require('passport-local');
const mongoose = require('mongoose');
const serve = require('koa-static');
const socketIO = require('socket.io');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const socketioJwt = require('socketio-jwt');

const jwtsecret = "mysecretkey"; // ключ для подписи токена

mongoose.Promise = Promise;
const beautifyUnique = require('mongoose-beautiful-unique-validation');
mongoose.set('debug', true);

const app = new Koa();
const router = new Router();

mongoose.connect('mongodb://localhost/test');
mongoose.connection.on('error', console.error);


//---------User management-------------------//

const userSchema = new mongoose.Schema({
  displayName: String,
  email: {
    type: String,
    required: 'Укажите e-mail',
    unique: 'Такой e-mail уже существует'
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
    // remove password (unable to login w/ password any more, but can use providers)
    this.salt = undefined;
    this.passwordHash = undefined;
  }
})
.get(function () {
  return this._plainPassword;
});

userSchema.methods.checkPassword = function (password) {
  if (!password) return false; // empty password means no login by password
  if (!this.passwordHash) return false; // this user does not have password (the line below would hang!)
  
  return crypto.pbkdf2Sync(password, this.salt, 1, 128, 'sha1') == this.passwordHash;
};

const User = mongoose.model('User', userSchema);


passport.serializeUser(function (user, done) {
  done(null, user.email);
});

passport.deserializeUser(function (email, done) {
  User.find({email: email}, done); // callback version checks id validity automatically
});

//----------Passport Local Strategies--------------//

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
        // don't say whether the user exists
        return done(null, false, {message: 'Нет такого пользователя или пароль неверен.'});
      }
      return done(null, user);
    });
  }
  )
);

//----------Passport JWT Strataegy--------//
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: jwtsecret
};

passport.use(new JwtStrategy(jwtOptions, function (payload, done) {
    User.findById(payload.id, (err, user) => {
      console.log("payload", payload);
      if (err) {
        return done(err)
      }
      if (user) {
        done(null, user)
      } else
      {
         done(null, false)
      }
    })
  })
);


//------------Routing---------------//


// маршрут для авторизации по токену

router.get('/login', async(ctx, next) => {
  
  await passport.authenticate('jwt', function(user) {
    if (user) {
      ctx.body = "hello " + user.displayName
      return ctx.login(user);
      
    } else {
      ctx.body = "No such user";
    }
  } )(ctx, next)
  
});

//маршрут для локальной авторизации и создания токена при успешной авторизации

router.post('/login', async(ctx, next) => {
  
  await passport.authenticate('local', function (user) {
    
    if (user == false) {
      ctx.body = "fail"
      ctx.logout()
    } else {
      
      //--payload - информация которую мы храним в токене и можем из него получать
      
      const payload = {
        id: user.id,
        name: user.displayName,
        email: user.email
      }
      const token = jwt.sign(payload, jwtsecret)
      
      ctx.body = {user: user.displayName, token: 'JWT ' + token}
      return ctx.login(user);
    }
  })(ctx, next);
  
});


//маршрут для создания нового пользователя

router.post('/user', async(ctx, next) => {
  try {
    ctx.body = await User.create(ctx.request.body);
  }
  catch (err) {
    ctx.status = 400;
    ctx.body = err;
  }
});

app.use(serve('public'));
app.use(logger())
app.use(bodyParser());
app.use(passport.initialize());
app.use(router.routes());
const server = app.listen(3000);

//---Socket Communication-----//
let io = socketIO(server);

io.on('connection', socketioJwt.authorize({
  secret: jwtsecret,
  timeout: 15000
})).on('authenticated', function(socket) {
  
  console.log('Это мое имя из токена: ' + socket.decoded_token.name);
  
  socket.on("clientEvent", (data) => {
    console.log(data);
  })
});
   
  
 


