import React, { useState, useRef } from 'react';
import SignaturePad from 'react-signature-canvas';
import { useDrag, useDrop } from 'react-dnd';

const DocumentPreview = () => {
  const [signatures, setSignatures] = useState([]);
  const [pdf, setPdf] = useState(null);
  const signatureRef = useRef();
  const previewContainerRef = useRef();
  const defaultSignatureData = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQTNc1-n2DBtZkYlEwR5L9_Z9hCNTGZPzKQkWkV-A5Hrep6Cw5KxQ7QITTxryksb98Wlys&usqp=CAU'; // Set the path to your logo image

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => setPdf(e.target.result);
    reader.readAsDataURL(file);
  };

  const SignatureElement = ({ id, position }) => {
    const [{ isDragging }, drag] = useDrag({
      type: 'SIGNATURE',
      item: { id, type: 'SIGNATURE', initialPosition: position },
      collect: (monitor) => ({
        isDragging: monitor.isDragging()
      })
    });

    return (
      <div
        ref={drag}
        style={{
          position: 'absolute',
          left: position.x,
          top: position.y,
          zIndex: 10, // Add z-index to ensure it appears above the PDF
          opacity: isDragging ? 0.5 : 1
        }}
      >
        <img src={signatures[id].data} alt="signature" />
      </div>
    );
  };

  const [, drop] = useDrop({
    accept: 'SIGNATURE',
    drop: (item, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset();
      const left = Math.round(item.initialPosition.x + delta.x);
      const top = Math.round(item.initialPosition.y + delta.y);
      console.log('Dropped at:', left, top);
      moveSignature(item.id, left, top);
    }
  });

  const moveSignature = (id, left, top) => {
    setSignatures(
      signatures.map((sig, index) => 
        index === id ? { ...sig, position: { x: left, y: top } } : sig
      )
    );
    console.log(signatures);
  };

  const addSignature = () => {
    const previewContainer = previewContainerRef.current;
    const centerX = previewContainer.offsetWidth / 2 - 250; // 250 is half of the canvas width
    const centerY = previewContainer.offsetHeight / 2 - 100; // 100 is half of the canvas height

    setSignatures([...signatures, {
      data: defaultSignatureData,
      position: { x: centerX, y: centerY }
    }]);
    signatureRef.current.clear();
    console.log(signatures);
  };

  return (
    <div className="document-preview">
      <input type="file" onChange={handleFileUpload} accept="application/pdf" />
      
      <div className="preview-container" ref={drop} style={{ position: 'relative', width: '100%', height: '800px' }} ref={previewContainerRef}>
        {pdf && (
          <iframe 
            src={pdf} 
            style={{ width: '100%', height: '100%' }}
          />
        )}
        
        {signatures.map((sig, index) => (
          <SignatureElement 
            key={index} 
            id={index} 
            position={sig.position} 
          />
        ))}
      </div>

      <div className="signature-pad">
        <SignaturePad
          ref={signatureRef}
          canvasProps={{ width: 500, height: 200 }}
        />
        <button onClick={addSignature}>
          Add Signature
        </button>
      </div>
    </div>
  );
};

export default DocumentPreview;