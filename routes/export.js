
const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

router.get("/export-pdf", async (req, res) => {
  try {
   
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const attendanceData = await Attendance.find().populate('student');

    const html = await renderEJSToHTML("pdfTemplate", { data: attendanceData });

   
    await page.setContent(html, { waitUntil: "networkidle0" });

   
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=attendance-stats.pdf",
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation failed", err);
    res.status(500).send("Failed to generate PDF");
  }
});


const ejs = require("ejs");
const path = require("path");

async function renderEJSToHTML(pdfTemplate, data) {
  const filePath = path.join(__dirname, "../views", `${pdfTemplate}.ejs`);
  return await ejs.renderFile(filePath, data);
}

module.exports = router;
