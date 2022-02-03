var base = "https://r4.ontoserver.csiro.au/fhir";
// base = "http://tx.fhir.org/r3";
// base = "http://its.patientsfirst.org.nz/RestService.svc/Terminz";
// base = 'http://fhirtest.uhn.ca/baseDstu3';

(function() {
  function label(r) {
    return r.title || r.name || r.url || "unknown";
  }

  function vsListener() {
    var json = JSON.parse(this.responseText);
    var sel = document.getElementById("valuesetSelect");
    json.entry
      .sort(function(a, b) {
        return label(a.resource).localeCompare(label(b.resource));
      })
      .forEach(function(e) {
        var option = document.createElement("option");
        var r = e.resource;
        option.text = label(r);
        option.value = r.url;
        sel.add(option);
      });
  }

  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", vsListener);
  oReq.open("GET", base + "/ValueSet?_elements=url,name,title&_format=json");
  oReq.send();

})();

function preload(system, code, display, vs) {
  document.getElementById("formUri").value = system || '';
  document.getElementById("formCode").value = code || '';
  document.getElementById("formDisplay").value = display || '';
  document.getElementById("valuesetSelect").value = vs || '';
}

function validate() {
  var vs = document.getElementById("valuesetSelect").value;
  var system = document.getElementById("formUri").value;
  var code = document.getElementById("formCode").value;
  var display = document.getElementById("formDisplay").value;

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

    if ('Parameters' === json.resourceType) {
      json.parameter.forEach(function(p) {
        if ("result" == p.name) {
          if (p.valueBoolean) {
            table.classList.add("table-success");
            table.classList.remove("table-danger");
          } else {
            table.classList.add("table-danger");
            table.classList.remove("table-success");
          }
        }

        var row = document.createElement('tr');
        var name = document.createElement('th');
        name.setAttribute("scope", "row");
        name.textContent = p.name;
        var value = document.createElement('td');
        value.textContent = p.valueString || p.valueInt || p.valueBoolean;

        row.appendChild(name);
        row.appendChild(value);
        table.appendChild(row);
      });
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

  var extra = display ? "&display=" + encodeURIComponent(display) : "";
  var request = "/ValueSet/$validate-code?url=" + encodeURIComponent(vs) + "&system=" + encodeURIComponent(system) + "&code=" + encodeURIComponent(code) + extra;

  document.getElementById("requestLink").href = base + request;
  document.getElementById("requestUrl").textContent = "[base]" + request;

  var oReq = new XMLHttpRequest();
  oReq.addEventListener("load", reqListener);
  oReq.open("GET", base + request + "&_format=json");
  oReq.send();

}
