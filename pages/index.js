"use client";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState(null);

  const handleChange = (e) => {
    const f = e.target.files[0];
    if (f && f.name.endsWith(".xlsx")) {
      setFile(f);
    } else {
      alert("Please upload a valid .xlsx file");
    }
  };

  const handleProcess = async () => {
    if (!file) return;
    const XLSX = await import("xlsx");

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      const headerIdx = json.findIndex((r) => r.includes("Account"));
      if (headerIdx === -1) throw new Error("Header row with 'Account' not found");

      const headers = json[headerIdx];
      const body = json.slice(headerIdx + 1);

      let current = "";
      const rows = body.map((row) => {
        if (row[0]) current = row[0];
        row[0] = current;

        const debit = parseFloat(row[headers.indexOf("Debit")] || 0);
        const credit = parseFloat(row[headers.indexOf("Credit")] || 0);
        row[headers.length] = debit - credit;

        return row;
      });

      headers.push("Total");
      const newSheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, newSheet, wb.SheetNames[0]);

      const blob = XLSX.write(newWb, { bookType: "xlsx", type: "blob" });
      const downloadUrl = URL.createObjectURL(blob);
      setUrl(downloadUrl);
    } catch (err) {
      alert("Error processing file");
      console.error("❌ Processing error:", err);
    }
  };

  return (
    <main style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>NetSuite TB Formatter</h1>
      <input type="file" accept=".xlsx" onChange={handleChange} />
      <button onClick={handleProcess} disabled={!file} style={{ marginLeft: 10 }}>
        Process File
      </button>
      {url && (
        <div style={{ marginTop: 20 }}>
          <a href={url} download="formatted.xlsx">
            Download Result
          </a>
        </div>
      )}
    </main>
  );
}
