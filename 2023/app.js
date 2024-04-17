// Instructions: https://www.youtube.com/watch?v=PFJNJQCU_lo

// Constants
const spreadsheetId = "1TMlB6OfVMGAKSmMoX_FL42b7g6ai8y7C_q0lcAxr-1E";

// Referencing dependencies
const express = require("express");
const cors = require("cors");
const { google } = require("googleapis");

// Creating app
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Gets the data from the google spreadsheet
async function getData(sheetName) {
    let auth = new google.auth.GoogleAuth({
        keyFile: "credentials.json",
        scopes: "https://www.googleapis.com/auth/spreadsheets"
    });

    // Creating client instance for auth
    let client = await auth.getClient();

    // Getting an instance of the google sheets api
    let googleSheets = google.sheets({
        version: "v4",
        auth: client
    });

    // Getting rows of the specified sheets
    let getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: sheetName
    });

    // Getting the values of each row
    let data = getRows.data.values;

    // Returning the data
    return data;
}

// Routes
// This route returns an array of ever
app.get("/data/regular_lots", async (req, res) => {
    const data = await getData("All Lots 12-11-21 by name");
    const json = [];

    for (let i = 1; i < data.length; i++) {
        json.push([
            data[i][5],  // First Name
            data[i][6],  // Middle Name
            data[i][4],  // Last Name
            data[i][7],  // Title
            data[i][0],  // Section
            data[i][1],  // Lot Number
            data[i][2],  // Grave Number
            data[i][8],  // Death
            data[i][9],  // Burial
            data[i][12], // Find-A-Grave ID
            data[i][13], // SketchFab ID
        ]);
    }
    
    res.json(json);
});

app.get("/data/single_graves", async (req, res) => {
    const data = await getData("All SGA 6-5-22");
    const json = [];

    for (let i = 1; i < data.length; i++) {
        json.push([
        data[i][3],  // First Name
        data[i][4],  // Middle Name
        data[i][2],  // Last Name
        data[i][5],  // Title
        data[i][0],  // Section
        null,        // Nothing?
        data[i][1],  // Grave Number
        data[i][6],  // Death
        data[i][7],  // Burial
        data[i][10], // Find-A-Grave ID
        data[i][11], // SketchFab ID
        ]);
    }
  
    res.json(json);
});

// Serving index
app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});

// Adding static files
app.use(express.static(__dirname + "/public"))

// init app
const port = 3001;
app.listen(port, () => console.log(`Server listening on port ${port}.`));