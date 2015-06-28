.controller('FaceCtrl', function ($rootScope, $scope, $facebook, $firebaseObject) {
    $scope.login = function() {
      $facebook.login().then(function() {
        $scope.getId();
        setTimeout(function () {
          $scope.refresh();
          setTimeout(function () {
            $scope.getFriends();
          }, 2000);
        }, 2000);
      });
    }
    $scope.getId = function() {
      $facebook.api("/me").then(
        function(response) {
          $rootScope.loggedInUser = response.id;
      });
    }
    $scope.refresh = function() {
      $facebook.api("/me").then(
        function(response) {
          console.log("refresh response: ", response);
          // $scope.resMe = response;
          // $rootScope.loggedInUser = response.id;
          console.log("refresh loggedInUser: ", $rootScope.loggedInUser);
          var refMe = new Firebase(`https://goanddo.firebaseio.com/users/${$rootScope.loggedInUser}/loginObj`);
          var objMe = $firebaseObject(refMe);
          objMe.$loaded()
            .then(function(objMe) {
              objMe.loginInfo = response;
            });
          objMe.$save()
            .then(function(refMe) {
              refMe.key() === objMe.$id; // true
            }, function(error) {
              console.log("Error:", error);
            });
          console.log("Login obj: ", objMe)
          location.href = "/#/loggedin";
        },
        function(err) {
          console.log("Facebook login issue...", err)
        });
    }
    $scope.getFriends = function() {
      $facebook.api("/me/friends").then(
        function(response) {
          // $scope.resFriends = response;
          console.log("getFriends response: ", response);
          console.log("getFriends loggedInUser: ", $rootScope.loggedInUser);
          var refFriends = new Firebase(`https://goanddo.firebaseio.com/users/${$rootScope.loggedInUser}/friends`);
          var objFriends = $firebaseObject(refFriends);
          // objFriends.$loaded().then(function (objFriends) {
            objFriends = response;
            objFriends.data.forEach(function(friend) {
              console.log(friend.id, friend.name);
              var id = friend.id;
              objFriends[id] = true;
            });
          // });
          // obj.$save().then(function(ref) {
          //   ref.key() === obj.$id; // true
          // }, function(error) {
          //   console.log("Error:", error);
          // });
          console.log("Friend obj: ", objFriends);

        },
        function(err) {
          console.log(err);
        });
    }
    $scope.logout = function() {
      $facebook.logout().then(function() {
        location.href = '/#/';
      });
    }
  })
