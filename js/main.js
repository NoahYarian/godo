'use strict';

var app = angular.module('goDo', ['ngRoute', 'firebase', 'ngFacebook']).config(function ($facebookProvider) {
  $facebookProvider.setAppId('103273773349279');
  $facebookProvider.setPermissions('user_friends');
  $facebookProvider.setCustomInit({
    channelUrl: '//godo.tehcode.com/channel.html',
    xfbml: true
  });
}).config(function ($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/landing.html'
  }).when('/happenings', {
    templateUrl: 'views/happenings.html'
  }).when('/profile', {
    templateUrl: 'views/profile.html'
  }).when('/loggedin', {
    templateUrl: 'views/loggedin.html'
  }).when('/invites', {
    templateUrl: 'views/invites.html'
  }).when('/time', {
    templateUrl: 'views/timeselect.html'
  }).when('/calendar', {
    templateUrl: 'views/calendar.html'
  }).when('/logout', {
    templateUrl: 'views/landing.html'
  });
}).run(function ($rootScope) {
  // Load the facebook SDK asynchronously
  (function () {
    // If we've already installed the SDK, we're done
    if (document.getElementById('facebook-jssdk')) {
      return;
    }

    // Get the first script element, which we'll use to find the parent node
    var firstScriptElement = document.getElementsByTagName('script')[0];

    // Create a new script element and set its id
    var facebookJS = document.createElement('script');
    facebookJS.id = 'facebook-jssdk';

    // Set the new script's source to the source of the Facebook JS SDK
    facebookJS.src = '//connect.facebook.net/en_US/sdk.js';

    // Insert the Facebook JS SDK into the DOM
    firstScriptElement.parentNode.insertBefore(facebookJS, firstScriptElement);
  })();
}).run(function ($rootScope, $location, $facebook) {

  // register listener to watch route changes
  $rootScope.$on('$routeChangeStart', function (event, next, current) {
    console.log('next: ', next, 'current: ', current);
    if (typeof $rootScope.loggedInUser === 'undefined' || $rootScope.loggedInUser == null) {
      $facebook.getLoginStatus().then(function (response) {
        if (typeof response.$$state !== 'undefined' && response.$$state.value.status === 'connected') {
          $rootScope.loggedInUser = response.$$state.value.authResponse.userID;
          console.log(response.$$state.value.authResponse.userID);
          $location.path('/loggedin');
        } else {
          console.log('Not logged in. response= ', response);
          $location.path('/');
        }
      });
    }
  });
}).controller('FaceCtrl', function ($rootScope, $scope, $facebook, $location, $timeout) {
  $scope.login = function () {
    $facebook.login().then(function () {
      $scope.getMyInfo();
    });
  };
  $scope.loginAs = function (facebookId) {
    $rootScope.loggedInUser = facebookId;
    $rootScope[facebookId] = { me: { name: facebookId } };
    var ref = new Firebase('https://goanddo.firebaseio.com/users/' + facebookId + '/friends');
    ref.once('value', function (dataSnapshot) {
      $rootScope[facebookId].friends = dataSnapshot.val();
    });
    $location.path('/loggedin');
  };
  $scope.getMyInfo = function () {
    $facebook.api('/me').then(function (response) {
      $rootScope.loggedInUser = response.id;
      var facebookId = $rootScope.loggedInUser;
      $rootScope[facebookId] = {};
      $rootScope[facebookId].me = response;
    });
    $timeout(function () {
      $facebook.api('/me/friends').then(function (response) {
        var facebookId = $rootScope.loggedInUser;
        var friendId;
        $rootScope[facebookId].friends = {};
        response.data.forEach(function (friend) {
          friendId = friend.id;
          $rootScope[facebookId].friends[friendId] = friend.name;
        });
      });
    }, 200);
    $timeout(function () {
      var facebookId = $rootScope.loggedInUser;
      console.log($rootScope[facebookId].me);
      console.log($rootScope.loggedInUser);
      console.log($rootScope[facebookId].friends);
      var ref = new Firebase('https://goanddo.firebaseio.com/users/' + $rootScope.loggedInUser);
      ref.once('value', function (dataSnapshot) {
        if (!dataSnapshot.child('me').exists()) {
          //New user tasks here
          var ref2 = new Firebase('https://goanddo.firebaseio.com/scheduleBoiler');
          // console.log("ref2: ", ref2);
          ref2.once('value', function (dataSnapshot2) {
            // console.log("dataSnapshot2: ", dataSnapshot2, "ref: ", ref);
            ref.child('schedule').set(dataSnapshot2.val());
          }, function (err) {
            console.log('second once err:', err);
          });
        };
        ref.child('me').set($rootScope[facebookId].me);
        ref.child('friends').set($rootScope[facebookId].friends);
      }, function (err) {
        console.log('first once err:', err);
      });
      console.log('$rootScope.loggedInUser: ', $rootScope.loggedInUser);
      $location.path('/loggedin');
    }, 400);
  };

  $scope.logout = function () {
    $rootScope.loggedInUser = null;
    $facebook.logout().then(function () {
      $location.path('/');
    });
  };

  $scope.checkFBAuth = function () {
    $facebook.getLoginStatus().then(function (response) {
      if (response.$$state.value.status === 'connected') {
        $rootScope.loggedInUser = response.$$state.value.authResponse.userID;
        console.log(response.$$state.value.authResponse.userID);
      } else {
        console.log('not logged in');
      }
    });
  };
})

// .controller("LandingCtrl", function($scope, $firebaseObject) {
//   var ref = new Firebase("https://goanddo.firebaseio.com/data");
//   var syncObject = $firebaseObject(ref);
//   syncObject.$bindTo($scope, "data");
// })

