'use strict';

(function (angular, buildfire) {
    angular.module('votingPluginContent')
        .provider('Buildfire', [function () {
            var Buildfire = this;
            Buildfire.$get = function () {
                return buildfire;
            };
            return Buildfire;
        }])
        .factory('VotingAPI', ['$q', 'Buildfire',
            function ($q, Buildfire) {
                var addUpdateContent = function (data, callback) {
                    Buildfire.datastore.save(data, 'content', callback);
                };

                var getContent = function (callback) {
                    Buildfire.datastore.get('content', function (err, result) {
                        if (err)
                            callback(err);
                        else if (result)
                            callback(null, result.data);
                        else
                            callback(null, null);
                    });
                };

                var addVote = function (data, callback) {
                    Buildfire.datastore.insert(data, 'votes', callback);
                };

                var updateVote = function (id, data, callback) {
                    Buildfire.datastore.update(id, data, 'votes', callback);
                };

                var getVotes = function (callback) {
                    Buildfire.datastore.search({"sort": {"order": 1}}, 'votes', callback);
                };

                var removeVote = function (id, callback) {
                    Buildfire.datastore.delete(id, 'votes', callback);
                };

                var sortVotes = function (arrayObj, callback) {
                    var i = 0;
                    var doUpdate = function () {
                        if (arrayObj && arrayObj[i] && arrayObj[i].data) {
                            arrayObj[i].data.order = i;
                            Buildfire.datastore.update(arrayObj[i].id, arrayObj[i].data, 'votes', function (err, result) {
                                if (err)
                                    callback(err);
                                else {
                                    i++;
                                    doUpdate();
                                }
                            });
                        }
                        else
                            callback(null, null);
                    };
                    doUpdate();
                };

                return {
                    addUpdateContent: addUpdateContent,
                    getContent: getContent,
                    addVote: addVote,
                    updateVote: updateVote,
                    getVotes: getVotes,
                    removeVote: removeVote,
                    sortVotes: sortVotes
                };
            }])
        .factory('Context', ['$q', function ($q) {
            return {
                getContext: function () {
                    var deferred = $q.defer();
                    buildfire.getContext(function (err, context) {
                        if (err)
                            deferred.resolve(null);
                        else deferred.resolve(context);
                    });
                    return deferred.promise;
                }
            };
        }])
        .factory('VoteCache', [function () {
            var vote = {};

            return {
                setVote: function (data) {
                    vote = data;
                },
                getVote: function () {
                    return vote;
                }
            };
        }])
})(window.angular, window.buildfire);