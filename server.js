/********************************************************************************
*  WEB322 – Assignment 06
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Wilgard Fils-aime ____Student ID: 172-529-225__ Date: ______________
*
*  Published URL: ___________________________________________________________
*
********************************************************************************/





const authData = require('./modules/auth-service');//for authentication
const legoData = require("./modules/legoSets");
const express = require('express');
const app = express();

const clientSessions = require('client-sessions')//

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');



//configuration of session
app.use(clientSessions(
  {
    cookieName: 'session',
    secret: 'o78efhubdFGETnfoT04hfsYEeh37GD73hosf',
    duration: 2 * 60 * 1000,
    activeDuration: 1000 * 60,
  }
))

//this is used to conditionally show or hide elements to use depending if user is logged in or not
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});



//this is to make sure that user is logged in before having access to certain pages

function ensureLogin(req, res, next) {
  if (!req.session.user) {
    // Redirect the user to the login page with a 401 status code (Unauthorized)
    res.status(401).redirect('/login');
  } else {
    next();
  }
}

// function ensureLogin(req, res, next) {
//   if (!req.session.user) {
//     res.redirect('/login',{message:'Please log in so access can be granted!\nOr register if you aren\'t yet!'});
//   } else {
//     next();
//   }
// }

app.get('/', (req, res) => {
  res.render("home")
});

app.get('/about', (req, res) => {
  res.render("about");
});

app.get("/lego/addSet", ensureLogin,async (req, res) => {
  let themes = await legoData.getAllThemes()
  res.render("addSet", { themes: themes })
});

app.post("/lego/addSet", ensureLogin,async (req, res) => {
  try {
    await legoData.addSet(req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", { Message: `I'm sorry, but we have encountered the following error: ${err}` });
  }

});

app.get("/lego/editSet/:num",ensureLogin,async (req, res) => {

  try {
    let set = await legoData.getSetByNum(req.params.num);
    let themes = await legoData.getAllThemes();

    res.render("editSet", { set, themes });
  } catch (err) {
    res.status(404).render("404", { message: err });
  }

});

app.post("/lego/editSet",ensureLogin,async (req, res) => {

  try {
    await legoData.editSet(req.body.set_num, req.body);
    res.redirect("/lego/sets");
  } catch (err) {
    res.render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
});

app.get("/lego/deleteSet/:num", ensureLogin,async (req, res) => {
  try {
    await legoData.deleteSet(req.params.num);
    res.redirect("/lego/sets");
  } catch (err) {
    res.status(500).render("500", { message: `I'm sorry, but we have encountered the following error: ${err}` });
  }
})

app.get("/lego/sets", async (req, res) => {

  let sets = [];

  try {
    if (req.query.theme) {
      sets = await legoData.getSetsByTheme(req.query.theme);
    } else {
      sets = await legoData.getAllSets();
    }

    res.render("sets", { sets })
  } catch (err) {
    res.status(404).render("404", { message: err });
  }

});


app.get("/lego/sets/:num", async (req, res) => {
  try {
    let set = await legoData.getSetByNum(req.params.num);
    res.render("set", { set })
  } catch (err) {
    res.status(404).render("404", { message: err });
  }
});

//================ login/register routes =================

app.get('/register', (req, res) => {
  res.render('register',{errorMessage:"", successMessage:"",userName:"", email: ""});
});

app.get('/login', (req, res) => {
  res.render('login', {errorMessage:"", userName:""});
});


app.post('/register', (req, res) => {
    // console.log('==========================================');
    // console.log('User Name: ', req.body.userName,);
    // console.log('Password: ', req.body.password);
    // console.log('Confirm Password: ', req.body.password2);
    // console.log('Email: ', req.body.email);
    // console.log('==========================================');

  authData.registerUser(req.body).then(() => {
    

    // res.redirect('/login', { errorMessage: "", successMessage: "User Created", userName: "", email: "" })
    res.render('register', { errorMessage: "", successMessage: "User Created", userName: "", email: "" })
  }).catch((err) => {
    res.render('register', { errorMessage: err, successMessage: "", userName: req.body.userName, email: req.body.email });
  }); 
});



app.post('/login', (req, res) => {

  req.body.userAgent = req.get('User-Agent');
  authData.checkUser(req.body)
    .then((user) => {
      req.session.user = {
        userName: user.userName,
        email: user.email,
        loginHistory: user.loginHistory,
      }
      res.redirect('/lego/sets');
    }).catch((err) => {
      res.render('login', { errorMessage: err, userName: req.body.userName });
    });
});


app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

app.get('/userHistory', ensureLogin, (req, res) => {
  res.render('userHistory');
});

//6 


app.use((req, res, next) => {
  res.status(404).render("404", { message: "I'm sorry, we're unable to find what you're looking for" });
});


legoData.initialize()
  .then(authData.initialize)
  .then(() => {
  app.listen(HTTP_PORT, () => { console.log(`server listening on: ${HTTP_PORT}`) });
}).catch(err => {
  console.log(err)
});




