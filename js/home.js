// Initialize Firebase variables
var database = firebase.database();
var userRef = database.ref('/users');
var chatRef = database.ref('/chat_msg');
var auth = firebase.auth();
const messaging = firebase.messaging();

// Create local variables of dom element
var senderdata = null;
var receiverdata = null;
var username = document.getElementById('user-name');
var usercard = document.getElementById('userlist-card');
var messagecard = document.getElementById('messages-card');
var userlist = document.getElementById('userlist');
var messageList = document.getElementById('messages');
var messageForm = document.getElementById('message-form');
var messageInput = document.getElementById('message');
var submitButton = document.getElementById('submit');
var activeuser = document.getElementById('activeuser');
var userName = document.getElementById('userName');
var status = document.getElementById('status');

// Template for messages.
var MESSAGE_TEMPLATE = '<div class="message-container">' +
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

auth.onAuthStateChanged(function(user) {
  if (user) {
    userRef.child(user.uid).once('value')
      .then(function(snapshot) {
        senderdata = snapshot.val();
        console.log(JSON.stringify(senderdata));
        username.textContent = senderdata.fullName;
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
      window.location.replace('login.html');
    })
    .catch(function(error) {
      console.log('Error code', error.code);
      console.log('Error message', error.message);
    });
};

function getUserList() {
  userRef.on('child_added', function(data) {
    console.log('child_added');
    if (senderdata.userType == "admin") {
      var user = data.val();
      if (user.userType == 'user') {
        usercreate(user);
      }
    } else {
      var user = data.val();
      if (user.userType == 'admin') {
        if (user.lastMessage) {
          usercreate(user);
        }
      }
    }
  });

  userRef.on('child_changed', function(data) {
    console.log("child_changed ");
  });

  userRef.on('child_removed', function(data) {
    console.log("child_removed ");
  });
};

function usercreate(user) {
  var li = document.createElement('li');
  var image = document.createElement('img');
  image.src = 'image/profile_placeholder.png';
  image.width = '50';
  image.height = '50';
  image.style = 'float:left';
  image.style = 'margin-right:10px';
  li.appendChild(image);
  var span = document.createElement('span');
  span.innerText = user.fullName;
  li.appendChild(span);
  li.style = 'margin-bottom:10px';
  li.className = 'mdl-js-ripple-effect';
  li.onclick = function() {
    loadMessages(user);
  };
  userlist.append(li);
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

function loadMessages(user) {
  receiverdata = user;
  console.log(JSON.stringify(receiverdata));
  getOnlineStatus();
  var room_1 = senderdata.userId + "_" + receiverdata.userId;
  var room_2 = receiverdata.userId + "_" + senderdata.userId;
  chatRef.off();
  chatRef.once('value')
    .then(function(snapshot) {
      if (snapshot.val().hasChild(room_1)) {
        snapshot.val().hasChild(room_1)
          .on('child_added', function(data) {
            console.log("child_added ");
            showMessages(data);
          });

        snapshot.val().hasChild(room_1)
          .on('child_changed', function(data) {
            console.log("child_changed ");
          });
      } else {
        snapshot.val().hasChild(room_2)
          .on('child_added', function(data) {
            console.log("child_added ");
            showMessages(data);
          });

        snapshot.val().hasChild(room_2)
          .on('child_changed', function(data) {
            console.log("child_changed ");
          });
      }
    })
    .catch(function(error) {
      console.log('Error code', error.code);
      console.log('Error message', error.message);
    });
};

function getOnlineStatus() {
  activeuser.removeAttribute('hidden');
  userName.innerText = receiverdata.fullName;
  userRef.child(receiverdata.userId)
    .on('value', function(snapshot) {
      var data = snapshot.val();
      console.log(JSON.stringify(data));
      if (receiverdata.online == true) {
        status.innerText = "Online";
      } else {
        var time = new Date(receiverdata.timeStamp);
        var datetime = time.toLocaleString('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          hour12: true
        });
        status.innerText = "Last seen on " + datetime;
      }
    });
};

function showMessages(chat) {
  var div = document.getElementById(chat.timeStamp);
  // If an element for that message does not exists yet we create it.
  if (!div) {
    var container = document.createElement('div');
    container.innerHTML = MESSAGE_TEMPLATE;
    div = container.firstChild;
    div.setAttribute('id', chat.timeStamp);
    this.messageList.appendChild(div);
  }
  div.querySelector('.name').textContent = chat.senderName;
  var messageElement = div.querySelector('.message');
  messageElement.textContent = chat.messageText;
  // Replace all line breaks by <br>.
  messageElement.innerHTML = messageElement.innerHTML.replace(/\n/g, '<br>');
  // Show the card fading-in and scroll to view the new message.
  setTimeout(function() {
    div.classList.add('visible')
  }, 1);
  messageList.scrollTop = messageList.scrollHeight;
  messageInput.focus();
};

function sendMessage() {
  var room_1 = senderdata.userId + "_" + receiverdata.userId;
  var room_2 = receiverdata.userId + "_" + senderdata.userId;
  var timeStamp = Math.floor(Date.now());
  var chat = {
    "messageText": messageInput.value,
    "receiverName": receiverdata.fullName,
    "receiverUid": receiverdata.userId,
    "senderName": senderdata.fullName,
    "senderUid": senderdata.userId,
    "sentSuccessfully": true,
    "timeStamp": timeStamp
  };
  chatRef.off();
  chatRef.once('value')
    .then(function(snapshot) {
      if (snapshot.val().hasChild(room_1)) {
        snapshot.val().child(room_1)
          .child(timeStamp).set(chat)
          .then(function() {
            updateLastMessage(messageInput.value);
            resetMaterialTextfield(messageInput);
            toggleButton();
          })
          .catch(function(error) {
            console.log('Error code', error.code);
            console.log('Error message', error.message);
          });
      } else if (snapshot.val().hasChild(room_2)) {
        snapshot.val().child(room_2)
          .child(timeStamp).set(chat)
          .then(function() {
            updateLastMessage(messageInput.value);
            resetMaterialTextfield(messageInput);
            toggleButton();
          })
          .catch(function(error) {
            console.log('Error code', error.code);
            console.log('Error message', error.message);
          });
      } else {
        snapshot.val().child(room_1)
          .child(timeStamp).set(chat)
          .then(function() {
            updateLastMessage(messageInput.value);
            resetMaterialTextfield(messageInput);
            toggleButton();
          })
          .catch(function(error) {
            console.log('Error code', error.code);
            console.log('Error message', error.message);
          });
      }
    })
    .catch(function(error) {
      console.log('Error code', error.code);
      console.log('Error message', error.message);
    });
};

function updateLastMessage(message) {
  var map = ['/lastMessage/' + message]
  userRef.child(senderdata.userId).update(map);
};

function updateOnlineStaus(status) {
  var map = ['/online/' + status]
  userRef.child(senderdata.userId).update(map);
};

function updateLastSeen() {
  var map = ['/lastSeenTime/' + Math.floor(Date.now())]
  userRef.child(senderdata.userId).update(map);
};
