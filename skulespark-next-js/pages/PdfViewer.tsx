import React, { useEffect, useRef, useState, useCallback } from "react";
import './style/PdfViewer.css';
import { pdfjs, Document, Page } from "react-pdf";
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { useWindowWidth, useResizeObserver } from '@wojtekmaj/react-hooks';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

const resizeObserverOptions = {};
const maxWidth = 1800;
function PdfViewer({ pdfLink, highlight}) {
  const canvasRefs = useRef({});
  const width = useWindowWidth();
  const [key, setKey] = useState(0); // Key to force re-render
  const [numPages, setNumPages] = useState();
  const [containerRef, setContainerRef] = useState(null);
  const [containerWidth, setContainerWidth] = useState();

  const onResize = useCallback<ResizeObserverCallback>((entries) => {
    const [entry] = entries;

    if (entry) {
      setContainerWidth(entry.contentRect.width);
    }
  }, []);

  useResizeObserver(containerRef, resizeObserverOptions, onResize);


  function onDocumentLoadSuccess({ numPages }){
    setNumPages(numPages);
  }
  
  
  function onRenderSuccess(pageIndex) {
    //for each map in highlight
    //if pageIndex == map[page_number]-1
    var scrolled = false;
    highlight.forEach(element_info => {
      console.log(element_info);
      const highlightIndex =  element_info["page_number"] - 1; // Assuming map is an object with page numbers as keys
      if (pageIndex === highlightIndex) {
        const canvas = canvasRefs.current[pageIndex];
        canvas.scrollIntoView();
        var context = canvas.getContext("2d");
        var { width, height } = canvas;
        var actualW = 1700;
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
        const points2 = [
            [144, 496], // Top-left
            [144, 562], // Bottom-left
            [1576, 562], // Bottom-right
            [1576, 496], // Top-right
          ];
        const points = [
          element_info["coordinates"][0], // Top-left
          element_info["coordinates"][1], // Bottom-left
          element_info["coordinates"][2], // Bottom-right
          element_info["coordinates"][3], // Top-right
        ];
        // Calculate rectangle width and height
        const w = points[2][0] - points[0][0];
        const h = points[1][1] - points[0][1];
        context.strokeStyle = "red";
        context.lineWidth = 5;
        context.fillStyle = 'rgba(255, 255, 0, 0.3)';
        //context.strokeRect(points[0][0], points[0][1], w, h); // Example coordinates and dimensions
        context.fillRect(points[0][0] *scaleFactor, points[0][1]*scaleFactor, w*scaleFactor, h*scaleFactor);
        context.restore();
      }
    });

  }

  // This effect will trigger whenever the documentUrl changes
  useEffect(() => {
    // Update key to force re-render of Document component when documentUrl changes
    setKey(prevKey => prevKey + 1);
  }, [pdfLink,highlight]);

  return (
    <div style={{ width: "100%", height: "100%" }} ref={setContainerRef}>
    <Document key= {key} file={pdfLink} onLoadSuccess={onDocumentLoadSuccess}>
    
      {Array.from(new Array(numPages), (el, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                onRenderSuccess={() => onRenderSuccess(index)} // Pass the pageIndex to onRenderSuccess
                width={containerWidth ? Math.min(containerWidth, maxWidth) : width*0.5}
                className={"pageborder"}
                canvasRef={(canvas) => { canvasRefs.current[index] = canvas; }} // Assign canvasRef
              />
            ))}
            
    </Document>
    </div>
  );
}

export default PdfViewer;
