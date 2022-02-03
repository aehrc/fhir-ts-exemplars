angular
  .module('plunker', ['ui.bootstrap'])
  .controller('TypeaheadCtrl', ['$scope', '$http', function($scope, $http) {

    $scope.concepts = function(term, valueSet, endpoint) {
      valueSet = valueSet || 'http://snomed.info/sct?fhir_vs';
      endpoint = endpoint || 'https://r4.ontoserver.csiro.au/fhir';

      return $http({
          method: 'GET',
          url: endpoint + '/ValueSet/$expand',
          params: {
            'identifier': valueSet,
            'filter': term,
            'count': 10,
            'includeDesignations': true,
            '_format': 'json'
          },
          responseType: 'json'
        })
        .then(function(response) {
          // console.log(response.data.expansion);

          return (response.data.expansion.contains || [{
            display: term
          }])
          .map(function (elt) {
            // extract the semantic tag
            (elt.designation || []).forEach(function (d) {
              if (d.value && d.use && d.use.code === '900000000000003001') {
                var fsn = d.value,
                    idx = fsn.lastIndexOf('(');
                elt.tag = fsn.substring(idx);
              }
            })
            return elt;
          });
        });
    };

  }]);
  
