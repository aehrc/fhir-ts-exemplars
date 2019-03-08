angular
  .module('plunker', ['ui.bootstrap'])
  .controller('Main', ['$scope', '$http', function($scope, $http) {
    // console.log('EP', $scope.endpoint);

    $scope.endpoint = 'https://stu3.ontoserver.csiro.au/fhir';

    function flattenP(params) {
      var m = {};
      params.forEach(function(p) {
        var v;
        if (p.part) {
          v = flattenP(p.part);
        } else {
          v = p.valueCode || p.valueCoding || p.valueString || p.valueBoolean;
        }
        if (m[p.name]) {
          if (!Array.isArray(m[p.name])) {
            m[p.name] = [m[p.name]];
          }
          m[p.name].push(v);
        } else {
          m[p.name] = v;
        }
      });
      return m;
    }

    $scope.selected = {};
    $scope.sourceName = undefined;

    var x = true,
        maps = [];

    $scope.conceptmaps = function(endpoint) {

      $scope.selected = undefined;
      
      maps.push({
        id: '1',
        url: 'http://snomed.info/sct?fhir_cm=900000000000497000',
        name: 'SNOMED to CTV3 map',
        description: 'SNOMED to CTV3 map',
        sourceUri: 'http://snomed.info/sct?fhir_vs',
        sourceName: 'SNOMED CT',
        targetUri: 'http://read.info/ctv3/vs',
      });
      maps.push({
        id: '2',
        url: 'http://snomed.info/sct?fhir_cm=900000000000489007',
        name: 'SNOMED Inactivation indicator map',
        description: 'SNOMED Inactivation indicator map',
        sourceUri: 'http://snomed.info/sct?fhir_vs',
        sourceName: 'SNOMED CT',
        targetUri: 'http://snomed.info/sct?fhir_vs',
      });
      
      $scope.selected = maps[0];

      return maps;
      
      $scope.error = undefined;
      // console.log('EP', endpoint);
      if (x !== endpoint) {
        x = endpoint;
        maps.splice(0, maps.length);  // delete existing list
        $scope.selected = undefined;
        // return
        $http({
            method: 'GET',
            url: endpoint + '/ConceptMap/_search',
            params: {
              '_elements': 'id,name,url,source,target,description',
              '_count': 200,
              '_format': 'json'
            },
            responseType: 'json'
          })
          .then(function(response) {
            response.data.entry
              .map(function(e) {
                return e.resource;
              })
              .filter(function(e) {
                return !(false && e.sourceUri || '').startsWith('urn:') &&
                       (e.targetUri || '').startsWith('http://snomed.info/sct') && e.targetUri;
              })
              .forEach(e => maps.push(e));
            $scope.selected = maps[0] || {};
            // $scope.sourceName = $scope.resName('ValueSet',$scope.selected.sourceUri);
            return maps;
          })
          .then(function (maps) {
            maps.forEach(m => {
              sourceName = $scope.resName('ValueSet', m.sourceUri)
                .then(name => m.sourceName = name);
            });
          });
      }
      return maps;
    };

    var cache = {};
    $scope.translate = function(code, system) {
      console.log('TRANSLATE', code, system);
      if (code && system) {
        var key =
          $scope.selected.url + '|' + code + '|' + system + '|' + $scope.selected.targetUri;
        // console.log(code, system);
        return cache[key] || $http({
            method: 'GET',
            url: $scope.endpoint + '/ConceptMap/$translate',
            params: {
              'url': $scope.selected.url,
              'code': code,
              'system': system,
              'target': $scope.selected.targetUri,
              '_format': 'json'
            },
            responseType: 'json'
          })
          .then(function(response) {
            var params = flattenP(response.data.parameter);
            cache[key] = params;
            console.log('P', params);
            $scope.translation = params;
            return params.result;
          }, function (response) {
            console.log('ERROR', response);
            cache[key] = 'ERROR';
            $scope.translation = response.data;
          });
      }
    };
    
    $scope.resName = function(resourceType, system, version) {
      // selected.sourceUri
      console.log(resourceType, system);
      if (system) {
        return $http({
          method: 'GET',
          url: $scope.endpoint + '/' + resourceType,
          params: {
            'url': system,
            'version': version,
            '_format': 'json'
          },
          responseType: 'json'
        })
        .then(function (response) {
          var name = system;
          if (response.data.total && response.data.entry) {
            response.data.entry.forEach(e => {name = e.resource.name;})
          }
          console.log('Name', name);
          return name;
        }, function (response) {
          console.log('ERROR', response);
          return system;
        })
      }
    };
    
  }])
  .controller('TypeaheadCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.concepts = function(term, endpoint) {
      // console.log(term);
      $scope.error = undefined;
      var valueSet = $scope.selected.sourceUri;
      endpoint = $scope.endpoint || 'https://ontoserver.csiro.au/stu3-latest';

      return $http({
          method: 'GET',
          url: endpoint + '/ValueSet/$expand',
          params: {
            'url': valueSet,
            'filter': term,
            'count': 15,
            '_format': 'json'
          },
          responseType: 'json'
        })
        .then(function(response) {
          // console.log(response.data.expansion);
          return response.data.expansion.contains || [{
            display: term
          }];
        }, function (response) {
          console.log('ERROR', response.status, JSON.stringify(response.data));
          var res = response.data;
          if (res && res.resourceType === 'OperationOutcome') {
            $scope.error = res;
          } else {
            $scope.error = JSON.stringify(response.data);
          }
        });
    };

  }]);