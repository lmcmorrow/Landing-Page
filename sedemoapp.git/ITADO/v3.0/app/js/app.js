// AngularJS App
var App = angular.module('usecaseApp', ['timer']);
//https://github.com/siddii/angular-timer

// Makes PouchDB available to AngularJS - turns on continuous replication
  App.factory('myPouch', function() {
    var mydb = new PouchDB('usecase-pouch');
      PouchDB.replicate('usecase-pouch', 'http://141.202.96.236:5984/usecase-db', {continuous: true});
      PouchDB.replicate('http://141.202.96.236:5984/usecase-db', 'usecase-pouch', {continuous: true});
    return mydb;
  });
// Wraps native PouchDB's API The service provides two helper functions
// return() and remove(id) that both return promises.
  App.factory('pouchWrapper', function($q, $rootScope, myPouch) {
    return {
      add: function(status, creator, title, description) {
        var deferred = $q.defer();
        var doc = {
          status: status,
          creator: creator,
          title: title,
          description: description,
          votes: 0
        };
        myPouch.post(doc, function(err, res) {
          $rootScope.$apply(function() {
            if (err) {
              deferred.reject(err)
            } else {
              deferred.resolve(res)
            }
          });
        });
        return deferred.promise;
      },
      remove: function(id) {
        var deferred = $q.defer();
        myPouch.get(id, function(err, doc) {
          $rootScope.$apply(function() {
            if (err) {
              deferred.reject(err);
            } else {
              myPouch.remove(doc, function(err, res) {
                $rootScope.$apply(function() {
                  if (err) {
                    deferred.reject(err)
                  } else {
                    deferred.resolve(res)
                  }
                });
              });
            }
          });
        });
        return deferred.promise;
      },
      upvote: function(id) {
        var deferred = $q.defer();
        myPouch.get(id, function(err, doc) {
          $rootScope.$apply(function() {
            if (err) {
              deferred.reject(err);
            } else {
              // alert(doc._rev + " " + id);
              doc.votes++;
              doc._id = id;
              myPouch.put(doc, doc._rev, doc._id, function(err, res) {
                console.log('myPouch.put');
                $rootScope.$apply(function() {
                  if (err) {
                    deferred.reject(err)
                  } else {
                    deferred.resolve(res)
                  }
                });
              });
            }
          });
        });
        return deferred.promise;
      },
      downvote: function(id) {
        var deferred = $q.defer();

        myPouch.get(id, function(err, doc) {
          $rootScope.$apply(function() {
            if (err) {
              deferred.reject(err);
            } else {
              doc.votes--;
              myPouch.put(doc, function(err, res) {
                $rootScope.$apply(function() {
                  if (err) {
                    deferred.reject(err)
                  } else {
                    deferred.resolve(res)
                  }
                });
              });
            }
          });
        });
        return deferred.promise;
      }
    };
  });
  App.factory('listener', function($rootScope, myPouch) {
    myPouch.changes({
      continuous: true,
      onChange: function(change) {
        if (!change.deleted) {
          
          $rootScope.$apply(function() {
            myPouch.get(change.id, function(err, doc) {
              $rootScope.$apply(function() {
                if (err) console.log(err);
                $rootScope.$broadcast('newUsecase', doc);
              })
            });
          })
        } else {
          $rootScope.$apply(function() {
            $rootScope.$broadcast('delUsecase', change.id);
          });
        }
      }
    })
  });
  App.controller('UsecaseCtrl', function($scope, listener, pouchWrapper) {
    $scope.future = new Date(2015, 0, 5); //Month is 0-11 in JavaScript
    $scope.submit = function() {
      pouchWrapper.add($scope.usecase.status, $scope.usecase.creator, $scope.usecase.title, $scope.usecase.description, $scope.usecase.votes).then(function(res) {
        $scope.usecase.status ='';
        $scope.usecase.creator = '';
        $scope.usecase.title = '';
        $scope.usecase.description='';
        $scope.usecase.votes='';
        console.log(res)
      }, function(reason) {
        console.log(reason);
      })
    };
    $scope.remove = function(id) {
      pouchWrapper.remove(id).then(function(res) {
//      console.log(res);
      }, function(reason) {
        console.log(reason);
      })
    };
    $scope.upvote = function(id) {
      pouchWrapper.upvote(id).then(function(res) {
//      console.log(res);
      }, function(reason) {
        console.log(reason);
      })
    };
    $scope.downvote = function(id) {
      pouchWrapper.downvote(id).then(function(res) {
//      console.log(res);
      }, function(reason) {
        console.log(reason);
      })
    };
    $scope.usecases = [];
    $scope.$on('newUsecase', function(event, usecase) {
      $scope.usecases.push(usecase);
      console.log('newUsecase');
    });
    $scope.$on('delUsecase', function(event, id) {
      for (var i = 0; i<$scope.usecases.length; i++) {
        if ($scope.usecases[i]._id === id) {
          $scope.usecases.splice(i,1);
          console.log('delUsecase');
        }
      }
    });
    $scope.$on('upvote', function(event, usecase) {
      console.log('upvote');
      $scope.usecases.put(usecase);
    });
    $scope.$on('downvote', function(event, usecase) {
      $scope.usecases.put(usecase);
      console.log('downvote');
    });
  });

//var future = new Date(2015, 0, 1); //Month is 0-11 in JavaScript
// App.future = 10;
