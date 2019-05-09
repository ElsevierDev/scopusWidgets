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

        var query = ''
        if (connectionData.searchQuery.indexOf('(') == -1)
          query = encodeURIComponent("TITLE-ABS-KEY(" + connectionData.searchQuery + ')')
        else
          query = encodeURIComponent(connectionData.searchQuery)

        var key = connectionData.apiKey
        var connectionUrl = 'https://api.elsevier.com:443/content/search/scopus?query=' + query + '&apiKey=' + key

        console.log(connectionUrl)

        var pace = 200
        var max = parseInt(connectionData.maxDocs)
        var cursor = '*'
        _jsonpAjax4(connectionUrl, parseResponse, table, doneCallback, 0, pace, max, cursor)
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

function parseResponse(url, successCallback, table, response, doneCallback, start, pace, max) {
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
        _jsonpAjax4(url, successCallback, table, doneCallback, start + pace, pace, max, cursor)
    } else {
      console.log('Done getting data!')
      doneCallback();
    }
}

function _jsonpAjax4(url, successCallback, table, doneCallback, start, pace, max, cursor) {
   var finalurl = url + '&field=eid,source-id,dc:title,dc:creator,citedby-count,prism:aggregationType,author'
        + '&sort=citedby-count'
        // + "&start=" + start + "&count=" + pace
        + "&cursor=" + encodeURIComponent(cursor) + "&count=" + pace

    $.ajax({
        url: finalurl,
        crossDomain: true,
        headers: {
            'X-ELS-Authtoken': 'sat_9CE0000EC883BA1B5FF5916CA497FDCCE32701A4FAE6DD9762261C65EFF0F465E39246EE9ACB888FEB5748BEE9FDE4C7DDD4DFFEC3BD37A31C20C80D8B079BAC8E7CFD27BDF140AC0AE81A2EE720E46FBE1598C1E9D87D2ED18F5F32C39FA2AEEDC42645FBC4C5E3B7096A000624F1FE326F9261E62351EE9ABB6EA2E304FCEF951220FE92F50AECC082BA548EF7F3D0AA9FC571DB894157BC962429EF879BDF'
        },
        data: {
        },
        success: function (response) {
            successCallback(url, successCallback, table, response, doneCallback, start, pace, max)
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
