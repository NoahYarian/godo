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
}).controller('FaceCtrl', function ($rootScope, $scope, $facebook) {
  $scope.login = function () {
    $facebook.login().then(function () {
      $scope.getMyInfo();
    });
  };
  $scope.getMyInfo = function () {
    $scope.friends = {};
    $facebook.api('/me').then(function (response) {
      $rootScope.loggedInUser = response.id;
      $scope.loginInfo = response;
    });
    setTimeout(function () {
      $facebook.api('/me/friends').then(function (response) {
        var id;
        response.data.forEach(function (friend) {
          id = friend.id;
          $scope.friends[id] = true;
        });
      });
    }, 2000);
    setTimeout(function () {
      console.log($scope.loginInfo);
      console.log($rootScope.loggedInUser);
      console.log($scope.friends);
      var ref = new Firebase('https://goanddo.firebaseio.com/users/' + $rootScope.loggedInUser);
      ref.child('basicInfo').set($scope.loginInfo);
      ref.child('friends').set($scope.friends);
      location.href = '/#/loggedin';
    }, 4000);
  };

  $scope.logout = function () {
    $facebook.logout().then(function () {
      location.href = '/#/';
    });
  };
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
}).controller('EventCtrl', function ($scope, $rootScope, $firebase, $firebaseObject) {
  $scope.freeHalfHours = [];
  $scope.timeBlocks = [];
  $scope.getAvailability = function (facebookId, callback) {
    $.get('https://goanddo.firebaseio.com/users/' + facebookId + '/schedule.json', function (data) {
      var dayObjArr = [];
      dayObjArr.push(data.mon, data.tue, data.wed, data.thu, data.fri, data.sat, data.sun);
      dayObjArr.forEach(function (day, i) {
        $scope.freeHalfHours[i] = [];
        for (var halfHour in day) {
          if (day[halfHour] === 'true') {
            $scope.freeHalfHours[i].push(halfHour);
          }
        }
      });
    }).done(function () {
      console.log($scope.freeHalfHours);
      typeof callback === 'function' && callback();
    });
  };

  $scope.isNextHour = function (halfHour1, halfHour2) {
    // if (!halfHour1 || !halfHour2) {
    //   return false;
    // }
    var half1Arr = halfHour1.split('');
    var half2Arr = halfHour2.split('');
    console.log(Number(half1Arr.slice(1, 3).join('')));
    console.log(Number(half2Arr.slice(1, 3).join('')));
    if (half1Arr[3] === '0' && half2Arr[3] === '3') {
      if (Number(half1Arr.slice(1, 3).join('')) === Number(half2Arr.slice(1, 3).join(''))) {
        console.log('yep');
        return true;
      } else {
        console.log('nope');
        return false;
      }
    } else if (half1Arr[3] === '3' && half2Arr[3] === '0') {
      if (Number(half1Arr.slice(1, 3).join('')) + 1 === Number(half2Arr.slice(1, 3).join(''))) {
        console.log('yep');
        return true;
      } else {
        console.log('nope');
        return false;
      }
    } else {
      console.log('nope');
      return false;
    }
  };

  $scope.getBlocks = function (facebookId) {
    $scope.getAvailability(facebookId, function () {
      $scope.freeHalfHours.forEach(function (day, i) {
        console.log(day);
        $scope.timeBlocks[day] = {};
        // day.forEach(function(halfHour, j) {
        for (var j = 0; j < day.length - 1; j++) {
          $scope.timeBlocks[day][halfHour] = 0.5;
          console.log('day[j] ', day[j]);
          console.log('day[j+1] ', day[j + 1]);
          console.log('is Next?', $scope.isNextHour(day[j], day[j + 1]));
          if ($scope.isNextHour(day[j], day[j + 1])) {
            $scope.timeBlocks[day][halfHour] += 0.5;
          }
        }
      });
      console.log('timeblocks', $scope.timeBlocks);
    });
  };
});