// .controller("FBCtrl", function($rootScope, $scope, $firebaseAuth) {
//   var vm = this;
//   vm.login = function() {
//     vm.ref = new Firebase("https://goanddo.firebaseio.com");
//     vm.ref.authWithOAuthPopup("facebook", function(error, authData) {
//       if (error) {
//         console.log("Login Failed!", error);
//       } else {
//         console.log("Authenticated successfully with payload:", authData);
//         $rootScope.loggedInUser = authData.uid;
//         console.log($rootScope.loggedInUser);
//         location.href = "/#/loggedIn";
//       }
//     }/*, {scope: 'user_friends'}*/);
//   }
//   vm.logout = function() {
//     vm.ref = new Firebase("https://goanddo.firebaseio.com");
//     vm.ref.unauth();
//     location.href = "/#/";
//   }
// })

.controller('InterestsCtrl', function ($rootScope, $scope, $firebaseObject) {
  var ref = new Firebase('https://goanddo.firebaseio.com/interests');
  var syncObject = $firebaseObject(ref);
  syncObject.$bindTo($scope, 'data');

  var refUser = new Firebase('https://goanddo.firebaseio.com/users/' + $rootScope.loggedInUser + '/interests');
  var syncObjectUser = $firebaseObject(refUser);
  syncObjectUser.$bindTo($scope, 'dataUser');

  $scope.pickInterest = function (interestName) {
    $scope.dataUser[interestName] = !$scope.dataUser[interestName];
  };

  $scope.onModalLoad = function () {
    $('#modal').modal('show');
    $('#modal').on('hidden.bs.modal', function (e) {
      $scope.$apply(function () {
        $scope.newInterest = {
          minPeople: 2,
          maxPeople: 2,
          time: 0.5
        };
      });
    });
  };

  $scope.addInterest = function (newInterest) {
    var name = newInterest.name;
    delete newInterest.name;
    $scope.data[name] = newInterest;
    $scope.dataUser[name] = true;
    $('#modal').modal('hide');
  };

  $scope.newInterest = {
    minPeople: 2,
    maxPeople: 2,
    time: 0.5
  }

  // set up an array to hold the months
  // var costLevels = ["Free!", "$", "$$", "$$$"];

  // $(".slider")

  //     // activate the slider with options
  //     .slider({
  //         min: 0,
  //         max: costLevels.length-1,
  //         value: 0
  //     })

  //     // add pips with the labels set to "months"
  //     .slider("pips", {
  //         rest: "label",
  //         labels: costLevels
  //     })

  //     // and whenever the slider changes, lets echo out the month
  //     .on("slidechange", function(e,ui) {
  //         $("#labels-months-output").text( "You selected " + costLevels[ui.value] + " (" + ui.value + ")");
  //     });

  ;
}).controller('ScheduleCtrl', function ($scope, $rootScope, $firebaseObject) {
  var facebookId = $rootScope.loggedInUser;
  console.log('scheduleCtrl ', facebookId);
  var ref = new Firebase('https://goanddo.firebaseio.com/users/' + facebookId + '/schedule');
  var syncObject = $firebaseObject(ref);
  syncObject.$bindTo($scope, 'userSchedule');

  // $scope.copyToRootScope = function() {
  //   $rootScope[facebookId].schedule = $scope.userSchedule;
  //   console.log("copied $scope.userSchedule to $rootScope[",facebookId,"].schedule");
  //   console.log("copyToRootScope() ",$rootScope);
  // }
})

// .controller("ScheduleCtrl", function($rootScope, $firebaseArray) {
//   var facebookId = $rootScope.loggedInUser;
//   var ref = new Firebase(`https://goanddo.firebaseio.com/users/${facebookId}/schedule`);
//   var syncObject = $firebaseArray(ref);
//   syncObject.$bindTo($rootScope, "userSchedule");
// })

