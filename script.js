const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwh_gakr_r3K0aFiFhQCJqaCauPURWBnCliQRtj6Urs94oSqeEIqy6Lms6DsSZ3ACmh/exec";

// قاعدة بيانات البنود والوحدات المسجلة مسبقاً
const itemsDatabase = [
    { code: "401000005", name: "Connecting or disconnecting the company's mobile generator (any capacity)", unit: "EA" },
    { code: "401000007", name: "Laying and connecting a temporary jumper inside LV (Low Voltage) equipment to restore power during accidents, fires, or breakdowns", unit: "EA" },
    { code: "505010003", name: "Re-tensioning an existing LV overhead service cable (any size/type)", unit: "EA" },
    { code: "505010004", name: "Disconnecting or connecting an LV service cable from an existing overhead source for maintenance purposes / technical disconnection from the subscriber's meter", unit: "EA" },
    { code: "204010403", name: "Making a repair joint for an existing bundled/twisted cable (any size)", unit: "EA" },
    { code: "506000005", name: "Installing/removing/replacing a jumper between a service box and a meter box, or inside the meter box", unit: "EA" },
    { code: "204020204", name: "Replacing/installing a jumper or a terminal connector for a single-phase MV (Medium Voltage)", unit: "EA" },
    { code: "204020205", name: "Replacing or re-fixing the tie or support rod for an insulator, or replacing a repair sleeve for a jumper, connector, or re-fixing an MV insulator", unit: "EA" },
    { code: "204020405", name: "Disconnecting or connecting jumpers for existing network conductors (any size)", unit: "EA" },
    { code: "204010202", name: "Replacing an LV bundled/twisted cable (any size)", unit: "EA" },
    { code: "304040207", name: "Disconnecting/connecting an existing riser cable on an MV/LV pole", unit: "EA" },
    { code: "305010502", name: "Replacing a single-phase terminal connector for an existing LV cable (any size)", unit: "EA" },
    { code: "311000007", name: "Replacing/re-fixing a cover or door of a sub-distribution panel (any type)", unit: "EA" },
    { code: "206000009", name: "Cutting or trimming trees near the overhead line", unit: "EA" },
    { code: "309010511", name: "Removing an LV circuit breaker or a fuse box (any size)", unit: "EA" },
    { code: "508000007", name: "Replacing meter box mounting brackets / re-fixing a meter box (any type/size)", unit: "EA" },
    { code: "205020304", name: "Replacing an MV fuse link (element) for an overhead line / equipment", unit: "EA" },
    { code: "204010405", name: "Replacing a single-phase terminal connector for an existing bundled cable (any size)", unit: "EA" },
    { code: "309010501", name: "Disconnecting or connecting an existing 4-core LV cable / four single phases to existing ground-mounted equipment", unit: "EA" },
    { code: "506000010", name: "Field inspection / survey of a subscriber's meter", unit: "EA" },
    { code: "309010507", name: "Replacing a fuse in a meter / sub or main distribution panel", unit: "EA" }
];

let cases = []; 
let currentCaseItems = []; 

const modal = document.getElementById("modal");
const caseForm = document.getElementById("caseForm");
const list = document.getElementById("casesList");
const itemSelect = document.getElementById("itemSelect");
const itemsTableBody = document.getElementById("itemsTableBody");

fetchFromSheets();
populateItemsDropdown();

function populateItemsDropdown() {
    itemsDatabase.forEach(item => {
        const option = document.createElement("option");
        option.value = item.code;
        option.text = `${item.code} - ${item.name}`;
        itemSelect.appendChild(option);
    });
}

async function fetchFromSheets() {
    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        if (data.length > 0) {
            cases = groupRowsByCase(data);
            renderCards();
        }
    } catch (error) {
        console.error("فشل جلب البيانات من جوجل شيت:", error);
    }
}

// دالة التجميع الذكي بناءً على رقم تعريف الحالة (case_id) الموحد
function groupRowsByCase(rows) {
    const grouped = [];
    rows.forEach(row => {
        const caseId = row.case_id; // الاعتماد على الـ ID الفريد
        if (!caseId) return;

        let existingCase = grouped.find(c => c.caseId === caseId);
        
        const itemObj = {
            code: row.item_code,
            name: row.item_name,
            unit: row.item_unit,
            qty: row.item_qty
        };

        if (existingCase) {
            existingCase.items.push(itemObj);
        } else {
            grouped.push({
                caseId: caseId,
                timestamp: row.timestamp,
                technician: row.technician,
                location: row.location,
                items: [itemObj]
            });
        }
    });
    return grouped;
}

document.getElementById("addItemBtn").onclick = function() {
    const selectedCode = itemSelect.value;
    if (!selectedCode) {
        alert("الرجاء اختيار بند أولاً");
        return;
    }

    const exists = currentCaseItems.some(i => i.code === selectedCode);
    if (exists) {
        alert("هذا البند مضاف بالفعل في القائمة");
        return;
    }

    const itemData = itemsDatabase.find(i => i.code === selectedCode);

    currentCaseItems.push({
        code: itemData.code,
        name: itemData.name,
        unit: itemData.unit,
        qty: 1
    });

    renderItemsTable();
};

function renderItemsTable() {
    itemsTableBody.innerHTML = "";
    currentCaseItems.forEach((item, index) => {
        const tr = document.createElement("tr");
        tr.style.animation = "fadeIn 0.3s ease-in-out";
        tr.innerHTML = `
            <td><strong>${item.code}</strong> - ${item.name}</td>
            <td><span style="background:#e0f2fe; color:#0369a1; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">${item.unit}</span></td>
            <td>
                <input type="number" lang="en" dir="ltr" class="qty-input" value="${item.qty}" min="1" step="1" 
                onchange="updateQty(${index}, this.value)" required>
            </td>
            <td>
                <button type="button" class="remove-item-btn" onclick="removeItem(${index})">Delete</button>
            </td>
        `;
        itemsTableBody.appendChild(tr);
    });
}

