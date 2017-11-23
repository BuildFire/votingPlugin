'use strict';

(function (angular) {
    angular
        .module('votingPluginContent')
        .controller('RemovePopupCtrl', ['$scope', '$modalInstance', 'pluginData',
            function ($scope, $modalInstance, data) {
                $scope.pluginData = null;
                if (data) {
                    $scope.pluginData = data;
                }
                $scope.ok = function () {
                    $modalInstance.close('yes');
                };
                $scope.cancel = function () {
                    $modalInstance.dismiss('no');
                };
            }])
})(window.angular);
