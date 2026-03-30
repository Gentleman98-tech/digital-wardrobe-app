
// ====== GRUND-ELEMENTE ======
const menuBtn = document.getElementById("menuBtn");
const sideMenu = document.getElementById("sideMenu");
const content = document.getElementById("content");

const SUPABASE_URL = "https://kzrgprujmdsoisxkaedb.supabase.co";
const SUPABASE_KEY = "sb_publishable_Tff1qERVhci-2FUX3CMLfg_IEjWgpPE";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Client:", supabaseClient);
// ====== OUTFIT SPEICHERN ======


const OUTFIT_STORAGE_KEY = "saved_outfits_v1";
let savedOutfits = [];

let nextOutfitNumber = 1;

async function loadSavedOutfits() {
  const { data, error } = await supabaseClient
    .from("saved_outfits")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Fehler beim Laden der Outfits:", error);
    savedOutfits = [];
    return;
  }

  savedOutfits = data.map(outfit => {
    const topItem = wardrobeItems.find(i => i.id === outfit.top_id);
    const bottomItem = wardrobeItems.find(i => i.id === outfit.bottom_id);
    const shoesItem = wardrobeItems.find(i => i.id === outfit.shoes_id);

    return {
      id: outfit.id,
      topId: outfit.top_id,
      bottomId: outfit.bottom_id,
      shoesId: outfit.shoes_id,
      topImg: topItem?.img || "images/closet.jpeg",
      bottomImg: bottomItem?.img || "images/closet.jpeg",
      shoesImg: shoesItem?.img || "images/closet.jpeg",
      createdAt: outfit.created_at
    };
  });
}

async function deleteSavedOutfit(outfitId) {
  const confirmed = confirm("Möchtest du dieses Outfit wirklich löschen?");
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("saved_outfits")
    .delete()
    .eq("id", outfitId);

  if (error) {
    console.error("Fehler beim Löschen des Outfits:", error);
    alert("Outfit konnte nicht gelöscht werden.");
    return;
  }

  await loadSavedOutfits();
  renderSavedOutfits();
}

function saveSavedOutfits() {
  localStorage.setItem(OUTFIT_STORAGE_KEY, JSON.stringify(savedOutfits));
}

function initSaveOutfitButton() {
  const btn = document.getElementById("saveOutfitBtn");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    const topItem = getFilteredItems("top")[outfitState.top];
    const bottomItem = getFilteredItems("bottom")[outfitState.bottom];
    const shoesItem = getFilteredItems("shoes")[outfitState.shoes];

    if (!topItem || !bottomItem || !shoesItem) {
      alert("Bitte wähle für alle drei Kategorien ein Teil aus.");
      return;
    }

    const { error } = await supabaseClient
      .from("saved_outfits")
      .insert([{
        top_id: topItem.id,
        bottom_id: bottomItem.id,
        shoes_id: shoesItem.id
      }]);

    if (error) {
      console.error("Fehler beim Speichern des Outfits:", error);
      alert("Outfit konnte nicht gespeichert werden.");
      return;
    }

    await loadSavedOutfits();
    renderSavedOutfits();
  });
}
// ====== OUTFIT FILTER VERKNÜPFUNG ======
const occasionOptions = [
  "Business",
  "Business Casual",
  "Freizeit",
  "Sport"
];

const colorOptions = [
  "schwarz",
  "weiß",
  "beige",
  "olive",
  "hellblau",
  "dunkelblau",
  "braun",
  "grau",
  "rosa",
];

const typeOptions = {
  Oberteile: [
    "T-Shirts",
    "Poloshirts",
    "Pullover",
    "Hoodies",
    "Strickjacken",
    "Leichte Jacken",
    "Hemden"
  ],
  Hosen: [
    "Jeans",
    "Chinos",
    "Jogger",
    "Shorts",
    "Sporthose",
    "Anzughose"
  ],
  Schuhe: [
    "Sneaker",
    "Chelsea Boots",
    "Anzugschuhe"
  ]
};
function getTypesForCategory(category) {
  const fromDB = wardrobeItems
    .filter(item => item.mainCategory === category)
    .map(item => item.type)
    .filter(Boolean);

  const merged = new Set([
    ...(typeOptions[category] || []),
    ...fromDB
  ]);

  return [...merged].sort((a, b) => a.localeCompare(b, "de"));
}

// ====== KATEGORIE-STRUKTUR (für Modal Dropdown) ======
const categoryStructure = [
  {
    group: "T-Shirts & Oberteile",
    items: [
      "T-Shirt Sport",
      "T-Shirt Casual",
      "Poloshirts",
      "Pullover",
      "Hoodies"
    ]
  },
  {
    group: "Indoorjacken",
    items: [
      "Strickjacken",
      "Polokragen-Jacken",
      "Trainingsjacken"
    ]
  },
  {
    group: "Hemden",
    items: [
      "Hemd Business",
      "Hemd Casual"
    ]
  },
  {
    group: "Hosen",
    items: [
      "Jeans",
      "Hosen Casual",
      "Hosen Business"
    ]
  },
  {
    group: "Outdoorjacken",
    items: [
      "Leicht",
      "Schwer"
    ]
  },
  {
    group: "Schuhe",
    items: [
      "Sneaker Business",
      "Sneaker Casual",
      "Boots Business",
      "Boots Casual"
    ]
  },
  {
    group: "Socken",
    items: []
  }
]

const outfitFilterOptions = {
  top: typeOptions.Oberteile,
  pants: typeOptions.Hosen,
  shoes: typeOptions.Schuhe
};

