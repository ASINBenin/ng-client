(function () {
  'use strict';

  angular.module('ClientApp').controller('SsoLandingCtrl', [
    '$scope',
    '$state',
    '$location',
    '$window',
    'UserService',
    'toastr',
    function ($scope, $state, $location, $window, UserService, toastr) {
      $scope.isLoading = true;

      // Traite le retour du callback SSO backend (succès ou erreur)
      function init() {
        var search = $location.search() || {};
        var error = search.error || search.signatureError;

        if (error) {
          $scope.isLoading = false;
          toastr.error(decodeURIComponent(error.replace(/\+/g, ' ')));
          $state.go('login');
          return;
        }

        var token = search.token || (window.location.href.match(/[?&]token=([^&]+)/) || [])[1];
        var uid = search.uid || (window.location.href.match(/[?&]uid=([^&]+)/) || [])[1];

        if (token && uid) {
          UserService.authenticateWithToken(
            decodeURIComponent(token),
            decodeURIComponent(uid)
          ).then(
            function () {
              redirectAfterAuth();
            },
            function (err) {
              $window.sessionStorage.removeItem('monarc_sso_return_state');
              $window.sessionStorage.removeItem('monarc_sso_return_url');

              $scope.isLoading = false;
              toastr.error('Échec de la validation de la session SSO.');
              $state.go('login');
            }
          );
        } else {
          redirectAfterAuth();
        }
      }

      function redirectAfterAuth() {
        var savedState = $window.sessionStorage.getItem('monarc_sso_return_state');
        var returnUrl = $window.sessionStorage.getItem('monarc_sso_return_url');
        $window.sessionStorage.removeItem('monarc_sso_return_state');
        $window.sessionStorage.removeItem('monarc_sso_return_url');

        if (savedState) {
          try {
            var nav = JSON.parse(savedState);
            var modelId = nav.params && nav.params.modelId;
            var requestId = nav.params && nav.params.requestId;
            if (modelId && requestId) {
              var targetUrl = '/#/client/project/' + modelId + '/anr/signature-process/' + requestId;
              $window.location.replace(targetUrl);
              return;
            }
          } catch (e) {}
        }

        if (returnUrl && returnUrl.trim().length > 0) {
          var cleanPath = returnUrl.replace(/^[\/#]+/, '/');
          $window.location.replace('/#' + cleanPath);
        } else {
          $state.go('main.project');
        }
      }

      init();
    },
  ]);
})();
