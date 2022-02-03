angular
  .module('plunker', ['ui.bootstrap'])
  .controller('TypeaheadCtrl', ['$scope', '$http', function($scope, $http) {
    
    $scope.vsItems = [];

    $scope.concepts = function(valueSet, endpoint) {
      valueSet = valueSet || 'http://snomed.info/sct?fhir_vs';
      endpoint = endpoint || 'https://r4.ontoserver.csiro.au/fhir';

      $http({
          method: 'GET',
          url: endpoint + '/ValueSet/$expand',
          params: {
            'identifier': valueSet,
            'count': 10,
            '_format': 'json'
          },
          responseType: 'json'
        })
        .then(function(response) {
          $scope.vsItems = response.data.expansion.contains || [{
            display: term
          }];
        });
    };

  }]);
  