const COLOR_OPTIONS = [
  "weiß",
  "schwarz",
  "grau",
  "dunkelgrau",
  "beige",
  "creme",
  "braun",
  "dunkelbraun",
  "navy",
  "blau",
  "hellblau",
  "grün",
  "olive",
  "rot",
  "bordeaux",
  "rosa",
  "lila",
  "gelb",
  "orange"
];
function buildColorOptions(selectedValue = "") {
  return `
    <option value="">Alle Farben</option>
    ${COLOR_OPTIONS.map(color => `
      <option value="${color}" ${selectedValue === color ? "selected" : ""}>${color}</option>
    `).join("")}
  `;
}

const TOP_SIZE_OPTIONS = ["XL", "XXL", "3XL"];

function buildSizeOptions(options = [], placeholder = "Bitte wählen") {
  return `
    <option value="">${placeholder}</option>
    ${options.map(size => `<option value="${size}">${size}</option>`).join("")}
  `;
}

function updateSizeSelectByCategory() {
  const categorySelect = document.getElementById("mainCategorySelect");
  const sizeSelect = document.getElementById("sizeSelect");

  if (!categorySelect || !sizeSelect) return;

  const category = categorySelect.value;

  if (category === "Oberteile") {
    sizeSelect.innerHTML = buildSizeOptions(TOP_SIZE_OPTIONS, "Größe wählen");
    sizeSelect.disabled = false;
  } else {
    sizeSelect.innerHTML = `<option value="">Derzeit nur für Oberteile</option>`;
    sizeSelect.disabled = true;
  }
}

const outfitGroupedOptions = {
  top: [
    {
      group: "Oberteile",
      items: ["T-Shirts", "Poloshirts", "Pullover", "Hoodies"]
    },
    {
      group: "Jacken",
      items: ["Strickjacken", "Leichte Jacken"]
    },
    {
      group: "Hemden",
      items: ["Hemden"]
    }
  ],
  pants: [
    {
      group: "Hosen",
      items: ["Jeans", "Chinos", "Anzughose"]
    }
  ],
  shoes: [
    {
      group: "Schuhe",
      items: ["Sneaker", "Chelsea Boots", "Anzugschuhe"]
    }
  ]
};

function buildGroupedOptions(groups) {
  return groups.map(group => `
    <optgroup label="${group.group}">
      ${group.items.map(item => `<option value="${item}">${item}</option>`).join("")}
    </optgroup>
  `).join("");
}

function buildGroupedOptions(groups) {
  return groups.map(group => `
    <optgroup label="${group.group}">
      ${group.items.map(item => `<option value="${item}">${item}</option>`).join("")}
    </optgroup>
  `).join("");
}

;


// Dropdown automatisch füllen
function fillCategorySelect(selectElement) {
  if (!selectElement) return;

  selectElement.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Bitte wählen";
  selectElement.appendChild(placeholder);

  ["Oberteile", "Hosen", "Schuhe"].forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    selectElement.appendChild(option);
  });
}

// ====== KATEGORIEN ======
const closetMainFilters = ["Alle", "Oberteile", "Hosen", "Schuhe"];





// Merkt sich den zuletzt gewählten Filter
let currentClosetFilter = "Alle";
let currentClosetSubfilter = "Alle";
let currentOutfitFilter = null;

let currentLocalFilters = {
  topType: "",
  topColor: "",
  bottomType: "",
  bottomColor: "",
  shoesType: "",
  shoesColor: ""
};

const closetSubFilters = {
  Oberteile: ["Alle", "T-Shirts", "Poloshirts", "Pullover", "Hoodies", "Strickjacken", "Leichte Jacken", "Hemden"],
  Hosen: ["Alle", "Jeans", "Chinos", "Anzughose"],
  Schuhe: ["Alle", "Sneaker", "Chelsea Boots","Sportschuhe", "Anzugschuhe"]
};

// ====== STORAGE ======
const STORAGE_KEY = "wardrobe_items_v1";

// Demo-Startbestand (wird nur genutzt, wenn localStorage leer ist)
let wardrobeItems = [
  // ===== OBERTEILE =====
  {
    id: "top_1",
    mainCategory: "Oberteile",
    type: "T-Shirts",
    occasions: "Freizeit",
    color: "schwarz",
    img: "images/shirt1.jpg"
  },
  {
    id: "top_2",
    mainCategory: "Oberteile",
    type: "Poloshirts",
    occasions: "Business Casual",
    color: "olive",
    img: "images/shirt2.jpg"
  },
  {
    id: "top_3",
    mainCategory: "Oberteile",
    type: "Poloshirts",
    occasions: "Business Casual",
    color: "beige",
    img: "images/shirt3.jpg"
  },

  // ===== HOSEN =====
  {
    id: "pants_1",
    mainCategory: "Hosen",
    type: "Chinos",
    occasions: ["Business","Business Casual"],
    color: "schwarz",
    img: "images/hose1.JPG"
  },
  {
    id: "pants_2",
    mainCategory: "Hosen",
    type: "Chinos",
    occasions: ["Business Casual","Freizeit"],
    color: "beige",
    img: "images/hose2.JPG"
  },
  {
    id: "pants_3",
    mainCategory: "Hosen",
    type: "Jeans",
    occasions: "Freizeit",
    color: "grau",
    img: "images/hose3.JPG"
  },

  // ===== SCHUHE =====
  {
    id: "shoes_1",
    mainCategory: "Schuhe",
    type: "Chelsea Boots",
    occasions: ["Freizeit","Business Casual"],
    color: "braun",
    img: "images/shoe1.jpg"
  },
  {
    id: "shoes_2",
    mainCategory: "Schuhe",
    type: "Sneaker",
    occasions: "Freizeit",
    color: "dunkelblau",
    img: "images/shoe2.jpg"
  },
  {
    id: "shoes_3",
    mainCategory: "Schuhe",
    type: "Sneaker",
    occasions: ["Business","Business Casual","Freizeit"],
    color: "weiß",
    img: "images/shoe3.JPG"
  }
];




