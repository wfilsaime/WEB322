require('dotenv').config();
const mongoose = require('mongoose');
const { resolve } = require('path');

const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        userName: {
            type: String,
            unique: true 
        },
        password: String,
        email: String,
        loginHistory: [{
            dateTime: { type: Date, default: Date.now },
            userAgent:{type: String}
        }]
    }
)

 //to be defined on new connection (see initialize)
let User; //= mongoose.model('Users', userSchema);



function initialize() {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err) => {
            reject(err); // reject the promise with the provided error
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            console.log('successfully connected to mongodb');
            resolve();
        });
    });
}




function registerUser(userData) {
    return new Promise((resolve, reject) => {
        // Check if passwords match
        if (userData.password != userData.password2) {
            reject('Passwords do not match');
        } else {
            // Encrypt the user password 
            bcrypt.hash(userData.password, 10)
                .then(hash => {
                    // Update userData.password with the hashed password
                    userData.password = hash;

                    // Create a new user from the userData
                    let newUser = new User(userData);
                    
                    // Save the newly created user
                    newUser.save()
                        .then(() => {
                            console.log(`This is Register function: user successfully created in the database`); //debugging purposes only;
                            resolve(); // User saved successfully
                        })
                        .catch((err) => {
                            if (err.code == 11000) {
                                reject("Username already taken");
                            } else {
                                reject(`There was an error creating the user: ${err}`);
                            }
                        });
                })
                .catch(err => {
                    console.log(`Hashing interrupted: ${err}`); //for debugging purposes
                    reject(`There was an error encrypting the password`);
                });
        }
    });
}

// function checkUser(userData) {
//     return new Promise((resolve, reject) => {
//         // Find user by userName
//         User.find({ userName: userData.userName })
//             .exec()
//             .then((users) => {
//                 // If no user found
//                 if (users.length == 0) {
//                     reject(`Unable to find user: ${userData.userName}`);
//                 } else {
//                     bcrypt.compare(users[0].password, userData.password).then((result) => {
//                         if (result == true) {
//                             if (users[0].loginHistory.length == 8) {
//                                 users[0].loginHistory.pop();
//                             }
//                             users[0].loginHistory.unshift({ dateTime: (new Date()).toString(), userAgent: userData.userAgent });
//                             User.updateOne({ userName: users[0].userName }, { $set: { loginHistory: users[0].loginHistory } }).exec().then(() => {
//                                 resolve(users[0]);
//                             })
//                                 .catch((err) => {
//                                     reject("There was an error verifying the user: " + err);
//                             })
//                          } else { reject("Incorrect Password")}
//                      })
                   
                    
//                 }
//             })
//             .catch((err) => {
//                 reject(`Unable to find user: ${userData.userName}`); // Error finding user
//             });
//     });
// }

function checkUser(userData) {
    return new Promise((resolve, reject) => {
      User.find({ userName: userData.userName })
        .exec()
        .then((users) => {
          if (users.length == 0) {
            // .length is used for both checking array and string size.
            reject("Unable to find user: " + userData.userName);
          } else {
            // while .find userName:userData.userName return unique value of users,
            // .find always return with array. Due to that, when we use .find, we have to specify the first unique data with users[0]
            // others [1][2] and so on are empty.
            bcrypt.compare(userData.password, users[0].password).then((res) => {
              //(users.password !== bcrypt.hash(userData.password)) not this. use compare method
              if (res == true) {
                // .compare method return bool
                if (users[0].loginHistory.length == 8) {
                  users[0].loginHistory.pop(); // remove the last elem from the array
                }
                users[0].loginHistory.unshift({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                }); //add elem in the begging of array. adjust the length as well
                User.updateOne(
                  { userName: users[0].userName },
                  { $set: { loginHistory: users[0].loginHistory } }
                )
                  .exec()
                  .then(() => {
                    resolve(users[0]);
                  })
                  .catch((err) => {
                    reject("There was an error verifying the user: " + err);
                  });
              } else {
                reject("Incorrect Password for user: " + userData.userName);
              }
            });
          }
        })
        .catch((err) => {
          reject("Unable to find user: " + userData.userName);
        });
    });
  }




module.exports = { initialize, registerUser, checkUser }; 