.controller('EventCtrl', function ($scope, $rootScope, $firebaseObject, $location, $timeout) {
  var facebookId = $rootScope.loggedInUser;
  $scope.messages = {};
  // $rootScope.$on("$routeChangeSuccess", function(angularEvent, current, previous) {
  //   if (current.loadedTemplateUrl === "views/invites.html") {
  //     console.log("routing to Invites page...");
  //     $scope.$apply(function() {
  //       $timeout(function() {
  //         $scope.updateCalendarAndGetInvites($rootScope.loggedInUser);
  //       }, 1000);
  //     });
  //   }
  // });

  // the ref at the top might not be needed if this is only happening once the person is logged in
  $scope.getBlocks = function (fbId, callback) {
    console.log('getBlocks() getting schedule ref for ', fbId);
    var ref = new Firebase('https://goanddo.firebaseio.com/users/' + fbId + '/schedule');
    // console.log(ref.parent().toString());
    ref.once('value', function (dataSnapshot) {
      $rootScope[fbId].schedule = dataSnapshot.val();
      $rootScope[fbId].timeBlocks = [];
      var k;
      var thisHalfHour;
      console.log('$rootScope[' + fbId + '].schedule: ', $rootScope[fbId].schedule);
      $.each($rootScope[fbId].schedule, function (dayIndex, halfHoursObj) {
        // if (!$.isNumeric(dayIndex)) {
        //   return true;
        // }
        // console.log("dayIndex: ", dayIndex);
        // console.log("halfHoursObj: ", halfHoursObj);
        // console.log("fbId: ", fbId);
        // console.log(`before dayindex = {} $rootScope[${fbId}].timeBlocks: ${$rootScope[fbId].timeBlocks}`);
        $rootScope[fbId].timeBlocks[dayIndex] = {};
        // console.log(`dayindex = {} $rootScope[${fbId}].timeBlocks: ${$rootScope[fbId].timeBlocks}`);
        $.each(halfHoursObj, function (halfHour, bool) {
          if (bool) {
            $rootScope[fbId].timeBlocks[dayIndex][halfHour] = 0.5;
            // console.log(`0.5 $rootScope[${fbId}].timeBlocks[${dayIndex}][${halfHour}]: ${$rootScope[fbId].timeBlocks[dayIndex][halfHour]}`);
            // console.log(`0.5 $rootScope[${fbId}].timeBlocks[${dayIndex}]: ${$rootScope[fbId].timeBlocks[dayIndex]}`);
            thisHalfHour = halfHour;
            // console.log("while", $rootScope[fbId].schedule[dayIndex][$scope.getNextHalfHour(thisHalfHour)]);
            while ($rootScope[fbId].schedule[dayIndex][$scope.getNextHalfHour(thisHalfHour)]) {
              $rootScope[fbId].timeBlocks[dayIndex][halfHour] += 0.5;
              thisHalfHour = $scope.getNextHalfHour(thisHalfHour);
            }
          } else {
            $rootScope[fbId].timeBlocks[dayIndex][halfHour] = 0;
          }
          // console.log(`$rootScope[${fbId}].timeBlocks[${dayIndex}][${halfHour}]: ${$rootScope[fbId].timeBlocks[dayIndex][halfHour]}`);
        });
        // console.log(`$rootScope[${fbId}].timeBlocks[${dayIndex}]: ${$rootScope[fbId].timeBlocks[dayIndex]}`);
      });
      console.log('$rootScope[' + fbId + '].timeBlocks: ', $rootScope[fbId].timeBlocks);
      // console.log(`$rootScope[${fbId}]: ${$rootScope[fbId]}`);
      // console.log("$rootScope: ", $rootScope); //Ohhhhhh....
      console.log('getBlocks() ', $rootScope);
      typeof callback === 'function' && callback();
    });
  };

  $scope.getPossibleEvents = function (fbId, callback) {
    if (!$rootScope[fbId]) {
      $rootScope[fbId] = {};
    }
    $scope.getBlocks(fbId, function () {
      $rootScope[fbId].interestsArr = [];
      $rootScope[fbId].possibleEvents = [];
      var ref = new Firebase('https://goanddo.firebaseio.com/users/' + fbId + '/interests');
      ref.once('value', function (dataSnapshot) {
        $.each(dataSnapshot.val(), function (interest, bool) {
          // console.log(fbId, "interest: ", interest, "bool: ", bool);
          if (bool) {
            $rootScope[fbId].interestsArr.push(interest);
          }
        });
        // console.log(`$rootScope[${fbId}].interestsArr: ${$rootScope[fbId].interestsArr}`);
        var ref2 = new Firebase('https://goanddo.firebaseio.com/interests');
        ref2.once('value', function (dataSnapshot2) {
          $scope.interestInfo = dataSnapshot2.val();
          $rootScope.interestInfo = dataSnapshot2.val();
          // $rootScope.interestTimes = {};
          // $.each(dataSnapshot2.val(), function(interestName, interestObj) {
          //   $rootScope.interestTimes[interestName] = interestObj.time;
          // });
          // console.log("$rootScope.interestTimes: ", $rootScope.interestTimes);
          $.each($rootScope[fbId].schedule, function (dayIndex, halfHoursObj) {
            if (!$.isNumeric(dayIndex)) {
              return true;
            }
            $rootScope[fbId].possibleEvents[dayIndex] = {};
            $.each(halfHoursObj, function (halfHour, bool) {
              $rootScope[fbId].possibleEvents[dayIndex][halfHour] = {};
              $.each($rootScope[fbId].interestsArr, function (i, userInterest) {
                $rootScope[fbId].possibleEvents[dayIndex][halfHour][userInterest] = {};
                if (bool && $rootScope[fbId].timeBlocks[dayIndex][halfHour] >= $scope.interestInfo[userInterest].time) {
                  //time block length starting this halfhour > interest time req.?
                  $rootScope[fbId].possibleEvents[dayIndex][halfHour][userInterest] = true;
                } else {
                  // if not a free half hour or not enough time, do this
                  $rootScope[fbId].possibleEvents[dayIndex][halfHour][userInterest] = false;
                }
              });
            });
          });
          // console.log(`$rootScope[${fbId}].possibleEvents :`, $rootScope[fbId].possibleEvents);
          // var ref3 = new Firebase(`https://goanddo.firebaseio.com/users/${fbId}`);
          // var onComplete = function(error) {
          //   if (error) {
          //     console.log('getPossibleEvents() synchronization failed');
          //   } else {
          //     console.log('getPossibleEvents() synchronization succeeded, about to call ', callback);
          typeof callback === 'function' && callback();
          //   }
          // };
          // console.log("getPossibleEvents() ",$rootScope);
          // ref3.child('possibleEvents').set($rootScope[fbId].possibleEvents, onComplete);
        });
      });
    });
  };

  $scope.userAvailToCalendar = function (fbId, callback) {
    $scope.getPossibleEvents(fbId, function () {
      var ref = new Firebase('https://goanddo.firebaseio.com/calendar');
      $.each($rootScope[fbId].possibleEvents, function (dayIndex, dayObj) {
        // $scope.calendar[dayIndex] = {};
        $.each(dayObj, function (halfHour, halfHourObj) {
          // $scope.calendar[dayIndex][halfHour] = {};
          $.each(halfHourObj, function (interest, bool) {
            // $scope.calendar[dayIndex][halfHour][interest] = {invited: {}};
            var onComplete = function onComplete(error) {
              if (error) {
                console.log('userAvailToCalendar() Synchronization failed', error);
              } else {
                console.log('userAvailToCalendar() Synchronization succeeded');
              }
            };
            if (bool) {
              // $scope.calendar[dayIndex][halfHour][interest].invited[fbId] = true;
              ref.child(dayIndex + '/' + halfHour + '/' + interest + '/invited/' + fbId).set(true, onComplete);
            } else {
              // if ($scope.calendar[dayIndex][halfHour][interest].invited[fbId]) {
              // delete $scope.calendar[dayIndex][halfHour][interest].invited[fbId];
              // }
              ref.child(dayIndex + '/' + halfHour + '/' + interest + '/invited/' + fbId).remove(onComplete);
            }
          });
        });
      });
      typeof callback === 'function' && callback();
    });
    // console.log("userAvailToCalendar(",fbId,") ",$rootScope);
  };

  $scope.updateCalendarAndGetInvites = function (fbId) {
    $scope.userAvailToCalendar(fbId, function () {
      var ref = new Firebase('https://goanddo.firebaseio.com/calendar');
      ref.once('value', function (calSnap) {
        $scope.invites = [];
        calSnap.forEach(function (daySnap) {
          daySnap.forEach(function (halfHourSnap) {
            halfHourSnap.forEach(function (interestSnap) {
              if (!interestSnap.hasChild('invited')) {
                interestSnap.ref().remove();
              } else if (interestSnap.child('invited').hasChild(fbId)) {
                var day = daySnap.key();
                var halfHour = halfHourSnap.key();
                var interest = interestSnap.key();
                var invitedNum = interestSnap.child('invited').numChildren();
                var confirmedNum = interestSnap.child('confirmed').numChildren();
                var declinedNum = interestSnap.child('declined').numChildren();
                var maxPeople = $scope.interestInfo[interest].maxPeople;
                var minPeople = $scope.interestInfo[interest].minPeople;
                var neededNum = minPeople - confirmedNum >= 0 ? minPeople - confirmedNum : 0;
                ref.child(day + '/' + halfHour + '/' + interest + '/maxPeople').set(maxPeople);
                ref.child(day + '/' + halfHour + '/' + interest + '/minPeople').set(minPeople);

                var userStatus = 'invited';
                if (interestSnap.child('confirmed').exists() && interestSnap.child('confirmed').hasChild(fbId)) {
                  userStatus = 'confirmed';
                }
                if (interestSnap.child('declined').exists() && interestSnap.child('declined').hasChild(fbId)) {
                  userStatus = 'declined';
                }

                if (confirmedNum === maxPeople) {
                  status = 'full';
                } else if (confirmedNum >= minPeople) {
                  status = 'confirmed';
                } else if (invitedNum >= minPeople) {
                  status = 'needsConf';
                  if (invitedNum - declinedNum < minPeople) {
                    status = 'tooManyDeclines';
                  }
                } else if (invitedNum === 1) {
                  status = 'allAlone';
                } else if (invitedNum < minPeople) {
                  status = 'needsInterest';
                }

                ref.child(day + '/' + halfHour + '/' + interest + '/status').set(status);

                var invitedPersonId;
                var invitedFriendsNum = 0;
                var invitedFriends = ['<ul class=\'popover-ul\'>'];
                interestSnap.child('invited').forEach(function (invitedPersonSnap) {
                  invitedPersonId = invitedPersonSnap.key();
                  if ($rootScope[fbId].friends[invitedPersonId]) {
                    invitedFriendsNum++;
                    invitedFriends.push('<li>', $rootScope[fbId].friends[invitedPersonId], '</li>');
                    // invitedFriends.push("<br>");
                  }
                });
                invitedFriends.pop('</ul>');

                var confirmedPersonId;
                var confirmedFriendsNum = 0;
                var confirmedFriends = ['<ul class=\'popover-ul\'>'];
                interestSnap.child('confirmed').forEach(function (confirmedPersonSnap) {
                  confirmedPersonId = confirmedPersonSnap.key();
                  if ($rootScope[fbId].friends[confirmedPersonId]) {
                    confirmedFriendsNum++;
                    confirmedFriends.push('<li>', $rootScope[fbId].friends[confirmedPersonId], '</li>');
                    // confirmedFriends.push("<br>");
                  }
                });
                confirmedFriends.push('</ul>');

                var declinedPersonId;
                var declinedFriendsNum = 0;
                var declinedFriends = ['<ul class=\'popover-ul\'>'];
                interestSnap.child('declined').forEach(function (declinedPersonSnap) {
                  declinedPersonId = declinedPersonSnap.key();
                  if ($rootScope[fbId].friends[declinedPersonId]) {
                    declinedFriendsNum++;
                    declinedFriends.push('<li>', $rootScope[fbId].friends[declinedPersonId], '</li>');
                    // declinedFriends.push("<br>")
                  }
                });
                declinedFriends.push('</ul>');

                $(function () {
                  $('[data-toggle="popover"]').popover();
                });

                if (status !== 'allAlone' && status !== 'needsInterest') {
                  $scope.$apply(function () {
                    $scope.invites.push({
                      interest: interest,
                      day: $scope.getDay(day),
                      dayIndex: day,
                      time: $scope.getTime(halfHour),
                      halfHour: halfHour,
                      status: status,
                      invited: interestSnap.child('invited').val(),
                      invitedNum: invitedNum,
                      invitedFriends: invitedFriends.join(''),
                      invitedFriendsNum: invitedFriendsNum,
                      confirmed: interestSnap.child('confirmed').val(),
                      confirmedNum: confirmedNum,
                      confirmedFriends: confirmedFriends.join(''),
                      confirmedFriendsNum: confirmedFriendsNum,
                      declined: interestSnap.child('declined').val(),
                      declinedNum: declinedNum,
                      declinedFriends: declinedFriends.join(''),
                      declinedFriendsNum: declinedFriendsNum,
                      neededNum: neededNum,
                      minPeople: minPeople,
                      maxPeople: maxPeople,
                      messages: interestSnap.child('messages').val(),
                      messageNum: interestSnap.child('messages').numChildren(),
                      userStatus: userStatus
                    });
                  });
                }
              }
            });
          });
        });
      });
    });
  };

  $scope.confirm = function (invite, inviteIndex) {
    var ref = new Firebase('http://goanddo.firebaseio.com/calendar/' + invite.dayIndex + '/' + invite.halfHour + '/' + invite.interest + '/confirmed');
    ref.child(facebookId).set($rootScope[facebookId].me.name);
    if (invite.neededNum === 1) {
      $scope.invites[inviteIndex].status = 'confirmed';
    } else if (invite.confirmedNum + 1 === invite.maxPeople) {
      $scope.invites[inviteIndex].status = 'full';
    }
    if (invite.confirmedNum < invite.minPeople) {
      $scope.invites[inviteIndex].neededNum--;
    }
    $scope.invites[inviteIndex].confirmedNum++;
  };

  $scope.decline = function (invite, inviteIndex) {
    var ref = new Firebase('http://goanddo.firebaseio.com/calendar/' + invite.dayIndex + '/' + invite.halfHour + '/' + invite.interest + '/declined');
    ref.child(facebookId).set($rootScope[facebookId].me.name);
    if (invite.invitedNum - invite.declinedNum <= invite.minPeople) {
      $scope.invites[inviteIndex].status = 'tooManyDeclines';
    }
    $scope.invites[inviteIndex].declinedNum++;
  };

  $scope.unConfirm = function (invite, inviteIndex) {
    var ref = new Firebase('http://goanddo.firebaseio.com/calendar/' + invite.dayIndex + '/' + invite.halfHour + '/' + invite.interest + '/confirmed');
    ref.child(facebookId).remove();
    if (invite.confirmedNum === invite.minPeople) {
      $scope.invites[inviteIndex].status = 'needsConf';
    } else if (invite.confirmedNum === invite.maxPeople) {
      $scope.invites[inviteIndex].status = 'confirmed';
    }
    if (invite.confirmedNum <= invite.minPeople) {
      $scope.invites[inviteIndex].neededNum++;
    }
    $scope.invites[inviteIndex].confirmedNum--;
  };

  $scope.unDecline = function (invite, inviteIndex) {
    var ref = new Firebase('http://goanddo.firebaseio.com/calendar/' + invite.dayIndex + '/' + invite.halfHour + '/' + invite.interest + '/declined');
    ref.child(facebookId).remove();
    if (invite.invitedNum - invite.declinedNum === invite.minPeople - 1) {
      $scope.invites[inviteIndex].status = 'needsConf';
    }
    $scope.invites[inviteIndex].declinedNum--;
  };

  $scope.filterInvites = function (invite, i, invites) {
    if (invite.status === 'tooManyDeclines') {
      if (invite.userStatus !== 'declined') {
        return false;
      }
    }
    return true;
  };

  $scope.postMessage = function (invite, inviteIndex) {
    var ref = new Firebase('http://goanddo.firebaseio.com/calendar/' + invite.dayIndex + '/' + invite.halfHour + '/' + invite.interest + '/messages');
    var messageObj = {
      userName: $rootScope[facebookId].me.name,
      userId: facebookId,
      timestamp: Date(),
      text: invite.newMessage
    };
    var inviteString = invite.dayIndex + '_' + invite.halfHour + '_' + invite.interest;
    var messageUidRef = ref.push(messageObj);
    var messageUid = messageUidRef.key().split('').slice(-19).join('');
    if (!$scope.messages[inviteString]) {
      $scope.messages[inviteString] = {};
    }
    $scope.messages[inviteString][messageUid] = messageObj;

    $scope.invites[inviteIndex].newMessage = '';
  };

  $scope.deleteMessage = function (invite, inviteIndex, messageUid) {
    delete $scope.invites[inviteIndex].messages[messageUid];
    var ref = new Firebase('http://goanddo.firebaseio.com/calendar/' + invite.dayIndex + '/' + invite.halfHour + '/' + invite.interest + '/messages');
    ref.child(messageUid).remove();
  };

  $scope.watchMessages = function (invite, inviteIndex) {
    var ref = new Firebase('http://goanddo.firebaseio.com/calendar/' + invite.dayIndex + '/' + invite.halfHour + '/' + invite.interest + '/messages');
    // ref.on('value', function(dataSnapshot) {
    //   // $scope.$apply(function() {
    //     $scope.invites[inviteIndex].messages = dataSnapshot.val();
    //   // });
    // }, function(error) {
    //   console.error(error);
    // });
    $scope.invites[inviteIndex].messages = $firebaseObject(ref);
  };

  $scope.hasMessages = function (invite) {
    if (!invite.messages) {
      return false;
    }
    var hasFireKeys = false;
    for (var key in invite.messages) {
      if (_.startsWith(key, '$')) {
        hasFireKeys = true;
      }
    }
    if (!hasFireKeys && Object.keys(invite.messages).length > 0 || hasFireKeys && Object.keys(invite.messages).length > 3 && invite.messages.$value !== null) {
      return true;
    } else {
      return false;
    }
  };

  $scope.getDay = function (dayIndex) {
    switch (Number(dayIndex)) {
      case 0:
        return 'Monday';
      case 1:
        return 'Tuesday';
      case 2:
        return 'Wednesday';
      case 3:
        return 'Thursday';
      case 4:
        return 'Friday';
      case 5:
        return 'Saturday';
      case 6:
        return 'Sunday';
    }
  };

  $scope.getTime = function (halfHour) {
    var hour = Number(halfHour.split('').slice(0, 2).join(''));
    var minute = Number(halfHour.split('').slice(2, 4).join(''));
    var suffix;
    var time = [];

    if (hour > 11) {
      suffix = ' PM';
    } else {
      suffix = ' AM';
    }

    if (hour > 12) {
      hour -= 12;
    }

    if (hour === 0) {
      hour = 12;
    }

    if (minute === 0) {
      minute = '00';
    }

    time.push(hour, ':', minute, suffix);
    return time.join('');
  };

  $scope.getNextHalfHour = function (halfHour) {
    var timeArr = halfHour.split('');
    var nextHalfHour = ['0'];
    var nextHour;
    var doneArr;
    var hour = timeArr.slice(0, 2).join('');
    var nextHourNoZero = (Number(hour) + 1).toString();

    if (nextHourNoZero.length === 1) {
      nextHour = nextHourNoZero.split('');
      nextHour.unshift('0');
    } else {
      nextHour = nextHourNoZero.split('');
    }

    if (timeArr[2] === '3') {
      nextHalfHour.unshift('0');
      doneArr = nextHour.concat(nextHalfHour);
    } else {
      nextHalfHour.unshift('3');
      doneArr = hour.split('').concat(nextHalfHour);
    }
    return doneArr.join('');
  };
}).controller('TimeCtrl', function () {

  $(function () {
    var isMouseDown = false,
        isHighlighted;
    $('.timeTable td').mousedown(function () {
      isMouseDown = true;
      $(this).children().toggleClass('timeTable-highlight');
      isHighlighted = $(this).children().hasClass('timeTable-highlight');
      return false; // prevent text selection
    }).mouseover(function () {
      if (isMouseDown) {
        $(this).children().toggleClass('timeTable-highlight', isHighlighted);
      }
    }).bind('selectstart', function () {
      return false;
    });

    $(document).mouseup(function () {
      isMouseDown = false;
    });
  });
}).controller('CalendarCtrl', function ($firebaseObject, $rootScope, $scope) {
  var facebookId = $rootScope.loggedInUser;
  var ref = new Firebase('http://goanddo.firebaseio.com/calendar');
  var calSyncObj = $firebaseObject(ref);
  calSyncObj.$bindTo($scope, 'data');
  $scope.filterCal = function (dayNum, halfHourNum, interestName) {
    console.log(dayNum, halfHourNum, interestName);
    if ($rootScope[facebookId].timeBlocks[dayNum][halfHourNum] < $rootScope.interestInfo[interestName].time) {
      return false;
    }
    return true;
  };
})

