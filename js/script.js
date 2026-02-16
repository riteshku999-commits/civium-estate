const API_URL = "https://script.google.com/macros/s/AKfycbz48gli_1QQXyaZL-ljHB8j2NgzVq3fQU7dYbQN7efUsUo5eHEQOu0RMObSsIQODDKulQ/exec";

const app = document.getElementById("app");

window.onload = () => {
  const params = new URLSearchParams(window.location.search);
  const propertyId = params.get("id");

  if (propertyId) {
    loadPropertyDetail(propertyId);
  } else {
    loadHome();
  }
};

function goHome() {
  window.location.href = "index.html";
}

async function loadHome() {
  app.innerHTML = "<h2 style='padding:30px'>Loading properties...</h2>";

  const response = await fetch(`${API_URL}?action=getProperties`);
  const properties = await response.json();

  let html = `<div class="property-grid">`;

  properties.forEach(property => {
    html += `
      <div class="property-card" onclick="viewProperty('${property.id}')">
        <img src="${property.image1}" />
        <div class="property-info">
          <h3>${property.title}</h3>
          <p><strong>₹ ${Number(property.price).toLocaleString()}</strong></p>
          <p>${property.location}</p>
          <p>${property.area} sq.ft | ${property.bedrooms} Beds | ${property.bathrooms} Baths</p>
        </div>
      </div>
    `;
  });

  html += `</div>`;

  app.innerHTML = html;
}

function viewProperty(id) {
  window.location.href = `index.html?id=${id}`;
}

async function loadPropertyDetail(id) {
  app.innerHTML = "<h2 style='padding:30px'>Loading property...</h2>";

  const response = await fetch(`${API_URL}?action=getPropertyById&id=${id}`);
  const property = await response.json();

  if (property.error) {
    app.innerHTML = "<h2>Property not found</h2>";
    return;
  }

  app.innerHTML = `
    <div class="property-detail">
      <h2>${property.title}</h2>
      <p><strong>₹ ${Number(property.price).toLocaleString()}</strong></p>
      <p>${property.location}</p>
      <p>${property.area} sq.ft | ${property.bedrooms} Beds | ${property.bathrooms} Baths</p>

      <div class="detail-images">
        <img src="${property.image1}" />
        <img src="${property.image2}" />
        <img src="${property.image3}" />
      </div>

      <p>${property.description}</p>

      <div class="lead-form">
        <h3>Interested? Enquire Now</h3>
        <input type="text" id="name" placeholder="Your Name" required />
        <input type="text" id="phone" placeholder="Your Phone" required />
        <textarea id="message" placeholder="Message"></textarea>
        <button onclick="submitLead('${property.id}')">Submit</button>
      </div>
    </div>
  `;
}

async function submitLead(propertyId) {
  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const message = document.getElementById("message").value;

  if (!name || !phone) {
    alert("Please fill required fields");
    return;
  }

  await fetch(`${API_URL}?action=addLead`, {
    method: "POST",
    body: JSON.stringify({
      propertyId,
      name,
      phone,
      message
    })
  });

  alert("Thank you! We will contact you soon.");

  document.getElementById("name").value = "";
  document.getElementById("phone").value = "";
  document.getElementById("message").value = "";
}
