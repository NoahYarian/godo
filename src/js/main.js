var app = angular

  .module("goDo", ['ngRoute', 'firebase', 'ngFacebook'])

  .config( function( $facebookProvider ) {
    $facebookProvider.setAppId('103273773349279');
    $facebookProvider.setPermissions("user_friends");
    $facebookProvider.setCustomInit({
      channelUrl : '//godo.tehcode.com/channel.html',
      xfbml      : true
    });
  })

  .run( function( $rootScope ) {
    // Load the facebook SDK asynchronously
    (function(){
       // If we've already installed the SDK, we're done
       if (document.getElementById('facebook-jssdk')) {return;}

       // Get the first script element, which we'll use to find the parent node
       var firstScriptElement = document.getElementsByTagName('script')[0];

       // Create a new script element and set its id
       var facebookJS = document.createElement('script');
       facebookJS.id = 'facebook-jssdk';

       // Set the new script's source to the source of the Facebook JS SDK
       facebookJS.src = '//connect.facebook.net/en_US/sdk.js';

       // Insert the Facebook JS SDK into the DOM
       firstScriptElement.parentNode.insertBefore(facebookJS, firstScriptElement);
     }());
  })

  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/landing.html'
      })
      .when('/happenings', {
        templateUrl: 'views/happenings.html'
      })
      .when('/profile', {
        templateUrl: 'views/profile.html'
      })
      .when('/loggedin', {
        templateUrl: 'views/loggedin.html'
      })
      .when('/logout', {
        templateUrl: 'views/landing.html'
      });
    })

  .controller('FaceCtrl', function ($rootScope, $scope, $facebook) {
    $scope.login = function() {
      $facebook.login().then(function() {
        $scope.getMyInfo();
      });
    }
    $scope.loginAs = function(facebookId) {
      $rootScope.loggedInUser = facebookId;
      $rootScope[facebookId] = {};
      location.href = "/#/loggedin";
    }
    $scope.getMyInfo = function() {
      $facebook.api("/me")
        .then(function(response) {
          $rootScope.loggedInUser = response.id;
          var facebookId = $rootScope.loggedInUser;
          $rootScope[facebookId] = {};
          $rootScope[facebookId].me = response;
        });
      setTimeout(function() {
        $facebook.api("/me/friends")
          .then(function(response) {
            var facebookId = $rootScope.loggedInUser;
            var friendId;
            $rootScope[facebookId].friends = {};
            response.data.forEach(function(friend) {
              friendId = friend.id;
              $rootScope[facebookId].friends[friendId] = true;
            });
          });
      }, 2000);
      setTimeout(function() {
        var facebookId = $rootScope.loggedInUser;
        console.log($rootScope[facebookId].me);
        console.log($rootScope.loggedInUser);
        console.log($rootScope[facebookId].friends);
        var ref = new Firebase(`https://goanddo.firebaseio.com/users/${$rootScope.loggedInUser}`);
        ref.once('value', function(dataSnapshot) {
          if (!dataSnapshot.child('me').exists()) {
            //New user tasks here
            var ref2 = new Firebase(`https://goanddo.firebaseio.com/scheduleBoiler`);
            // console.log("ref2: ", ref2);
            ref2.once('value', function(dataSnapshot2) {
              // console.log("dataSnapshot2: ", dataSnapshot2, "ref: ", ref);
              ref.child('schedule').set(dataSnapshot2.val());
            }, function (err) {
              console.log("second once err:", err)
            });
          };
          ref.child('me').set($rootScope[facebookId].me);
          ref.child('friends').set($rootScope[facebookId].friends);
        }, function (err) {
          console.log("first once err:", err)
        });
        location.href = "/#/loggedin";
      }, 4000);
    }

    $scope.logout = function() {
      $facebook.logout().then(function() {
        location.href = '/#/';
      });
    }
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

  .controller("InterestsCtrl", function($rootScope, $scope, $firebaseObject) {
    var ref = new Firebase(`https://goanddo.firebaseio.com/interests`);
    var syncObject = $firebaseObject(ref);
    syncObject.$bindTo($scope, "data");

    var refUser = new Firebase(`https://goanddo.firebaseio.com/users/${$rootScope.loggedInUser}/interests`);
    var syncObjectUser = $firebaseObject(refUser);
    syncObjectUser.$bindTo($scope, "dataUser");

    $scope.addOne = function (item) {
      $scope.data[item] = true;
      $scope.name = '';
    }

    $scope.pickInterest = function(item) {
      $scope.dataUser[item] = $scope.dataUser[item] ? false : true;
    }
  })

  .controller("ScheduleCtrl", function($scope, $rootScope, $firebaseObject) {
    var facebookId = $rootScope.loggedInUser;
    console.log("scheduleCtrl ", facebookId);
    var ref = new Firebase(`https://goanddo.firebaseio.com/users/${facebookId}/schedule`);
    var syncObject = $firebaseObject(ref);
    syncObject.$bindTo($scope, "userSchedule");

    $scope.copyToRootScope = function() {
      $rootScope[facebookId].schedule = $scope.userSchedule;
      console.log("copied $scope.userSchedule to $rootScope[",facebookId,"].schedule");
      console.log("copyToRootScope() ",$rootScope);
    }
  })

  // .controller("ScheduleCtrl", function($rootScope, $firebaseArray) {
  //   var facebookId = $rootScope.loggedInUser;
  //   var ref = new Firebase(`https://goanddo.firebaseio.com/users/${facebookId}/schedule`);
  //   var syncObject = $firebaseArray(ref);
  //   syncObject.$bindTo($rootScope, "userSchedule");
  // })

  .controller('EventCtrl', function($scope, $rootScope, $firebase) {
    var facebookId = $rootScope.loggedInUser;

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

    $scope.getNextHalfHour = function (halfHour) {
      var timeArr = halfHour.split('');
      var nextHalfHour = ["0"];
      var nextHour;
      var doneArr;
      var hour = timeArr.slice(0, 2).join('');
      var nextHourNoZero = (Number(hour) + 1).toString();

      if (nextHourNoZero.length === 1) {
        nextHour = nextHourNoZero.split('');
        nextHour.unshift("0");
      } else {
        nextHour = nextHourNoZero.split('');
      }

      if (timeArr[2] === "3") {
        nextHalfHour.unshift("0");
        doneArr = nextHour.concat(nextHalfHour);
      } else {
        nextHalfHour.unshift("3");
        doneArr = hour.split('').concat(nextHalfHour);
      }
      return doneArr.join('');
    }

    // the ref at the top might not be needed if this is only happening once the person is logged in
    $scope.getBlocks = function(fbId, callback) {
      console.log("getBlocks() getting schedule ref for ", fbId);
      var ref = new Firebase(`https://goanddo.firebaseio.com/users/${fbId}/schedule`);
      // console.log(ref.parent().toString());
      ref.once('value', function(dataSnapshot) {
        $rootScope[fbId].schedule = dataSnapshot.val();
        $rootScope[fbId].timeBlocks = [];
        var k;
        var thisHalfHour;
        console.log(`$rootScope[${fbId}].schedule: `,$rootScope[fbId].schedule);
        $.each($rootScope[fbId].schedule, function(dayIndex, halfHoursObj) {
          // if (!$.isNumeric(dayIndex)) {
          //   return true;
          // }
          // console.log("dayIndex: ", dayIndex);
          // console.log("halfHoursObj: ", halfHoursObj);
          // console.log("fbId: ", fbId);
          // console.log(`before dayindex = {} $rootScope[${fbId}].timeBlocks: ${$rootScope[fbId].timeBlocks}`);
          $rootScope[fbId].timeBlocks[dayIndex] = {};
          // console.log(`dayindex = {} $rootScope[${fbId}].timeBlocks: ${$rootScope[fbId].timeBlocks}`);
          $.each(halfHoursObj, function(halfHour, bool) {
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
        console.log(`$rootScope[${fbId}].timeBlocks: `,$rootScope[fbId].timeBlocks);
        // console.log(`$rootScope[${fbId}]: ${$rootScope[fbId]}`);
        // console.log("$rootScope: ", $rootScope); //Ohhhhhh....
        console.log("getBlocks() ",$rootScope);
        typeof callback === 'function' && callback();
      });
    };

    $scope.getPossibleEvents = function(fbId, callback) {
      if (!$rootScope[fbId]) {
        $rootScope[fbId] = {};
      }
      $scope.getBlocks(fbId, function () {
        $rootScope[fbId].interestsArr = [];
        $rootScope[fbId].possibleEvents = [];
        var ref = new Firebase(`https://goanddo.firebaseio.com/users/${fbId}/interests`);
        ref.once('value', function(dataSnapshot) {
          $.each(dataSnapshot.val(), function(interest, bool) {
            // console.log(fbId, "interest: ", interest, "bool: ", bool);
            if (bool) {
              $rootScope[fbId].interestsArr.push(interest);
            }
          });
          // console.log(`$rootScope[${fbId}].interestsArr: ${$rootScope[fbId].interestsArr}`);
          var ref2 = new Firebase('https://goanddo.firebaseio.com/interests');
          ref2.once('value', function(dataSnapshot2) {
            $rootScope.interestTimes = {};
            $.each(dataSnapshot2.val(), function(interestName, interestObj) {
              $rootScope.interestTimes[interestName] = interestObj.time;
            });
            // console.log("$rootScope.interestTimes: ", $rootScope.interestTimes);
            $.each($rootScope[fbId].schedule, function(dayIndex, halfHoursObj) {
              if (!$.isNumeric(dayIndex)) {
                return true;
              }
              $rootScope[fbId].possibleEvents[dayIndex] = {};
              $.each(halfHoursObj, function(halfHour, bool) {
                $rootScope[fbId].interestsArr.forEach(function(userInterest) {
                  if (!$rootScope[fbId].possibleEvents[dayIndex][userInterest]) {
                    $rootScope[fbId].possibleEvents[dayIndex][userInterest] = {};
                  }
                  if (bool && $rootScope[fbId].timeBlocks[dayIndex][halfHour] >= $rootScope.interestTimes[userInterest]) { //time block length starting this halfhour > interest time req.?
                    $rootScope[fbId].possibleEvents[dayIndex][userInterest][halfHour] = true;
                  } else {
                  // if not a free half hour or not enough time, do this
                  $rootScope[fbId].possibleEvents[dayIndex][userInterest][halfHour] = false;
                  }
                });
              });
            });
            console.log(`$rootScope[${fbId}].possibleEvents :`, $rootScope[fbId].possibleEvents);
            var ref3 = new Firebase(`https://goanddo.firebaseio.com/users/${fbId}`);
            var onComplete = function(error) {
              if (error) {
                console.log('getPossibleEvents() synchronization failed');
              } else {
                console.log('getPossibleEvents() synchronization succeeded, about to call ', callback);
                typeof callback === 'function' && callback();
              }
            };
            console.log("getPossibleEvents() ",$rootScope);
            ref3.child('possibleEvents').set($rootScope[fbId].possibleEvents, onComplete);
          });
        });
      });
    };

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

    $scope.userAvailToFirebase = function(fbId) {
      $scope.getPossibleEvents(fbId, function() {
        var ref = new Firebase(`https://goanddo.firebaseio.com/availability`);
        console.log("$rootScope[",fbId,"].possibleEvents: ", $rootScope[fbId].possibleEvents);
        $rootScope[fbId].possibleEvents.forEach(function(day, i) {
          console.log("i:", i, "day:", day);
          $.each(day, function(interest, startTimesObj) {
            console.log("interest: ", interest, "startTimesObj: ", startTimesObj);
            $.each(startTimesObj, function(startTime, bool) {
              var onComplete = function(error) {
                if (error) {
                  console.log('Synchronization failed', error);
                } else {
                  console.log('Synchronization succeeded');
                }
              };
              if (bool) {
                ref.child(`${interest}/${i}/${startTime}/${fbId}`).set(true, onComplete);
              } else {
                ref.child(`${interest}/${i}/${startTime}/${fbId}`).remove();
              }
            });
          });
        });
      });
      console.log("userAvailToFirebase(",fbId,") ",$rootScope);
    };

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

    $scope.allUserAvailToFirebase = function () {
      var ref = new Firebase('https://goanddo.firebaseio.com/users');
      ref.once('value', function(dataSnapshot) {
        $.each(dataSnapshot.val(), function(fbId, userObj) {
          console.log("fbId: ", fbId);
          $scope.userAvailToFirebase(fbId);
        });
      });
      console.log("allUserAvailToFirebase() ",$rootScope);
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

    $scope.makeEventsIfEnoughPeople = function() {
      var refAvail = new Firebase('https://goanddo.firebaseio.com/availability');
      refAvail.once('value', function(dataSnapshotAvail) {
        $scope.avail = dataSnapshotAvail.val();
        var refInterests = new Firebase('https://goanddo.firebaseio.com/interests');
        refInterests.once('value', function(dataSnapshotInterests) {
        $scope.interests = dataSnapshotInterests.val();
        $scope.possibleEventsWithEnoughPeople = {};
          $.each($scope.avail, function(interestName, weekObj) {
            if (!$scope.possibleEventsWithEnoughPeople[interestName]) {
              $scope.possibleEventsWithEnoughPeople[interestName] = {};
            }
            $.each(weekObj, function(dayIndex, dayObj) {
              if (!$scope.possibleEventsWithEnoughPeople[interestName][dayIndex]) {
                $scope.possibleEventsWithEnoughPeople[interestName][dayIndex] = {};
              }
              $.each(dayObj, function(halfHour, userListObj) {
                if (!$scope.possibleEventsWithEnoughPeople[interestName][dayIndex]) {
                  $scope.possibleEventsWithEnoughPeople[interestName][dayIndex] = {};
                }
                if (Object.keys(userListObj).length >= $scope.interests[interestName].minPeople) {
                  $scope.possibleEventsWithEnoughPeople[interestName][dayIndex][halfHour] = true;
                } else {
                  $scope.possibleEventsWithEnoughPeople[interestName][dayIndex][halfHour] = false;
                }
              });
            });
          });
        });
      });

    }


  })

//for all userIDs in users
//if there are enough people for an interest at a certain time
//put their IDs in an object within that time within that day within that interest



//for something where it's about friends of friends there would need to be a list made of all friends on a site that are connected



