(function() {

    "use strict";

    angular.module("pouchUtils", [] )


    .factory("pouchService", [ "$q", function(q) {

        var svc = {};
        svc.getDocListFactory = function(db) {
             return function() {
                var deferred = $q.defer();
                db.allDocs({include_docs: true, conflicts:true}, function(err, doc) {
                    if (err){
                      deferred.reject(err);
                    }
                    var out = _.pluck(doc.rows, 'doc');
                    deferred.resolve(out);
                });
                return deferred.promise;
            };
        };

        svc.getDocFactory = function(db){
            return function(id){
                var deferred = $q.defer();
                db.get(id, { include_docs:true }, function(err, doc) {
                    if (err){
                      deferred.reject(err);
                    }
                    deferred.resolve(doc);
                });
                return deferred.promise;
            };
        };

        svc.saveDocFactory = function(db) {
                return function(item) {
                    var deferred = $q.defer();
                    if (item._id && item._rev){
                        db.put(item, item._id, item._rev)
                        .then(function(response) {
                          item._rev = response.rev;
                          deferred.resolve(item);
                        })
                        .catch(function(err) {
                          deferred.reject(err);
                        });
                    } else {
                      db.post(item, item._id)
                      .then(function(response) {
                          item._id = response.id;
                          item._rev = response.rev;
                          deferred.resolve(item);
                        })
                      .catch(function(err) {
                        deferred.reject(err);
                      });
                    }
                    return deferred.promise;
                };
            };


            svc.deleteDocFactory = function(db) {
                return function(item) {
                    var deferred = $q.defer();
                    db.remove(item, function(err, doc) {
                        if (err) {
                          deferred.reject(err);
                        }
                        deferred.resolve(doc);
                    });
                    return deferred.promise;
                };
            };


        return svc;

    } ]);

}());
