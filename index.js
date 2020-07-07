"use strict;"

let cityOverallSourceUrl = "https://homicides.news.baltimoresun.com/baltimore-homicides-victims-1594039258.json";
let statePoliceEncounterSourceUrl = "police-deaths.json";

Bedrock.Http.get(cityOverallSourceUrl, (response) => {
    let transformCityData = function (response) {
        let headers = response.headers;
        let headersCount = headers.length;
        let records = [];
        let record = Object.create(null);
        let i = 0;
        for (let datum of response.data) {
            // get and store the datum in the current record
            let header = headers[i];
            if ((datum !== "") && (datum !== null)) {
                record[header] = datum;
            }

            // advance the datum counter, and if we got all the rcord entries, store the record and prepare the next
            i = (i + 1) % headersCount;
            if (i === 0) {
                // add a sortable timestamp, and sort it
                record.timestamp = Date.parse (record.date_found + " " + (("time_found" in record) ? record.time_found : "00:00:00"));

                // save the record
                records.push (record);
                record = Object.create(null);
            }
        }

        // sort the records
        let CF = Bedrock.CompareFunctions;
        return Bedrock.DatabaseOperations.Sort.new ({
            fields: [
                { name: "timestamp", descending: true, type: CF.NUMERIC },
                { name: "id", descending: true, type: CF.NUMERIC }
            ]
        }).perform (records);
    };
    let cityData = transformCityData (response);

    // build the database filter
    Bedrock.Database.Container.new ({
        database: cityData,
        filterValues: [{ field: "date_found", value: "2020"}],
        onUpdate: function (db) {
            Bedrock.PagedDisplay.Table.new ({
                container: "bedrock-database-display",
                records: db,
                select: [
                    { name: "id", displayName: "ID", width: 0.05 },
                    { name: "date_found", displayName: "Date", width: 0.075 },
                    { name: "time_found", displayName: "Time", width: 0.075 },
                    { name: "gender", displayName: "Gender", width: 0.05 },
                    { name: "race", displayName: "Race", width: 0.075 },
                    { name: "cause", displayName: "Cause", width: 0.1 },
                    { name: "age", displayName: "Age", width: 0.05 },
                    { name: "district", displayName: "District", width: 0.05 }
                ],
                onclick: function (record) {
                    document.getElementById("response-container").innerHTML = JSON.stringify(record, null, 4);
                    return true;
                }
            }).makeTableWithHeader ();
        }
    });

    Bedrock.Http.get(statePoliceEncounterSourceUrl, (response) => {
    });
});
