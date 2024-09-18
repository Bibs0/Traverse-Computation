// Function to convert DMS to decimal degrees
function DMStoDecimal(deg, min, sec) {
    return deg + (min / 60) + (sec / 3600);
}

// Function to convert decimal degrees to DMS format
function decimalToDMS(decimal) {
    const deg = Math.floor(decimal);
    const min = Math.floor((decimal - deg) * 60);
    const sec = (((decimal - deg) * 60) - min) * 60;
    return `${deg}° ${min}' ${sec.toFixed(2)}"`;
}

function generateFields() {
    const numStations = document.getElementById("stationNumber").value;
    const inputFields = document.getElementById("inputFields");
    inputFields.innerHTML = ""; // Clear previous inputs

    if (numStations) {
        let html = `<label>Initial Bearing:</label>
                    <div>
                        <input type="number" id="initialBearingDeg" placeholder="Degrees" min="0" max="360">
                        <input type="number" id="initialBearingMin" placeholder="Minutes" min="0" max="59">
                        <input type="number" id="initialBearingSec" placeholder="Seconds" min="0" max="59">
                    </div>
                    <label>Initial Easting:</label>
                    <input type="number" id="initialEasting" placeholder="Enter initial easting">
                    <label>Initial Northing:</label>
                    <input type="number" id="initialNorthing" placeholder="Enter initial northing">`;

        for (let i = 1; i <= numStations; i++) {
            html += `<h3>Station ${i}</h3>
                     <label>Station Name (Station ${i}):</label>
                     <input type="text" id="stationName${i}" placeholder="Enter name for station ${i}">
                     <label>Observed Angle (Station ${i}):</label>
                     <div>
                         <input type="number" id="angleDeg${i}" placeholder="Degrees" min="0" max="360">
                         <input type="number" id="angleMin${i}" placeholder="Minutes" min="0" max="59">
                         <input type="number" id="angleSec${i}" placeholder="Seconds" min="0" max="59">
                     </div>
                     <label>Length (Station ${i}):</label>
                     <input type="number" id="length${i}" placeholder="Enter length for station ${i}">`;
        }

        inputFields.innerHTML = html;
    }
}

function getInitialInputs() {
    const initialBearingDeg = parseFloat(document.getElementById("initialBearingDeg").value) || 0;
    const initialBearingMin = parseFloat(document.getElementById("initialBearingMin").value) || 0;
    const initialBearingSec = parseFloat(document.getElementById("initialBearingSec").value) || 0;
    const initialEasting = parseFloat(document.getElementById("initialEasting").value);
    const initialNorthing = parseFloat(document.getElementById("initialNorthing").value);

    
    const initialBearing = DMStoDecimal(initialBearingDeg, initialBearingMin, initialBearingSec);

    return {
        initialBearing,
        initialEasting,
        initialNorthing
    };
}


function computeBearing(previousBearing, observedAngle) {
    if (previousBearing >= 180) {
        previousBearing -= 180;
    } else {
        previousBearing += 180;
    }

    let newBearing = previousBearing + observedAngle;

    // Ensure bearing is within 0-360 degrees
    if (newBearing < 0) {
        newBearing += 360;
    } else if (newBearing >= 360) {
        newBearing -= 360;
    }

    return newBearing;
}


function computeDeltaCoordinates(length, bearing) {
    const deltaEasting = length * Math.cos(bearing * (Math.PI / 180));
    const deltaNorthing = length * Math.sin(bearing * (Math.PI / 180));
    return { deltaEasting, deltaNorthing };
}


function computeCorrections(totalDeltaEasting, totalDeltaNorthing, numStations) {
    let correctionEasting = 0;
    let correctionNorthing = 0;

    if (totalDeltaEasting !== 0) {
        correctionEasting = -totalDeltaEasting / numStations;
    }

    if (totalDeltaNorthing !== 0) {
        correctionNorthing = -totalDeltaNorthing / numStations;
    }

    return { correctionEasting, correctionNorthing };
}


function buildTableRow(stationName, observedAngle, length, bearing, easting, northing, correctionEasting, correctionNorthing, finalEasting, finalNorthing) {
    return `<tr>
                <td>${stationName}</td>
                <td>${decimalToDMS(observedAngle)}</td>
                <td>${length}</td>
                <td>${decimalToDMS(bearing)}</td>
                <td>${easting.toFixed(2)}</td>
                <td>${northing.toFixed(2)}</td>
                <td>${correctionEasting.toFixed(2)}</td>
                <td>${correctionNorthing.toFixed(2)}</td>
                <td>E: ${finalEasting.toFixed(2)}, N: ${finalNorthing.toFixed(2)}</td>
            </tr>`;
}


function computeTraverse() {
    const numStations = document.getElementById("stationNumber").value;
    const { initialBearing, initialEasting, initialNorthing } = getInitialInputs();

    if (!numStations || isNaN(initialEasting) || isNaN(initialNorthing)) {
        alert("Please fill all fields correctly!");
        return;
    }

    let resultTable = document.getElementById("resultTable");
    resultTable.innerHTML = ""; // Clear previous results

    let bearings = [];
    bearings[0] = initialBearing;  // First station's bearing is the same as the initial bearing

    let currentEasting = initialEasting;
    let currentNorthing = initialNorthing;

    let totalDeltaEasting = 0;
    let totalDeltaNorthing = 0;
    let html = `<table>
                <thead>
                    <tr>
                        <th>Station Name</th>
                        <th>Observed Angle (DMS)</th>
                        <th>Length</th>
                        <th>Bearing (DMS)</th>
                        <th>Easting</th>
                        <th>Northing</th>
                        <th>Correction (Easting)</th>
                        <th>Correction (Northing)</th>
                        <th>Final Coordinates</th>
                    </tr>
                </thead>
                <tbody>`;

    for (let i = 1; i <= numStations; i++) {
        let stationName = document.getElementById(`stationName${i}`).value;
        let observedAngleDeg = parseFloat(document.getElementById(`angleDeg${i}`).value) || 0;
        let observedAngleMin = parseFloat(document.getElementById(`angleMin${i}`).value) || 0;
        let observedAngleSec = parseFloat(document.getElementById(`angleSec${i}`).value) || 0;
        let length = parseFloat(document.getElementById(`length${i}`).value);

        if (!stationName || isNaN(length)) {
            alert(`Please fill all fields for station ${i}`);
            return;
        }

        let observedAngle = DMStoDecimal(observedAngleDeg, observedAngleMin, observedAngleSec);
        let newBearing = computeBearing(bearings[i - 1], observedAngle);

        bearings[i] = newBearing;

        let { deltaEasting, deltaNorthing } = computeDeltaCoordinates(length, newBearing);

        totalDeltaEasting += deltaEasting;
        totalDeltaNorthing += deltaNorthing;

        let { correctionEasting, correctionNorthing } = computeCorrections(totalDeltaEasting, totalDeltaNorthing, numStations);

        let finalEasting = currentEasting + deltaEasting + correctionEasting;
        let finalNorthing = currentNorthing + deltaNorthing + correctionNorthing;

        html += buildTableRow(stationName, observedAngle, length, newBearing, currentEasting, currentNorthing, correctionEasting, correctionNorthing, finalEasting, finalNorthing);

        currentEasting = finalEasting;
        currentNorthing = finalNorthing;
    }

    html += `</tbody></table>`;
    resultTable.innerHTML = html;
}