//($scope.data[dayNum][halfHourNum][interestName].status === "tooManyDeclines" && $scope.data[dayNum][halfHourNum][interestName].userStatus !== "declined") ||
//(!$rootScope[facebookId].interests[interestName])

// $scope.getAvailability = function(facebookId, callback) {
//   $scope.freeHalfHours = [];
//   $.get(`https://goanddo.firebaseio.com/users/${facebookId}/schedule.json`, function(data) {
//     var dayObjArr = [];
//     dayObjArr.push(data.mon, data.tue, data.wed, data.thu, data.fri, data.sat, data.sun);
//     // console.log("dayObjArr: ", dayObjArr);
//     dayObjArr.forEach(function(day, i) {
//       $scope.freeHalfHours[i] = [];
//       for (var halfHour in day) {
//         if (day[halfHour]) {
//           $scope.freeHalfHours[i].push(halfHour);
//         }
//       }
//     });
//   })
//   .done(function() {
//     // console.log("$scope.freeHalfHours: ", $scope.freeHalfHours);
//     typeof callback === 'function' && callback();
//   });
// };

// $scope.isNextHalfHour = function(halfHour1, halfHour2) {
//   if (!halfHour1 || !halfHour2) {
//     // console.log("nope, undefined arg", "1: ", halfHour1, "2: ", halfHour2);
//     return false;
//   }
//   var half1Arr = halfHour1.split('');
//   var half2Arr = halfHour2.split('');
//   // console.log(Number(half1Arr.slice(1,3).join('')));
//   // console.log(Number(half2Arr.slice(1,3).join('')));
//   if (half1Arr[3] === "0" && half2Arr[3] === "3") {
//     if (Number(half1Arr.slice(1,3).join('')) === Number(half2Arr.slice(1,3).join(''))) {
//       // console.log("yep", halfHour1, halfHour2);
//       return true;
//     } else {
//       // console.log("nope", halfHour1, halfHour2);
//       return false;
//     }
//   } else if (half1Arr[3] === "3" && half2Arr[3] === "0") {
//     if (Number(half1Arr.slice(1,3).join('')) + 1 === Number(half2Arr.slice(1,3).join(''))) {
//       // console.log("yep", halfHour1, halfHour2);
//       return true;
//     } else {
//       // console.log("nope", halfHour1, halfHour2);
//       return false;
//     }
//   } else {
//     // console.log("nope", halfHour1, halfHour2);
//     return false;
//   }
// };

