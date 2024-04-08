import React, { useEffect, useRef, useState } from "react";
import './style/PdfViewer.css';
import { pdfjs, Document, Page } from "react-pdf";
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import { useWindowWidth} from '@wojtekmaj/react-hooks';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;


const maxWidth = 1800;
function OCRViewer({ pdfLink, highlight, pageNumber, actualW}) {
  const canvas = useRef();
  const width = useWindowWidth();
  const [key, setKey] = useState(0); // Key to force re-render
  const [isRendered,setIsRendered] = useState(false);
  const [containerWidth, setContainerWidth] = useState();
 
  function onRenderSuccess() {
    setIsRendered(true);
       // Update key to force re-render of Document component when documentUrl changes
    //setKey(prevKey => prevKey + 1);
    if(isRendered && highlight.length>0){
        var context = canvas.current.getContext('2d');
        var { width, height } = canvas.current;
        var scaleFactor = width/actualW 
        console.log(width, height);
        //context.clearRect(0, 0, width, height);

        context.save();

        // Calculate rectangle width and height
        const w = highlight[2][0] - highlight[0][0];
        const h = highlight[1][1] - highlight[0][1];
        context.strokeStyle = "red";
        context.lineWidth = 5;
        context.fillStyle = 'rgba(255, 255, 0, 0.3)';
        //context.strokeRect(points[0][0], points[0][1], w, h); // Example coordinates and dimensions
        context.fillRect(highlight[0][0] *scaleFactor, highlight[0][1]*scaleFactor, w*scaleFactor, h*scaleFactor);
        context.restore();
  }
}

  // This effect will trigger whenever the hihglights changes
//   useEffect(() => {
//     // Update key to force re-render of Document component when documentUrl changes
//     //setKey(prevKey => prevKey + 1);
//     if(isRendered){
//         var context = canvas.current.getContext('2d');
//         var { width, height } = canvas.current;
//         var scaleFactor = width/actualW 
//         console.log(width, height);
//         //context.clearRect(0, 0, width, height);

//         context.save();

//         // Calculate rectangle width and height
//         const w = highlight[2][0] - highlight[0][0];
//         const h = highlight[1][1] - highlight[0][1];
//         context.strokeStyle = "red";
//         context.lineWidth = 5;
//         context.fillStyle = 'rgba(255, 255, 0, 0.3)';
//         //context.strokeRect(points[0][0], points[0][1], w, h); // Example coordinates and dimensions
//         context.fillRect(highlight[0][0] *scaleFactor, highlight[0][1]*scaleFactor, w*scaleFactor, h*scaleFactor);
//         context.restore();

//     }
//   }, [highlight]);
  // This effect will trigger whenever the documentUrl changes
  useEffect(() => {
    // Update key to force re-render of Document component when documentUrl changes
    
    setKey(prevKey => prevKey + 1);
  }, [highlight]);
  return (
    <div style={{ width: "100%", height: "auto" }}>
    <Document key= {key} file={pdfLink}>
    <Page
        pageNumber={pageNumber}
        canvasRef={canvas}
        onRenderSuccess={onRenderSuccess}
        width={width? Math.min(width*0.4, maxWidth) : width*0.5}
      />
          
    </Document>
    </div>
  );
}

export default OCRViewer;