function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(wardrobeItems));
}

async function deleteWardrobeItem(itemId) {
  const confirmed = confirm("Möchtest du dieses Kleidungsstück wirklich löschen?");
  if (!confirmed) return;

  const { error } = await supabaseClient
    .from("wardrobe_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    console.error("Fehler beim Löschen:", error);
    alert("Fehler beim Löschen des Kleidungsstücks.");
    return;
  }

  await loadItems();
  renderCloset(currentClosetFilter);
}

function uid() {
  return "id_" + Math.random().toString(16).slice(2) + "_" + Date.now();
}

function getItemsByCategory(category) {
  return wardrobeItems.filter(item => item.mainCategory === category);
}

// ====== OUTFIT FILTER VERKNÜPFUNGEN ======

function getFilteredItems(key) {
  let categoryName = "";

  if (key === "top") categoryName = "Oberteile";
  if (key === "bottom") categoryName = "Hosen";
  if (key === "shoes") categoryName = "Schuhe";

  let items = wardrobeItems.filter(item => item.mainCategory === categoryName);

  // Globaler Filter nach Anlass
  if (currentOutfitFilter) {
    items = items.filter(item => (item.occasions || []).includes(currentOutfitFilter))
  }

  // Lokale Typ-Filter
  if (key === "top" && currentLocalFilters.topType) {
    items = items.filter(item => item.type === currentLocalFilters.topType);
  }

  if (key === "bottom" && currentLocalFilters.bottomType) {
    items = items.filter(item => item.type === currentLocalFilters.bottomType);
  }

  if (key === "shoes" && currentLocalFilters.shoesType) {
    items = items.filter(item => item.type === currentLocalFilters.shoesType);
  }

  // Lokale Farb-Filter
  if (key === "top" && currentLocalFilters.topColor) {
    items = items.filter(item => item.color === currentLocalFilters.topColor);
  }

  if (key === "bottom" && currentLocalFilters.bottomColor) {
    items = items.filter(item => item.color === currentLocalFilters.bottomColor);
  }

  if (key === "shoes" && currentLocalFilters.shoesColor) {
    items = items.filter(item => item.color === currentLocalFilters.shoesColor);
  }

  return items;
}
// ====== MENU OPEN/CLOSE ======
menuBtn.addEventListener("click", () => {
  sideMenu.classList.toggle("open");
});

// ====== NAV CLICK ======
document.querySelectorAll("nav li").forEach(item => {
  item.addEventListener("click", () => {
    const page = item.getAttribute("data-page");
    sideMenu.classList.remove("open");
    renderPage(page);
  });
});

// ====== PAGES ======
function renderHome() {
  content.innerHTML = `
    <div class="glass-box">
      <h1>Hallo Timon</h1>
      <p>Willkommen in deinem digitalen Kleiderschrank</p>
    </div>
  `;
}
function renderOutfits() {
  content.innerHTML = `
    <div class="closet-panel outfits-panel">
      <button class="outfits-sidebar-toggle" id="outfitsSidebarToggle">❯</button>
      <div class="outfits-sidebar-backdrop" id="outfitsSidebarBackdrop"></div>

      <div class="outfits-layout">

        <div class="outfits-main">
          <div class="closet-topbar">
            <h1 class="closet-title">Outfits</h1>
          </div>

          <div class="outfit-global-filters">
            <button class="outfit-top-filter">Business</button>
            <button class="outfit-top-filter">Business Casual</button>
            <button class="outfit-top-filter">Freizeit</button>
          </div>

          <div class="outfit-section-block">
            <div class="outfit-section-head">
              <div class="outfit-section-label">Oberteile</div>
            </div>

            <div class="outfit-local-filters">
            <select class="outfit-mini-select" id="topTypeFilter">
  <option value="">Alle</option>
  ${buildSimpleOptions(outfitFilterOptions.top)}
</select>

              <select class="outfit-mini-select" id="topColorFilter">
  ${buildColorOptions()}
</select>
            </div>

            <div class="outfit-rondell">
              <div class="outfit-side-card left" id="topLeft"></div>
              <button class="outfit-arrow left" id="topPrev">◀</button>
              <div class="outfit-center-card" id="topCenter"></div>
              <button class="outfit-arrow right" id="topNext">▶</button>
              <div class="outfit-side-card right" id="topRight"></div>
            </div>
          </div>

          <div class="outfit-section-block">
            <div class="outfit-section-head">
              <div class="outfit-section-label">Hosen</div>
            </div>

            <div class="outfit-local-filters">
              <select class="outfit-mini-select" id="bottomTypeFilter">
  <option value="">Alle</option>
  <option value="Jeans">Jeans</option>
  <option value="Chinos">Chinos</option>
  <option value="Jogger">Jogger</option>
  <option value="Shorts">Shorts</option>
  <option value="Sporthose">Sporthose</option>
  <option value="Anzughose">Anzughose</option>
</select>

              <select class="outfit-mini-select" id="bottomColorFilter">
  ${buildColorOptions()}
</select>
            </div>

            <div class="outfit-rondell">
              <div class="outfit-side-card left" id="bottomLeft"></div>
              <button class="outfit-arrow left" id="bottomPrev">◀</button>
              <div class="outfit-center-card" id="bottomCenter"></div>
              <button class="outfit-arrow right" id="bottomNext">▶</button>
              <div class="outfit-side-card right" id="bottomRight"></div>
            </div>
          </div>

          <div class="outfit-section-block">
            <div class="outfit-section-head">
              <div class="outfit-section-label">Schuhe</div>
            </div>

            <div class="outfit-local-filters">
              <select class="outfit-mini-select" id="shoeTypeFilter">
  <option value="">Alle</option>
  ${buildSimpleOptions(outfitFilterOptions.shoes)}
</select>

              <select class="outfit-mini-select" id="shoeColorFilter">
  ${buildColorOptions()}
</select>
            </div>

            <div class="outfit-rondell">
              <div class="outfit-side-card left" id="shoeLeft"></div>
              <button class="outfit-arrow left" id="shoePrev">◀</button>
              <div class="outfit-center-card" id="shoeCenter"></div>
              <button class="outfit-arrow right" id="shoeNext">▶</button>
              <div class="outfit-side-card right" id="shoeRight"></div>
            </div>
          </div>

          <div class="outfit-save-row">
            <button class="outfit-save-btn" id="saveOutfitBtn">
              💾 Outfit speichern
            </button>
          </div>
        </div>

        <div class="outfits-sidebar">
          <div class="saved-outfits-title">Gespeicherte Outfits</div>
          <div id="savedOutfitsList" class="saved-outfits-list">
            <div class="saved-outfit-placeholder">Noch keine Outfits gespeichert</div>
          </div>
        </div>

      </div>
    </div>
  `;


  initOutfitRondells();
  // initOutfitTopFilters();
  initLocalOutfitFilters();
  initSaveOutfitButton();
  renderSavedOutfits();
  initOutfitsSidebarToggle();
}
function buildSimpleOptions(items) {
  return items.map(item => `<option value="${item}">${item}</option>`).join("");
}