//probably needs fixing, but I might not use it
// $scope.getFriendPossibleEvents = function (facebookId, callback) {
//   $scope.friendPossibleEvents = {};
//   $rootScope.friends = {fakedata2: true, fakedata3: true, fakedata4: true, fakedata5: true};
//   $rootScope.friends[facebookId] = true;
//   // console.log($rootScope.friends);
//   $.each($rootScope.friends, function (friendId, truth) {
//     // console.log(friendId);
//       $.get(`https://goanddo.firebaseio.com/users/${friendId}/possibleEvents.json`, function(data) {
//         $scope.friendPossibleEvents[friendId] = data;
//         // $scope.friendPossibleEvents.push(data);
//       })
//       .done(function() {
//         console.log("$scope.friendPossibleEvents for", facebookId, ": ", $scope.friendPossibleEvents);
//         if (Object.keys($scope.friendPossibleEvents).length === Object.keys($rootScope.friends).length) {
//           var ref = new Firebase(`https://goanddo.firebaseio.com/users/${facebookId}`);
//           ref.child('friendPossibleEvents').set($scope.friendPossibleEvents);
//         }
//         typeof callback === 'function' && callback();
//       });
//   });
// }

//A function that finds what events are shared in common by a person and ALL of their friends.... not what I need!
// $scope.makeEvents = function (facebookId) {
//   $scope.events = $scope.possibleEventsUser[facebookId];
//   // console.log($scope.friendPossibleEvents);
//   for (var friend in $scope.friendPossibleEvents) {
//     // console.log("$scope.friendPossibleEvents[",friend,"]: ", $scope.friendPossibleEvents[friend]);
//     $scope.friendPossibleEvents[friend].forEach(function(day, i) {
//       // console.log($scope.events);
//       // console.log("friend: ", friend, "day index: ", i, "day: ", day);
//       if (day) {
//         for (var interest in day) {
//           // console.log(friend, i, interest, day[interest]);
//           day[interest].forEach(function(startTime) {
//             for (var friend2 in $scope.friendPossibleEvents) {
//               // console.log(friend, friend2, i, startTime, interest);
//               // console.log("$scope.friendPossibleEvents[friend2][i]: ", $scope.friendPossibleEvents[friend2][i]);
//               if ($scope.events[i][interest] &&
//                   (!$scope.friendPossibleEvents[friend2][i] ||
//                   !$scope.friendPossibleEvents[friend2][i][interest] ||
//                   $scope.friendPossibleEvents[friend2][i][interest].indexOf(startTime) === -1)) {
//                 $scope.events[i][interest].splice($scope.events[i][interest].indexOf(startTime), 1);
//               }
//             }
//           });
//         }
//       }
//     });
//   };
//   // console.log($scope.friendPossibleEvents)
//   console.log("$scope.events: ", $scope.events);
// }

