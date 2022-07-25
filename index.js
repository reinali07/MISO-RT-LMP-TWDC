(function () {
    var myConnector = tableau.makeConnector();
    var url;
    function getHist(arr) {
        var occurrences = arr.reduce(function(obj, item) {
            obj[item] = (obj[item] || 0) + 1;
            obj['total'] = (obj['total'] || 0) + 1;
            return obj;
        }, {});

        return occurrences
    };

    function getDataTypes(keys,values) {
        //var datatypes = [];
        var datatypes = keys.map(() => []);
        for (var i = 0;i<values.length;i++){
            for (var j = 0;j<keys.length;j++){

                datatypes[j].push(typeof values[i][j] == 'number' ? tableau.dataTypeEnum.float : typeof values[i][j]);
            }
        }

        const occurrences = datatypes.map(k => getHist(k));

        var temp;
        maxType = [];
        for (var i=0;i<occurrences.length;i++){
            let {total, ...y} = occurrences[i];
            temp = Object.keys(y).reduce((a, b) => y[a] > y[b] ? a : b);
            if (y[temp] > total/2) {
                maxType.push(temp);
            }
            else {
                maxType.push('tableau.dataTypeEnum.string');
            }
        };
        return maxType;
    };

    myConnector.getSchema = function (schemaCallback) {
        //http://localhost:8889/https://docs.misoenergy.org/marketreports/20220721_rt_lmp_final.csv
        let conData = JSON.parse(tableau.connectionData);
        let url = conData.dataUrl;
        //const url = "http://localhost:8889/" + document.getElementById("url").value;
        tableau.log(url);
        Papa.parse(url, {
            download: true,
            dynamicTyping: true,
            skipEmptyLines: 'greedy',
            preview: 30,
            complete: function(data) {
                var hrow;
                var tableData = [];
                var rowlengths = [];
                var datatypes = [];
                
                tableData = data.data;

                for (var i=0;i<tableData.length;i++) {
                    rowlengths.push(tableData[i].length);
                };
                
                let avglen = rowlengths.reduce((a, b) => a + b) / rowlengths.length;
                for (var i =0;i<rowlengths.length;i++) {
                    if (rowlengths[i] >= avglen) {
                        break;
                    };
                };
                hrow = i;
                tableData = tableData.slice(hrow);

                const keys = (tableData[0]).map(str => str.replace(/\s+/g, ''));
                const values = tableData.slice(1);

                datatypes = getDataTypes(keys,values);

                const cols = keys.map((k,i) => Object.fromEntries([['id',k],['dataType',datatypes[i]]]));

                var tableSchema = {
                    id: "RT_LMP_Final",
                    alias: conData.date.replace(/\D/g,''),
                    columns: cols
                };
                
                schemaCallback([tableSchema]);
            }
        });
    };

    myConnector.getData = function (table, doneCallback) {
        var hrow;
        var tableData = [];
        var rowlengths = [];
        //http://localhost:8889/https://docs.misoenergy.org/marketreports/20220721_rt_lmp_final.csv
        //const url = "http://localhost:8889/" + document.getElementById("url").value;
        let conData = JSON.parse(tableau.connectionData);
        let url = conData.dataUrl;
        tableau.log(url);
        Papa.parse(url, {
            download: true,
            dynamicTyping: true,
            skipEmptyLines: 'greedy',
            step: function(row){
                tableData.push(row.data);
                rowlengths.push(row.data.length);
            },
            complete: function(data) {
                for (var i=0;i<tableData.length;i++) {
                    rowlengths.push(tableData[i].length);
                };
                
                let avglen = rowlengths.reduce((a, b) => a + b) / rowlengths.length;
                for (var i =0;i<rowlengths.length;i++) {
                    if (rowlengths[i] >= avglen) {
                        break;
                    };
                };
                hrow = i;
                tableData = tableData.slice(hrow);

                const keys = (tableData[0]).map(str => str.replace(/\s+/g, ''));
                const values = tableData.slice(1);
                
                const result = values.map(vs => Object.fromEntries(vs.map((v, i) => [keys[i], v])));
                //tableau.log(result.slice(0,4));
                //console.log(result[0]);
                table.appendRows(result);
                doneCallback;

            }
        });

    };

    tableau.registerConnector(myConnector);

    async function _submitToTableau() {
        let date = $("#date").val().trim();
        if (!date) return _error("No data entered.");

        //const urlRegex = /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/|ftp:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/gm;
        //const result = dataUrl.match(urlRegex);
        //if (result === null) {
        //    _error("WARNING: URL may not be valid...");
        //    await new Promise(resolve => setTimeout(resolve, 2000));
        //}
        let dataUrl = "https://twdc-cors.herokuapp.com/https://docs.misoenergy.org/marketreports/"+date.replace(/\D/g,'')+"_rt_lmp_final.csv"



        tableau.connectionData = JSON.stringify({
            dataUrl,
            date
        });

        tableau.connectionName = "RT LMP Final " + date;
        tableau.submit();
    };


    $(document).ready(function () {
        $("#submitButton").click(function () {
            _submitToTableau();
        });
    });
})();