function renderSavedOutfits() {
  const list = document.getElementById("savedOutfitsList");
  if (!list) return;

  if (!savedOutfits.length) {
    list.innerHTML = `<div class="saved-outfit-placeholder">Noch keine Outfits gespeichert</div>`;
    return;
  }

  list.innerHTML = savedOutfits.map(outfit => `
  <div class="saved-outfit-card" data-id="${outfit.id}">
    <button class="delete-saved-outfit-btn" data-id="${outfit.id}" aria-label="Outfit löschen">
      <span class="trash-icon"></span>
    </button>

    <div class="saved-outfit-slot">
      <img class="saved-outfit-img" src="${outfit.topImg}" alt="Oberteil">
    </div>

    <div class="saved-outfit-slot">
      <img class="saved-outfit-img" src="${outfit.bottomImg}" alt="Hose">
    </div>

    <div class="saved-outfit-slot">
      <img class="saved-outfit-img" src="${outfit.shoesImg}" alt="Schuhe">
    </div>

    <div class="saved-outfit-number">${outfit.number || ""}</div>
  </div>
`).join("");

document.querySelectorAll(".delete-saved-outfit-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();

    const id = btn.getAttribute("data-id");
    deleteSavedOutfit(id);
  });
});

  document.querySelectorAll(".saved-outfit-card").forEach(card => {
    card.addEventListener("click", (e) => {
      if (e.target.closest(".delete-outfit-btn")) return;

      const id = card.getAttribute("data-id");
      const outfit = savedOutfits.find(o => o.id === id);
      if (!outfit) return;

      outfitState.top = outfitData.top.findIndex(i => i.id === outfit.topId);
      outfitState.bottom = outfitData.bottom.findIndex(i => i.id === outfit.bottomId);
      outfitState.shoes = outfitData.shoes.findIndex(i => i.id === outfit.shoesId);

      renderSingleRondell("top", "topLeft", "topCenter", "topRight");
      renderSingleRondell("bottom", "bottomLeft", "bottomCenter", "bottomRight");
      renderSingleRondell("shoes", "shoeLeft", "shoeCenter", "shoeRight");
    });
  });

 document.querySelectorAll(".delete-outfit-btn").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();

    const id = btn.getAttribute("data-id");
    savedOutfits = savedOutfits.filter(o => o.id !== id);

    if (savedOutfits.length === 0) {
      nextOutfitNumber = 1;
    }

    saveSavedOutfits();
    renderSavedOutfits();
  });
});
}

function initOutfitsSidebarToggle() {
  const toggleBtn = document.getElementById("outfitsSidebarToggle");
  const sidebar = document.querySelector(".outfits-sidebar");
  const backdrop = document.getElementById("outfitsSidebarBackdrop");

  if (!toggleBtn || !sidebar || !backdrop) return;

  const openSidebar = () => {
    sidebar.classList.add("open");
    backdrop.classList.add("open");
    toggleBtn.classList.add("open");
    toggleBtn.textContent = "❮";
  };

  const closeSidebar = () => {
    sidebar.classList.remove("open");
    backdrop.classList.remove("open");
    toggleBtn.classList.remove("open");
    toggleBtn.textContent = "❯";
  };

  // Klick bleibt zusätzlich möglich
  toggleBtn.addEventListener("click", () => {
    if (sidebar.classList.contains("open")) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  backdrop.addEventListener("click", closeSidebar);

  // ===== Swipe auf der Leiste: nach links = öffnen =====
  let toggleStartX = 0;
  let toggleStartY = 0;

  toggleBtn.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    toggleStartX = touch.clientX;
    toggleStartY = touch.clientY;
  }, { passive: true });

  toggleBtn.addEventListener("touchend", (e) => {
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - toggleStartX;
    const diffY = touch.clientY - toggleStartY;

    // nach links wischen auf der Leiste
    if (diffX < -30 && Math.abs(diffY) < 40) {
      openSidebar();
    }
  }, { passive: true });

  // ===== Swipe auf er Sidebar: nach rechts = schließen =====
  let sidebarStartX = 0;
  let sidebarStartY = 0;

  sidebar.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    sidebarStartX = touch.clientX;
    sidebarStartY = touch.clientY;
  }, { passive: true });

  sidebar.addEventListener("touchend", (e) => {
    const touch = e.changedTouches[0];
    const diffX = touch.clientX - sidebarStartX;
    const diffY = touch.clientY - sidebarStartY;

    // nach rechts wischen auf der Sidebar
    if (diffX > 30 && Math.abs(diffY) < 40) {
      closeSidebar();
    }
  }, { passive: true });
}
function initOutfitTopFilters() {
  const buttons = document.querySelectorAll(".outfit-top-filter");

  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      const value = btn.textContent.trim();

      if (currentOutfitFilter === value) {
        currentOutfitFilter = null;
        btn.classList.remove("active");
        rerenderAllRondells();
        return;
      }

      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentOutfitFilter = value;

      rerenderAllRondells();
    });
  });
}
const outfitState = {
  top: 0,
  bottom: 0,
  shoes: 0
};

