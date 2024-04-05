import React, { useEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { pdfjs, Document, Page } from "react-pdf";


import samplePDF from "./Ismail_Bennani_Resume (6).pdf";



function PdfViewer({ pdfLink }) {
  const canvas = useRef();
  const [isRendered, setIsRendered] = useState();

  function onRenderSuccess() {
    setIsRendered(true);
  }

  useEffect(() => {
    if (!isRendered || !canvas.current) {
      return;
    }

    var context = canvas.current.getContext("2d");
    var { width, height } = canvas.current;
    console.log(width, height);
    context.save();

    const angle = 45;
    // context.translate(width / 2, height / 2);
    // context.rotate(degreesToRadians(angle));
    // context.globalCompositeOperation = "multiply";
    // context.textAlign = "center";
    // context.font = "100px sans-serif";
    // context.fillStyle = "rgba(0, 0, 0, .25)";
    // context.fillText("Acme Inc", 0, 0);
    // Draw a bounding rectangle
    // Example usage:
    const points = [
      [565.6666564941406, 92.31832611111106], // Top-left
      [565.6666564941406, 161.17138166666663], // Bottom-left
      [1136.3333740234375, 161.17138166666663], // Bottom-right
      [1136.3333740234375, 92.31832611111106], // Top-right
    ];

    // Calculate rectangle width and height
    const w = points[2][0] - points[0][0];
    const h = points[1][1] - points[0][1];
    context.strokeStyle = "red";
    context.lineWidth = 5;
    //context.strokeRect(points[0][0], points[0][1], w, h); // Example coordinates and dimensions
    context.strokeRect(1700, 496, 600, h);
    context.restore();
  }, [isRendered]);

  return (
    //<div style={{ width: "100%", height: "auto" }}>
    <Document file={pdfLink}>
      <Page
        pageNumber={1}
        canvasRef={canvas}
        onRenderSuccess={onRenderSuccess}
      />
    </Document>
    // </div>
  );
}

export default PdfViewer;
