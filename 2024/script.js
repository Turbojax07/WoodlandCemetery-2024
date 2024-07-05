// Constants used when getting the values from the spreadsheet.
const SPREADSHEET_ID = "1TMlB6OfVMGAKSmMoX_FL42b7g6ai8y7C_q0lcAxr-1E";
const API_KEY = "AIzaSyB2nE9aGbN51EuV_S0yGf-IyxvcGGUcDao";

// These constants allow easier access to the data from each google sheet.
// They are indexes for different kinds of data.
// Indexes for the all lots array
const SECTION = 0;
const LOT_NUMBER = 1;
const GRAVE_NUMBER = 2;
const ORIENTATION = 3;
const LAST_NAME = 4;
const FIRST_NAME = 5;
const MIDDLE_NAME = 6;
const TITLE = 7;
const DEATH_DATE = 8;
const BURIAL_DATE = 9;
const NOTES = 10;
const FIND_A_GRAVE_ID = 11;
const SKETCHFAB_ID = 12;

/* 
    Data structure for info from the google sheet.

    sheetData.all contains information for every grave in the cemetery.
    sheetData.sga contains information for every grave in the cemetery that has only one person in that lot.
    sheetData.notable contains information for the graves of some of the more famous graves in the cemetery.
*/
var sheetData = {
    all: [],
    sga: [],
    notable: []
};

window.onload = () => {
    // Loading Text
    // This displays while the search bar is loading.
    // The display updates every half second
    let dotCount = 1;
    setInterval(() => {
        // Updates the text
        document.getElementById("loading").innerText = "Loading" + ".".repeat(dotCount);

        // Increments the counter
        dotCount = (dotCount % 3) + 1;
    }, 500);

    new Promise(async (resolve) => {
        // Fetching data from the google sheet
        sheetData.all = await getInfo("All Lots");
        sheetData.sga = await getInfo("All SGA");
        sheetData.notable = await getInfo("Notable Burials");

        resolve();
    }).then(() => {
        // Removing the title row from each sheet
        sheetData.all.splice(0, 1);
        sheetData.sga.splice(0, 1);
        sheetData.notable.splice(0, 1);
    
        // Loading information into the search form
        sheetData.all.forEach((grave, index) => {
            let option = document.createElement("option");
            option.value = `${grave[FIRST_NAME]} ${grave[LAST_NAME]} (${grave[SECTION]} ${grave[LOT_NUMBER]})`.replace(/  */g, " ");

            document.getElementById("name-list").appendChild(option);
        });

        // Overriding the submit event for the form
        let form = document.getElementById("search-form");
        form.onsubmit = (evt) => {
            // Hiding the currently highlighted graves.
            for (let grave of document.getElementsByClassName("grave")) {
                grave.style.opacity = 0;
            }

            evt.preventDefault();

            let info = document.getElementById("name-input").value;
            displayPerson(info);
        }

        // Having the submit button on the form do something.
        let submit = document.getElementById("submit-search-form");
        submit.onclick = () => {
            // Hiding the currently highlighted graves.
            for (let grave of document.getElementsByClassName("grave")) {
                grave.style.opacity = 0;
            }

            // When the form is submitted, get the selected person and display their info.
            let info = document.getElementById("name-input").value;
            displayPerson(info);
        }
        
        // Displaying the search form
        form.classList.add("fade-in");
        setTimeout(() => {
            form.classList.remove("fade-in");
            form.style.opacity = "1";
        }, 500);

        // Hiding the loading text
        let loading = document.getElementById("loading")
        loading.classList.add("fade-out");
        setTimeout(() => {
            loading.classList.remove("fade-out");
            loading.style.opacity = "0";
        }, 500);
    });

    // Getting the label object.
    var label = document.getElementById("label");

    // Adding event listeners to each landmark.
    var landmarks = document.getElementsByClassName("landmark");
    for (let landmark of landmarks) {
        // Displaying the label for this landmark.
        landmark.onmouseenter = () => {
            label.style.display = "block";
        }

        // Updating the value and position of the label.
        landmark.onmousemove = (evt) => {
            label.style.left = `${evt.clientX + 10}px`;
            label.style.top = `${evt.clientY + 10}px`;

            label.innerText = landmark.classList[1];
        }

        // Hiding the label fot this landmark.
        landmark.onmouseleave = () => {
            label.style.display = "none";
        }
    }

    // Adding event listeners to each grave.
    var graves = document.getElementsByClassName("grave");
    for (let grave of graves) {
        // Displaying the label and the polygon for this grave.
        grave.onmouseover = () => {
            label.style.display = "block";
            grave.style.opacity = 1;
        }

        // Updating the value and position of the label.
        grave.onmousemove = (evt) => {
            label.style.left = `${evt.clientX + 10}px`;
            label.style.top = `${evt.clientY + 10}px`;

            label.innerText = grave.classList[1];
        }

        // Hiding the label and the polygon for this grave.
        grave.onmouseleave = () => {
            label.style.display = "none";
            grave.style.opacity = 0;
        }

        // Displaying the people buried in the selected section.
        grave.onclick = () => {
            displayPlot(grave.classList[1])
        }
    }

    // Adding the notable burials functionality.
    document.getElementById("show-notable-burials").onclick = () => {
        displayPlot("Notable Burials");
    }

    // Adding click event listeners to the person-hide element.
    document.getElementById("person-hide").onclick = () => {
        document.getElementById("person-data").style.display = "none";

        // Hiding the currently highlighted graves.
        for (let grave of document.getElementsByClassName("grave")) {
            grave.style.opacity = 0;
        }
    }

    // Adding click event listeners to the plot-hide element.
    document.getElementById("plot-hide").onclick = () => {
        document.getElementById("plot-data").style.display = "none";
    }
    
    // Adding click event listeners to the sketchfab-hide element.
    document.getElementById("sketchfab-hide").onclick = () => {
        document.getElementById("sketchfab-container").style.display = "none";
    }
}

