(function () {

    angular
        .module('ClientApp')
        .controller('ClientCampaignsCtrl', [
            '$scope', '$rootScope', '$mdDialog', 'gettextCatalog', 'toastr', 'ClientCampaignsService',
            'ClientAnrService', ClientCampaignsCtrl
        ]);

    /**
     * Campaigns the entity is invited to, received from the BackOffice.
     */
    function ClientCampaignsCtrl($scope, $rootScope, $mdDialog, gettextCatalog, toastr, ClientCampaignsService,
                                 ClientAnrService) {
        $scope.campaigns = [];
        $scope.freeAnrs = [];
        $scope.synchronization = 'ok';
        $scope.isLoading = true;

        var today = moment().format('YYYY-MM-DD');

        /**
         * Where the campaign stands today: closed, upcoming, open, or past its response deadline with no answer.
         */
        $scope.getPhase = function (campaign) {
            if (campaign.status === 'closed') {
                return 'closed';
            }
            if (today < campaign.startDate) {
                return 'upcoming';
            }
            if (today > campaign.responseDeadline && campaign.participationStatus === 'invited') {
                return 'noAnswer';
            }

            return 'open';
        };

        /**
         * The entity has not answered yet, or answered but its analysis is missing (the creation failed).
         */
        $scope.canParticipate = function (campaign) {
            return $scope.getPhase(campaign) === 'open'
                && (campaign.participationStatus === 'invited' || !campaign.anrId);
        };

        $scope.participate = function (campaign, ev) {
            if (campaign.participationStatus !== 'invited') {
                saveParticipation(campaign);
                return;
            }

            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Do you want to participate in this campaign?'))
                .textContent(gettextCatalog.getString(
                    'An analysis based on the campaign model will be created. You cannot withdraw afterwards.'
                ))
                .targetEvent(ev)
                .theme('light')
                .ok(gettextCatalog.getString('Participate'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function () {
                saveParticipation(campaign);
            });
        };

        function saveParticipation(campaign) {
            campaign.isSaving = true;
            ClientCampaignsService.participate(campaign.id).then(function (data) {
                campaign.participationStatus = data.participationStatus;
                campaign.anrId = data.anrId;
                toastr.success(
                    gettextCatalog.getString('Your analysis has been created.'),
                    gettextCatalog.getString('Participation recorded')
                );
                $rootScope.$broadcast('fo-anr-changed');
                $scope.manageAccess(campaign);
            }).finally(function () {
                campaign.isSaving = false;
            });
        }

        /**
         * The administrator chooses who else can open the analysis of the campaign.
         */
        $scope.manageAccess = function (campaign, ev) {
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'campaign', CampaignAccessDialogCtrl],
                templateUrl: 'views/dialogs/campaign.access.html',
                targetEvent: ev,
                locals: {campaign: campaign},
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

        /**
         * History of the reports sent to the BackOffice for an analysis, and sending of a new version.
         * Reports can be sent while the campaign is open; an analysis outside any campaign needs write access.
         */
        $scope.showReports = function (anr, canSubmit, ev) {
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'anr', 'canSubmit', ReportsDialogCtrl],
                templateUrl: 'views/dialogs/campaign.reports.html',
                targetEvent: ev,
                locals: {anr: anr, canSubmit: canSubmit},
                clickOutsideToClose: false
            });
        };

        function ReportsDialogCtrl($scope, $mdDialog, anr, canSubmit) {
            $scope.anr = anr;
            $scope.canSubmit = canSubmit;
            $scope.submissions = [];
            $scope.synchronization = 'ok';
            $scope.isLoading = true;
            $scope.isSending = false;

            ClientCampaignsService.getSubmissions(anr.id).then(function (data) {
                $scope.submissions = data.submissions;
                $scope.synchronization = data.synchronization;
            }).finally(function () {
                $scope.isLoading = false;
            });

            $scope.formatSize = function (bytes) {
                return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.ceil(bytes / 1024) + ' KB';
            };

            $scope.close = function () {
                $mdDialog.hide();
            };

            $scope.send = function () {
                $scope.isSending = true;
                ClientCampaignsService.submitReport(anr.id).then(function (data) {
                    $scope.submissions.unshift(data.submission);
                    toastr.success(gettextCatalog.getString(
                        'Version {{version}} of the report has been sent to the BackOffice.',
                        {version: data.submission.version}
                    ));
                }).finally(function () {
                    $scope.isSending = false;
                });
            };
        }

        ClientAnrService.getAnrs().then(function (data) {
            $scope.freeAnrs = data.anrs.filter(function (anr) {
                return anr.rwd >= 0 && !anr.campaignLocked;
            });
        });

        ClientCampaignsService.getCampaigns().then(function (data) {
            $scope.campaigns = data.campaigns;
            $scope.synchronization = data.synchronization;
        }).finally(function () {
            $scope.isLoading = false;
        });
    }

})();
