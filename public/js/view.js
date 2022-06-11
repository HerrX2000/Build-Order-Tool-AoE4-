import escapeHtml from './global.js';
import civilizations from '../json/civilizations.js';

//////////////////////////////////////////////////
// DEFINE menu structure
//////////////////////////////////////////////////
import headerData from '../json/headerData.js';
for (var header in headerData) {
    for (var genre in headerData[header]) {
        headerData[header][genre] = [[], [], [], []]; // add ages
    }
}

//////////////////////////////////////////////////
// READ URLSearchParams data
//////////////////////////////////////////////////
var selectedciv = null;
var buildorder = null;
var buildordercolumns = 6;
var usp = new URLSearchParams(window.location.search);
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-app.js"; import firebaseConfig from '../json/fs.js'; const app = initializeApp(firebaseConfig); import { getFirestore, doc, getDoc, setDoc, collection, updateDoc, addDoc } from "https://www.gstatic.com/firebasejs/9.8.1/firebase-firestore.js"; const db = getFirestore();
if (isNaN(usp.get("f"))) { // Update View counter
    var ref = doc(db, "Age4Builds", usp.get("f"));
    const docSnap = await getDoc(ref);
    if (docSnap.exists()) {
        var docData = docSnap.data();
        //console.log(docData.timestamp);
        //console.log(Date.now());
        //console.log((Date.now()-docData.timestamp)/(1000*60*60*24));
        var newScore = Math.max(docData.score - 10, Math.min(docData.score + 10, docData.views + docData.likes * 10 - Math.floor((Date.now() - docData.timestamp) / (1000 * 60 * 60 * 24))));
        await updateDoc(
            ref, {
            views: docData.views + 1,
            score: newScore
        }).then(() => {
            //alert("data updated successfully");

        }).catch((error) => {
            console.log("Unsuccesful operation, error: " + error);
        });

        //////////////////////////////////////////////////
        // INITIALIZE
        //////////////////////////////////////////////////
        for (let i = 0; i < civilizations.length; i++) {
            if (docData.civ == civilizations[i].abbr) {
                selectedciv = civilizations[i];
                break;
            }
        }
        buildorder = LZString.decompressFromEncodedURIComponent(docData.build);
        switch (docData.version)
        {
            case "t":
            default: 
                buildordercolumns = 6;
                break;
        }
        var buildingTimeModifier = selectedciv.civ == "CH" ? 0.5 : 1;
        const upgradeDSTimeModifier = [3, 3.5, 5, 15];
        const titleLength = 48;
        const nameLength = 24;
        var str = "";
        var tooltipindex = -1;

        //////////////////////////////////////////////////
        // WRITE civilizations menu
        //////////////////////////////////////////////////
        for (let i = 0; i < civilizations.length; i++) {
            str += "<li";
            if (civilizations[i].abbr == selectedciv.abbr) {
                str += " class=\"active\"";
            }
            str += "><a href=\"index.html?c=" + civilizations[i].abbr + "\">" + civilizations[i].civilization + "</a></li>";
        }
        str += "<li><a href=\"index.html\">ALL</a></li>";
        str += "<li><a href=\"build.html?c=" + selectedciv.abbr + "&" + docData.version + "=" + docData.build + "\" class=\"gold\">✎ OPEN BUILDER</a></li>";
        document.getElementById("civilizationsMenu").innerHTML = str;

        //////////////////////////////////////////////////
        // GET page width
        //////////////////////////////////////////////////
        function getWidth() {
            return Math.max(
                document.body.scrollWidth,
                document.documentElement.scrollWidth,
                document.body.offsetWidth,
                document.documentElement.offsetWidth,
                document.documentElement.clientWidth
            );
        }

        //////////////////////////////////////////////////
        // CONVERT seconds to time
        //////////////////////////////////////////////////
        function sToTime(input) {
            var output = "";
            if (input >= 60) {
                output += Math.floor(input / 60) + "m ";
            }
            output += Math.round(input % 60) + "s"
            return output;
        }

        //////////////////////////////////////////////////
        // FORMAT and PRINT image
        //////////////////////////////////////////////////
        const imgstr = ["<a class=\"tooltip\">",
            "<img src=\"img/",
            ".png\" onerror=\"this.src = 'assets/placeholder.png';\"",
            "class=\"icon\" data-index=\"",
            "\" data-info=\"",
            "\" alt=\"",
            "\" style=\"background: radial-gradient(circle, rgba(69,69,69,0.69) 0%, ",
            " 69%); ",
            "\"\></a>"];
        const tableitems = [["food", "resourcefoodicon"], ["wood", "resourcewoodicon"], ["gold", "resourcegoldicon"], ["stone", "resourcestoneicon"], ["time", "timetobuild"], ["pop", "house"]];
        function formatImage(reference, value, showTooltip) {
            var tooltip = "";
            if (showTooltip) {
                tooltip = "<div class=\"tooltipColumn1\">";
                tooltip += imgstr[1] + reference[selectedciv.abbr] + imgstr[2] + "></img><br/><div class=\"smallIcons\">";
                for (let h = 0; h < tableitems.length; h++) {
                    if (reference[tableitems[h][0]]) {
                        if (selectedciv.abbr == "CH" && (reference.genre == "Building" || reference.genre == "Landmark") && tableitems[h][0] == "time") { // Chinese building modifier
                            tooltip += imgstr[1] + tableitems[h][1] + imgstr[2] + ">" + sToTime(reference[tableitems[h][0]] * buildingTimeModifier) + "<br/>";
                        }
                        else if (selectedciv.abbr == "DS" && (reference.genre == "Technology" || reference.genre == "Upgrade" || reference.genre == "Blacksmith")) { // Dehli upgrade modifier
                            if (tableitems[h][0] == "time") {
                                tooltip += imgstr[1] + tableitems[h][1] + imgstr[2] + ">" + sToTime(reference[tableitems[h][0]] * upgradeDSTimeModifier[reference.age - 1]) + "<br/>";
                            }
                        }
                        else {
                            tooltip += imgstr[1] + tableitems[h][1] + imgstr[2] + ">" + (tableitems[h][0] == "time" ? sToTime(reference[tableitems[h][0]]) : reference[tableitems[h][0]]) + "<br/>";
                        }
                    }
                }
                tooltip += "</div></div><div class=\"tooltipColumn2\"><h3>" + reference.name + " (age: " + reference.age + "+)</h3></br></br>" + reference.description + "</div>";
            }
            return reference.color == "transparent"
                ? (imgstr[0] + imgstr[1] + reference[selectedciv.abbr] + imgstr[2] + imgstr[3] + value + imgstr[4] + LZString.compressToEncodedURIComponent(tooltip) + imgstr[5] + reference.name + imgstr[8])
                : (imgstr[0] + imgstr[1] + reference[selectedciv.abbr] + imgstr[2] + imgstr[3] + value + imgstr[4] + LZString.compressToEncodedURIComponent(tooltip) + imgstr[5] + reference.name + imgstr[6] + reference.color + imgstr[7] + imgstr[8]);
        }

        //////////////////////////////////////////////////
        // SANITIZE and CONVERT images to values
        //////////////////////////////////////////////////
        function sanitizeNconvert(input) {
            input = " " + input;
            var array = input.split("<");
            var output = array[0].substring(1);
            for (let i = 1; i < array.length; i++) {
                var array2 = array[i].split(">");
                if (/data-index+\S+/.test(array2[0])) {
                    output += "{" + array2[0].match(/data-index+\S+/)[0].split("\"")[1] + "}";
                }
                for (let j = 1; j < array2.length; j++) {
                    output += array2[j];
                }
            }
            return output.replace(/&nbsp;/g, " ");
        }

        //////////////////////////////////////////////////
        // CONVERT value back to image
        //////////////////////////////////////////////////
        function convertBack(input, data) {
            input = " " + input;
            var array = input.split("{");
            var output = array[0].substring(1);
            for (let k = 1; k < array.length; k++) {
                var array2 = array[k].split("}");
                if (Number.isInteger(parseInt(array2[0]))) {
                    const i = parseInt(array2[0]);
                    output += formatImage(data[i], i, true);
                }
                for (let j = 1; j < array2.length; j++) {
                    output += array2[j];
                }
            }
            return output;
        }

        //////////////////////////////////////////////////
        // READ json/icons.json data
        //////////////////////////////////////////////////
        async function loadiconsJSON() {
            const response = await fetch("json/icons.json");
            const data = await response.json();
            for (let i = 0; i < data.length; i++) {
                var matching = true;
                if (data[i][selectedciv.abbr]) {
                    for (var header in headerData) {
                        for (var genre in headerData[header]) {
                            if (data[i].genre == genre) {
                                headerData[header][genre][data[i].age - 1].push(i);
                                matching = false;
                                break;
                            }
                        }
                        if (!matching) break;
                    }
                    if (matching) {
                        headerData["Miscellaneous"]["Misc"][data[i].age - 1].push(i);
                    }
                }
            }

            //////////////////////////////////////////////////
            // WRITE current civ
            //////////////////////////////////////////////////
            document.getElementById("civilizationFocus").innerHTML = selectedciv.focus;
            document.getElementById("civilizationFlag").innerHTML = "<img src=\"img/flag" + selectedciv.abbr + ".png\" onerror=\"this.src = 'assets/placeholder.png';\"></img>";
            var str = selectedciv.civilization + " ";
            for (let i = 0; i < 3; i++) {
                if (selectedciv.difficulty == i) {
                    str += "<span style=\"color: #11141D\">";
                }
                str += "★";
            }
            str += "</span>";
            document.getElementById("civilizationName").innerHTML = str;
            str = "";
            selectedciv.uniqueunits.forEach(element => {
                str += formatImage(data[element], element, true);
            });
            document.getElementById("civilizationUniqueUnits").innerHTML = str;

            str = escapeHtml(docData.title).substring(0, titleLength) + " (by " + escapeHtml(docData.user).substring(0, nameLength) + ")";
            document.getElementById("civilizationFocus").innerHTML = str;


            //////////////////////////////////////////////////
            // LOAD event
            //////////////////////////////////////////////////
            var buildarray;
            if (buildorder) {
                buildarray = sanitizeNconvert(buildorder).split("|");
            }
            else {
                let vilval = selectedciv.abbr == "FR" ? 54 : 53;
                let str = `0|Click to start editing your own build|1|Icons can be dragged from the menu on the right: {${vilval}} |2|When ready press \"Save to URL\" and share your build!|`;
                window.history.replaceState("Home", "AGE OF EMPIRES 4 - BUILD ORDER TOOL", 'view.html?c=' + selectedciv.abbr + "&b=" + str);
                buildarray = sanitizeNconvert(str).split("|");
            }
            var rows = document.getElementById("buildTable").rows;
            for (let i = buildarray.length / buildordercolumns - (rows.length - 1); i > 1; i--) {
                document.getElementById("buildTable").insertRow(2);
            }
            var rows = document.getElementById("buildTable").rows;
            for (let i = 0; i < (rows.length - 1); i++) {
                var rowstring = "";
                for (let j = 0; j < buildordercolumns; j++) {
                    rowstring += "<td ";
                    if (j == buildordercolumns - 1) {
                        rowstring += " style=\"text-align: left;\"";
                    }
                    rowstring += ">" + convertBack(buildarray[(i * buildordercolumns) + j], data) + "</td>";
                    if (j == 0 && buildordercolumns == 2) {
                        for (let k = 0; k < (6 - buildordercolumns); k++) {
                            rowstring += "<td></td>"
                        }
                    }
                }
                rows[i + 1].innerHTML = rowstring;
                //console.log(rowstring);
            }

            ///////////////////////////////////////////////////
            // SHOW tooltips
            ///////////////////////////////////////////////////
            let tooltipContainer = document.getElementById('tooltipContainer');
            const tooltipBox = document.getElementById('tooltipBox');
            document.addEventListener('mousemove', function checkHover(e) {
                tooltipContainer.style.left = getWidth() > e.pageX + 330 ? e.pageX + 4 + 'px' : e.pageX - 333 + 'px';
                tooltipContainer.style.top = e.pageY + 2 + 'px';
                const allTooltips = document.getElementsByClassName('tooltip');
                if (tooltipindex < 0 || !allTooltips.item(tooltipindex).querySelector(':hover')) {
                    for (var i = 0; i < allTooltips.length; i++) {
                        if (allTooltips.item(i).querySelector(':hover')) {
                            tooltipBox.innerHTML = LZString.decompressFromEncodedURIComponent(allTooltips.item(i).firstChild.getAttribute('data-info'));
                            tooltipBox.style.display = "block";
                            tooltipindex = i;
                            return;
                        }
                    }
                    tooltipBox.innerHTML = "";
                    tooltipBox.style.display = "none";
                    tooltipindex = -1;
                }

            });

        } //////////////////////////////////////////////////
        loadiconsJSON();
        document.getElementById('tooltipBox').style.display = "none";


    }
    else {
        alert("No such Document");
    }

} else {
    window.location.href = "index.html";
}

//////////////////////////////////////////////////
// RANDOMIZE background
//////////////////////////////////////////////////
//const backgroundOptions = ["02celebration", "03focuslongbowmen", "04lordrobertsb", "07raisedstakestwoknights", "10mongoltrebuchet", "11chinesetradecaravans", "12mongolscharging", "15paytributeb", "alarm"];
//document.getElementById("background").style.backgroundImage = "url(img/" + backgroundOptions[Math.floor(Math.random() * backgroundOptions.length)] + ".png)";