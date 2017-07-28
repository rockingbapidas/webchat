// Initialize Firebase variables
var database = firebase.database();
var auth = firebase.auth();
var storage = firebase.storage();
const messaging = firebase.messaging();

// Create local variables
var admindata = null;
var userdata = null;
var userRef = '/users';
var groupRef = '/groups';
var chatRef = '/chat_msg';
var chatImage = 'chat_img/';

//cast DOM element to the variables
var username = document.getElementById('user-name');
var usercard = document.getElementById('userlist-card');
var messagecard = document.getElementById('messages-card');
var userlist = document.getElementById('userlist');

var messageList = document.getElementById('messages');
var messageForm = document.getElementById('message-form');
var messageInput = document.getElementById('message');
var submitButton = document.getElementById('submit');

var submitImageButton = document.getElementById('submitImage');
var imageForm = document.getElementById('image-form');
var mediaCapture = document.getElementById('mediaCapture');

var activeuser = document.getElementById('activeuser');
var userName = document.getElementById('userName');
var onlinestatus = document.getElementById('onstatus');
var chatempty = document.getElementById('nodata');
var loader = document.getElementById("loader");
var snackbar = document.getElementById("snackbar");

// Template for messages.
var MESSAGE_TEMPLATE =
  '<div class="message-container">' +
  '<div class="spacing"><div class="pic"></div></div>' +
  '<div class="message"></div>' +
  '<div class="name"></div>' +
  '</div>';

// A loading image URL.
var LOADING_IMAGE_URL = 'https://www.google.com/images/spin-32.gif';

// addEventListener for the button.
var buttonTogglingHandler = this.toggleButton.bind(this);
messageInput.addEventListener('keyup', buttonTogglingHandler);
messageInput.addEventListener('change', buttonTogglingHandler);
messageForm.addEventListener('submit', this.sendMessage.bind(this));

submitImageButton.addEventListener('click', function(e) {
  e.preventDefault();
  this.mediaCapture.click();
}.bind(this));
mediaCapture.addEventListener('change', this.saveImageMessage.bind(this));

auth.onAuthStateChanged(function(user) {
  if (user) {
    var ref = database.ref(userRef);
    ref.off();
    ref.child(user.uid).once('value')
      .then(function(snapshot) {
        admindata = snapshot.val();
        console.log("admindata : ", JSON.stringify(admindata));
        username.textContent = admindata.fullName;
        updateOnlineStaus(true);
        updateLastSeen();
        getUserList();
      })
      .catch(function(error) {
        console.log('Error code', error.code);
        console.log('Error message', error.message);
        window.location.replace('index.html');
      });
  } else {
    window.location.replace('index.html');
  }
});

function logout() {
  auth.signOut()
    .then(function() {
      updateOnlineStaus(false);
      updateLastSeen();
      window.location.replace('login.html');
    })
    .catch(function(error) {
      console.log('Error code', error.code);
      console.log('Error message', error.message);
    });
};

function toggleButton() {
  if (messageInput.value) {
    submitButton.removeAttribute('disabled');
  } else {
    submitButton.setAttribute('disabled', 'true');
  }
};

function clearTextField(element) {
  element.value = '';
  element.parentNode.MaterialTextfield.boundUpdateClassesHandler();
}

function getUserList() {
  var ref = database.ref(userRef);
  ref.off();
  ref.on('child_added', function(data) {
    console.log('getUserList child_added');
    managerRole(data)
  });

  ref.on('child_changed', function(data) {
    console.log("getUserList child_changed ");
    managerRole(data)
  });

  ref.on('child_removed', function(data) {
    console.log("getUserList child_removed ");
  });
};

function managerRole(data) {
  var user = data.val();
  if (user.userType == 'user') {
    getLastMessage(user);
  }
};

