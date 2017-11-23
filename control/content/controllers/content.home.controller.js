'use strict';

(function (angular, buildfire) {
    angular
        .module('votingPluginContent')
        .controller('ContentHomeCtrl', ['$scope', 'Buildfire', 'VotingAPI', 'VoteCache', 'STATUS_CODE', '$modal', '$location', '$timeout', 'context',
            function ($scope, Buildfire, VotingAPI, VoteCache, STATUS_CODE, $modal, $location, $timeout, context) {
                console.log("---------------------", context);
                var ContentHome = this;
                var _data = {
                    images: [],
                    description: ''
                };

                //Scroll current view to top when page loaded.
                buildfire.navigation.scrollTop();

                ContentHome.masterData = null;
                ContentHome.bodyWYSIWYGOptions = {
                    plugins: 'advlist autolink link image lists charmap print preview',
                    skin: 'lightgray',
                    trusted: true,
                    theme: 'modern'
                };
                ContentHome.currentLoggedInUser = null;
                ContentHome.invalidApplicationParameters = false;
                ContentHome.needToLoginInCP = false;


                /*buildfire carousel component*/
                // create a new instance of the buildfire carousel editor
                ContentHome.editor = new Buildfire.components.carousel.editor("#carousel");
                // this method will be called when a new item added to the list
                ContentHome.editor.onAddItems = function (items) {
                    if (!ContentHome.data.images)
                        ContentHome.data.images = [];
                    ContentHome.data.images.push.apply(ContentHome.data.images, items);
                    $scope.$digest();
                };
                // this method will be called when an item deleted from the list
                ContentHome.editor.onDeleteItem = function (item, index) {
                    ContentHome.data.images.splice(index, 1);
                    $scope.$digest();
                };
                // this method will be called when you edit item details
                ContentHome.editor.onItemChange = function (item, index) {
                    ContentHome.data.images.splice(index, 1, item);
                    $scope.$digest();
                };
                // this method will be called when you change the order of items
                ContentHome.editor.onOrderChange = function (item, oldIndex, newIndex) {
                    var items = ContentHome.data.images;

                    var tmp = items[oldIndex];

                    if (oldIndex < newIndex) {
                        for (var i = oldIndex + 1; i <= newIndex; i++) {
                            items[i - 1] = items[i];
                        }
                    } else {
                        for (var i = oldIndex - 1; i >= newIndex; i--) {
                            items[i + 1] = items[i];
                        }
                    }
                    items[newIndex] = tmp;

                    ContentHome.data.images = items;
                    $scope.$digest();
                };

                function updateMasterItem(data) {
                    ContentHome.masterData = angular.copy(data);
                };

                function isUnchanged(data) {
                    return angular.equals(data, ContentHome.masterData);
                };

                /*UI sortable option*/
                ContentHome.votesSortableOptions = {
                    handle: '> .cursor-grab',
                    stop: function (event, ui) {
                        ContentHome.sortVotes(ContentHome.votes);
                        console.log('update');
                    }
                };
                /*
                 * Go pull any previously saved data
                 * */
                ContentHome.init = function () {
                    ContentHome.success = function (result) {
                        console.info('init success result:', result);
                        ContentHome.data = result;
                        if (!ContentHome.data)
                            ContentHome.data = angular.copy(_data);

                        if (!ContentHome.data.images)
                            ContentHome.editor.loadItems([]);
                        else
                            ContentHome.editor.loadItems(ContentHome.data.images);
                        updateMasterItem(ContentHome.data);
                        if (tmrDelay) clearTimeout(tmrDelay);
                        $scope.$digest();
                    };
                    ContentHome.error = function (err) {
                    };
                    ContentHome.successVotes = function (result) {
                        ContentHome.votes = result;
                        if (!ContentHome.votes)
                            ContentHome.votes = [];
                        console.info('init success result votes:', result);
                        if (tmrDelay) clearTimeout(tmrDelay);
                        $scope.$digest();
                    };
                    ContentHome.errorVotes = function (err) {
                        console.log('Error while getting data votes', err);
                    };

                    VotingAPI.getContent(function (err, result) {
                        if (err)
                            ContentHome.error(err);
                        else
                            ContentHome.success(result);
                    });
                    VotingAPI.getVotes(function (err, result) {
                        if (err)
                            ContentHome.errorVotes(err);
                        else
                            ContentHome.successVotes(result);
                    });
                };

                /*SortVotes method declaration*/
                ContentHome.sortVotes = function (data) {
                    var successSortVotes = function (result) {
                        buildfire.messaging.sendMessageToWidget({
                            type: 'ListSorted'
                        });
                        console.info('Votes list Sorted:', result);
                        if (tmrDelay) clearTimeout(tmrDelay);
                    };
                    var errorSortVotes = function (err) {
                        console.log('Error while sorting rewards', err);
                    };
                    VotingAPI.sortVotes(data, function (err, result) {
                        if (err)
                            errorSortVotes(err);
                        else
                            successSortVotes(result);
                    });
                };

                /*
                 * Call the vote api to save the data object
                 */
                var saveData = function (newObj, tag) {
                    if (typeof newObj === 'undefined') {
                        return;
                    }
                    var success = function (result) {
                        console.info('Saved data result: ', result);
                        updateMasterItem(ContentHome.data);
                        buildfire.messaging.sendMessageToWidget({
                            type: 'UpdateContent',
                            data: ContentHome.data
                        });
                    };
                    var error = function (err) {
                        console.log('Error while updating application : ', err);
                    };

                    VotingAPI.addUpdateContent(ContentHome.data, function (err, result) {
                        if (err)
                            error(err);
                        else
                            success(result);
                    });
                };

                /*Delete the vote*/
                ContentHome.removeVote = function (vote, index) {
                    var status = function (result) {
                            console.log(result)
                        },
                        err = function (err) {
                            console.log(err)
                        };

                    buildfire.navigation.scrollTop();

                    var modalInstance = $modal.open({
                        templateUrl: 'templates/modals/remove.html',
                        controller: 'RemovePopupCtrl',
                        size: 'sm',
                        resolve: {
                            pluginData: function () {
                                return vote.data;
                            }
                        }
                    });


                    modalInstance.result.then(function (message) {
                        debugger;
                        if (message === 'yes') {
                            //ContentHome.loyaltyRewards.splice(index, 1);  //remove this line of code when API will start working.
                            buildfire.messaging.sendMessageToWidget({
                                index: index,
                                type: 'RemoveVote'
                            });

                            var success = function (result) {
                                ContentHome.votes.splice(index, 1);
                                console.log("Vote removed successfully");
                            };
                            var error = function (err) {
                                console.log("Some issue in Vote delete", err);
                            };
                            VotingAPI.removeVote(vote.id, function (err, result) {
                                if (err)
                                    error(err);
                                else
                                    success(result);
                            });
                        }
                    }, function (data) {
                        //do something on cancel
                    });
                };

                ContentHome.openVote = function (data, index) {
                    VoteCache.setVote(data);
                    $location.path('/vote/' + data.id + '/' + index);
                };

                /*
                 * create an artificial delay so api isn't called on every character entered
                 * */
                var tmrDelay = null;

                var saveDataWithDelay = function (newObj) {
                    if (newObj) {
                        if (isUnchanged(newObj)) {
                            return;
                        }
                        if (tmrDelay) {
                            clearTimeout(tmrDelay);
                        }
                        tmrDelay = setTimeout(function () {
                            saveData(JSON.parse(angular.toJson(newObj)));
                        }, 500);
                    }
                };

                /*
                 * watch for changes in data and trigger the saveDataWithDelay function on change
                 * */
                $scope.$watch(function () {
                    return ContentHome.data;
                }, saveDataWithDelay, true);

                ContentHome.init();
            }]);
})(window.angular, window.buildfire);
