'use strict';

(function (angular, buildfire) {
    angular
        .module('votingPluginContent')
        .controller('ContentVoteCtrl', ['$scope', 'Buildfire', 'VotingAPI', 'STATUS_CODE', '$location', '$routeParams', 'VoteCache', 'context', '$modal',
            function ($scope, Buildfire, VotingAPI, STATUS_CODE, $location, $routeParams, VoteCache, context, $modal) {
                var ContentVote = this;
                //Scroll current view to top when page loaded.
                buildfire.navigation.scrollTop();

                ContentVote.selectionTypes = [
                    {name: "Single Selection", value: "single"}, {name: "Multi Selection", value: "multi"}];

                ContentVote.item = {
                    data: {
                        order: 0,
                        title: "",
                        description: "",
                        selectionType: ContentVote.selectionTypes[0],
                        answers: []
                    },
                    id: null
                };

                ContentVote.isInserted = false;
                ContentVote.masterData = null;
                ContentVote.itemSaved = false;

                updateMasterItem(ContentVote.item);
                ContentVote.bodyWYSIWYGOptions = {
                    plugins: 'advlist autolink link image lists charmap print preview',
                    skin: 'lightgray',
                    trusted: true,
                    theme: 'modern'
                };

                function updateMasterItem(data) {
                    ContentVote.masterData = angular.copy(data);
                }

                function isUnchanged(data) {
                    return angular.equals(data, ContentVote.masterData);
                }

                /*Add reward method declaration*/
                ContentVote.addVote = function (newObj) {
                    ContentVote.isInserted = true;
                    if (typeof newObj === 'undefined') {
                        return;
                    }

                    var success = function (result) {
                        console.info('Saved data result: ', result);
                        updateMasterItem(newObj);
                        ContentVote.itemSaved = true;
                        ContentVote.item.deepLinkUrl = Buildfire.deeplink.createLink({id: result.id});
                        ContentVote.item = Object.assign(ContentVote.item, result);
                        ContentVote.isInserted = true;
                        if (ContentVote.item.id) {
                            buildfire.messaging.sendMessageToWidget({
                                id: ContentVote.item.id,
                                type: 'AddNewItem',
                                data: ContentVote.item
                            });
                        }

                        $scope.$digest();
                    };
                    var error = function (err) {
                        ContentVote.isInserted = false;
                        ContentVote.itemSaved = true;
                        console.error('Error while saving data : ', err);

                        $scope.$digest();
                    };
                    VotingAPI.addVote(newObj.data, function (err, result) {
                        if (err)
                            error(err);
                        else
                            success(result);
                    });
                };

                /*Update reward method declaration*/
                ContentVote.updateVote = function (newObj) {
                    if (typeof newObj === 'undefined') {
                        return;
                    }
                    updateMasterItem(newObj);
                    var data = newObj;

                    buildfire.messaging.sendMessageToWidget({
                        id: ContentVote.item.id,
                        index: $routeParams.index || 0,
                        type: 'UpdateItem',
                        data: ContentVote.item
                    });

                    var success = function (result) {
                        console.info('Saved data result: ', result);
                        ContentVote.itemSaved = true;

                        $scope.$digest();
                    };
                    var error = function (err) {
                        console.error('Error while saving data : ', err);
                        ContentVote.itemSaved = true;

                        $scope.$digest();
                    };
                    VotingAPI.updateVote(data.id, newObj.data, function (err, result) {
                        if (err)
                            error(err);
                        else
                            success(result);
                    });
                };

                /*validate the required fields whether its there or not */
                ContentVote.isValidVote = function (vote) {
                    if (vote && vote.data)
                        return (vote.data.title && true);
                };

                /*This method is used to get the rewards details*/
                ContentVote.getVote = function (voteId) {

                };

                ContentVote.changeOption = function (option) {

                };

                /*Go back to home on done button click*/
                ContentVote.gotToHome = function () {
                    buildfire.messaging.sendMessageToWidget({
                        type: 'ReturnHome'
                    });
                    buildfire.history.pop();
                    $location.path('#/');
                };

                if ($routeParams.id && VoteCache.getVote()) {
                    ContentVote.item = VoteCache.getVote();
                    ContentVote.item.deepLinkUrl = Buildfire.deeplink.createLink({id: ContentVote.item.id});

                    ContentVote.isInserted = true;
                    buildfire.messaging.sendMessageToWidget({
                        id: $routeParams.id,
                        index: $routeParams.index || 0,
                        type: 'OpenItem',
                        data: ContentVote.item
                    });
                }

                /*Save the data on .5 sec delay*/
                var tmrDelay = null;
                var saveDataWithDelay = function (newObj) {
                    if (newObj) {
                        if (isUnchanged(newObj)) {
                            return;
                        }
                        ContentVote.itemSaved = false;
                        if (tmrDelay) {
                            clearTimeout(tmrDelay);
                        }
                        tmrDelay = setTimeout(function () {
                            if (ContentVote.isValidVote(ContentVote.item) && !ContentVote.isInserted && !$routeParams.id) {
                                ContentVote.addVote(JSON.parse(angular.toJson(newObj)));
                            }
                            if (ContentVote.isValidVote(ContentVote.item) && ContentVote.isInserted && newObj.id) {
                                ContentVote.updateVote(JSON.parse(angular.toJson(newObj)));
                            }
                        }, 500);
                    }
                };

                ContentVote.removeAnswer = function (answer, index) {
                    buildfire.navigation.scrollTop();

                    var modalInstance = $modal.open({
                        templateUrl: 'templates/modals/remove.html',
                        controller: 'RemovePopupCtrl',
                        size: 'sm',
                        resolve: {
                            pluginData: function () {
                                return answer;
                            }
                        }
                    });

                    modalInstance.result.then(function (message) {
                        if (message === 'yes') {
                            if (ContentVote.item.data.answers) {
                                ContentVote.item.data.answers.splice(index, 1);
                                ContentVote.updateVote(JSON.parse(angular.toJson(ContentVote.item)));
                            }
                        }
                    }, function (data) {
                        //do something on cancel
                    });
                };

                var addAnswerToPublicData = function (answerId, vote, callback) {
                    debugger;
                    //adding answerId to publicData
                    Buildfire.publicData.search({voteId: vote.id}, 'voteAnswers', function (err, result) {
                        if (result && result.length > 0) {
                            Buildfire.publicData.searchAndUpdate({
                                voteId: vote.id,
                                "answers.id": answerId
                            }, {
                                $push: {answers: {id: answerId}}
                            }, 'voteAnswers', function (err, result) {
                                callback(err, result);
                            });
                        }
                        else {
                            Buildfire.publicData.insert({
                                voteId: vote.id,
                                answers: [{id: answerId}]
                            }, 'voteAnswers', false, function (err, result) {
                                callback(err, result);
                            });
                        }
                    });
                };

                ContentVote.addEditAnswer = function (answer, index) {
                    buildfire.navigation.scrollTop();

                    var modalInstance = $modal.open({
                        templateUrl: 'templates/modals/answer.html',
                        controller: 'AnswerPopupCtrl',
                        size: 'sm',
                        resolve: {
                            pluginData: function () {
                                return answer;
                            }
                        }
                    });
                    modalInstance.result.then(function (result) {
                        if (result) {
                            if (!ContentVote.item.data.answers)
                                ContentVote.item.data.answers = [];

                            if (ContentVote.item.data.answers[index]) {
                                ContentVote.item.data.answers[index] = result;
                            }
                            else {
                                result.id = (new Date()).toISOString();
                                ContentVote.item.data.answers.push(result);
                            }
                            addAnswerToPublicData(result.id, ContentVote.item, function (err, result) {
                                if (result)
                                    ContentVote.updateVote(JSON.parse(angular.toJson(ContentVote.item)));
                            });
                        }
                    }, function (data) {
                        //do something on cancel
                    });
                };
                /*
                 * watch for changes in data and trigger the saveDataWithDelay function on change
                 * */

                $scope.$watch(function () {
                    return ContentVote.item;
                }, saveDataWithDelay, true);
            }]);
})(window.angular, window.buildfire);