const outfitData = {
  top: getItemsByCategory("Oberteile"),
  bottom: getItemsByCategory("Hosen"),
  shoes: getItemsByCategory("Schuhe")
};

function initOutfitRondells() {
  bindRondell("top", "topPrev", "topNext", "topLeft", "topCenter", "topRight");
  bindRondell("bottom", "bottomPrev", "bottomNext", "bottomLeft", "bottomCenter", "bottomRight");
  bindRondell("shoes", "shoePrev", "shoeNext", "shoeLeft", "shoeCenter", "shoeRight");

  enableRondellSwipe("top", "topCenter", "topLeft", "topRight");
enableRondellSwipe("bottom", "bottomCenter", "bottomLeft", "bottomRight");
enableRondellSwipe("shoes", "shoeCenter", "shoeLeft", "shoeRight");
}

function bindRondell(key, prevId, nextId, leftId, centerId, rightId) {
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);

  if (!prevBtn || !nextBtn) return;

  prevBtn.addEventListener("click", () => {
    const total = getFilteredItems(key).length;
    if (!total) return;

    outfitState[key] = (outfitState[key] - 1 + total) % total;
    renderSingleRondell(key, leftId, centerId, rightId);
  });

  nextBtn.addEventListener("click", () => {
    const total = getFilteredItems(key).length;
    if (!total) return;

    outfitState[key] = (outfitState[key] + 1) % total;
    renderSingleRondell(key, leftId, centerId, rightId);
  });

  renderSingleRondell(key, leftId, centerId, rightId);
}

function enableRondellSwipe(key, centerId, leftId, rightId) {
  const centerCard = document.getElementById(centerId);
  if (!centerCard) return;

  let startX = 0;
  let endX = 0;

  centerCard.addEventListener("touchstart", (e) => {
    startX = e.changedTouches[0].clientX;
  }, { passive: true });

  centerCard.addEventListener("touchend", (e) => {
    endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    const total = getFilteredItems(key).length;

    if (!total) return;

    if (diff > 40) {
      outfitState[key] = (outfitState[key] - 1 + total) % total;
      renderSingleRondell(key, leftId, centerId, rightId);
    }

    if (diff < -40) {
      outfitState[key] = (outfitState[key] + 1) % total;
      renderSingleRondell(key, leftId, centerId, rightId);
    }
  }, { passive: true });
}

function renderSingleRondell(key, leftId, centerId, rightId) {
  const left = document.getElementById(leftId);
  const center = document.getElementById(centerId);
  const right = document.getElementById(rightId);

  if (!left || !center || !right) return;

  const items = getFilteredItems(key);
  const total = items.length;

  if (!total) {
    left.innerHTML = "";
    center.innerHTML = `<div class="empty-rondell">Kein passendes Teil</div>`;
    right.innerHTML = "";
    return;
  }

  // Falls Index größer als neue gefilterte Liste ist → zurücksetzen
  if (outfitState[key] >= total) {
    outfitState[key] = 0;
  }

  const current = outfitState[key];
  const leftIndex = (current - 1 + total) % total;
  const rightIndex = (current + 1) % total;

  const leftItem = items[leftIndex];
  const centerItem = items[current];
  const rightItem = items[rightIndex];

  left.classList.remove("rondell-animate");
  center.classList.remove("rondell-animate");
  right.classList.remove("rondell-animate");

  left.innerHTML = `<img src="${leftItem.img}" alt="${leftItem.type}">`;
  center.innerHTML = `<img src="${centerItem.img}" alt="${centerItem.type}">`;
  right.innerHTML = `<img src="${rightItem.img}" alt="${rightItem.type}">`;

  void left.offsetWidth;
  void center.offsetWidth;
  void right.offsetWidth;

  left.classList.add("rondell-animate");
  center.classList.add("rondell-animate");
  right.classList.add("rondell-animate");
}