function getLastMessage(user) {
  console.log("getLastMessage ", user.fullName);
  var room_1 = admindata.userId + "_" + user.userId;
  var room_2 = user.userId + "_" + admindata.userId;
  var cref = database.ref(chatRef);
  //cref.off();
  cref.once('value').then(function(snapshot) {
      if (snapshot.child(room_1).val()) {
        //cref.child(room_1).off();
        cref.child(room_1).orderByValue().limitToLast(1).on('child_added', function(data) {
          console.log("getLastMessage child_added from room_1");
          var lastMessage = data.val().messageText;
          usercreate(user, lastMessage);
        });
        cref.child(room_1).orderByValue().limitToLast(1).on('child_changed', function(data) {
          console.log("getLastMessage child_changed from room_1");
          var lastMessage = data.val().messageText;
          usercreate(user, lastMessage);
        });
      } else if (snapshot.child(room_2).val()) {
        //cref.child(room_2).off();
        cref.child(room_2).orderByValue().limitToLast(1).on('child_added', function(data) {
          console.log("getLastMessage child_added from room_2");
          var lastMessage = data.val().messageText;
          usercreate(user, lastMessage);
        });
        cref.child(room_2).orderByValue().limitToLast(1).on('child_changed', function(data) {
          console.log("getLastMessage child_changed from room_2");
          var lastMessage = data.val().messageText;
          usercreate(user, lastMessage);
        });
      } else {
        console.log("no last message found");
        console.log("so user not created");
      }
    })
    .catch(function(error) {
      console.log('Error ', error);
    });
};

function usercreate(user, lastMessage) {
  var div = document.getElementById(user.userId);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', user.userId);
    this.userlist.appendChild(div);
  }
  div.querySelector('.name').textContent = lastMessage;
  var messageElement = div.querySelector('.message');
  messageElement.textContent = user.fullName;
  // Replace all line breaks by <br>.
  messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  // Show the card fading-in and scroll to view the new message.
  setTimeout(function() {
    div.classList.add('visible')
  }, 1);
  div.onclick = function() {
    loadMessages(user);
  }
  userlist.scrollTop = this.userlist.scrollHeight;
};

function getGroups() {

}

function groupcreate(group) {

}

function getGroupLastMessage(group) {

}

function loadMessages(user) {
  loader.removeAttribute('hidden');
  while (messageList.firstChild) {
    messageList.removeChild(messageList.firstChild);
  }
  userdata = user;
  console.log(JSON.stringify(userdata));
  getOnlineStatus();
  var room_1 = admindata.userId + "_" + userdata.userId;
  var room_2 = userdata.userId + "_" + admindata.userId;
  var cref = database.ref(chatRef);
  cref.off();
  cref.once('value').then(function(snapshot) {
      if (snapshot.child(room_1).val()) {
        cref.child(room_1).off();
        cref.child(room_1).limitToLast(12).on('child_added', function(data) {
          console.log("loadMessages child_added from room_1");
          if (data.val().senderUid == userdata.userId && data.val().receiverUid == admindata.userId) {
            showMessages(data);
          } else if (data.val().senderUid == admindata.userId && data.val().receiverUid == userdata.userId) {
            showMessages(data);
          }
        });
        cref.child(room_1).limitToLast(12).on('child_changed', function(data) {
          console.log("loadMessages child_changed from room_1");
          if (data.val().senderUid == userdata.userId && data.val().receiverUid == admindata.userId) {
            showMessages(data);
          } else if (data.val().senderUid == admindata.userId && data.val().receiverUid == userdata.userId) {
            showMessages(data);
          }
        });
      } else if (snapshot.child(room_2).val()) {
        cref.child(room_2).off();
        cref.child(room_2).limitToLast(12).on('child_added', function(data) {
          console.log("loadMessages child_added from room_2");
          if (data.val().senderUid == userdata.userId && data.val().receiverUid == admindata.userId) {
            showMessages(data);
          } else if (data.val().senderUid == admindata.userId && data.val().receiverUid == userdata.userId) {
            showMessages(data);
          }
        });
        cref.child(room_2).limitToLast(12).on('child_changed', function(data) {
          console.log("loadMessages child_changed from room_2");
          if (data.val().senderUid == userdata.userId && data.val().receiverUid == admindata.userId) {
            showMessages(data);
          } else if (data.val().senderUid == admindata.userId && data.val().receiverUid == userdata.userId) {
            showMessages(data);
          }
        });
      } else {
        console.log("no chat data found");
        chatempty.removeAttribute('hidden')
      }
    })
    .catch(function(error) {
      console.log('Error ', error);
    });
};