/**
 * This function loads a list of people that are buried in a specific lot.
 * It also is used to display notable burials such as Arthur Ashe and Martha Anderson.
 * To display notable burials, the plotInfo string is "Notable Burials".
 * 
 * @param {string} plotInfo The plot number {section letter}{lot number} of the grave. EX: ("M11")
 */
function displayPlot(plotInfo) {
    // Finding the group of people to list.
    var people = [];
    if (plotInfo == "Notable Burials") {
        people = sheetData.notable;
    } else {
        sheetData.all.forEach(person => {
            if (plotInfo == `${person[SECTION]}${person[LOT_NUMBER]}`) people.push(person);
        })
    }

    // Hides the individial person container.
    document.getElementById("person-data").style.display = "none";
        
    // Displays a plot info div and adds a caption.
    document.getElementById("plot-data").style.display = "block";
    document.getElementById("plot-name").innerText = plotInfo;

    // Clearing the list of people and adjusting the CSS.
    let inhabitants = document.getElementById("plot-inhabitants")
    inhabitants.innerHTML = "";
    inhabitants.style.height = "auto";

    for (let person of people) {
        // Creating the li element for each person
        let inhabitant = document.createElement("li");
        inhabitant.classList.add("plot-inhabitant")
        inhabitant.innerText = `${person[FIRST_NAME]} ${person[MIDDLE_NAME]} ${person[LAST_NAME]} (${person[SECTION]} ${person[LOT_NUMBER]})`;

        // Removing double spaces from the innerText.
        inhabitant.innerText.replace(/  +/g, " ");

        // Adding click events
        inhabitant.onclick = () => {
            displayPerson(inhabitant.innerText);
        }

        // Adding the inhabitant to the inhabitants list.
        inhabitants.appendChild(inhabitant);
    }

    // Adding a scroll bar if necessary
    if (inhabitants.style.height > window.innerHeight - 220) {
        inhabitants.style.overflowY = "scroll";
        inhabitants.style.height = window.innerHeight - 220;
    } else {
        inhabitants.style.overflowY = "hidden";
        inhabitants.style.height = "auto";
    }
}