window.updateQty = (index, value) => {
    const intValue = parseInt(value, 10);
    currentCaseItems[index].qty = isNaN(intValue) || intValue < 1 ? 1 : intValue;
};

window.removeItem = (index) => {
    currentCaseItems.splice(index, 1);
    renderItemsTable();
};

window.editCase = (index) => {
    const currentCase = cases[index];
    
    document.getElementById("modalTitle").innerText = "🔧 EDIT CASE & BANDS";
    document.getElementById("editIndex").value = index;
    document.getElementById("oldTimestamp").value = currentCase.timestamp; // نحتفظ بالتوقيت الأصلي للإنشاء
    
    document.getElementById("technician").value = currentCase.technician;
    document.getElementById("location").value = currentCase.location;
    
    currentCaseItems = currentCase.items.map(item => ({ ...item }));
    
    renderItemsTable();
    modal.style.display = "block";
};

caseForm.onsubmit = async function(e) {
    e.preventDefault();

    if (currentCaseItems.length === 0) {
        alert("يجب إضافة بند واحد على الأقل للحالة قبل الحفظ!");
        return;
    }

    const editIndex = document.getElementById("editIndex").value;
    const technician = document.getElementById("technician").value;
    const location = document.getElementById("location").value;
    
    let caseId;
    let timestamp;

    if (editIndex === "-1") {
        // حالة جديدة: نولد رقم ID فريد يعتمد على التوقيت الحالي بالملي ثانية
        caseId = "CASE-" + Date.now();
        timestamp = new Date().toLocaleString('en-EG');
    } else {
        // حالة معدلة: نأخذ نفس الـ ID القديم لكي نقوم بالاستبدال عليه في الشيت
        caseId = cases[editIndex].caseId;
        timestamp = document.getElementById("oldTimestamp").value; 
    }

    const payload = {
        action: editIndex === "-1" ? "add" : "edit",
        caseId: caseId, // نرسل الـ ID في الحالتين للبحث به والفلترة
        rows: currentCaseItems.map(item => ({
            case_id: caseId,
            timestamp: timestamp,
            technician: technician,
            location: location,
            item_code: item.code,
            item_name: item.name,
            item_unit: item.unit,
            item_qty: item.qty
        }))
    };

    // إرسال البيانات لجوجل سكريبت
    fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify(payload)
    });

    const updatedCase = {
        caseId: caseId,
        timestamp: timestamp,
        technician: technician,
        location: location,
        items: [...currentCaseItems]
    };

    if (editIndex === "-1") {
        cases.push(updatedCase);
    } else {
        cases[editIndex] = updatedCase;
    }
    
    renderCards();

    modal.style.display = "none";
    caseForm.reset();
    currentCaseItems = [];
    itemsTableBody.innerHTML = "";
};

function renderCards() {
    list.innerHTML = "";
    cases.forEach((c, index) => {
        const card = document.createElement("div");
        card.className = "card";
        
        let itemsHtml = "";
        c.items.forEach(item => {
            itemsHtml += `<li>⚡ <strong>${item.name}</strong> (${item.code}) - <span style="color:#4f46e5;">Quantity: ${item.qty} ${item.unit}</span></li>`;
        });

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center;">
               <h3>👤 Technician: ${c.technician}</h3>
               <span style="font-size:11px; background:#f1f5f9; padding:2px 6px; border-radius:4px; color:#64748b; font-weight:bold;">${c.caseId}</span>
            </div>
            <p>📍 <strong>Location:</strong> ${c.location}</p>
            <p>🕒 <strong>Time:</strong> <span style="font-size:12px;">${c.timestamp || ''}</span></p>
            <div class="items-box">
                <strong style="font-size:13px; color:#475569;">📋 Work :</strong>
                <ul style="list-style:none; padding-right:5px; margin-top:8px; margin-bottom: 12px;">${itemsHtml}</ul>
            </div>
            <button onclick="editCase(${index})" style="background:#4f46e5; color:white; border:none; width:100%; padding:8px; border-radius:6px; cursor:pointer; font-family:'Cairo', sans-serif; font-weight:600;">⚙ EDIT DATA</button>
        `;
        list.appendChild(card);
    });
} 

document.getElementById("addBtn").onclick = () => {
    caseForm.reset();
    document.getElementById("editIndex").value = "-1";
    document.getElementById("modalTitle").innerText = "INSERT NEW Case";
    currentCaseItems = [];
    itemsTableBody.innerHTML = "";
    modal.style.display = "block";
};
document.querySelector(".close").onclick = () => modal.style.display = "none";

window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; }

document.getElementById("exportBtn").onclick = function() {
    if (cases.length === 0) {
        alert("لا توجد بيانات لتصديرها!");
        return;
    }
    const exportData = [];
    cases.forEach(c => {
        c.items.forEach(item => {
            exportData.push({
                "رقم الحالة (Case ID)": c.caseId,
                "التوقيت": c.timestamp,
                "اسم الفني": c.technician,
                "الموقع": c.location,
                "كود البند": item.code,
                "وصف البند": item.name,
                "الوحدة": item.unit,
                "الكمية": item.qty
            });
        });
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الحالات والبنود التفصيلية");
    XLSX.writeFile(workbook, `تقرير_الحالات_التفصيلي_${new Date().toLocaleDateString('ar-EG')}.xlsx`);
};