function getOnlineStatus() {
  activeuser.removeAttribute('hidden');
  userName.innerText = userdata.fullName;
  var uref = database.ref(userRef);
  uref.off();
  uref.child(userdata.userId)
    .on('value', function(snapshot) {
      var data = snapshot.val();
      if (data.userId == userdata.userId) {
        console.log('getOnlineStatus ', data.online);
        if (data.online) {
          onlinestatus.innerText = "Online";
        } else {
          var time = moment(data.lastSeenTime).format("hh:mm a");
          onlinestatus.innerText = "Last seen on " + time;
        }
      }
    });
};

function showMessages(chat) {
  //console.log(JSON.stringify(chat));
  var div = document.getElementById(chat.val().timeStamp);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', chat.val().timeStamp);
    messageList.appendChild(div);
  }

  div.querySelector('.name').textContent = chat.val().senderName;
  var messageElement = div.querySelector('.message');

  if (chat.val().chatType == 'text') {
    messageElement.textContent = chat.val().messageText;
    // Replace all line breaks by <br>.
    messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  } else {
    var image = document.createElement('img');
    image.addEventListener('load', function() {
      messageList.scrollTop = messageList.scrollHeight;
    }.bind(this));
    setImageUrl(chat.val().fileUrl, image);
    messageElement.innerHTML = '';
    messageElement.appendChild(image);
  }

  // Show the card fading-in and scroll to view the new message.
  setTimeout(function() {
    div.classList.add('visible')
  }, 1);
  messageList.scrollTop = messageList.scrollHeight;
  messageInput.focus();
  loader.setAttribute('hidden', 'true');
};

function sendMessage() {
  if (userdata) {
    var room_1 = admindata.userId + "_" + userdata.userId;
    var room_2 = userdata.userId + "_" + admindata.userId;
    var timeStamp = Math.floor(Date.now());
    var chat = {
      "chatType": "text",
      "messageText": messageInput.value,
      "receiverName": userdata.fullName,
      "receiverUid": userdata.userId,
      "senderName": admindata.fullName,
      "senderUid": admindata.userId,
      "readSuccessfully": false,
      "sentSuccessfully": true,
      "timeStamp": timeStamp
    };
    //console.log(JSON.stringify(chat));
    var cref = database.ref(chatRef);
    cref.off();
    cref.once('value').then(function(snapshot) {
        if (snapshot.child(room_1).val()) {
          cref.child(room_1).child(timeStamp).set(chat)
            .then(function() {
              clearTextField(messageInput);
              toggleButton();
            })
            .catch(function(error) {
              console.log('Error ', error);
            });
        } else if (snapshot.child(room_2).val()) {
          cref.child(room_2).child(timeStamp).set(chat)
            .then(function() {
              clearTextField(messageInput);
              toggleButton();
            })
            .catch(function(error) {
              console.log('Error ', error);
            });
        } else {
          cref.child(room_1).child(timeStamp).set(chat)
            .then(function() {
              clearTextField(messageInput);
              toggleButton();
            })
            .catch(function(error) {
              console.log('Error ', error);
            });
        }
      })
      .catch(function(error) {
        console.log('Error ', error);
      });
  } else {
    var data = {
      message: 'Please select user',
      timeout: 2000
    };
    snackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }
};

function setImageUrl(imageUri, imgElement) {
  if (imageUri.startsWith('gs://')) {
    imgElement.src = LOADING_IMAGE_URL;
    storage.refFromURL(imageUri).getMetadata()
      .then(function(metadata) {
        imgElement.src = metadata.downloadURLs[0];
      });
  } else {
    imgElement.src = imageUri;
  }
};

