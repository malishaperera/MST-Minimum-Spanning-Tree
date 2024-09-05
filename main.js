const network = document.getElementById('network');
const branchForm = document.getElementById('branchForm');
const branchTable = document.getElementById('branchTable').querySelector('tbody');

// Expanded dataset of coordinates for districts in Sri Lanka
const districtCoordinates = {
    Colombo: { lat: 6.9271, lon: 79.9612 },
    Kandy: { lat: 7.2906, lon: 80.6337 },
    Galle: { lat: 6.0328, lon: 80.2200 },
    Jaffna: { lat: 9.6615, lon: 80.0376 },
    Anuradhapura: { lat: 8.3114, lon: 80.4037 },
    Kalutara: { lat: 6.5752, lon: 79.9684 },
    Batticaloa: { lat: 7.7036, lon: 81.6902 },
    Gampaha: { lat: 7.0401, lon: 80.2085 },
    Matara: { lat: 5.9524, lon: 80.5316 },
    Polonnaruwa: { lat: 7.9436, lon: 81.0158 },
    Ratnapura: { lat: 6.6942, lon: 80.3933 },
    Badulla: { lat: 6.9828, lon: 81.0594 },
    Monaragala: { lat: 6.8686, lon: 81.5020 },
    Hambantota: { lat: 6.1247, lon: 81.1229 },
    Kurunegala: { lat: 7.4790, lon: 80.3484 },
    Vavuniya: { lat: 8.7598, lon: 80.5081 },
    Trincomalee: { lat: 8.5678, lon: 81.2331 },
    Ampara: { lat: 7.2993, lon: 81.6874 },
    Mullaitivu: { lat: 8.8183, lon: 81.5588 },
    Kegalle: { lat: 7.2422, lon: 80.3614 },
    NuwaraEliya: { lat: 6.9651, lon: 80.7805 },
    Kalmunai: { lat: 7.4246, lon: 81.8494 },
    Matale: { lat: 7.4811, lon: 80.6095 }
};

let branches = {
    Colombo: { lat: 6.9271, lon: 79.9612, x: 100, y: 100 }
};
let mst = [];
const graph = {};
const branchSpacing = 100; // Minimum spacing between branches

function haversine(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function updateGraph() {
    const branchNames = Object.keys(branches);
    for (let i = 0; i < branchNames.length; i++) {
        const startBranch = branchNames[i];
        if (!graph[startBranch]) {
            graph[startBranch] = [];
        }
        for (let j = 0; j < branchNames.length; j++) {
            if (i !== j) {
                const endBranch = branchNames[j];
                const distance = haversine(
                    branches[startBranch].lat, branches[startBranch].lon,
                    branches[endBranch].lat, branches[endBranch].lon
                );
                if (!graph[startBranch].find(([neighbor]) => neighbor === endBranch)) {
                    graph[startBranch].push([endBranch, distance]);
                }
            }
        }
    }
}

function placeBranch(branchName) {
    const existingBranches = Object.values(branches);
    let x, y;
    let validPosition = false;

    while (!validPosition) {
        x = Math.random() * (network.clientWidth - 50);
        y = Math.random() * (network.clientHeight - 50);

        validPosition = existingBranches.every(({ x: ex, y: ey }) =>
            Math.hypot(x - ex, y - ey) > branchSpacing
        );
    }

    return { x, y };
}

function drawBranches() {
    network.innerHTML = '';
    for (let branch in branches) {
        const div = document.createElement('div');
        div.classList.add('branch');
        div.style.left = branches[branch].x + 'px';
        div.style.top = branches[branch].y + 'px';
        div.innerText = branch;
        network.appendChild(div);
    }
}

function drawConnections() {
    network.querySelectorAll('.line').forEach(line => line.remove());

    mst.forEach(connection => {
        const [start, end] = connection;
        const startPos = branches[start];
        const endPos = branches[end];

        const line = document.createElement('div');
        line.classList.add('line');
        const x1 = startPos.x + 25; // center of the branch
        const y1 = startPos.y + 25; // center of the branch
        const x2 = endPos.x + 25; // center of the branch
        const y2 = endPos.y + 25; // center of the branch
        const length = Math.hypot(x2 - x1, y2 - y1);
        line.style.width = `${length}px`;
        line.style.height = '3px'; // Increased line thickness
        line.style.left = `${Math.min(x1, x2)}px`;
        line.style.top = `${Math.min(y1, y2)}px`;
       
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.transformOrigin = '0 0'; // Ensure the rotation is correct

        // Adjust z-index and background-color to make lines visible
        line.style.zIndex = '1';
        line.style.backgroundColor = 'rgb(9, 43, 166)'; // Line color

        network.appendChild(line);
    });
}

// Prim's algorithm for incremental MST
function primIncremental(newBranch) {
    const newConnections = [];
    const edges = [];

    for (let [branch, connections] of Object.entries(graph)) {
        if (branch !== newBranch) {
            connections.forEach(([neighbor, cost]) => {
                if (neighbor === newBranch) {
                    edges.push([cost, branch, neighbor]);
                }
            });
        }
    }

    edges.sort(([cost1], [cost2]) => cost1 - cost2);
    const [cost, start, end] = edges[0];
    newConnections.push([start, end]);

    return { connections: newConnections, connectedBranch: start };
}

branchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const branchName = document.getElementById('branchName').value.trim();

    if (districtCoordinates[branchName]) {
        if (branches[branchName]) {
            alert('District is already connected.');
            return;
        }

        // Use existing district coordinates for positioning
        const { x, y } = placeBranch(branchName);
        branches[branchName] = {
            lat: districtCoordinates[branchName].lat,
            lon: districtCoordinates[branchName].lon,
            x: x,
            y: y
        };

        // Update graph and draw branches and connections
        updateGraph();
        drawBranches();

        // Compute and draw new connections incrementally
        const { connections: newConnections, connectedBranch } = primIncremental(branchName);
        mst = mst.concat(newConnections);
        drawConnections();

        // Add new branch to the table with connection details
        const newRow = branchTable.insertRow();
        const cell1 = newRow.insertCell(0);
        const cell2 = newRow.insertCell(1);
        const cell3 = newRow.insertCell(2); // New cell for Connected Branch
        cell1.innerText = branchName;
        cell2.innerText = `(${districtCoordinates[branchName].lat}, ${districtCoordinates[branchName].lon})`;

        // Set connection details for the new row
        cell3.innerText = connectedBranch;

        branchForm.reset();
    } else {
        alert('District not found. Please check the name.');
    }
});

// Initialize with Colombo only
updateGraph();
drawBranches();
drawConnections();