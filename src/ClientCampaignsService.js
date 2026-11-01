(function () {

    angular
        .module('ClientApp')
        .factory('ClientCampaignsService', ['$resource', '$http', ClientCampaignsService]);

    function ClientCampaignsService($resource, $http) {
        var campaignsResource = $resource('api/campaigns', {}, {
            'query': {
                isArray: false
            }
        });
        var participationResource = $resource('api/campaigns/:id/participation', {id: '@id'}, {
            'participate': {
                method: 'POST'
            }
        });

        var accessResource = $resource('api/campaigns/:id/access', {id: '@id'}, {
            'get': {
                method: 'GET'
            },
            'replace': {
                method: 'PUT'
            }
        });

        var submissionsResource = $resource('api/client-anr/:id/submissions', {id: '@id'}, {
            'query': {
                method: 'GET'
            },
            'submit': {
                method: 'POST'
            }
        });
        var preparedReportsResource = $resource('api/client-anr/:id/prepared-reports', {id: '@id'}, {
            'prepare': {
                method: 'POST'
            }
        });
        var signedReportsResource = $resource('api/client-anr/:id/signed-reports', {id: '@id'}, {
            'query': {
                method: 'GET'
            }
        });

        /**
         * Campagnes de l'entité, après synchronisation avec le BackOffice : { campaigns: [], synchronization: '' }.
         */
        var getCampaigns = function () {
            return campaignsResource.query().$promise;
        };

        /**
         * L'entité participe : renvoie la campagne mise à jour (statut de participation, analyse créée).
         */
        var participate = function (id) {
            return participationResource.participate({id: id}, {}).$promise;
        };

        /**
         * Utilisateurs pouvant accéder à l'analyse de la campagne, avec leur droit : { users: [{id, ..., rwd}] }.
         */
        var getAccess = function (id) {
            return accessResource.get({id: id}).$promise;
        };

        /**
         * Remplace les accès ; accesses : [{userId, rwd}], rwd valant 0 (lecture) ou 1 (écriture).
         */
        var setAccess = function (id, accesses) {
            return accessResource.replace({id: id}, {accesses: accesses}).$promise;
        };

        /**
         * Versions du rapport de l'analyse déjà envoyées au BackOffice, la plus récente d'abord : { submissions: [] }.
         */
        var getSubmissions = function (anrId) {
            return submissionsResource.query({id: anrId}).$promise;
        };

        /**
         * Génère le rapport final de l'analyse et le garde de côté, valable une heure :
         * { preparedReport: { token, fileSize, createdAt, expiresAt } }.
         */
        var prepareReport = function (anrId) {
            return preparedReportsResource.prepare({id: anrId}, {}).$promise;
        };

        /**
         * Rapports finaux de l'analyse signés dans le module de signature : { signedReports: [{ id, title, signedAt, fileSize }] }.
         */
        var getSignedReports = function (anrId) {
            return signedReportsResource.query({id: anrId}).$promise;
        };

        /**
         * Envoie au BackOffice un rapport déjà relu : data vaut { token } (rapport préparé) ou { signatureRequestId }
         * (rapport signé). Renvoie la version créée { submission: {} }.
         */
        var submitReport = function (anrId, data) {
            return submissionsResource.submit({id: anrId}, data).$promise;
        };

        /**
         * Adresse locale d'un PDF du serveur, à ouvrir dans un onglet : la lecture doit porter le jeton de session.
         */
        var getPdfUrl = function (path) {
            return getPdf(path).then(function (data) {
                return URL.createObjectURL(new Blob([data], {type: 'application/pdf'}));
            });
        };

        /**
         * Contenu d'un PDF du serveur.
         */
        var getPdf = function (path) {
            return $http.get(path, {responseType: 'arraybuffer'}).then(function (response) {
                return response.data;
            });
        };

        return {
            getCampaigns: getCampaigns,
            participate: participate,
            getAccess: getAccess,
            setAccess: setAccess,
            getSubmissions: getSubmissions,
            prepareReport: prepareReport,
            getSignedReports: getSignedReports,
            submitReport: submitReport,
            getPdfUrl: getPdfUrl,
            getPdf: getPdf
        };
    }

})();
