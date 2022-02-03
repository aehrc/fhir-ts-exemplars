angular
  .module('plunker', ['ui.bootstrap'])
  .controller('TypeaheadCtrl', ['$scope', '$http', function($scope, $http) {

    const threshold = 4;

    $scope.distance = 0;
    $scope.match = {};

    $scope.alert = function (text) {
      alert(text);
    }

    $scope.notSimilar = function() {
      $scope.distance = levenshteinDistance($scope.match.display, $scope.freetext);
      
      if ($scope.distance > threshold || $scope.distance < 0) {
        $scope.result = {};
        return true;
      } else if ($scope.freetext && !$scope.match.code) {
        $scope.result = {
          display: $scope.freetext,
          userSelected: $scope.freetext && true,
        };
      }
      return false;
    };

    $scope.onSelect = function($item, $model, $label, $event) {
      if ($item.code) {
        $scope.result = {
          system: $item.system,
          version: $item.version,
          code: $item.code,
          display: $item.display,
          userSelected: true,
        };
      } else {
        $scope.result = {};
      }
    };

    $scope.concepts = function(term, valueSet, endpoint) {
      valueSet = valueSet || 'http://snomed.info/sct?fhir_vs';
      endpoint = endpoint || 'https://r4.ontoserver.csiro.au/fhir';

      $scope.distance = 0;

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
            .map(function(elt) {
              // extract the semantic tag
              (elt.designation || []).forEach(function(d) {
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

    /*
     * The following function is subject to and used here under the MIT Licence.
     * Original source: https://github.com/trekhleb/javascript-algorithms/blob/master/src/algorithms/string/levenshtein-distance/levenshteinDistance.js
     *
     * The MIT License (MIT)
     *
     * Copyright (c) 2018 Oleksii Trekhleb
     *
     * Permission is hereby granted, free of charge, to any person obtaining a copy
     * of this software and associated documentation files (the "Software"), to deal
     * in the Software without restriction, including without limitation the rights
     * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
     * copies of the Software, and to permit persons to whom the Software is
     * furnished to do so, subject to the following conditions:
     *
     * The above copyright notice and this permission notice shall be included in all
     * copies or substantial portions of the Software.
     *
     * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
     * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
     * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
     * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
     * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
     * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
     * SOFTWARE.
     */
    function levenshteinDistance(a, b) {
      if (!a || !b) return -1;
      // Create empty edit distance matrix for all possible modifications of
      // substrings of a to substrings of b.
      const distanceMatrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

      // Fill the first row of the matrix.
      // If this is first row then we're transforming empty string to a.
      // In this case the number of transformations equals to size of a substring.
      for (let i = 0; i <= a.length; i += 1) {
        distanceMatrix[0][i] = i;
      }

      // Fill the first column of the matrix.
      // If this is first column then we're transforming empty string to b.
      // In this case the number of transformations equals to size of b substring.
      for (let j = 0; j <= b.length; j += 1) {
        distanceMatrix[j][0] = j;
      }

      for (let j = 1; j <= b.length; j += 1) {
        for (let i = 1; i <= a.length; i += 1) {
          const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
          distanceMatrix[j][i] = Math.min(
            distanceMatrix[j][i - 1] + 1, // deletion
            distanceMatrix[j - 1][i] + 1, // insertion
            distanceMatrix[j - 1][i - 1] + indicator // substitution
          );
        }
      }

      return distanceMatrix[b.length][a.length];
    }

  }]);