function renderSingleRondell(key, leftId, centerId, rightId) {
  const left = document.getElementById(leftId);
  const center = document.getElementById(centerId);
  const right = document.getElementById(rightId);

  if (!left || !center || !right) return;

  const items = getFilteredItems(key);
  const total = items.length;

  if (!total) {
    left.innerHTML = "";
    center.innerHTML = `<div class="empty-rondell">Kein passendes Teil</div>`;
    right.innerHTML = "";
    return;
  }

  // Falls Index größer als neue gefilterte Liste ist → zurücksetzen
  if (outfitState[key] >= total) {
    outfitState[key] = 0;
  }

  const current = outfitState[key];
  const leftIndex = (current - 1 + total) % total;
  const rightIndex = (current + 1) % total;

  const leftItem = items[leftIndex];
  const centerItem = items[current];
  const rightItem = items[rightIndex];

  left.classList.remove("rondell-animate");
  center.classList.remove("rondell-animate");
  right.classList.remove("rondell-animate");

  left.innerHTML = `<img src="${leftItem.img}" alt="${leftItem.type}">`;
  center.innerHTML = `<img src="${centerItem.img}" alt="${centerItem.type}">`;
  right.innerHTML = `<img src="${rightItem.img}" alt="${rightItem.type}">`;

  void left.offsetWidth;
  void center.offsetWidth;
  void right.offsetWidth;

  left.classList.add("rondell-animate");
  center.classList.add("rondell-animate");
  right.classList.add("rondell-animate");
}
function rerenderAllRondells() {
  renderSingleRondell("top", "topLeft", "topCenter", "topRight");
  renderSingleRondell("bottom", "bottomLeft", "bottomCenter", "bottomRight");
  renderSingleRondell("shoes", "shoeLeft", "shoeCenter", "shoeRight");
}    
function buildOutfitRondell() {
  const container = document.getElementById("outfitContainer");

  // Kategorien die im Rondell erscheinen
  const outfitTypes = ["T-Shirts", "Hosen", "Socken", "Schuhe"];

  // Index merkt sich aktuelle Position je Kategorie
  const state = {};

  outfitTypes.forEach(type => {
    const items = wardrobeItems.filter(i => i.type === type);

    state[type] = 0;

    const section = document.createElement("div");
    section.className = "outfit-section";

    const title = document.createElement("div");
    title.className = "outfit-title";
    title.textContent = type;

    const row = document.createElement("div");
    row.className = "outfit-row";

    const left = document.createElement("button");
    left.className = "arrow-btn";
    left.textContent = "◀";

    const right = document.createElement("button");
    right.className = "arrow-btn";
    right.textContent = "▶";

    const center = document.createElement("div");
    center.className = "outfit-center";

    function renderCenter() {
      center.innerHTML = "";

      if (items.length === 0) {
        center.textContent = "Kein Item";
        return;
      }

      const item = items[state[type]];

      const card = document.createElement("div");
      card.className = "outfit-card";
      card.innerHTML = `
        <img src="${item.img}">
        <div>${item.name}</div>
        <div class="small">${item.color || ""}</div>
      `;

      center.appendChild(card);
    }

    left.onclick = () => {
      if (items.length === 0) return;
      state[type] = (state[type] - 1 + items.length) % items.length;
      renderCenter();
    };

    right.onclick = () => {
      if (items.length === 0) return;
      state[type] = (state[type] + 1) % items.length;
      renderCenter();
    };

    row.appendChild(left);
    row.appendChild(center);
    row.appendChild(right);

    section.appendChild(title);
    section.appendChild(row);

    container.appendChild(section);

    renderCenter();
  });
}

function renderInspiration() {
  content.innerHTML = `
    <div class="glass-box">
      <h1>Inspiration</h1>
      <p>Hier speichern wir später Looks/Bilder (z. B. aus dem Internet).</p>
    </div>
  `;
}

