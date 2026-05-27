import type { GeneratedPaper } from "@veda/shared";
import PDFDocument from "pdfkit";

export class PdfService {
  async renderQuestionPaper(paper: GeneratedPaper): Promise<Buffer> {
    const doc = new PDFDocument({ size: "A4", margin: 54 });
    const chunks: Buffer[] = [];
    const margin = 54;
    const contentWidth = doc.page.width - margin * 2;

    // pdfkit streams output, so collect chunks before sending the download.
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    doc.font("Helvetica-Bold").fontSize(20).text(paper.schoolName, margin, doc.y, {
      align: "center",
      width: contentWidth
    });
    doc.moveDown(0.35);
    doc.fontSize(13).text(`Subject: ${paper.subject}    Class: ${paper.className}`, margin, doc.y, {
      align: "center",
      width: contentWidth
    });
    doc.moveDown(1.8);

    doc.fontSize(12);
    const metaY = doc.y;
    doc.text(`Time Allowed: ${paper.timeAllowed}`, margin, metaY, { width: contentWidth / 2 });
    doc.text(`Maximum Marks: ${paper.maximumMarks}`, margin, metaY, { align: "right", width: contentWidth });
    doc.y = metaY + 18;
    doc.moveDown(2);

    doc.font("Helvetica-Bold").text(paper.instructions, margin, doc.y, {
      width: contentWidth,
      lineGap: 2
    });
    doc.moveDown(1.5);
    doc.text("Name: ______________________", margin, doc.y, { width: contentWidth });
    doc.text("Roll Number: _______________", margin, doc.y, { width: contentWidth });
    doc.text(`Class: ${paper.className} Section: __________`, margin, doc.y, { width: contentWidth });
    doc.moveDown(1.6);

    paper.sections.forEach((section) => {
      doc.moveDown(0.8);
      doc.font("Helvetica-Bold").fontSize(15).text(section.title, margin, doc.y, {
        align: "center",
        width: contentWidth
      });
      doc.moveDown(1);
      doc.fontSize(12).text(section.questionType, margin, doc.y, { width: contentWidth });
      doc.font("Helvetica-Oblique").text(section.instruction, margin, doc.y, { width: contentWidth });
      doc.moveDown(0.8);

      section.questions.forEach((question, index) => {
        const questionText = `${index + 1}. ${question.text}  [${question.difficulty}] [${question.marks} Marks]`;
        doc.font("Helvetica").fontSize(11).text(questionText, margin, doc.y, {
          width: contentWidth,
          lineGap: 2
        });
        doc.moveDown(0.55);
      });
    });

    doc.end();
    return done;
  }
}
