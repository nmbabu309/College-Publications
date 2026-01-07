import { Router } from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import { db } from "../db.js";
import ExcelJS from "exceljs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//const adminEmails = ["ammanfawaz272@gmail.com"];

//const isAdmin = (email) => adminEmails.includes(email);
//const isAdmin = (email) => adminEmails.includes(email);
const isAdmin = async (email) => {
  try {
    const [rows] = await db.query("select 1 from admins WHERE EMAIL = ?", [email]);
    return rows.length > 0;
  } catch (err) {
    console.error("isAdmin check failed:", err);
    return false;
  }
};

router.post("/isAdmin", verifyToken, async (req, res) => {
  try {
    const email = req.user.userEmail;
    console.log(`[DEBUG] /isAdmin check for: '${email}'`);
    const isUserAdmin = await isAdmin(email);
    console.log(`[DEBUG] /isAdmin DB result:`, isUserAdmin);
    return res.status(200).json({ isAdmin: isUserAdmin });
  } catch (err) {
    console.error("/isAdmin route failed:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message, stack: err.stack });
  }
});

const logAction = async (userEmail, action, details) => {
  try {
    await db.query("INSERT INTO audit_logs (user_email, action, details) VALUES (?, ?, ?)", [userEmail, action, details]);
  } catch (err) {
    console.error("Failed to log action:", err);
  }
};



router.post("/formEntry", verifyToken, async (req, res) => {
  const {
    publicationType,
    mainAuthor,
    title,
    email,
    phone,
    dept,
    coauthors,
    journal,
    publisher,
    year,
    vol,
    issueNo,
    pages,
    indexation,
    issnNo,
    journalLink,
    ugcApproved,
    impactFactor,
    pdfUrl,
  } = req.body;


  try {
    // Check for duplicate title
    const [existingRows] = await db.query("SELECT 1 FROM publications WHERE title = ?", [title]);
    if (existingRows.length > 0) {
      return res.status(409).json({ message: "Duplicate entry: Publication with this title already exists." });
    }

    await db.query(
      `INSERT INTO publications 
  (publicationType, mainAuthor, title, email, phone, dept, coauthors, journal, publisher, year, vol, issueNo, pages, indexation, issnNo, journalLink, ugcApproved, impactFactor, pdfUrl)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        publicationType,
        mainAuthor,
        title,
        email,
        phone,
        dept,
        coauthors,
        journal,
        publisher,
        year,
        vol,
        issueNo,
        pages,
        indexation,
        issnNo,
        journalLink,
        ugcApproved,
        impactFactor,
        pdfUrl
      ]
    );

    await logAction(req.user.userEmail, "CREATE", `Created publication: ${title}`);
    return res.status(200).json({ message: "data stored suceessfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/formEntryBatchUpdate", verifyToken, async (req, res) => {
  // Batch update usually for admin or massive changes, strictly restrict or keep as is?
  // User didn't specify batch update rules, but implied admin access allows editing ANY entry.
  // For now I will assume this is an admin-only or specific feature.
  // As per instructions "users can edit only their entry", batch update makes it hard to enforce "only their entry" unless we check every single one.
  // I will leave it but add admin check if feasible, or just leave as is if it's used for bulk import corrections.
  // Actually, let's restrict to Admin for safety if this is "Bulk Import" related fix.
  // But wait, user said "add a admin acesss acount whihc allows any entry to be deleted and eddited".

  const isUserAdmin = await isAdmin(req.user.userEmail);
  if (!isUserAdmin) {
    return res
      .status(403)
      .json({ message: "Only admins can perform batch updates." });
  }

  const updates = req.body; // expecting array of updates

  if (!Array.isArray(updates)) {
    return res.status(400).json({ message: "Array expected" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const query = `
      UPDATE publications
      SET 
        publicationType = COALESCE(?, publicationType),
        mainAuthor = COALESCE(?, mainAuthor),
        title = COALESCE(?, title),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        dept = COALESCE(?, dept),
        coauthors = COALESCE(?, coauthors),
        journal = COALESCE(?, journal),
        publisher = COALESCE(?, publisher),
        year = COALESCE(?, year),
        vol = COALESCE(?, vol),
        issueNo = COALESCE(?, issueNo),
        pages = COALESCE(?, pages),
        indexation = COALESCE(?, indexation),
        issnNo = COALESCE(?, issnNo),
        journalLink = COALESCE(?, journalLink),
        ugcApproved = COALESCE(?, ugcApproved),
        impactFactor = COALESCE(?, impactFactor),
        pdfUrl = COALESCE(?, pdfUrl)
      WHERE id = ?
    `;

    for (const row of updates) {
      await connection.query(query, [
        row.publicationType ?? null,
        row.mainAuthor ?? null,
        row.title ?? null,
        row.email ?? null,
        row.phone ?? null,
        row.dept ?? null,
        row.coauthors ?? null,
        row.journal ?? null,
        row.publisher ?? null,
        row.year ?? null,
        row.vol ?? null,
        row.issueNo ?? null,
        row.pages ?? null,
        row.indexation ?? null,
        row.issnNo ?? null,
        row.journalLink ?? null,
        row.ugcApproved ?? null,
        row.impactFactor ?? null,
        row.pdfUrl ?? null,
        row.id
      ]);
    }

    await connection.commit();
    await logAction(req.user.userEmail, "BATCH_UPDATE", `Batch updated ${updates.length} entries`);

    return res
      .status(200)
      .json({ message: "Batch update successful", count: updates.length });
  } catch (err) {
    await connection.rollback();
    console.log(err);
    return res.status(500).json({ message: "Batch update failed" });
  } finally {
    connection.release();
  }
});

router.put("/formEntryUpdate", verifyToken, async (req, res) => {
  const {
    id,
    publicationType,
    mainAuthor,
    title,
    email,
    phone,
    dept,
    coauthors,
    journal,
    publisher,
    year,
    vol,
    issueNo,
    pages,
    indexation,
    issnNo,
    journalLink,
    ugcApproved,
    impactFactor,
    pdfUrl,
  } = req.body;

  const userEmail = req.user.userEmail;

  try {
    // Check ownership or admin
    const [rows] = await db.query("SELECT email FROM publications WHERE id = ?", [id]);
    const entry = rows[0];

    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }

    const isUserAdmin = await isAdmin(userEmail);
    if (entry.email !== userEmail && !isUserAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this entry" });
    }

    await db.query(
      `UPDATE publications 
      SET publicationType = ?, mainAuthor = ?, title = ?, email = ?, phone = ?, dept = ?, coauthors = ?, journal = ?, publisher = ?, year = ?, vol = ?, issueNo = ?, pages = ?, indexation = ?, issnNo = ?, journalLink = ?, ugcApproved = ?, impactFactor = ?, pdfUrl = ?
      WHERE id = ?`,
      [
        publicationType,
        mainAuthor,
        title,
        email,
        phone,
        dept,
        coauthors,
        journal,
        publisher,
        year,
        vol,
        issueNo,
        pages,
        indexation,
        issnNo,
        journalLink,
        ugcApproved,
        impactFactor,
        pdfUrl,
        id
      ]
    );

    await logAction(userEmail, "UPDATE", `Updated publication ID: ${id}`);
    return res.status(200).json({ message: "Data updated successfully" });
  } catch (e) {
    console.log(e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/deleteEntry/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const userEmail = req.user.userEmail;
  console.log(userEmail);
  try {
    // 1. Check ownership
    const [rows] = await db.query("SELECT email FROM publications WHERE id = ?", [id]);
    const entry = rows[0];

    if (!entry) {
      return res.status(404).json({ message: "Publication not found" });
    }

    const isUserAdmin = await isAdmin(userEmail);
    if (entry.email !== userEmail && !isUserAdmin) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this entry" });
    }

    // 2. Delete
    await db.query("DELETE FROM publications WHERE id = ?", [id]);

    await logAction(userEmail, "DELETE", `Deleted publication ID: ${id}`);

    return res
      .status(200)
      .json({ message: "Publication deleted successfully" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/formGet", async (req, res) => {
  try {
    const [rows] = await db.query("select * from publications");
    return res.json(rows);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "error reading database", error: e.message });
  }
});

router.get("/downloadExcel", async (req, res) => {
  try {
    // Fetch all rows
    const [rows] = await db.query("SELECT * FROM publications");

    // Create workbook + sheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Publications");

    // 1. Add Title Row
    worksheet.mergeCells("A1:T1");
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = "FACULTY PAPER PUBLICATIONS";
    titleRow.getCell(1).font = {
      name: "Arial",
      family: 4,
      size: 16,
      bold: true,
    };
    titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    titleRow.height = 30;

    // 2. Define Headers & Widths manually
    const columns = [
      { header: "ID", key: "id", width: 10 },
      { header: "Publication Type", key: "publicationType", width: 25 },
      { header: "Main Author", key: "mainAuthor", width: 25 },
      { header: "Title", key: "title", width: 40 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Dept", key: "dept", width: 15 },
      { header: "Coauthors", key: "coauthors", width: 30 },
      { header: "Journal", key: "journal", width: 25 },
      { header: "Publisher", key: "publisher", width: 25 },
      { header: "Year", key: "year", width: 10 },
      { header: "Volume", key: "vol", width: 10 },
      { header: "Issue No", key: "issueNo", width: 10 },
      { header: "Pages", key: "pages", width: 15 },
      { header: "Indexation", key: "indexation", width: 20 },
      { header: "ISSN/ISBN No", key: "issnNo", width: 20 },
      { header: "Journal Link", key: "journalLink", width: 30 },
      { header: "UGC Approved", key: "ugcApproved", width: 15 },
      { header: "Impact Factor", key: "impactFactor", width: 15 },
      { header: "DOI Link", key: "pdfUrl", width: 40 },
    ];

    // Set widths
    columns.forEach((col, index) => {
      worksheet.getColumn(index + 1).width = col.width;
    });

    // Add Header Row at Row 2
    const headerRow = worksheet.addRow(columns.map((c) => c.header));

    // Style Header Row
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4CAF50" }, // Green background
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });
    headerRow.height = 25; // Header height

    // 3. Add Data Rows
    rows.forEach((row) => {
      const rowData = columns.map((col) => row[col.key]);
      const newRow = worksheet.addRow(rowData);

      // Style Data Cells: Alignment and Wrap Text for readability
      newRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });



    // Response headers for browser download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=publications.xlsx"
    );

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
    console.log("done");
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to generate Excel file" });
  }
});

router.get("/downloadTemplate", async (req, res) => {
  try {
    // Generate a new workbook for the template
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Publications");

    // 1. Add Title Row
    worksheet.mergeCells("A1:T1");
    const titleRow = worksheet.getRow(1);
    titleRow.getCell(1).value = "FACULTY PAPER PUBLICATIONS";
    titleRow.getCell(1).font = {
      name: "Arial",
      family: 4,
      size: 16,
      bold: true,
    };
    titleRow.getCell(1).alignment = { vertical: "middle", horizontal: "center" };
    titleRow.height = 30;

    // 2. Define Headers & Widths manually
    const columns = [
      { header: "ID", width: 10 },
      { header: "Publication Type", width: 25 },
      { header: "Main Author", width: 25 },
      { header: "Title", width: 40 },
      { header: "Email", width: 30 },
      { header: "Phone", width: 15 },
      { header: "Dept", width: 15 },
      { header: "Coauthors", width: 30 },
      { header: "Journal", width: 25 },
      { header: "Publisher", width: 25 },
      { header: "Year", width: 10 },
      { header: "Volume", width: 10 },
      { header: "Issue No", width: 10 },
      { header: "Pages", width: 15 },
      { header: "Indexation", width: 20 },
      { header: "ISSN/ISBN No", width: 20 },
      { header: "Journal Link", width: 30 },
      { header: "UGC Approved", width: 15 },
      { header: "Impact Factor", width: 15 },
      { header: "DOI Link", width: 40 },
    ];

    // Set widths
    columns.forEach((col, index) => {
      worksheet.getColumn(index + 1).width = col.width;
    });

    // Add Header Row at Row 2
    const headerRow = worksheet.addRow(columns.map((c) => c.header));

    // Style Header Row
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; // White text
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4CAF50" }, // Green background
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    });
    headerRow.height = 25; // Header height

    // Response headers for browser download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=publications_template.xlsx"
    );

    // Write workbook to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error("Template download error:", e);
    res.status(500).json({ message: "Server error", error: e.message });
  }
});

export default router;
