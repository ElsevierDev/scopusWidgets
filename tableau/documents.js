// Web Data Connector for getting DDM Elasticsearch logs



// Define our Web Data Connector
(function () {
    var myConnector = tableau.makeConnector();

    myConnector.getSchema = function (schemaCallback) {
        var cols = [ {
            id: "eid",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "sourceID",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "title",
            dataType: tableau.dataTypeEnum.string
        }, {
            id: "authname",
            dataType: tableau.dataTypeEnum.string
        }, {
              id: "authid",
              dataType: tableau.dataTypeEnum.string
        }, {
            id: "citedbycount",
            dataType: tableau.dataTypeEnum.int
        }, {
            id: "aggregationType",
            dataType: tableau.dataTypeEnum.string
        }];

        var tableSchema = {
            id: "scopusapi",
            alias: "Scopus API",
            columns: cols
        };
        schemaCallback([tableSchema]);
    }

    myConnector.getData = function (table, doneCallback) {

        var connectionData = JSON.parse(tableau.connectionData)

        // Adding a default Title, Abstract, Key field selector
        var query = ''
        if (connectionData.searchQuery.indexOf('(') == -1)
          query = encodeURIComponent("TITLE-ABS-KEY(" + connectionData.searchQuery + ')')
        else
          query = encodeURIComponent(connectionData.searchQuery)

        // Retrieving user API Key
        var key = connectionData.apiKey

        // Checking if an authentication Token has been passed with the API KEY
        // Useful only for Authentication API users
        var token = null
        key = key.replace(/\s\s+/g, ' ');
        // ES5 compatibility
        if (key.indexOf(' ') !== -1) {
        // if (key.includes(' ')) {
          var tab = key.split(' ')
          key = tab[0]
          token = tab[1]
        }

        // Building URL base with query and API KEY
        var connectionUrl = 'https://api.elsevier.com:443/content/search/scopus?query=' + query + '&apiKey=' + key
        console.log(connectionUrl)

        var pace = 200
        var max = parseInt(connectionData.maxDocs)
        var cursor = '*'
        _jsonpAjax4(connectionUrl, parseResponse, table, doneCallback, 0, pace, max, cursor, token)
    }

    tableau.registerConnector(myConnector);
})();

function copySimpleDictionary(mainObj) {
  var objCopy = {};
  var key;

  for (key in mainObj) {
    objCopy[key] = mainObj[key];
  }
  return objCopy;
}

function parseResponse(url, successCallback, table, response, doneCallback, start, pace, max, token) {
    var tableData = [];
    var bombs = [{field: 'author', selectors: ['authname', 'authid']}]

    for (var i = 0; i < response['search-results']['entry'].length; i++) {
        var entry = response['search-results']['entry'][i]

        var tableEntries = [{
              eid: entry['eid'],
              sourceID: entry['source-id'],
              title: entry['dc:title'],
              citedbycount: entry['citedby-count'],
              aggregationType: entry['prism:aggregationType'],
        }]

        for (var j = 0; j < bombs.length; j++) {
          var bomb = bombs[j] // author field name
          var newValuesToAdd = entry[bomb.field]
          if (newValuesToAdd === undefined || newValuesToAdd == null)
            continue

          var newTableEntries = []

          for (var k = 0; k < tableEntries.length; k++) {
            for (var l = 0; l < newValuesToAdd.length; l++) {
              var row = copySimpleDictionary(tableEntries[k])
              for (var m = 0; m < bomb.selectors.length; m++) {
                var bombSelector = bomb.selectors[m]
                row[bombSelector] = newValuesToAdd[l][bombSelector]
              }
              newTableEntries.push(row)
            }
          }
          tableEntries = newTableEntries
        }

        try {
          for (var j = 0; j < tableEntries.length; j++)
            tableData.push(tableEntries[j]);
        } catch (e) {
            console.log(e.message)
        }
    }

    table.appendRows(tableData);

    var reslength = response['search-results']['entry'].length
    var restotal = response['search-results']['opensearch:totalResults']
    cursor = response['search-results']['cursor']['@next']
    if (start + reslength < restotal && start + reslength + pace <= max) {
        console.log("Iterating... cursor: " + cursor);
        _jsonpAjax4(url, successCallback, table, doneCallback, start + pace, pace, max, cursor, token)
    } else {
      console.log('Done getting data!')
      doneCallback();
    }
}

function _jsonpAjax4(url, successCallback, table, doneCallback, start, pace, max, cursor, token) {
   var finalurl = url + '&field=eid,source-id,dc:title,dc:creator,citedby-count,prism:aggregationType,author'
        + '&sort=citedby-count'
        + "&cursor=" + encodeURIComponent(cursor) + "&count=" + pace

    // If Authentication API is used and Token value passed
    var headers = {}
    if (token != null)
      headers['X-ELS-Authtoken'] = token

    $.ajax({
        url: finalurl,
        crossDomain: true,
        headers: headers,
        data: {
        },
        success: function (response) {
            successCallback(url, successCallback, table, response, doneCallback, start, pace, max, token)
        },
        error: function (xhr, status, error) {
            console.log(xhr.responseText);
        }
    })
};

$(document).ready(function () {

    $("#submitButton").click(function () {
      tableau.connectionData = JSON.stringify({
        searchQuery: $("#apiQueryInput").val(),
        apiKey: $("#apiKey").val(),
        maxDocs: $("#maxDocs").val()
      })
      tableau.connectionName = "Scopus API";
      tableau.submit();
    });

});