// $scope.getAllPossibleEvents = function() {
//   $scope.allPossibleEvents = {};
//   $scope.allUsers = [];
//   $http.get('https://goanddo.firebaseio.com/users.json')
//     .success(function (data) {
//       $scope.users = data;
//       var t = -1000;
//       $.each(data, function(user, obj) {
//         console.log(user)
//         t += 1000;
//         setTimeout(function() {
//           $scope.getPossibleEventsUser(user);
//         }, t);
//         // $http.get(`https://goanddo.firebaseio.com/users/${user}/possibleEvents.json`)
//         //   .success(function (data2) {
//         //     $scope.allPossibleEvents[user] = data2;
//         //     console.log($scope.allPossibleEvents);
//         //   });
//       });
//     })
//     .then(function() {
//       setTimeout(function() {
//         console.log("$scope.possibleEventsUser", $scope.possibleEventsUser);
//       }, 8000);
//     });
// }

// $scope.getFriendPossibleEvents = function (facebookId, callback) {
//   $scope.friendPossibleEvents = {};
//   $rootScope.friends = {fakedata2: true, fakedata3: true, fakedata4: true, fakedata5: true};
//   $rootScope.friends[facebookId] = true;
//   // console.log($rootScope.friends);
//   $.each($rootScope.friends, function (friendId, truth) {
//     // console.log(friendId);
//       $.get(`https://goanddo.firebaseio.com/users/${friendId}/possibleEvents.json`, function(data) {
//         $scope.friendPossibleEvents[friendId] = data;
//         // $scope.friendPossibleEvents.push(data);
//       })
//       .done(function() {
//         console.log("$scope.friendPossibleEvents for", facebookId, ": ", $scope.friendPossibleEvents);
//         if (Object.keys($scope.friendPossibleEvents).length === Object.keys($rootScope.friends).length) {
//           var ref = new Firebase(`https://goanddo.firebaseio.com/users/${facebookId}`);
//           ref.child('friendPossibleEvents').set($scope.friendPossibleEvents);
//         }
//         typeof callback === 'function' && callback();
//       });
//   });
// }