function initLocalOutfitFilters() {
  const topType = document.getElementById("topTypeFilter");
  const topColor = document.getElementById("topColorFilter");

  const bottomType = document.getElementById("bottomTypeFilter");
  const bottomColor = document.getElementById("bottomColorFilter");

  const shoeType = document.getElementById("shoeTypeFilter");
  const shoeColor = document.getElementById("shoeColorFilter");

  if (topType) {
    topType.addEventListener("change", () => {
      currentLocalFilters.topType = topType.value;
      outfitState.top = 0;
      rerenderAllRondells();
    });
  }

  if (topColor) {
    topColor.addEventListener("change", () => {
      currentLocalFilters.topColor = topColor.value;
      outfitState.top = 0;
      rerenderAllRondells();
    });
  }

  if (bottomType) {
    bottomType.addEventListener("change", () => {
      currentLocalFilters.bottomType = bottomType.value;
      outfitState.bottom = 0;
      rerenderAllRondells();
    });
  }

  if (bottomColor) {
    bottomColor.addEventListener("change", () => {
      currentLocalFilters.bottomColor = bottomColor.value;
      outfitState.bottom = 0;
      rerenderAllRondells();
    });
  }

  if (shoeType) {
    shoeType.addEventListener("change", () => {
      currentLocalFilters.shoesType = shoeType.value;
      outfitState.shoes = 0;
      rerenderAllRondells();
    });
  }

  if (shoeColor) {
    shoeColor.addEventListener("change", () => {
      currentLocalFilters.shoesColor = shoeColor.value;
      outfitState.shoes = 0;
      rerenderAllRondells();
    });
  }
}
// ====== CLOSET ======
function renderCloset(initialFilter = "Alle") {
  content.innerHTML = `
    <div class="closet-panel">
      <div class="closet-topbar">
        <h1 class="closet-title">Mein Kleiderschrank</h1>
        <button class="add-btn" id="addItemBtn">+ Hinzufügen</button>
      </div>

      <div class="filter-strip">
        <div class="filter-bar" id="filterBar"></div>
        <div class="subfilter-bar" id="closetSubFilterBar"></div>
      </div>

      <div class="thin-divider"></div>

      <div id="closetBody"></div>
    </div>
  `;
  const filterBar = document.getElementById("filterBar");
  const closetBody = document.getElementById("closetBody");
  const closetSubFilterBar = document.getElementById("closetSubFilterBar");

  // Buttons rendern
closetMainFilters.forEach(cat => {
  const btn = document.createElement("button");
  btn.className = "filter-btn";
  btn.textContent = cat;

  if (cat === initialFilter) btn.classList.add("active");

  btn.addEventListener("click", () => {
    currentClosetFilter = cat;
    currentClosetSubfilter = "Alle";

    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    renderSubFilterBar();
    renderClosetBody(currentClosetFilter, currentClosetSubfilter);
  });

  filterBar.appendChild(btn);
});

function renderSubFilterBar() {
  closetSubFilterBar.innerHTML = "";

  if (currentClosetFilter === "Alle") {
    closetSubFilterBar.style.display = "none";
    return;
  }

  const subfilters = closetSubFilters[currentClosetFilter] || [];
  closetSubFilterBar.style.display = "flex";

  subfilters.forEach(sub => {
    const btn = document.createElement("button");
    btn.className = "filter-btn subfilter-btn";
    btn.textContent = sub;

    if (sub === currentClosetSubfilter) {
      btn.classList.add("active");
    }

    btn.addEventListener("click", () => {
      currentClosetSubfilter = sub;

      closetSubFilterBar
        .querySelectorAll(".subfilter-btn")
        .forEach(b => b.classList.remove("active"));

      btn.classList.add("active");
      renderClosetBody(currentClosetFilter, currentClosetSubfilter);
    });

    closetSubFilterBar.appendChild(btn);
  });
}

function renderCard(i) {
  const card = document.createElement("div");
  card.className = "item-card";

  card.innerHTML = `
    <div class="item-card-inner">

      <!-- FRONT -->
      <div class="item-card-front">
        <button class="delete-item-btn" data-id="${i.id}" aria-label="Teil löschen">
          <span class="trash-icon"></span>
        </button>

        <div class="item-card-image-wrap">
          <img src="${i.img}" alt="${i.type}">
        </div>

        <div class="item-card-front-text">
          <div class="item-name">${i.type}</div>
        </div>
      </div>

      <!-- BACK -->
      <div class="item-card-back">
        <div class="item-back-content">
          <div class="item-back-title">${i.type}</div>
          <div class="item-back-meta"><strong>Kategorie:</strong> ${i.mainCategory || "-"}</div>
          <div class="item-back-meta"><strong>Farbe:</strong> ${i.color || "-"}</div>
          <div class="item-back-meta"><strong>Größe:</strong> ${i.size || "-"}</div>
          <div class="item-back-meta"><strong>Marke:</strong> ${i.brand || "-"}</div>
          <div class="item-back-meta"><strong>Shop:</strong> ${i.marketplace || "-"}</div>
          <div class="item-back-meta"><strong>Anlass:</strong> ${(Array.isArray(i.occasions) ? i.occasions.join(", ") : i.occasions || "-") || "-"}</div>
        </div>
      </div>

    </div>
  `;

  const deleteBtn = card.querySelector(".delete-item-btn");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = deleteBtn.getAttribute("data-id");
      deleteWardrobeItem(id);
    });
  }

  let startX = 0;
  let startY = 0;
  let moved = false;

  card.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".delete-item-btn")) return;
    startX = e.clientX;
    startY = e.clientY;
    moved = false;
  });

  card.addEventListener("pointermove", (e) => {
    const diffX = Math.abs(e.clientX - startX);
    const diffY = Math.abs(e.clientY - startY);

    if (diffX > 14 || diffY > 14) {
      moved = true;
    }
  });

  card.addEventListener("pointerup", (e) => {
    if (e.target.closest(".delete-item-btn")) return;
    if (moved) return;

    card.classList.toggle("flipped");
  });

  return card;
}
  function renderSectionTitle(label, count) {
    const t = document.createElement("div");
    t.className = "section-title";
    t.textContent = `${label} (${count})`;
    return t;
  }

  function renderThinDivider() {
    const d = document.createElement("div");
    d.className = "thin-divider";
    return d;
  }

  function renderRow(items) {
    const row = document.createElement("div");
    row.className = "item-row";
    items.forEach(i => row.appendChild(renderCard(i)));
    return row;
  }

function renderClosetBody(mainFilter, subFilter) {
  closetBody.innerHTML = "";

  function getItemsForClosetView(mainFilterValue, subFilterValue) {
    if (mainFilterValue === "Alle") {
      return wardrobeItems;
    }

    let items = wardrobeItems.filter(i => i.mainCategory === mainFilterValue);

    if (subFilterValue && subFilterValue !== "Alle") {
      items = items.filter(i => i.type === subFilterValue);
    }

    return items;
  }

  // FALL A: Alle -> Hauptkategorien untereinander
  if (mainFilter === "Alle") {
    const categoriesToShow = closetMainFilters.filter(c => c !== "Alle");

    categoriesToShow.forEach((category, idx) => {
      const items = wardrobeItems.filter(i => i.mainCategory === category);

      closetBody.appendChild(renderSectionTitle(category, items.length));
      closetBody.appendChild(renderRow(items));

      if (idx !== categoriesToShow.length - 1) {
        closetBody.appendChild(renderThinDivider());
      }
    });

    return;
  }

  // FALL B: Hauptfilter + optional Unterfilter
  const items = getItemsForClosetView(mainFilter, subFilter);
  const title = subFilter && subFilter !== "Alle" ? subFilter : mainFilter;

  closetBody.appendChild(renderSectionTitle(title, items.length));
  closetBody.appendChild(renderRow(items));
}
  // erstes Rendern
  renderSubFilterBar();
renderClosetBody(currentClosetFilter, currentClosetSubfilter);
  // + Hinzufügen
  const addBtn = document.getElementById("addItemBtn");
  addBtn.addEventListener("click", openAddModal);
}

// ====== ROUTING ======
function renderPage(page) {
  if (page === "home") renderHome();
  if (page === "closet") renderCloset(currentClosetFilter);
  if (page === "outfits") renderOutfits();
  if (page === "inspiration") renderInspiration();
}

