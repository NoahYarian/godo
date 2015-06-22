'use strict';

var app = angular.module('goDo', ['ngRoute', 'firebase']).config(function ($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: 'views/landing.html'
  }).when('/happening', {
    templateUrl: 'views/happening.html'
  }).when('/profile', {
    templateUrl: 'views/profile.html'
  }).when('/login', {
    templateUrl: 'views/login.html'
  });
}).controller('LandingCtrl', function ($scope, $firebaseObject) {
  var ref = new Firebase('https://goanddo.firebaseio.com/data');
  // download the data into a local object
  var syncObject = $firebaseObject(ref);
  // synchronize the object with a three-way data binding
  // click on `index.html` above to see it used in the DOM!
  syncObject.$bindTo($scope, 'data');
}).controller('ArrayCtrl', function ($scope, $firebaseArray) {
  var ref = new Firebase('https://goanddo.firebaseio.com/messages');
  // create a synchronized array
  // click on `index.html` above to see it used in the DOM!
  $scope.messages = $firebaseArray(ref);

  // add new items to the array
  // the message is automatically added to our Firebase database!
  $scope.addMessage = function () {
    $scope.messages.$add({
      text: $scope.newMessageText
    });
  };
}).controller('FBCtrl', function ($scope, $firebaseAuth) {
  var vm = this;
  vm.login = function () {
    vm.ref = new Firebase('https://goanddo.firebaseio.com');
    vm.ref.authWithOAuthPopup('facebook', function (error, authData) {
      if (error) {
        console.log('Login Failed!', error);
      } else {
        console.log('Authenticated successfully with payload:', authData);
      }
    });
  };
});