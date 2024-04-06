import React, { useEffect, useRef, useState } from "react";

import { pdfjs, Document, Page } from "react-pdf";
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

function PdfViewer({ pdfLink, highlight}) {
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
    var actualW = 1700;
    var actualH = 2200;
    var scaleFactor = width/actualW 
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
    const points1 = [
      [130, 424], // Top-left
      [130, 492], // Bottom-left
      [514, 492], // Bottom-right
      [514, 424], // Top-right
    ];
    const points = [
        [144, 496], // Top-left
        [144, 562], // Bottom-left
        [1576, 562], // Bottom-right
        [1576, 496], // Top-right
      ];
    // Calculate rectangle width and height
    const w = points[2][0] - points[0][0];
    const h = points[1][1] - points[0][1];
    context.strokeStyle = "red";
    context.lineWidth = 5;
    //context.strokeRect(points[0][0], points[0][1], w, h); // Example coordinates and dimensions
    context.strokeRect(points[0][0] *scaleFactor, points[0][1]*scaleFactor, w*scaleFactor, h*scaleFactor);
    context.strokeRect(points[0][0]*scaleFactor +500, points[0][1]*scaleFactor+100, w*scaleFactor, h*scaleFactor);
    context.restore();
  }, [isRendered]);

  return (
    //<div style={{ width: "100%", height: "auto" }}>
    <Document file={"https://storage.googleapis.com/capstone-notes-bucket/Arafat_Resume (3).pdf"}>
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
