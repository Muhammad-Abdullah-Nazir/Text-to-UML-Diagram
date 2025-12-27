// API Configuration
const API_URL = 'http://localhost:5000/api/generate';

// Example texts
const examples = {
    1: `Student has name, age and rollNumber.
Teacher has name, subject and experience.
Person has address and phoneNumber.
Student inherits from Person.
Teacher inherits from Person.`,
    
    2: `Book has title, author and ISBN.
Member has name, email and memberID.
Library consists of Book.
Librarian inherits from Member.
Member uses Book.`,
    
    3: `Customer has name, email and address.
Product has name, price and description.
Order has orderDate and totalAmount.
Cart has items.
Customer has Cart.
Cart contains Product.
Order consists of Product.`,
    
    4: `Car has color, model and year.
Engine has power, type and cylinders.
Vehicle has speed.
Car inherits from Vehicle.
Car consists of Engine.`
};

// Load example into textarea
function loadExample(num) {
    document.getElementById('inputText').value = examples[num];
}

// Clear all content
function clearAll() {
    document.getElementById('inputText').value = '';
    document.getElementById('canvas').innerHTML = '<div class="welcome-message"><h3>👋 Welcome!</h3><p>Click an example button or enter your own text to generate a UML diagram.</p></div>';
    document.getElementById('infoPanel').innerHTML = '';
}

// Main function to generate diagram
async function generateDiagram() {
    const text = document.getElementById('inputText').value.trim();
    const canvas = document.getElementById('canvas');
    const infoPanel = document.getElementById('infoPanel');
    
    // Validation
    if (!text) {
        infoPanel.innerHTML = '<div class="error-message">⚠️ Please enter some text first!</div>';
        return;
    }
    
    // Show loading
    canvas.innerHTML = '<div class="loading"><div class="spinner"></div><p>Processing your text...</p></div>';
    infoPanel.innerHTML = '';
    
    try {
        // Call backend API
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Draw diagram
            drawDiagram(result.classes, result.attributes, result.relationships);
            // Show info
            showInfo(result);
        } else {
            infoPanel.innerHTML = `<div class="error-message">❌ ${result.error}</div>`;
            canvas.innerHTML = '<div class="welcome-message"><h3>❌ Error</h3><p>Could not generate diagram. Check the error message below.</p></div>';
        }
    } catch (error) {
        console.error('Error:', error);
        infoPanel.innerHTML = `<div class="error-message">❌ Cannot connect to server!<br><br><strong>Make sure:</strong><br>1. Backend server is running (python app.py)<br>2. Server is on http://localhost:5000<br><br><strong>Error:</strong> ${error.message}</div>`;
        canvas.innerHTML = '<div class="welcome-message"><h3>🔌 Server Not Connected</h3><p>Please start the backend server first.</p></div>';
    }
}

// Draw the UML diagram
function drawDiagram(classes, attributes, relationships) {
    const canvas = document.getElementById('canvas');
    canvas.innerHTML = '';
    
    const positions = {};
    const cols = Math.min(3, classes.length);
    const boxSpacing = 250;
    
    // Create class boxes
    classes.forEach((className, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 50 + col * boxSpacing;
        const y = 50 + row * 220;
        
        positions[className] = { x, y };
        
        // Create class box element
        const classBox = document.createElement('div');
        classBox.className = 'class-box';
        classBox.style.left = x + 'px';
        classBox.style.top = y + 'px';
        
        // Class header (name)
        const header = document.createElement('div');
        header.className = 'class-header';
        header.textContent = className;
        classBox.appendChild(header);
        
        // Class attributes
        if (attributes[className] && attributes[className].length > 0) {
            const attrsDiv = document.createElement('div');
            attrsDiv.className = 'class-attributes';
            
            attributes[className].slice(0, 5).forEach(attr => {
                const attrItem = document.createElement('div');
                attrItem.className = 'attribute-item';
                attrItem.textContent = `- ${attr}`;
                attrsDiv.appendChild(attrItem);
            });
            
            classBox.appendChild(attrsDiv);
        }
        
        canvas.appendChild(classBox);
    });
    
    // Draw relationships as SVG lines
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';
    svg.style.width = '100%';
    svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '1';
    
    relationships.forEach(rel => {
        if (positions[rel.source] && positions[rel.target]) {
            const x1 = positions[rel.source].x + 100;
            const y1 = positions[rel.source].y + 20;
            const x2 = positions[rel.target].x + 100;
            const y2 = positions[rel.target].y + 20;
            
            // Draw line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', rel.color);
            line.setAttribute('stroke-width', '3');
            
            // Dashed line for association
            if (rel.type === 'association') {
                line.setAttribute('stroke-dasharray', '5,5');
            }
            
            svg.appendChild(line);
            
            // Draw arrow head
            const angle = Math.atan2(y2 - y1, x2 - x1);
            const arrowLength = 15;
            
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const points = [
                `${x2},${y2}`,
                `${x2 - arrowLength * Math.cos(angle - Math.PI / 6)},${y2 - arrowLength * Math.sin(angle - Math.PI / 6)}`,
                `${x2 - arrowLength * Math.cos(angle + Math.PI / 6)},${y2 - arrowLength * Math.sin(angle + Math.PI / 6)}`
            ].join(' ');
            arrow.setAttribute('points', points);
            arrow.setAttribute('fill', rel.color);
            
            svg.appendChild(arrow);
            
            // Add label
            const labelX = (x1 + x2) / 2;
            const labelY = (y1 + y2) / 2;
            
            const labelBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            labelBg.setAttribute('x', labelX - 30);
            labelBg.setAttribute('y', labelY - 10);
            labelBg.setAttribute('width', 60);
            labelBg.setAttribute('height', 20);
            labelBg.setAttribute('fill', 'white');
            labelBg.setAttribute('stroke', rel.color);
            labelBg.setAttribute('stroke-width', '1');
            labelBg.setAttribute('rx', '5');
            
            const labelText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            labelText.setAttribute('x', labelX);
            labelText.setAttribute('y', labelY + 5);
            labelText.setAttribute('text-anchor', 'middle');
            labelText.setAttribute('font-size', '10');
            labelText.setAttribute('fill', rel.color);
            labelText.textContent = rel.label;
            
            svg.appendChild(labelBg);
            svg.appendChild(labelText);
        }
    });
    
    canvas.appendChild(svg);
}

// Show information panel
function showInfo(result) {
    const infoPanel = document.getElementById('infoPanel');
    const totalAttrs = Object.values(result.attributes).reduce((sum, arr) => sum + arr.length, 0);
    
    const classDetails = result.classes.map(cls => {
        const attrs = result.attributes[cls] || [];
        return `<strong>${cls}</strong>: ${attrs.length} attribute${attrs.length !== 1 ? 's' : ''}`;
    }).join(' | ');
    
    infoPanel.innerHTML = `
        <div class="success-message">
            <h3>✅ Diagram Generated Successfully!</h3>
            <p style="margin-top: 10px;">
                <strong>📊 Summary:</strong><br>
                Classes: ${result.classes.length} | 
                Total Attributes: ${totalAttrs} | 
                Relationships: ${result.relationships.length}
            </p>
            <p style="margin-top: 10px; font-size: 0.9em;">
                ${classDetails}
            </p>
        </div>
    `;
}

// Initialize on page load
window.onload = () => {
    console.log('🎨 Text to UML Diagram Generator loaded!');
    console.log('📍 Looking for backend at:', API_URL);
    loadExample(1);
};