// $scope.userAvailToFirebase = function(fbId) {
//   $scope.getPossibleEvents(fbId, function() {
//     var ref = new Firebase(`https://goanddo.firebaseio.com/availability`);
//     $.each($rootScope[fbId].possibleEvents, function(dayIndex, dayObj) {
//       $.each(dayObj, function(halfHour, halfHourObj) {
//         $.each(halfHourObj, function(interest, bool) {
//           var onComplete = function(error) {
//             if (error) {
//               console.log('userAvailToFirebase() Synchronization failed', error);
//             } else {
//               console.log('userAvailToFirebase() Synchronization succeeded');
//             }
//           };
//           if (bool) {
//             ref.child(`${dayIndex}/${halfHour}/${interest}/${fbId}`).set(true, onComplete);
//           } else {
//             ref.child(`${dayIndex}/${halfHour}/${interest}/${fbId}`).remove();
//           }
//         });
//       });
//     });
//   });
//   console.log("userAvailToFirebase(",fbId,") ",$rootScope);
// };

// $scope.getPossibleEventsAll = function() {
//   var ref = new Firebase('https://goanddo.firebaseio.com/users');
//   ref.once('value', function(dataSnapshot) {
//     var t = 0;
//     $.each(dataSnapshot.val(), function(fbId, userObj) {
//       if (fbId !== "10103264160478133") {  // limit to test accts
//         setTimeout(function() {
//           console.log("fbId: ", fbId);
//           $scope.getPossibleEvents(fbId);
//         }, t);
//         t += 2000;
//       }
//     });
//   });
//   console.log("getPossibleEventsAll() ",$rootScope);
// }

// $scope.allUserAvailToFirebase = function () {
//   var ref = new Firebase('https://goanddo.firebaseio.com/users');
//   ref.once('value', function(dataSnapshot) {
//     $.each(dataSnapshot.val(), function(fbId, userObj) {
//       console.log("fbId: ", fbId);
//       $scope.userAvailToFirebase(fbId);
//     });
//   });
//   console.log("allUserAvailToFirebase() ",$rootScope);
// }

//   $rootScope.friends = {fakedata2: true, fakedata3: true, fakedata4: true, fakedata5: true};
//   $rootScope.friends[facebookId] = true;
//   // console.log($rootScope.friends);
//   $.each($rootScope.friends, function (friendId, truth) {
//     // console.log(friendId);
//       $.get(`https://goanddo.firebaseio.com/users/${friendId}/possibleEvents.json`, function(data) {
//         $scope.friendPossibleEvents[friendId] = data;
//         // $scope.friendPossibleEvents.push(data);
//       })
//       .done(function() {
//         console.log("$scope.friendPossibleEvents for", facebookId, ": ", $scope.friendPossibleEvents);
//         if (Object.keys($scope.friendPossibleEvents).length === Object.keys($rootScope.friends).length) {
//           var ref = new Firebase(`https://goanddo.firebaseio.com/users/${facebookId}`);
//           ref.child('friendPossibleEvents').set($scope.friendPossibleEvents);
//         }
//         typeof callback === 'function' && callback();
//       });
//   });
// }

