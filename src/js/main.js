var app = angular
  .module("goDo", ['ngRoute'])

  .config(function($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/landing.html',
        controller: 'mainController',
        controllerAs: 'main'
      })
      .when('/happening', {
        templateUrl: 'views/happening.html'
      })
      .when('/profile', {
        templateUrl: 'views/profile.html'
      })
      .when('/login', {
        templateUrl: 'views/login.html'
      })
    })

  .controller('mainController', function() {});
