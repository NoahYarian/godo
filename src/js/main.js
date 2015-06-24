var app = angular

  .module("goDo", ['ngRoute', 'firebase'])

  // .run(['$rootScope', '$window', 'srvAuth',
  //   function($rootScope, $window, sAuth) {

  //   $rootScope.user = {};

  //   $window.fbAsyncInit = function() {
  //     // Executed when the SDK is loaded

  //     FB.init({

  //       /*
  //        The app id of the web app;
  //        To register a new app visit Facebook App Dashboard
  //        ( https://developers.facebook.com/apps/ )
  //       */

  //       appId: '103273773349279',

  //       /*
  //        Adding a Channel File improves the performance
  //        of the javascript SDK, by addressing issues
  //        with cross-domain communication in certain browsers.
  //       */

  //       channelUrl: '../channel.html',


  //        Set if you want to check the authentication status
  //        at the start up of the app


  //       status: true,

  //       /*
  //        Enable cookies to allow the server to access
  //        the session
  //       */

  //       cookie: true,

  //       /* Parse XFBML */

  //       xfbml: true
  //     });

  //     sAuth.watchAuthenticationStatusChange();

  //   };

  //   // Are you familiar to IIFE ( http://bit.ly/iifewdb ) ?

  //   (function(d){
  //     // load the Facebook javascript SDK

  //     var js,
  //     id = 'facebook-jssdk',
  //     ref = d.getElementsByTagName('script')[0];

  //     if (d.getElementById(id)) {
  //       return;
  //     }

  //     js = d.createElement('script');
  //     js.id = id;
  //     js.async = true;
  //     js.src = "//connect.facebook.net/en_US/all.js";

  //     ref.parentNode.insertBefore(js, ref);

  //   }(document));

  // }])

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
      })
    })

  .controller("LandingCtrl", function($scope, $firebaseObject) {
    var ref = new Firebase("https://goanddo.firebaseio.com/data");
    // download the data into a local object
    var syncObject = $firebaseObject(ref);
    // synchronize the object with a three-way data binding
    // click on `index.html` above to see it used in the DOM!
    syncObject.$bindTo($scope, "data");
  })

  .controller("ArrayCtrl", function($scope, $firebaseArray) {
    var ref = new Firebase("https://goanddo.firebaseio.com/messages");
    // create a synchronized array
    // click on `index.html` above to see it used in the DOM!
    $scope.messages = $firebaseArray(ref);

    // add new items to the array
    // the message is automatically added to our Firebase database!
    $scope.addMessage = function() {
      $scope.messages.$add({
        text: $scope.newMessageText
      });
    };
  })

  .controller("FBCtrl", function($rootScope, $scope, $firebaseAuth) {
    var vm = this;
    vm.login = function() {
      vm.ref = new Firebase("https://goanddo.firebaseio.com");
      vm.ref.authWithOAuthPopup("facebook", function(error, authData) {
        if (error) {
          console.log("Login Failed!", error);
        } else {
          console.log("Authenticated successfully with payload:", authData);
          $rootScope.loggedInUser = authData.uid;
          console.log($rootScope.loggedInUser);
          location.href = "/#/loggedin";
        }
      }/*, {scope: 'user_friends'}*/);
    }
    vm.logout = function() {
      vm.ref = new Firebase("https://goanddo.firebaseio.com");
      vm.ref.unauth();
      location.href = "/#/";
    }
  })

  // .controller("addInterestsCtrl", function($rootScope, $scope, $firebaseArray) {
  //   var ref = new Firebase(`https://goanddo.firebaseio.com/interests`);
  //   $scope.list = $firebaseArray(ref);
  //   $scope.addOne = function() {
  //     $scope.list.$add({ name: $scope.name }).then(function(ref) {
  //       console.log("added record {name: " + $scope.name + "} with id " + ref.key());
  //       $scope.name = '';
  //     });
  //   }
  //   $scope.removeOne = function(item) {
  //     $scope.list.$remove(item).then(function(ref) {
  //       console.log(ref.key())
  //     });
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

    // $scope.addOne = function() {
    //   $scope.interestsList.$add({ name: $scope.name }).then(function(ref) {
    //     console.log("added record {name: " + $scope.name + "} with id " + ref.key());
    //     $scope.name = '';
    //   });
    // }
    // $scope.removeOne = function(item) {
    //   $scope.interestsList.$remove(item).then(function(ref) {
    //     console.log(ref.key())
    //   });
    // }
    $scope.pickInterest = function(item) {
      $scope.dataUser[item] = $scope.dataUser[item] ? false : true;
    }
  })

  .controller("pickInterestsCtrl", function($rootScope, $scope, $firebaseObject) {
    var ref = new Firebase(`https://goanddo.firebaseio.com/users/${$rootScope.loggedInUser}/interests`);
    var syncObject = $firebaseObject(ref);
    syncObject.$bindTo($scope, "data");
    console.log(syncObject);
    $scope.pickInterest = function (interestClicked) {
      data[interestClicked] = "true";
      console.log(interestClicked);
    }
  })

  .controller("ScheduleCtrl", function($rootScope, $scope, $firebaseObject) {
    var ref = new Firebase(`https://goanddo.firebaseio.com/users/${$rootScope.loggedInUser}/schedule`);
    // download the data into a local object
    var syncObject = $firebaseObject(ref);
    // synchronize the object with a three-way data binding
    // click on `index.html` above to see it used in the DOM!
    syncObject.$bindTo($scope, "data");
  })

  // .factory('srvAuth', function () {

  //   watchLoginChange = function() {
  //     var vm = this;
  //     FB.Event.subscribe('auth.authResponseChange', function(res) {
  //       if (res.status === 'connected') {
  //         /*
  //          The user is already logged,
  //          is possible retrieve his personal info
  //         */
  //         vm.getUserInfo();
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
  //     var vm = this;
  //     FB.api('/me', function(res) {
  //       $rootScope.$apply(function() {
  //         $rootScope.user = vm.user = res;
  //       });
  //     });
  //   }

  //   logout = function() {
  //     var vm = this;
  //     FB.logout(function(response) {
  //       $rootScope.$apply(function() {
  //         $rootScope.user = vm.user = {};
  //       });
  //     });
  //   }
  // })