function displayPerson(personInfo) {
    // Showing the person data container
    document.getElementById("person-data").style.display = "block";

    // Hiding the plot data container
    document.getElementById("plot-data").style.display = "none";

    // Creating a list of people that match the description.
    let matches = [];

    // Searching all data.
    for (let entry of sheetData.all) {
        // Checking the description against the people in the database.
        let entryString = `${entry[FIRST_NAME]} ${entry[MIDDLE_NAME]} ${entry[LAST_NAME]} (${entry[SECTION]} ${entry[LOT_NUMBER]})`.toLowerCase()
        entryString = entryString.replace(/  */g, " ");
        if (entryString.includes(personInfo.toLowerCase())) {
            console.log(entryString);
            matches.push(entry);
        }
    }

    // Showing the number of matches found
    document.getElementById("person-count").innerText = `${matches.length} match${matches.length == 1 ? "" : "es"} found`; 

    // Clearing existing records
    var records = document.getElementById("person-records");
    records.innerHTML = "";

    // Showing matches found
    for (let match of matches) {
        let div = document.createElement("div");
        div.classList.add("person-record");

        // Adding a border to separate this row from others.
        div.append(document.createElement("hr"));

        // Creating the name banner and adding it to the main div.
        let name = document.createElement("h2");
        name.classList.add("person-name");
        name.innerHTML = `${match[FIRST_NAME]} ${match[MIDDLE_NAME]} ${match[LAST_NAME]}`;
        div.append(name);

        // Creating the info div.
        // It contains all relevant information about the person.
        let info = document.createElement("div");
        info.classList.add("person-info");

        // Creating the section element and adding it to the info div.
        let section = document.createElement("p");
        section.classList.add("person-section");
        section.innerText = `Section: ${match[SECTION]}`;
        info.append(section);

        // Creating the lotNumber element and adding it to the info div.
        let lotNumber = document.createElement("p");
        lotNumber.classList.add("person-lot-number");
        lotNumber.innerText = `Lot Number: ${match[LOT_NUMBER]}`;
        info.append(lotNumber);

        // Creating the title element and adding it to the info div.
        let title = document.createElement("p");
        title.classList.add("person-title");
        title.innerText = `Title: ${match[TITLE]}`;
        info.append(title);

        // Creating the graveNumber element and adding it to the info div.
        let graveNumber = document.createElement("p");
        graveNumber.classList.add("person-grave-number");
        graveNumber.innerText = `Grave Number: ${match[GRAVE_NUMBER]}`;
        info.append(graveNumber);

        // Creating the deathDate element and adding it to the info div.
        let deathDate = document.createElement("p");
        deathDate.classList.add("person-death-date");
        deathDate.innerText = `Death Date: ${match[DEATH_DATE] == "??-??-????" ? "Unknown" : match[DEATH_DATE]}`;
        info.append(deathDate);

        // Creating the burialDate element and adding it to the info div.
        let burialDate = document.createElement("p");
        burialDate.classList.add("person-burial-date");
        burialDate.innerText = `Burial Date: ${match[BURIAL_DATE] == "??-??-????" ? "Unknown" : match[BURIAL_DATE]}`;
        info.append(burialDate);

        // Creating the notes element and adding it to the info div.
        if (match[NOTES] != "") {
            let notes = document.createElement("p");
            notes.classList.add("person-notes");
            notes.innerText = `Notes: ${match[NOTES]}`;
            info.append(notes);
        }

        // Adding the info div to the main div.
        div.append(info);

        // Adding the Find-A-Grave link, if it exists, to the main div.
        if (match[FIND_A_GRAVE_ID] != "") {
            // Spacing the buttons from the rest of the text.
            div.append(document.createElement("br"));

            // Adding the find a grave button to the document.
            let findAGraveLink = document.createElement("input");
            findAGraveLink.type = "button";
            findAGraveLink.classList.add("find-a-grave-link");
            findAGraveLink.value = "FindAGrave.com";
            findAGraveLink.onclick = () => {
                window.open(`https://findagrave.com/memorial/${match[FIND_A_GRAVE_ID]}`, "_blank");
            }
            
            div.append(findAGraveLink);
        }

        // Adding the sketchfab button, if it exists, to the main div.
        if (match[SKETCHFAB_ID] != "") {
            // Separating the Find-A-Grave and sketchfab buttons
            // div.append(document.createElement("br"));

            // Adding the sketchfab button.
            let sketchfabView = document.createElement("input");
            sketchfabView.type = "button";
            sketchfabView.classList.add("sketchfab-view");
            sketchfabView.value = "View 3D Grave";
            sketchfabView.onclick = () => {
                displaySketchFab(match);
            };

            div.append(sketchfabView);
        }

        // The div is now complete, adding it to the page.
        records.append(div);

        // Highlighting the section that this person belongs to.
        let objClass = `${match[SECTION]}${match[LOT_NUMBER]}`;
        let grave = document.getElementsByClassName(objClass);
        if (grave[0] != undefined) {
            grave[0].style.opacity = "1";
        }
    }
}

function displaySketchFab(person) {
    // Showing the sketchfab container.
    document.getElementById("sketchfab-container").style.display = "block";

    // Adding a title and source for the embed.
    document.getElementById("sketchfab-title").innerText = `${person[FIRST_NAME]} ${person[LAST_NAME]}'s Gravestone`;
    document.getElementById("sketchfab-embed").src = `https://sketchfab.com/models/${person[SKETCHFAB_ID]}/embed`;
}

/**
 * Returns a JSON of the values on the spreadsheet linked below.
 * It uses the "sheetName" parameter to determine which sheet to get the information from.
 * https://docs.google.com/spreadsheets/d/1TMlB6OfVMGAKSmMoX_FL42b7g6ai8y7C_q0lcAxr-1E/edit
 */
async function getInfo(sheetName) {
    return await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(sheetName)}?key=${API_KEY}`)
        .then(resp => resp.json())
        .then(json => {
            for (let i = 0; i < json.values.length; i++) {
                for (let j = 0; j < 14; j++) {
                    json.values[i][j] = (json.values[i][j] == undefined) ? "" : json.values[i][j].trim();
                }
            }

            if (sheetName == "All SGA") {
                
            }

            return json.values;
        });
}
