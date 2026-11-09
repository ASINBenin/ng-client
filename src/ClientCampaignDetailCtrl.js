(function () {

    angular
        .module('ClientApp')
        .controller('ClientCampaignDetailCtrl', [
            '$scope', '$rootScope', '$stateParams', '$mdDialog', 'gettextCatalog', 'toastr', 'ClientCampaignsService',
            ClientCampaignDetailCtrl
        ]);

    /**
     * Page of a campaign: its terms, the participation, the access to its analysis and the reports sent.
     */
    function ClientCampaignDetailCtrl($scope, $rootScope, $stateParams, $mdDialog, gettextCatalog, toastr,
                                      ClientCampaignsService) {
        $scope.campaign = null;
        $scope.synchronization = 'ok';
        $scope.isLoading = true;
        $scope.getProgress = ClientCampaignsService.getProgress;
        $scope.canParticipate = ClientCampaignsService.canParticipate;

        $scope.loadCampaign = function () {
            $scope.isLoading = true;
            ClientCampaignsService.getCampaign($stateParams.campaignId).then(function (data) {
                $scope.campaign = data.campaign;
                $scope.synchronization = data.synchronization;
                $scope.reportsAnr = {id: data.campaign.anrId, label: data.campaign.label};
            }).finally(function () {
                $scope.isLoading = false;
            });
        };

        $scope.participate = function (ev) {
            if ($scope.campaign.participationStatus !== 'invited') {
                saveParticipation();
                return;
            }

            // L'entité lit d'abord la campagne en entier, puis décide
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'campaign', ParticipationDialogCtrl],
                templateUrl: 'views/dialogs/campaign.participate.html',
                targetEvent: ev,
                locals: {campaign: $scope.campaign},
                clickOutsideToClose: false
            }).then(saveParticipation);
        };

        function ParticipationDialogCtrl($scope, $mdDialog, campaign) {
            $scope.campaign = campaign;
            $scope.cancel = function () {
                $mdDialog.cancel();
            };
            $scope.participate = function () {
                $mdDialog.hide();
            };
        }

        function saveParticipation() {
            var campaign = $scope.campaign;
            campaign.isSaving = true;
            ClientCampaignsService.participate(campaign.id).then(function (data) {
                campaign.participationStatus = data.participationStatus;
                campaign.anrId = data.anrId;
                $scope.reportsAnr = {id: data.anrId, label: campaign.label};
                toastr.success(
                    gettextCatalog.getString('Your analysis has been created.'),
                    gettextCatalog.getString('Participation recorded')
                );
                $rootScope.$broadcast('fo-anr-changed');
                $scope.manageAccess();
            }).finally(function () {
                campaign.isSaving = false;
            });
        }

        /**
         * The administrator chooses who else can open the analysis of the campaign.
         */
        $scope.manageAccess = function (ev) {
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'campaign', CampaignAccessDialogCtrl],
                templateUrl: 'views/dialogs/campaign.access.html',
                targetEvent: ev,
                locals: {campaign: $scope.campaign},
                clickOutsideToClose: false
            });
        };

        function CampaignAccessDialogCtrl($scope, $mdDialog, campaign) {
            $scope.campaign = campaign;
            $scope.users = [];
            $scope.isLoading = true;
            $scope.isSaving = false;

            ClientCampaignsService.getAccess(campaign.id).then(function (data) {
                $scope.users = data.users.map(function (user) {
                    user.access = user.rwd === null ? 'none' : (user.rwd === 1 ? 'write' : 'read');
                    return user;
                });
            }).finally(function () {
                $scope.isLoading = false;
            });

            $scope.cancel = function () {
                $mdDialog.cancel();
            };

            $scope.save = function () {
                var accesses = $scope.users.filter(function (user) {
                    return user.access !== 'none';
                }).map(function (user) {
                    return {userId: user.id, rwd: user.access === 'write' ? 1 : 0};
                });

                $scope.isSaving = true;
                ClientCampaignsService.setAccess(campaign.id, accesses).then(function () {
                    toastr.success(gettextCatalog.getString('The access to the analysis has been updated.'));
                    $mdDialog.hide();
                }).finally(function () {
                    $scope.isSaving = false;
                });
            };
        }

        $scope.loadCampaign();
    }

})();
