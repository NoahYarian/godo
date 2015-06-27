'use strict';

var app = angular.module('goDo', ['ngRoute', 'firebase', 'ngFacebook']).config(function ($facebookProvider) {
  $facebookProvider.setAppId('103273773349279');
  $facebookProvider.setPermissions('user_friends');
  $facebookProvider.setCustomInit({
    channelUrl: '//godo.tehcode.com/channel.html',
    xfbml: true
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
}).config(function ($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/landing.html'
  }).when('/happenings', {
    templateUrl: 'views/happenings.html'
  }).when('/profile', {
    templateUrl: 'views/profile.html'
  }).when('/loggedin', {
    templateUrl: 'views/loggedin.html'
  }).when('/logout', {
    templateUrl: 'views/landing.html'
  });
}).controller('FaceCtrl', function ($rootScope, $scope, $facebook) {
  $scope.login = function () {
    $facebook.login().then(function () {
      $scope.getMyInfo();
    });
  };
  $scope.getMyInfo = function () {
    $rootScope.friends = {};
    $facebook.api('/me').then(function (response) {
      $rootScope.loggedInUser = response.id;
      $scope.loginInfo = response;
    });
    setTimeout(function () {
      $facebook.api('/me/friends').then(function (response) {
        var id;
        response.data.forEach(function (friend) {
          id = friend.id;
          $rootScope.friends[id] = true;
        });
      });
    }, 2000);
    setTimeout(function () {
      console.log($scope.loginInfo);
      console.log($rootScope.loggedInUser);
      console.log($rootScope.friends);
      var ref = new Firebase('https://goanddo.firebaseio.com/users/' + $rootScope.loggedInUser);
      ref.once('value', function (dataSnapshot) {
        if (!dataSnapshot.child('basicInfo').exists()) {
          //New user tasks here
          console.log('MCFLY?');
          var ref2 = new Firebase('https://goanddo.firebaseio.com/scheduleBoiler');
          console.log('ref2: ', ref2);
          ref2.once('value', function (dataSnapshot2) {
            console.log('dataSnapshot2: ', dataSnapshot2, 'ref: ', ref);
            ref.child('schedule').set(dataSnapshot2.val());
          }, function (err) {
            console.log('second once err:', err);
          });
        };
        ref.child('basicInfo').set($scope.loginInfo);
        ref.child('friends').set($rootScope.friends);
      }, function (err) {
        console.log('first once err:', err);
      });
      location.href = '/#/loggedin';
    }, 4000);
  };

  $scope.logout = function () {
    $facebook.logout().then(function () {
      location.href = '/#/';
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
//         location.href = "/#/loggedin";
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

  $scope.addOne = function (item) {
    $scope.data[item] = true;
    $scope.name = '';
  };

  $scope.pickInterest = function (item) {
    $scope.dataUser[item] = $scope.dataUser[item] ? false : true;
  };
}).controller('ScheduleCtrl', function ($rootScope, $scope, $firebaseObject) {
  var ref = new Firebase('https://goanddo.firebaseio.com/users/' + $rootScope.loggedInUser + '/schedule');
  var syncObject = $firebaseObject(ref);
  syncObject.$bindTo($scope, 'data');
}).controller('EventCtrl', function ($scope, $rootScope, $firebase, $firebaseObject, $http) {
  $scope.possibleEventsUser = {};

  $scope.getAvailability = function (facebookId, callback) {
    $scope.freeHalfHours = [];
    $.get('https://goanddo.firebaseio.com/users/' + facebookId + '/schedule.json', function (data) {
      var dayObjArr = [];
      dayObjArr.push(data.mon, data.tue, data.wed, data.thu, data.fri, data.sat, data.sun);
      // console.log("dayObjArr: ", dayObjArr);
      dayObjArr.forEach(function (day, i) {
        $scope.freeHalfHours[i] = [];
        for (var halfHour in day) {
          if (day[halfHour]) {
            $scope.freeHalfHours[i].push(halfHour);
          }
        }
      });
    }).done(function () {
      // console.log("$scope.freeHalfHours: ", $scope.freeHalfHours);
      typeof callback === 'function' && callback();
    });
  };

  $scope.isNextHalfHour = function (halfHour1, halfHour2) {
    if (!halfHour1 || !halfHour2) {
      // console.log("nope, undefined arg", "1: ", halfHour1, "2: ", halfHour2);
      return false;
    }
    var half1Arr = halfHour1.split('');
    var half2Arr = halfHour2.split('');
    // console.log(Number(half1Arr.slice(1,3).join('')));
    // console.log(Number(half2Arr.slice(1,3).join('')));
    if (half1Arr[3] === '0' && half2Arr[3] === '3') {
      if (Number(half1Arr.slice(1, 3).join('')) === Number(half2Arr.slice(1, 3).join(''))) {
        // console.log("yep", halfHour1, halfHour2);
        return true;
      } else {
        // console.log("nope", halfHour1, halfHour2);
        return false;
      }
    } else if (half1Arr[3] === '3' && half2Arr[3] === '0') {
      if (Number(half1Arr.slice(1, 3).join('')) + 1 === Number(half2Arr.slice(1, 3).join(''))) {
        // console.log("yep", halfHour1, halfHour2);
        return true;
      } else {
        // console.log("nope", halfHour1, halfHour2);
        return false;
      }
    } else {
      // console.log("nope", halfHour1, halfHour2);
      return false;
    }
  };

  // TODO: Fix this shit for days with multiple time blocks
  $scope.getBlocks = function (facebookId, callback) {
    $scope.getAvailability(facebookId, function () {
      $scope.timeBlocks = [];
      var k;
      $scope.freeHalfHours.forEach(function (day, i) {
        // console.log(i, day);
        $scope.timeBlocks[i] = {};
        day.forEach(function (halfHour, j) {
          k = 0;
          $scope.timeBlocks[i][halfHour] = 0.5;
          // console.log("day[j] ", day[j]);
          // console.log("day[j+1] ", day[j+1]);
          while (k < day.length + 1 - j) {
            if ($scope.isNextHalfHour(day[j + k], day[j + k + 1])) {
              $scope.timeBlocks[i][halfHour] += 0.5;
            }
            k++;
          }
        });
      });
      // console.log("timeBlocks", $scope.timeBlocks);
    });
    typeof callback === 'function' && callback();
  };

  $scope.getPossibleEventsUser = function (facebookId, callback) {
    $scope.getBlocks(facebookId, function () {
      $scope.interestsArr = [];
      $scope.interestTimes = {};
      $scope.possibleEventsUser[facebookId] = [];
      $http.get('https://goanddo.firebaseio.com/users/' + facebookId + '/interests.json').success(function (data) {
        $.each(data, function (interest, truth) {
          console.log('interest: ', interest, 'data[interest]: ', data[interest]);
          if (data[interest]) {
            $scope.interestsArr.push(interest);
          }
        });
        // console.log("interestsArr: ", $scope.interestsArr);
        $http.get('https://goanddo.firebaseio.com/interests.json').success(function (data) {
          $.each(data, function (interest, truth) {
            $scope.interestTimes[interest] = data[interest].time;
          });
          // console.log("$scope.interestTimes: ", $scope.interestTimes);
          // now make an object of interests and their possible times for the user's availability
          $scope.freeHalfHours.forEach(function (day, i) {
            //day => ["t0530", "t0600", "t1230"]
            $scope.possibleEventsUser[facebookId][i] = {}; //$scope.possibleEventsUser => [{},{},{},{},{},{},{}]
            day.forEach(function (freeHalfHour, j) {
              //freeHalfHour => "t0530"
              $scope.interestsArr.forEach(function (userInterest) {
                //userInterest => "Ultimate Frisbee"
                // console.log("$scope.timeBlocks[i][freeHalfHour]: ", $scope.timeBlocks[i][freeHalfHour]);
                // console.log("$scope.interestTimes[userInterest]: ", $scope.interestTimes[userInterest]);
                if ($scope.timeBlocks[i][freeHalfHour] >= $scope.interestTimes[userInterest]) {
                  //time block length starting this halfhour > interest time req.?
                  if (!$scope.possibleEventsUser[facebookId][i][userInterest]) {
                    $scope.possibleEventsUser[facebookId][i][userInterest] = [];
                  }
                  $scope.possibleEventsUser[facebookId][i][userInterest].push(freeHalfHour);
                  // console.log("freeHalfHour: ", freeHalfHour);
                }
              });
            });
          });
        }).then(function () {
          console.log(facebookId, ' $scope.possibleEventsUser[facebookId]: ', $scope.possibleEventsUser[facebookId]);
          var ref = new Firebase('https://goanddo.firebaseio.com/users/' + facebookId);
          ref.child('possibleEvents').set($scope.possibleEventsUser[facebookId]);
          typeof callback === 'function' && callback();
        });
      });
    });
  };

  $scope.getFriendPossibleEvents = function (facebookId, callback) {
    $scope.friendPossibleEvents = {};
    $rootScope.friends = { fakedata2: true, fakedata3: true, fakedata4: true, fakedata5: true };
    $rootScope.friends[facebookId] = true;
    // console.log($rootScope.friends);
    $.each($rootScope.friends, function (friendId, truth) {
      // console.log(friendId);
      $.get('https://goanddo.firebaseio.com/users/' + friendId + '/possibleEvents.json', function (data) {
        $scope.friendPossibleEvents[friendId] = data;
        // $scope.friendPossibleEvents.push(data);
      }).done(function () {
        console.log('$scope.friendPossibleEvents for', facebookId, ': ', $scope.friendPossibleEvents);
        if (Object.keys($scope.friendPossibleEvents).length === Object.keys($rootScope.friends).length) {
          var ref = new Firebase('https://goanddo.firebaseio.com/users/' + facebookId);
          ref.child('friendPossibleEvents').set($scope.friendPossibleEvents);
        }
        typeof callback === 'function' && callback();
      });
    });
  };

  //TODO: maybe restructure data so startTimes are objects instead of members of an array?
  $scope.makeEvents = function (facebookId) {
    $scope.events = $scope.possibleEventsUser[facebookId];
    // console.log($scope.friendPossibleEvents);
    for (var friend in $scope.friendPossibleEvents) {
      // console.log("$scope.friendPossibleEvents[",friend,"]: ", $scope.friendPossibleEvents[friend]);
      $scope.friendPossibleEvents[friend].forEach(function (day, i) {
        // console.log($scope.events);
        // console.log("friend: ", friend, "day index: ", i, "day: ", day);
        if (day) {
          for (var interest in day) {
            // console.log(friend, i, interest, day[interest]);
            day[interest].forEach(function (startTime) {
              for (var friend2 in $scope.friendPossibleEvents) {
                // console.log(friend, friend2, i, startTime, interest);
                // console.log("$scope.friendPossibleEvents[friend2][i]: ", $scope.friendPossibleEvents[friend2][i]);
                if ($scope.events[i][interest] && (!$scope.friendPossibleEvents[friend2][i] || !$scope.friendPossibleEvents[friend2][i][interest] || $scope.friendPossibleEvents[friend2][i][interest].indexOf(startTime) === -1)) {
                  $scope.events[i][interest].splice($scope.events[i][interest].indexOf(startTime), 1);
                }
              }
            });
          }
        }
      });
    };
    // console.log($scope.friendPossibleEvents)
    console.log('$scope.events: ', $scope.events);
  };
  //WAIT. what did I just write?! That was a function that found what events are shared in common by a person and ALL of their friends....

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

  $scope.userAvailToFirebase = function (facebookId) {
    var ref = new Firebase('https://goanddo.firebaseio.com/availability');
    $scope.possibleEventsUser[facebookId].forEach(function (day, i) {
      console.log('i:', i, 'day:', day);
      $.each(day, function (interest, startTimesArr) {
        console.log('interest: ', interest, 'startTimesArr: ', startTimesArr);
        startTimesArr.forEach(function (startTime) {
          ref.child(interest + '/' + i + '/' + startTime + '/' + facebookId).set('true');
        });
      });
    });
  };

  $scope.allUserAvailToFirebase = function () {
    $http.get('https://goanddo.firebaseio.com/users.json').success(function (data) {
      $scope.users = data;
      $.each(data, function (facebookId, userObj) {
        $scope.userAvailToFirebase(facebookId);
      });
    });
  }

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

  ;
})

//for all userIDs in users
//if there are enough people for an interest at a certain time
//put their IDs in an object within that time within that day within that interest

//for something where it's about friends of friends there would need to be a list made of all friends on a site that are connected
;