var base = "https://r4.ontoserver.csiro.au/fhir";
// base = "http://tx.fhir.org/r3";
// base = "http://its.patientsfirst.org.nz/RestService.svc/Terminz";
// base = 'http://fhirtest.uhn.ca/baseDstu3';

function preload(ecl) {
  document.getElementById("ecl").value = ecl || '';
}

function expand() {
  var ecl = document.getElementById("ecl").value;

  // console.log(system, code, display);

  function reqListener() {
    var resultJson = document.getElementById("resultJson");
    resultJson.textContent = this.responseText;

    var table = document.getElementById("resultTable");
    while (table.firstChild) {
      table.removeChild(table.firstChild);
    }

    var json;
    try {
      json = JSON.parse(this.responseText);
    } catch (err) {
      console.log('response', this.response);
      throw err;
    }

    if ('ValueSet' === json.resourceType) {
      
      function append(row, elt, text) {
        var item = document.createElement(elt);
        item.textContent = text;
        row.append(item);
        return row;
      }
      
      var hrow1 = document.createElement('tr');
      var header = document.createElement('th');
      header.setAttribute('colspan', 3);
      header.textContent = "Total matches: " + json.expansion.total;
      hrow1.append(header);
      table.append(hrow1);
      
      var hrow2 = document.createElement('tr');
      append(hrow2, 'th', 'System');
      append(hrow2, 'th', 'Code');
      append(hrow2, 'th', 'Display');
      table.append(hrow2);
      
      json.expansion.contains.forEach(function(c) {
        var row = document.createElement('tr');
        var system = document.createElement('td');
        system.innerHTML = "<tt>"+c.system+"</tt>";
        var code = document.createElement('td');
        code.innerHTML = "<tt class=\"font-weight-bold\">"+c.code+"</tt>";
        var display = document.createElement('td');
        display.textContent = c.display;

        row.appendChild(system);
        row.appendChild(code);
        row.appendChild(display);
        table.appendChild(row);
      });
      
      if (json.expansion.total > json.expansion.contains.length) {
        var frow = document.createElement('tr');
        var footer = document.createElement('th');
        footer.setAttribute('colspan', 3);
        footer.textContent = "remainder of results omitted...";
        frow.append(footer);
        table.append(frow);
      }
      
    } else if ('OperationOutcome' === json.resourceType) {
      // [{"severity":"error","code":"invalid","diagnostics":"[a95793f4-31bd-4f7f-8a92-947444f23bfb]: ValueSet url cannot be empty."}]
      json.issue.forEach(function (i) {
        var row = document.createElement('tr');
        if ('error' === i.severity) {
          row.classList.add('table-danger');
          row.classList.remove('table-warning');
          row.classList.remove('table-info');
        } else if ('warning' === i.severity) {
          row.classList.add('table-warning');
          row.classList.remove('table-danger');
          row.classList.remove('table-info');
        } else {
          row.classList.add('table-info');
          row.classList.remove('table-danger');
          row.classList.remove('table-warning');
        }
        var code = document.createElement('td');
        code.textContent = i.code;
        var diagnostic = document.createElement('td');
        diagnostic.textContent = i.diagnostics;

        row.appendChild(code);
        row.appendChild(diagnostic);
        table.appendChild(row);
      });
    }

    resultJson.textContent = JSON.stringify(json, null, 2);
  }

  var request = "/ValueSet/$expand?url=" + encodeURIComponent("http://snomed.info/sct?fhir_vs=ecl/" + ecl) + "&count=20";

  document.getElementById("requestLink").href = base + request;
  document.getElementById("requestUrl").textContent = "[base]" + request;

  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener);
  oReq.open("GET", base + request + "&_format=json");
  oReq.send();

}
