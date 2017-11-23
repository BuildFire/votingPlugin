'use strict';

(function (angular) {
    angular
        .module('votingPluginContent')
        .controller('AnswerPopupCtrl', ['$scope', '$modalInstance', 'pluginData',
            function ($scope, $modalInstance, data) {
                $scope.data = data;
                $scope.save = function () {
                    $modalInstance.close($scope.data);
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss(null);
                };
            }])
})(window.angular);
