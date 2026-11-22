/**
 * VarshaRakshak — Hyperlocal Waterlogging Management
 * Handles road flood depth reports, severity classifications, and spatial queries.
 */

const VRWaterlogging = {
  SEVERITY: {
    LOW: { label: "LOW (6-12 in)", color: "#10b981", badge: "badge-success", desc: "Minor puddle, passable" },
    MODERATE: { label: "MODERATE (12-24 in)", color: "#f59e0b", badge: "badge-warning", desc: "Passable with caution" },
    HIGH: { label: "HIGH (24-36 in)", color: "#f97316", badge: "badge-warning", desc: "Engine stall risk, diversion advised" },
    SEVERE: { label: "SEVERE (>36 in)", color: "#ef4444", badge: "badge-danger", desc: "Impassable road, hazard closed" }
  },

  getAllReports() {
    return VRStorage.getWaterloggingReports();
  },

  getReportsByPincode(pincode) {
    const reports = this.getAllReports();
    return reports.filter(r => r.pincode === pincode);
  },

  getSevereHotspots() {
    return this.getAllReports().filter(r => r.severity === 'HIGH' || r.severity === 'SEVERE');
  },

  addReport(reportData) {
    const depth = Number(reportData.waterDepthCm || 20);
    let severity = "LOW";
    if (depth > 40) severity = "SEVERE";
    else if (depth > 25) severity = "HIGH";
    else if (depth > 12) severity = "MODERATE";

    const report = {
      id: `wl-spot-${Date.now()}`,
      roadName: reportData.roadName || "Main Road",
      landmark: reportData.landmark || "",
      pincode: reportData.pincode || "400053",
      lat: Number(reportData.lat),
      lng: Number(reportData.lng),
      severity: reportData.severity || severity,
      waterDepthCm: depth,
      status: severity === 'SEVERE' ? 'IMPASSABLE' : (severity === 'HIGH' ? 'DIVERSION_RECOMMENDED' : 'SLOW_MOVING'),
      dataSource: reportData.dataSource || "ADMIN_ENTRY",
      isDemoData: true,
      reportedAt: new Date().toISOString(),
      description: reportData.description || `${depth}cm water accumulation reported.`
    };

    VRStorage.addWaterloggingReport(report);
    return report;
  }
};
