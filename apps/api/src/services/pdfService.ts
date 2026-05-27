import type { GeneratedPaper } from "@veda/shared";
import PDFDocument from "pdfkit";

export class PdfService {
  async renderQuestionPaper(paper: GeneratedPaper): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 54 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    doc.font("Helvetica-Bold").fontSize(20).text(paper.schoolName, { align: "center" });
    doc.moveDown(0.35);
    doc.fontSize(13).text(`Subject: ${paper.subject}    Class: ${paper.className}`, { align: "center" });
    doc.moveDown(1.8);

    doc.fontSize(12);
    const metaY = doc.y;
    doc.text(`Time Allowed: ${paper.timeAllowed}`, 54, metaY);
    doc.text(`Maximum Marks: ${paper.maximumMarks}`, 360, metaY, { align: "right" });
    doc.moveDown(2);

    doc.font("Helvetica-Bold").text(paper.instructions);
    doc.moveDown(1.5);
    doc.text("Name: ______________________");
    doc.text("Roll Number: _______________");
    doc.text(`Class: ${paper.className} Section: __________`);
    doc.moveDown(1.6);

    paper.sections.forEach((section) => {
      doc.moveDown(0.8);
      doc.font("Helvetica-Bold").fontSize(15).text(section.title, { align: "center" });
      doc.moveDown(1);
      doc.fontSize(12).text(section.questionType);
      doc.font("Helvetica-Oblique").text(section.instruction);
      doc.moveDown(0.8);

      section.questions.forEach((question, index) => {
        doc.font("Helvetica").fontSize(11).text(`${index + 1}. ${question.text}`, {
          continued: true
        });
        doc.font("Helvetica-Bold").text(`  [${question.difficulty}] [${question.marks} Marks]`);
        doc.moveDown(0.55);
      });
    });

    doc.end();
    return done;
  }
}

