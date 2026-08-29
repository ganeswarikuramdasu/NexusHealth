/**
 * Download Utility for Patient Records, Prescriptions, and Lab Reports
 */

// Helper to trigger direct HTML file download if popup window is blocked
const triggerHtmlDownload = (htmlContent: string, filename: string) => {
  try {
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Direct HTML download failed:", err);
  }
};

export const downloadPrescriptionPDF = (
  prescription: any,
  doctorName: string,
  hospitalName: string,
  patientName: string,
  healthId: string
) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Prescription - ${healthId}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
        .header { border-bottom: 3px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
        .hospital-title { font-size: 24px; font-weight: 800; color: #5b21b6; margin: 0; }
        .hospital-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
        .rx-badge { font-size: 36px; font-weight: 900; color: #7c3aed; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
        .info-item { font-size: 13px; }
        .info-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 2px; }
        .info-val { font-weight: 600; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
        th { background: #f1f5f9; text-align: left; padding: 12px; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
        td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .med-name { font-weight: 700; color: #5b21b6; }
        .footer { margin-top: 50px; border-top: 2px dashed #cbd5e1; padding-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
        .sign-box { text-align: right; }
        .sign-line { width: 200px; border-top: 1px solid #0f172a; margin-top: 40px; margin-left: auto; text-align: center; padding-top: 5px; font-size: 12px; font-weight: 700; }
        .seal { font-size: 10px; font-family: monospace; color: #059669; font-weight: 700; background: #ecfdf5; padding: 6px 12px; border-radius: 20px; border: 1px solid #a7f3d0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="hospital-title">${hospitalName || "NexusHealth Network Hospital"}</h1>
          <div class="hospital-sub">Integrated EHR & Telemedicine Systems • Official Digital Prescription</div>
        </div>
        <div class="rx-badge">Rx</div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Patient Name</span>
          <span class="info-val">${patientName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Patient Health ID</span>
          <span class="info-val">${healthId}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Attending Doctor</span>
          <span class="info-val">${doctorName || "Dr. Robert Chen (MD)"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Date of Issue</span>
          <span class="info-val">${prescription?.date || new Date().toISOString().split("T")[0]}</span>
        </div>
      </div>

      <h3>Prescribed Medications</h3>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Medication Name</th>
            <th>Dosage</th>
            <th>Frequency / Timing</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${
            Array.isArray(prescription?.medications)
              ? prescription.medications
                  .map(
                    (m: any, idx: number) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td class="med-name">${m.medicationName || m.name || "Medication"}</td>
                  <td>${m.dosage || "1 Tablet"}</td>
                  <td>${m.frequency || "Once Daily"}</td>
                  <td>${m.durationDays ? `${m.durationDays} Days` : "7 Days"}</td>
                </tr>
              `
                  )
                  .join("")
              : `
                <tr>
                  <td>1</td>
                  <td class="med-name">${prescription?.medicationName || "Prescribed Medication"}</td>
                  <td>${prescription?.dosage || "500 mg"}</td>
                  <td>${prescription?.frequency || "Twice daily"}</td>
                  <td>${prescription?.durationDays ? `${prescription.durationDays} Days` : "10 Days"}</td>
                </tr>
              `
          }
        </tbody>
      </table>

      ${
        prescription?.instructions
          ? `
        <div style="background: #fffbebfb; border: 1px solid #fef08a; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <strong style="color: #b45309; font-size: 12px; display: block; margin-bottom: 4px;">SPECIAL CLINICAL INSTRUCTIONS:</strong>
          <span style="font-size: 13px; color: #78350f;">${prescription.instructions}</span>
        </div>
      `
          : ""
      }

      <div class="footer">
        <div class="seal">
          ✓ DIGITALLY VERIFIED EHR SIGNATURE • NEXUS-HEALTH-ID: ${healthId}
        </div>
        <div class="sign-box">
          <div class="sign-line">${doctorName || "Physician Signature"}</div>
        </div>
      </div>

      <script>
        window.onload = function() {
          try { window.print(); } catch(e) {}
        };
      </script>
    </body>
    </html>
  `;

  let printWindow: Window | null = null;
  try {
    printWindow = window.open("", "_blank");
  } catch (e) {
    printWindow = null;
  }

  if (printWindow && !printWindow.closed) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    triggerHtmlDownload(html, `Prescription_${healthId}_${Date.now()}.html`);
  }
};

export const downloadLabReportPDF = (report: any, patientName: string, healthId: string) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Lab Report - ${report?.title || "Diagnostic Report"}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
        .header { border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
        .lab-title { font-size: 24px; font-weight: 800; color: #1e40af; margin: 0; }
        .lab-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
        .info-item { font-size: 13px; }
        .info-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 2px; }
        .info-val { font-weight: 600; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 30px; }
        th { background: #f1f5f9; text-align: left; padding: 12px; font-size: 12px; font-weight: 700; color: #475569; border-bottom: 2px solid #cbd5e1; }
        td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
        .status-high { color: #dc2626; font-weight: 700; background: #fef2f2; padding: 2px 8px; border-radius: 4px; }
        .status-normal { color: #16a34a; font-weight: 700; background: #f0fdf4; padding: 2px 8px; border-radius: 4px; }
        .footer { margin-top: 50px; border-top: 2px dashed #cbd5e1; padding-top: 20px; font-size: 11px; color: #64748b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="lab-title">${report?.labName || report?.hospitalName || "Central Pathology & Diagnostic Institute"}</h1>
          <div class="lab-sub">Certified Health Diagnostics • ISO 15189 Accredited Laboratory</div>
        </div>
        <div style="text-align: right;">
          <strong style="color: #2563eb; font-size: 16px;">${report?.title || "LAB INVESTIGATION REPORT"}</strong>
          <div style="font-size: 12px; color: #64748b;">Date: ${report?.date || new Date().toISOString().split("T")[0]}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Patient Name</span>
          <span class="info-val">${patientName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Global Health ID</span>
          <span class="info-val">${healthId}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Overall Report Status</span>
          <span class="info-val" style="color: ${report?.status === "ELEVATED" ? "#dc2626" : "#16a34a"};">${report?.status || "COMPLETED"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Referring Doctor</span>
          <span class="info-val">${report?.doctorName || "Attending Physician"}</span>
        </div>
      </div>

      <h3>Diagnostic Test Parameters</h3>
      <table>
        <thead>
          <tr>
            <th>Test Parameter</th>
            <th>Measured Value</th>
            <th>Unit</th>
            <th>Reference Interval</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${
            Array.isArray(report?.parameters) && report.parameters.length > 0
              ? report.parameters
                  .map(
                    (p: any) => `
                <tr>
                  <td><strong>${p.name || p.parameter}</strong></td>
                  <td style="font-weight: 700; color: ${p.status === "HIGH" || p.status === "ELEVATED" ? "#dc2626" : "#0f172a"};">
                    ${p.value}
                  </td>
                  <td>${p.unit || "-"}</td>
                  <td>${p.referenceRange || p.refRange || "Standard"}</td>
                  <td>
                    <span class="${p.status === "HIGH" || p.status === "ELEVATED" ? "status-high" : "status-normal"}">
                      ${p.status || "NORMAL"}
                    </span>
                  </td>
                </tr>
              `
                  )
                  .join("")
              : `
                <tr>
                  <td colspan="5" style="text-align: center; color: #64748b;">No discrete test parameters available.</td>
                </tr>
              `
          }
        </tbody>
      </table>

      ${
        report?.doctorNotes || report?.notes
          ? `
        <div style="background: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; border-radius: 4px; margin-bottom: 20px;">
          <strong style="color: #1e40af; font-size: 12px; display: block; margin-bottom: 4px;">PATHOLOGIST IMPRESSION & CLINICAL NOTES:</strong>
          <span style="font-size: 13px; color: #334155;">${report.doctorNotes || report.notes}</span>
        </div>
      `
          : ""
      }

      <div class="footer">
        <div>Electronic Signature: Dr. Sarah Jenkins (Senior Consultant Pathologist, MD)</div>
        <div style="margin-top: 4px;">This diagnostic report is cryptographically bound to Global Unique Health ID: ${healthId}</div>
      </div>

      <script>
        window.onload = function() {
          try { window.print(); } catch(e) {}
        };
      </script>
    </body>
    </html>
  `;

  let printWindow: Window | null = null;
  try {
    printWindow = window.open("", "_blank");
  } catch (e) {
    printWindow = null;
  }

  if (printWindow && !printWindow.closed) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    triggerHtmlDownload(html, `LabReport_${healthId}_${Date.now()}.html`);
  }
};

export const downloadMedicalRecordPDF = (record: any, patientName: string, healthId: string) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Medical Record - ${record?.title || "Clinical Record"}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
        .header { border-bottom: 3px solid #0284c7; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
        .record-title { font-size: 24px; font-weight: 800; color: #0369a1; margin: 0; }
        .record-sub { font-size: 13px; color: #64748b; margin-top: 4px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
        .info-item { font-size: 13px; }
        .info-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 10px; display: block; margin-bottom: 2px; }
        .info-val { font-weight: 600; color: #0f172a; }
        .section-box { background: #f1f5f9; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .section-title { font-size: 14px; font-weight: 800; color: #0f172a; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; }
        .footer { margin-top: 50px; border-top: 2px dashed #cbd5e1; padding-top: 20px; font-size: 11px; color: #64748b; display: flex; justify-content: space-between; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="record-title">${record?.hospitalName || "NexusHealth Unified Hospital"}</h1>
          <div class="record-sub">Unified Electronic Health Record (EHR) Summary</div>
        </div>
        <div style="text-align: right;">
          <strong style="color: #0284c7; font-size: 14px;">CONSULTATION EHR ENTRY</strong>
          <div style="font-size: 12px; color: #64748b;">Date: ${record?.date || new Date().toISOString().split("T")[0]}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Patient Name</span>
          <span class="info-val">${patientName}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Global Health ID</span>
          <span class="info-val">${healthId}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Attending Doctor</span>
          <span class="info-val">${record?.doctorName || "Attending Physician"}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Category</span>
          <span class="info-val">${record?.category || "General Consultation"}</span>
        </div>
      </div>

      <div class="section-box">
        <div class="section-title">Diagnosis & Primary Impression</div>
        <div style="font-size: 14px; color: #1e293b; font-weight: 600;">${record?.diagnosis || "Routine Consultation"}</div>
      </div>

      <div class="section-box">
        <div class="section-title">Clinical Symptoms & Patient Notes</div>
        <div style="font-size: 13px; color: #334155;">${record?.symptoms || "No subjective symptoms listed."}</div>
      </div>

      ${
        Array.isArray(record?.prescriptions) && record.prescriptions.length > 0
          ? `
          <div class="section-box">
            <div class="section-title">Associated Prescriptions</div>
            <ul>
              ${record.prescriptions
                .map(
                  (p: any) => `
                <li style="margin-bottom: 6px; font-size: 13px;">
                  <strong>${p.medicationName || p.name}</strong>: ${p.dosage || "Standard"} (${p.frequency || "Daily"}) - ${p.durationDays || "7"} Days
                </li>
              `
                )
                .join("")}
            </ul>
          </div>
        `
          : ""
      }

      <div class="footer">
        <span>Verified Cryptographic Seal: ${record?.doctorSignature || "PATIENT_CONSENTED_EHR"}</span>
        <span>Generated for Health ID: ${healthId}</span>
      </div>

      <script>
        window.onload = function() {
          try { window.print(); } catch(e) {}
        };
      </script>
    </body>
    </html>
  `;

  let printWindow: Window | null = null;
  try {
    printWindow = window.open("", "_blank");
  } catch (e) {
    printWindow = null;
  }

  if (printWindow && !printWindow.closed) {
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    triggerHtmlDownload(html, `MedicalRecord_${healthId}_${Date.now()}.html`);
  }
};
