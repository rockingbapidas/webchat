// Initialize Firebase variables
var database = firebase.database();
var auth = firebase.auth();
const messaging = firebase.messaging();

//create local vaiables
var userRef = '/users';
var userData = null;
var loader = document.getElementById("loader");
var form = document.getElementById("myDiv");
var snackbar = document.getElementById("snackbar");
var message = document.getElementById('message');

function login() {
  var username = document.getElementById('username').value;
  var password = document.getElementById('password').value;
  if (username && password) {
    // Hide and unhide view
    message.innerText = 'Please wait';
    form.setAttribute('hidden', 'true');
    loader.removeAttribute('hidden');

    // sign in with firebase
    auth.signInWithEmailAndPassword(username, password)
      .then((success) => {
        userData = auth.currentUser;
        console.log("Firebase success: " + userData.uid);
        checkuserType();
      })
      .catch((error) => {
        var errorCode = error.code;
        console.log("Error code " + errorCode);

        // Hide and unhide view
        message.innerText = 'Please login to continue';
        form.removeAttribute('hidden');
        loader.setAttribute('hidden', 'true');

        // Display a message to the user using a Toast.
        var data;
        switch (errorCode) {
          case 'auth/user-not-found':
            data = {
              message: 'User not found',
              timeout: 2000
            };
            break;
          case 'auth/invalid-email':
            data = {
              message: 'Invalid email address',
              timeout: 2000
            };
            break;
          case 'auth/user-disabled':
            data = {
              message: 'User is disable contact administrator',
              timeout: 2000
            };
            break;
          case 'auth/wrong-password':
            data = {
              message: 'Password is invalid',
              timeout: 2000
            };
            break;
          default:
            data = {
              message: 'Server error',
              timeout: 2000
            };
        }
        snackbar.MaterialSnackbar.showSnackbar(data);
      });
  } else {
    // Display a message to the user using a Toast.
    var data = {
      message: 'Enter username and password',
      timeout: 2000
    };
    snackbar.MaterialSnackbar.showSnackbar(data);
  }
};

function checkuserType() {
  var ref = database.ref(userRef);
  ref.child(userData.uid).once('value')
    .then(function(snapshot) {
      var user = snapshot.val();
      if (user.userType == 'admin') {
        //updateToken();
        window.location.replace('adminHome.html');
      } else {
        auth.signOut();
        // Hide and unhide view
        message.innerText = 'Please login to continue';
        form.removeAttribute('hidden');
        loader.setAttribute('hidden', 'true');
        data = {
          message: 'User invalid try another account',
          timeout: 2000
        };
        snackbar.MaterialSnackbar.showSnackbar(data);
      }
    })
    .catch(function(error) {
      console.error('Unable to get.', error);
    });
};

function updateToken() {
  if (userData) {
    messaging.getToken()
    .then(function(currentToken) {
        if (currentToken) {
          console.log('FCM device token:', currentToken);
          // Saving the Device Token to the datastore.
          userRef.child(userData.uid).child('fcmToken').set(currentToken);
        } else {
          // Need to request permissions to show notifications.
        }
      })
      .catch(function(error) {
        console.error('Unable to get fcm token.', error);
      });
  }
};
