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
    $facebook.api('/me/friends').then(function (response) {
      var id;
      response.data.forEach(function (friend) {
        id = friend.id;
        $scope.friends[id] = true;
      });
    });
    setTimeout(function () {
      console.log($scope.loginInfo);
      console.log($rootScope.loggedInUser);
      console.log($scope.friends);
    }, 3000);
  };
  //location.href = "/#/loggedin";
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
})

// .factory('srvAuth', function () {

//   watchLoginChange = function() {
//     var _self = this;
//     FB.Event.subscribe('auth.authResponseChange', function(res) {
//       if (res.status === 'connected') {
//         /*
//          The user is already logged,
//          is possible retrieve his personal info
//         */
//         _self.getUserInfo();
//         /*
//          This is also the point where you should create a
//          session for the current user.
//          For this purpose you can use the data inside the
//          res.authResponse object.
//         */
//       }
//       else {
//         /*
//          The user is not logged to the app, or into Facebook:
//          destroy the session on the server.
//         */
//       }
//     });
//   }

//   getUserInfo = function() {
//     var _self = this;
//     FB.api('/me', function(res) {
//       $rootScope.$apply(function() {
//         $rootScope.user = _self.user = res;
//       });
//     });
//   }

//   logout = function() {
//     var _self = this;
//     FB.logout(function(response) {
//       $rootScope.$apply(function() {
//         $rootScope.user = _self.user = {};
//       });
//     });
//   }
// })
;