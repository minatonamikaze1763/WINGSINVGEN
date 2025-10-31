const dropZone = document.getElementById("dropZone");
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const fileInfo = document.getElementById("fileInfo");
const generateBtn = document.getElementById("generateBtn");
const progress = document.getElementById("progress");
const currentRow = document.getElementById("currentRow");
const progressFill = document.getElementById("progressFill");
const result = document.getElementById("result");
const downloadBtn = document.getElementById("downloadBtn");

let excelFile = null;

// 🟦 Handle Drag & Drop
dropZone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", e => handleFile(e.target.files[0]));

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("dragover");
  dropZone.querySelector("p").textContent = "Drop it here 👇";
});

dropZone.addEventListener("dragleave", e => {
  dropZone.classList.remove("dragover");
  dropZone.querySelector("p").textContent = "Drag & drop Excel file here or click to browse";
});

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  handleFile(file);
});

function handleFile(file) {
  if (!file) return;
  if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
    alert("Please upload a valid Excel file (.xlsx or .xls)");
    return;
  }
  excelFile = file;
  fileName.textContent = file.name;
  fileInfo.classList.remove("hidden");
  generateBtn.disabled = false;
}

// 🧾 Simulate generation progress
generateBtn.addEventListener("click", async () => {
  if (!excelFile) return;
  generateBtn.disabled = true;
  progress.classList.remove("hidden");
  
  // simulate row processing
  const totalRows = 20; // temp value until we parse Excel
  for (let i = 1; i <= totalRows; i++) {
    currentRow.textContent = i;
    progressFill.style.width = `${(i / totalRows) * 100}%`;
    await new Promise(res => setTimeout(res, 100)); // simulate delay
  }
  
  progress.classList.add("hidden");
  result.classList.remove("hidden");
});

downloadBtn.addEventListener("click", () => {
  alert("📄 Your combined PDF will be ready here (functionality coming soon)");
});



// 🧭 Step 1: Field position map (edit coords later after testing)
const fieldMap = {
  invoice_no: { x: 410, y: 710 },
  invoice_date: { x: 480, y: 710 },
  customer_name: { x: 100, y: 680 },
  address: { x: 100, y: 660 },
  gst: { x: 100, y: 640 },
  engine_no: { x: 130, y: 520 },
  chassis_no: { x: 130, y: 500 },
  model: { x: 150, y: 470 },
  colour: { x: 400, y: 470 },
  amount: { x: 500, y: 250 },
  amount_words: { x: 100, y: 230 },
  financier: { x: 150, y: 200 }
};

// 🧾 Step 2: Function to load PDF template and draw text from one Excel row
async function fillInvoiceFromRow(rowData, templateBytes) {
  // Load PDF
  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // 🖊️ Draw all column values at mapped coordinates
  Object.keys(fieldMap).forEach((key) => {
    if (rowData[key]) {
      const { x, y } = fieldMap[key];
      page.drawText(String(rowData[key]), {
        x,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0),
      });
    }
  });
  
  return await pdfDoc.save(); // returns modified PDF bytes
}

// 🧩 Example test (simulate one Excel row)
async function testInvoiceFill() {
  // Fetch the uploaded template (PDF)
  const templateUrl = "example_inv.pdf";
  const templateBytes = await fetch(templateUrl).then((res) => res.arrayBuffer());
  
  // Example row data (replace with actual Excel data later)
  const row = {
    invoice_no: "NZBVSIAS4624",
    invoice_date: "28-10-2025",
    customer_name: "M/S NIMMALA CHINNA ODDENNA",
    address: "2-65/2, Makloor, Nizamabad",
    gst: "36AAFCL0077Q1Z1",
    engine_no: "MD621BP25S2G22167",
    chassis_no: "BP2GS2617143",
    model: "TVS XL100 HD I-TOUCH START OB2B-BSVI",
    colour: "GREEN",
    amount: "56367.00",
    amount_words: "Fifty Six Thousand Three Hundred and Sixty Seven",
    financier: "SHRIRAM FINANCE LTD",
  };
  
  // Fill template
  const newPdfBytes = await fillInvoiceFromRow(row, templateBytes);
  
  // 🧾 Download result
  const blob = new Blob([newPdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${row.invoice_no}.pdf`;
  link.click();
}