// $scope.makeCalendar = function(callback) {
//   var refAvail = new Firebase('https://goanddo.firebaseio.com/availability');
//   refAvail.once('value', function(dataSnapshotAvail) {
//     $scope.avail = dataSnapshotAvail.val();
//     var refInterests = new Firebase('https://goanddo.firebaseio.com/interests');
//     refInterests.once('value', function(dataSnapshotInterests) {
//     $scope.interests = dataSnapshotInterests.val();
//     $scope.calendar = {};
//       $.each($scope.avail, function(dayIndex, dayObj) {
//         $scope.calendar[dayIndex] = {};
//         $.each(dayObj, function(halfHour, halfHourObj) {
//           $scope.calendar[dayIndex][halfHour] = {};
//           $.each(halfHourObj, function(interest, interestObj) {
//               $scope.calendar[dayIndex][halfHour][interest] = {};
//             if (Object.keys(interestObj).length >= $scope.interests[interest].minPeople) {
//               $scope.calendar[dayIndex][halfHour][interest].invited = {};
//               $.each(interestObj, function(facebookId, truth) {
//                 $scope.calendar[dayIndex][halfHour][interest].invited[facebookId] = true;
//               });
//               $scope.calendar[dayIndex][halfHour][interest].minPeople = $scope.interests[interest].minPeople;
//               $scope.calendar[dayIndex][halfHour][interest].maxPeople = $scope.interests[interest].maxPeople;
//             }
//           });
//         });
//       });
//       var refCalendar = new Firebase('https://goanddo.firebaseio.com/calendar');
//       var onComplete = function(error) {
//         if (error) {
//           console.log('makeCalendar() Synchronization failed', error);
//         } else {
//           console.log('makeCalendar() Synchronization succeeded');
//           typeof callback === 'function' && callback();
//         }
//       };
//       refCalendar.set($scope.calendar, onComplete);
//     });
//   });
// }

// $scope.getRandNum = function(min, max) {
//   return Math.random() * (max - min) + min;
// }

// $scope.getInvites = function(fbId) {
//   // var refPossibleEvents = new Firebase('https://goanddo.firebaseio.com/allPossibleEvents');
//   // refPossibleEvents.once('value', function(dataSnapshotPossibleEvents) {
//   //   $scope.possibleEvents = dataSnapshotPossibleEvents.val();
//     var refUserPossibleEvents = new Firebase(`https://goanddo.firebaseio.com/users/${fbId}/possibleEvents`);
//     refUserPossibleEvents.once('value', function(dataSnapshotUserPossibleEvents) {
//       if (!$rootScope[fbId]) {
//         $rootScope[fbId] = {};
//       }
//       $rootScope[fbId].possibleEvents = dataSnapshotUserPossibleEvents.val();
//       if (!$rootScope[fbId].invites) {
//         $rootScope[fbId].invites = [];
//       }
//       $.each($rootScope[fbId].possibleEvents, function(dayIndex, interestsObj) {
//         // if (!$rootScope[fbId].invites[dayIndex]) {
//         //   $rootScope[fbId].invites[dayIndex] = {};
//         //   $rootScope[fbId].invites[dayIndex].name = dayIndex;
//         // }
//         $.each(interestsObj, function(interestName, halfHoursObj) {
//           // if (!$rootScope[fbId].invites[dayIndex][interestName]) {
//           //   $rootScope[fbId].invites[dayIndex][interestName] = {};
//           //   $rootScope[fbId].invites[dayIndex][interestName].name = interestName;
//           // }
//           $.each(halfHoursObj, function(halfHour, bool) {
//             if (bool && $scope.calendar[interestName][dayIndex][halfHour]) {
//               console.log(interestName, dayIndex, halfHour, fbId);
//               // $rootScope[fbId].invites[dayIndex][interestName][halfHour] = {};
//               // $rootScope[fbId].invites[dayIndex][interestName][halfHour].name = halfHour;
//               // $.each($scope.calendar[interestName][dayIndex][halfHour], function(facebookId, truth) {
//                 // $rootScope[fbId].invites[dayIndex][interestName][halfHour][facebookId] = true;
//                 // $rootScope[fbId].invites[dayIndex][interestName][halfHour][facebookId].name = facebookId;
//                 // invited.push(facebookId);
//               // });
//               $rootScope[fbId].invites.push({
//                 day: $scope.getDay(dayIndex),
//                 interest: interestName,
//                 time: $scope.getTime(halfHour),
//                 // invited: Object.keys(halfHour.invited).length,
//                 // confirmed: Object.keys(halfHour.confirmed).length,
//                 // declined: Object.keys(halfHour.declined).length,
//                 minPeople: halfHour.minPeople,
//                 maxPeople: halfHour.maxPeople
//               });
//             }
//           });
//         });
//       });
//       var refInvites = new Firebase(`https://goanddo.firebaseio.com/users/${fbId}/invites`);
//       var onComplete = function(error) {
//         if (error) {
//           console.log('getInvites() Synchronization failed', error);
//         } else {
//           console.log('getInvites() Synchronization succeeded');
//         }
//       };
//       refInvites.set($rootScope[fbId].invites, onComplete);
//     });
//   // });
// }

// $scope.getAllInvites = function() {
//   var ref = new Firebase('https://goanddo.firebaseio.com/users');
//   ref.once('value', function(dataSnapshot) {
//     $.each(dataSnapshot.val(), function(fbId, userObj) {
//       console.log("fbId: ", fbId);
//       $scope.getInvites(fbId);
//     });
//   });
// }

// .controller('InvitesCtrl', function($scope, $rootScope, $firebase, $firebaseObject) {
// var vm = this;
// var facebookId = $rootScope.loggedInUser;

// vm.fetchInvites = function(fbId) {
//   var refInvites = new Firebase(`https://goanddo.firebaseio.com/users/${fbId}/invites`);
//   refInvites.once('value', function(dataSnapshotInvites) {
//     vm.invites = dataSnapshotInvites.val();
//   });
// }

// var refInvites = new Firebase(`https://goanddo.firebaseio.com/users/${facebookId}/invites`);
// var syncObject = $firebaseObject(refInvites);
// syncObject.$bindTo($scope, "data");

// $scope.queryCalendarForUserInvites(facebookId);

// })

//for all userIDs in users
//if there are enough people for an interest at a certain time
//put their IDs in an object within that time within that day within that interest

//for something where it's about friends of friends there would need to be a list made of all friends on a site that are connected
;