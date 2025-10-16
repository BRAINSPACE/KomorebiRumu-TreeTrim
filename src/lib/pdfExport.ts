import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
// FIX: Corrected import path to use '@/' alias.
import { useSimulationStore } from '@/store/simulationStore';

export async function exportToPDF() {
  const { selectedSpecies, iterations, angle, stepSize, thickness, prunedBranches } = useSimulationStore.getState();
  if (!selectedSpecies) return;

  useSimulationStore.setState({ isExporting: true });

  try {
    const controlEl = document.getElementById('control-scene-container');
    const simEl = document.getElementById('simulation-scene-container');

    if (!controlEl || !simEl) {
        throw new Error("Scene containers not found");
    }
    
    // Temporarily set background to white for better PDF output
    controlEl.style.backgroundColor = 'white';
    simEl.style.backgroundColor = 'white';
    
    const controlCanvas = await html2canvas(controlEl, { useCORS: true, backgroundColor: '#ffffff' });
    const simulationCanvas = await html2canvas(simEl, { useCORS: true, backgroundColor: '#ffffff' });

    // Revert background color
    controlEl.style.backgroundColor = '';
    simEl.style.backgroundColor = '';

    const controlData = controlCanvas.toDataURL('image/png');
    const simulationData = simulationCanvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const imgWidth = (pdfWidth - margin * 3) / 2;
    const imgHeight = (imgWidth * controlCanvas.height) / controlCanvas.width;

    // Header
    pdf.setFontSize(18);
    pdf.text('Trädbeskärningssimulator - Jämförelserapport', margin, margin + 5);

    // Images
    pdf.addImage(controlData, 'PNG', margin, margin + 20, imgWidth, imgHeight);
    pdf.addImage(simulationData, 'PNG', margin * 2 + imgWidth, margin + 20, imgWidth, imgHeight);
    pdf.setFontSize(10);
    pdf.text('Kontroll (Obeskuren)', margin, margin + 20 + imgHeight + 5);
    pdf.text('Simulering (Beskuren)', margin * 2 + imgWidth, margin + 20 + imgHeight + 5);

    // Parameters
    let yPos = margin + 20 + imgHeight + 15;
    pdf.setFontSize(12);
    pdf.text('Parametrar', margin, yPos);
    pdf.setFontSize(10);
    pdf.text(`Trädart: ${selectedSpecies.commonName} (${selectedSpecies.scientificName})`, margin, yPos += 6);
    pdf.text(`Iterationer: ${iterations}`, margin, yPos += 6);
    pdf.text(`Grenvinkel: ${angle.toFixed(1)}°`, margin, yPos += 6);
    pdf.text(`Stegstorlek: ${stepSize.toFixed(1)}`, margin, yPos += 6);
    pdf.text(`Tjocklek: ${thickness.toFixed(1)}`, margin, yPos += 6);
    pdf.text(`Antal beskurna grenar: ${prunedBranches.size}`, margin, yPos += 6);

    pdf.save(`tree-pruning-report-${new Date().toISOString().slice(0,10)}.pdf`);
  } catch (error) {
    console.error("Failed to export PDF:", error);
    // You could use a toast notification to inform the user about the error.
  } finally {
    useSimulationStore.setState({ isExporting: false });
  }
}