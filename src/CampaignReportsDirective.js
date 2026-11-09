(function () {

    angular
        .module('ClientApp')
        .directive('campaignReports', [CampaignReportsDirective]);

    /**
     * Reports of an analysis sent to the BackOffice, with the sending of a new version. Shown in the campaign page
     * and in the "Reports" dialog of an analysis outside any campaign.
     */
    function CampaignReportsDirective() {
        return {
            restrict: 'E',
            scope: {
                anr: '<',
                canSubmit: '<',
                requiresSignature: '<'
            },
            templateUrl: 'views/campaign.reports.panel.html',
            controller: ['$scope', '$window', 'gettextCatalog', 'toastr', 'ClientCampaignsService', 'DownloadService',
                CampaignReportsCtrl]
        };
    }

    function CampaignReportsCtrl($scope, $window, gettextCatalog, toastr, ClientCampaignsService, DownloadService) {
        var anrId = $scope.anr.id;
        $scope.submissions = [];
        $scope.signedReports = [];
        $scope.preparedReport = null;
        $scope.synchronization = 'ok';
        $scope.isLoading = true;
        $scope.isPreparing = false;
        $scope.isSending = false;

        ClientCampaignsService.getSubmissions(anrId).then(function (data) {
            $scope.submissions = data.submissions;
            $scope.synchronization = data.synchronization;
        }).finally(function () {
            $scope.isLoading = false;
        });
        if ($scope.canSubmit) {
            ClientCampaignsService.getSignedReports(anrId).then(function (data) {
                $scope.signedReports = data.signedReports;
            });
            if (!$scope.requiresSignature) {
                // A report prepared earlier and not yet sent is still valid for an hour
                ClientCampaignsService.getPreparedReport(anrId).then(function (data) {
                    $scope.preparedReport = data.preparedReport;
                });
            }
        }

        $scope.formatSize = function (bytes) {
            return bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : Math.ceil(bytes / 1024) + ' KB';
        };

        /**
         * Opens a PDF of the server in a new tab. The tab is opened at once, from the click, then receives the
         * file: this way the browser does not take it for an unwanted popup.
         */
        function openPdf(path) {
            var tab = $window.open('', '_blank');
            ClientCampaignsService.getPdfUrl(path).then(function (url) {
                if (tab) {
                    tab.location.href = url;
                } else {
                    $window.location.href = url;
                }
            }, function () {
                if (tab) {
                    tab.close();
                }
            });
        }

        function downloadPdf(path, fileName) {
            ClientCampaignsService.getPdf(path).then(function (data) {
                DownloadService.downloadBlob(data, fileName, 'application/pdf');
            });
        }

        $scope.prepare = function () {
            $scope.isPreparing = true;
            ClientCampaignsService.prepareReport(anrId).then(function (data) {
                $scope.preparedReport = data.preparedReport;
            }).finally(function () {
                $scope.isPreparing = false;
            });
        };

        $scope.readPrepared = function () {
            openPdf('api/client-anr/' + anrId + '/prepared-reports/' + $scope.preparedReport.token);
        };

        $scope.downloadPrepared = function () {
            downloadPdf('api/client-anr/' + anrId + '/prepared-reports/' + $scope.preparedReport.token, 'rapport.pdf');
        };

        $scope.discardPrepared = function () {
            ClientCampaignsService.discardPreparedReport(anrId, $scope.preparedReport.token).then(function () {
                $scope.preparedReport = null;
            });
        };

        $scope.readSigned = function (signedReport) {
            openPdf('api/client-anr/' + anrId + '/signed-reports/' + signedReport.id);
        };

        $scope.downloadSigned = function (signedReport) {
            downloadPdf('api/client-anr/' + anrId + '/signed-reports/' + signedReport.id, 'rapport-signe.pdf');
        };

        function submit(data) {
            $scope.isSending = true;
            ClientCampaignsService.submitReport(anrId, data).then(function (response) {
                $scope.submissions.unshift(response.submission);
                $scope.preparedReport = null;
                // Un rapport signé soumis n'est plus proposé
                if (data.signatureRequestId) {
                    $scope.signedReports = $scope.signedReports.filter(function (report) {
                        return report.id !== data.signatureRequestId;
                    });
                }
                toastr.success(gettextCatalog.getString(
                    'Version {{version}} of the report has been sent to the BackOffice.',
                    {version: response.submission.version}
                ));
            }).finally(function () {
                $scope.isSending = false;
            });
        }

        $scope.submitPrepared = function () {
            submit({token: $scope.preparedReport.token});
        };

        $scope.submitSigned = function (signedReport) {
            submit({signatureRequestId: signedReport.id});
        };
    }

})();