// ====== MODAL: ADD ITEM ======
function openAddModal() {
  const modal = document.createElement("div");
  modal.id = "addModal";
  modal.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-card">
      <h2 class="add-modal-title">Teil hinzufügen</h2>

      <label>Foto</label>
      <input type="file" id="photoInput" accept="image/*">

      <label>Kategorie</label>
      <select id="mainCategorySelect">
        <option value="">Bitte wählen</option>
        <option>Oberteile</option>
        <option>Hosen</option>
        <option>Schuhe</option>
      </select>

      <label>Typ</label>
      <select id="typeSelect">
        <option value="">Bitte zuerst Kategorie wählen</option>
      </select>

      <label>Farbe</label>
      <select id="colorSelect">
        ${buildColorOptions("").replace('<option value="">Alle Farben</option>', '<option value="">Bitte wählen</option>')}
      </select>

      <label>Marke</label>
      <input type="text" id="brandInput" placeholder="z. B. COS, Zara, Jack & Jones">

      <label>Shop / Marketplace</label>
      <input type="text" id="marketplaceInput" placeholder="z. B. Zalando, Vinted, About You">

      <label>Größe</label>
      <select id="sizeSelect">
        <option value="">Bitte zuerst Kategorie wählen</option>
      </select>

      <div class="add-field">
        <label class="field-label">Anlass</label>

        <div class="occasion-checkboxes">
          <label class="occasion-option">
            <input type="checkbox" value="Business">
            <span>Business</span>
          </label>

          <label class="occasion-option">
            <input type="checkbox" value="Business Casual">
            <span>Business Casual</span>
          </label>

          <label class="occasion-option">
            <input type="checkbox" value="Freizeit">
            <span>Freizeit</span>
          </label>

          <label class="occasion-option">
            <input type="checkbox" value="Sport">
            <span>Sport</span>
          </label>
        </div>
      </div>

      <div class="add-modal-actions">
        <button id="cancelBtn" class="btn-secondary">Abbrechen</button>
        <button id="saveBtn" class="btn-primary">Speichern</button>
      </div>
    </div>
  `;
    function fillTypeSelectByCategory(category, selectElement) {
  selectElement.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Bitte wählen";
  selectElement.appendChild(placeholder);

  if (!category || !typeOptions[category]) return;

  typeOptions[category].forEach(type => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = type;
    selectElement.appendChild(option);
  });
}

document.body.appendChild(modal);

const backdrop = modal.querySelector(".modal-backdrop");
const cancelBtn = document.getElementById("cancelBtn");
const saveBtn = document.getElementById("saveBtn");

const mainCategorySelect = document.getElementById("mainCategorySelect");
const typeSelect = document.getElementById("typeSelect");
const sizeSelect = document.getElementById("sizeSelect");

if (backdrop) {
  backdrop.addEventListener("click", closeAddModal);
}

if (cancelBtn) {
  cancelBtn.addEventListener("click", closeAddModal);
}

if (saveBtn) {
  saveBtn.addEventListener("click", saveNewItem);
}

if (mainCategorySelect && typeSelect) {
  mainCategorySelect.addEventListener("change", () => {
    fillTypeSelectByCategory(mainCategorySelect.value, typeSelect);
    updateSizeSelectByCategory();
  });
}

updateSizeSelectByCategory();
}

function closeAddModal() {
  const modal = document.getElementById("addModal");
  if (modal) modal.remove();
}

// Bild als Base64 lesen
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Konnte Bild nicht lesen"));
    reader.readAsDataURL(file);
  });
}

async function saveNewItem() {
  const fileInput = document.getElementById("photoInput");
  const mainCategory = document.getElementById("mainCategorySelect").value;
  const type = document.getElementById("typeSelect").value;
  const color = document.getElementById("colorSelect").value;
  const brand = document.getElementById("brandInput")?.value.trim() || "";
  const marketplace = document.getElementById("marketplaceInput")?.value.trim() || "";
  const size = document.getElementById("sizeSelect")?.value || "";

  const occasionCheckboxes = document.querySelectorAll(".occasion-checkboxes input:checked");
  const selectedOccasions = Array.from(occasionCheckboxes).map(cb => cb.value);

  if (!mainCategory || !type || !color) {
    alert("Bitte Kategorie, Typ und Farbe auswählen.");
    return;
  }

  if (!selectedOccasions.length) {
    alert("Bitte mindestens einen Anlass auswählen.");
    return;
  }

  let imageUrl = "images/closet.jpeg";
  const file = fileInput.files && fileInput.files[0];

  if (file) {
    const safeFileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("wardrobe-images")
      .upload(safeFileName, file);

    if (uploadError) {
      console.error("Fehler beim Bild-Upload:", uploadError);
      alert("Bild konnte nicht hochgeladen werden.");
      return;
    }

    const { data: publicUrlData } = supabaseClient.storage
      .from("wardrobe-images")
      .getPublicUrl(safeFileName);

    imageUrl = publicUrlData.publicUrl;
  }

  const { error } = await supabaseClient
    .from("wardrobe_items")
    .insert([{
      main_category: mainCategory,
      type: type,
      color: color,
      brand: brand,
      marketplace: marketplace,
      size: size,
      occasions: selectedOccasions,
      image_url: imageUrl
    }]);

  if (error) {
    console.error("Fehler beim Speichern:", error);
    alert("Fehler beim Speichern");
    return;
  }

  closeAddModal();
  await loadItems();
  renderCloset(currentClosetFilter);
}

async function loadItems() {
  const { data, error } = await supabaseClient
    .from("wardrobe_items")
    .select("*");

  if (error) {
    console.error("Fehler beim Laden:", error);
    wardrobeItems = [];
    return;
  }

  wardrobeItems = data.map(item => ({
    id: item.id,
    mainCategory: item.main_category,
    type: item.type,
    color: item.color || "",
    brand: item.brand || "",
    marketplace: item.marketplace || "",
    size: item.size || "",
    occasions: item.occasions || [],
    img: item.image_url || "images/closet.jpeg"
  }));
}
// ====== INIT ======
async function initApp() {
  await loadItems();
  await loadSavedOutfits();
  renderHome();
}

initApp();