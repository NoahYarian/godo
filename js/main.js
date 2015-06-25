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
  $scope.hourBlocks = {};

  $scope.getUserStartTimes = function () {
    var week = [];
    var week2 = [];
    $.get('https://goanddo.firebaseio.com/users/fakeface/schedule.json', function (data) {
      week[0] = data.monday;
      week[1] = data.tuesday;
      week[2] = data.wednesday;
      week[3] = data.thursday;
      week[4] = data.friday;
      week[5] = data.saturday;
      week[6] = data.sunday;
      week.forEach(function (day) {
        week2[day] = [];
        $.each(day, function (key, value) {
          if (value) {
            week2[day].push(key);
          }
        });
      });
      console.log(week);
      console.log(week2);
    });
  }
  // setTimeout(function() {
  //   console.log($scope.hourBlocks);
  // }, 5000);
  ;
});