const { PDFDocument, rgb, StandardFonts } = PDFLib;

// =================== DOM ELEMENTS ===================
const pdfDropZone = document.getElementById("dropZone"); // PDF uploader
const pdfInput = document.getElementById("pdfInput");
const pdfFileName = document.getElementById("pdfFileName");
const pdfFileInfo = document.getElementById("fileInfo");

const excelDropZone = document.querySelectorAll(".drop-zone")[1]; // Excel uploader (2nd one)
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const fileInfo = document.querySelectorAll(".file-info")[1];
const generateBtn = document.getElementById("generateBtn");
const progress = document.getElementById("progress");
const currentRow = document.getElementById("currentRow");
const progressFill = document.getElementById("progressFill");
const result = document.getElementById("result");
const downloadBtn = document.getElementById("downloadBtn");

// =================== FILE STORAGE ===================
let uploadedPDF = null;
let excelFile = null;

// =================== FIELD MAP ===================
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

// =================== PDF DROP ZONE ===================
pdfDropZone.addEventListener("click", () => pdfInput.click());
pdfInput.addEventListener("change", (e) => handlePDF(e.target.files[0]));

pdfDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  pdfDropZone.classList.add("dragover");
  pdfDropZone.querySelector("p").textContent = "Drop PDF here 👇";
});

pdfDropZone.addEventListener("dragleave", () => {
  pdfDropZone.classList.remove("dragover");
  pdfDropZone.querySelector("p").textContent =
    "Drag & drop PDF file here or click to browse";
});

pdfDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  pdfDropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  handlePDF(file);
});

function handlePDF(file) {
  if (!file || !file.name.endsWith(".pdf")) {
    alert("Please upload a valid PDF file");
    return;
  }
  uploadedPDF = file;
  pdfFileName.textContent = file.name;
  pdfFileInfo.classList.remove("hidden");
  enableGenerateIfReady();
}

// =================== EXCEL DROP ZONE ===================
excelDropZone.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", (e) => handleExcel(e.target.files[0]));

excelDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  excelDropZone.classList.add("dragover");
  excelDropZone.querySelector("p").textContent = "Drop Excel here 👇";
});

excelDropZone.addEventListener("dragleave", () => {
  excelDropZone.classList.remove("dragover");
  excelDropZone.querySelector("p").textContent =
    "Drag & drop Excel file here or click to browse";
});

excelDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  excelDropZone.classList.remove("dragover");
  const file = e.dataTransfer.files[0];
  handleExcel(file);
});

function handleExcel(file) {
  if (!file || (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls"))) {
    alert("Please upload a valid Excel file (.xlsx or .xls)");
    return;
  }
  excelFile = file;
  fileName.textContent = file.name;
  fileInfo.classList.remove("hidden");
  enableGenerateIfReady();
}

// =================== ENABLE BUTTON WHEN BOTH FILES ARE READY ===================
function enableGenerateIfReady() {
  generateBtn.disabled = !(uploadedPDF && excelFile);
}

// =================== GENERATE BUTTON ===================
generateBtn.addEventListener("click", async () => {
  if (!uploadedPDF || !excelFile) return alert("Upload both files first!");
  generateBtn.disabled = true;
  progress.classList.remove("hidden");
  
  const pdfBytes = await uploadedPDF.arrayBuffer();
  const mergedPdf = await PDFDocument.create();
  
  // 🧾 1️⃣ Read Excel file and convert to JSON
  const data = await excelFile.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" }); // array of objects
  
  const totalRows = rows.length;
  console.log("✅ Excel rows loaded:", totalRows, rows);
  
  // 🧾 2️⃣ Loop through each row in Excel and generate invoice
  for (let i = 0; i < totalRows; i++) {
    const row = rows[i];
    currentRow.textContent = i + 1;
    progressFill.style.width = `${((i + 1) / totalRows) * 100}%`;
    
    // Convert numeric amount to words if not present
    if (!row.amount_words && row.amount) {
      const amountValue = parseFloat(row.amount.toString().replace(/,/g, ""));
      row.amount_words = numberToRupeesWords(amountValue);
    }
    
    const filledPdf = await fillInvoiceFromRow(row, pdfBytes);
    const tempDoc = await PDFDocument.load(filledPdf);
    const copiedPages = await mergedPdf.copyPages(tempDoc, [0]);
    mergedPdf.addPage(copiedPages[0]);
    await new Promise((res) => setTimeout(res, 150)); // smooth animation
  }
  
  // 🧩 3️⃣ Merge all PDFs and offer download
  const finalPdfBytes = await mergedPdf.save();
  progress.classList.add("hidden");
  result.classList.remove("hidden");
  
  downloadBtn.onclick = () => {
    saveAs(new Blob([finalPdfBytes], { type: "application/pdf" }), "Merged_Invoices.pdf");
  };
});
// =================== PDF FILLER FUNCTION ===================
async function fillInvoiceFromRow(rowData, templateBytes) {
  const pdfDoc = await PDFDocument.load(templateBytes);
  const page = pdfDoc.getPages()[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  Object.keys(fieldMap).forEach((key) => {
    if (rowData[key]) {
      const { x, y } = fieldMap[key];
      page.drawText(String(rowData[key]), {
        x,
        y,
        size: 10,
        font,
        color: rgb(0, 0, 0)
      });
    }
  });
  
  return await pdfDoc.save();
}

// =================== RUPEES CONVERTER ===================
function numberToRupeesWords(num) {
  if (num === 0) return "Zero Rupees Only";
  
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];
  const scales = ["", "Thousand", "Lakh", "Crore"];
  
  const numStr = num.toString();
  const chunks = [];
  let i = numStr.length;
  while (i > 0) {
    const end = i;
    const start = i > 3 ? (chunks.length === 0 ? i - 3 : i - 2) : 0;
    chunks.unshift(numStr.slice(start, end));
    i = start;
  }
  
  const words = [];
  for (let j = 0; j < chunks.length; j++) {
    const n = parseInt(chunks[j]);
    if (n === 0) continue;
    
    let str = "";
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    
    if (hundred > 0) str += ones[hundred] + " Hundred ";
    if (remainder > 0) {
      if (remainder < 20) str += ones[remainder] + " ";
      else {
        str += tens[Math.floor(remainder / 10)] + " ";
        if (remainder % 10) str += ones[remainder % 10] + " ";
      }
    }
    
    const scaleIndex = chunks.length - j - 1;
    if (scaleIndex > 0) str += scales[scaleIndex] + " ";
    words.push(str.trim());
  }
  
  const result = words.join(" ").replace(/\s+/g, " ").trim();
  return result + " Rupees Only";
}