function saveImageMessage(event) {
  event.preventDefault();
  var file = event.target.files[0];
  imageForm.reset();
  if (!file.type.match('image.*')) {
    var data = {
      message: 'You can only share images',
      timeout: 2000
    };
    snackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }
  if (userdata) {
    var room_1 = admindata.userId + "_" + userdata.userId;
    var room_2 = userdata.userId + "_" + admindata.userId;
    var timeStamp = Math.floor(Date.now());
    var chat = {
      "chatType": "image",
      "fileUrl": LOADING_IMAGE_URL,
      "receiverName": userdata.fullName,
      "receiverUid": userdata.userId,
      "senderName": admindata.fullName,
      "senderUid": admindata.userId,
      "readSuccessfully": false,
      "sentSuccessfully": true,
      "timeStamp": timeStamp
    };
    //console.log(JSON.stringify(chat));
    var cref = database.ref(chatRef);
    cref.off();
    cref.once('value').then(function(snapshot) {
        if (snapshot.child(room_1).val()) {
          cref.child(room_1).child(timeStamp).set(chat)
            .then(function() {
              uploadTask(room_1, timeStamp, file);
            })
            .catch(function(error) {
              console.log('Error ', error);
            });
        } else if (snapshot.child(room_2).val()) {
          cref.child(room_2).child(timeStamp).set(chat)
            .then(function() {
              uploadTask(room_2, timeStamp, file);
            })
            .catch(function(error) {
              console.log('Error ', error);
            });
        } else {
          cref.child(room_1).child(timeStamp).set(chat)
            .then(function() {
              uploadTask(room_1, timeStamp, file);
            })
            .catch(function(error) {
              console.log('Error ', error);
            });
        }
      })
      .catch(function(error) {
        console.log('Error ', error);
      });
  } else {
    var data = {
      message: 'Please select user',
      timeout: 2000
    };
    snackbar.MaterialSnackbar.showSnackbar(data);
    return;
  }
};

function uploadTask(room, timeStamp, file) {
  var uploadTask = storage.ref(chatImage).child(String(timeStamp)).put(file);
  uploadTask.on('state_changed', function(snapshot) {
    // Handle progress uploads
    var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Upload is ' + progress + '% done');
    switch (snapshot.state) {
      case firebase.storage.TaskState.PAUSED: // or 'paused'
        console.log('Upload is paused');
        break;
      case firebase.storage.TaskState.RUNNING: // or 'running'
        console.log('Upload is running');
        break;
    }
  }, function(error) {
    // Handle unsuccessful uploads
    console.log(error);
  }, function() {
    // Handle successful uploads on complete
    var downloadURL = uploadTask.snapshot.downloadURL;
    updateFileUri(room, timeStamp, downloadURL);
  });
}

function updateOnlineStaus(status) {
  var uref = database.ref(userRef);
  uref.child(admindata.userId).child('online').set(status).then(function() {
      uploadTask(room_1, timeStamp, file);
    })
    .catch(function(error) {
      console.log('Error ', error);
    });
};

function updateLastSeen() {
  var uref = database.ref(userRef);
  uref.child(admindata.userId).child('lastSeenTime').set(Math.floor(Date.now()))
    .then(function() {
      console.log('Last seen time updated');
    })
    .catch(function(error) {
      console.log('Error ', error);
    });
};

function updateFileUri(room, timeStamp, uri) {
  var chatF = database.ref(chatRef);
  chatF.child(room).child(timeStamp).child('fileUrl').set(uri)
    .then(function() {
      console.log('File url updated');
    })
    .catch(function(error) {
      console.log('Error ', error);
    });
}

function updateSentStatus(room, timeStamp) {
  var chatS = database.ref(chatRef);
  chatS.child(room).child(timeStamp).child('sentSuccessfully').set(true)
    .then(function() {
      console.log('Sent status updated');
    })
    .catch(function(error) {
      console.log('Error ', error);
    });
}

function updateReadStatus(room, timeStamp) {
  var chatR = database.ref(chatRef);
  chatR.child(room).child(timeStamp).child('readSuccessfully').set(true)
    .then(function() {
      console.log('Read status updated');
    })
    .catch(function(error) {
      console.log('Error ', error);
    });
}
