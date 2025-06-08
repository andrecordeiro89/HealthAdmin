import React, { useRef } from 'react';
import { UI_TEXT } from '../constants';
import { Alert, AlertType } from './Alert'; 
import { buttonPrimary, buttonSize } from './uiClasses';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void; 
  disabled?: boolean;
}

const MAX_FILES_UPLOAD = 25;

// Função de pré-processamento usando Canvas
function preprocessImage(file, callback) {
  const img = new window.Image();
  const reader = new FileReader();
  reader.onload = e => {
    img.src = e.target.result;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      // Escala de cinza
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const avg = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
        imageData.data[i] = imageData.data[i+1] = imageData.data[i+2] = avg;
      }
      ctx.putImageData(imageData, 0, 0);
      // Retorna a imagem processada como Blob
      canvas.toBlob(blob => {
        const processedFile = new File([blob], file.name, { type: 'image/png' });
        callback(processedFile);
      }, 'image/png');
    };
  };
  reader.readAsDataURL(file);
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const files = event.target.files;
    if (files) {
      if (files.length > MAX_FILES_UPLOAD) {
        setUploadError(UI_TEXT.maxFilesError(MAX_FILES_UPLOAD));
        event.target.value = '';
        return;
      }
      const fileArray = Array.from(files);
      // Pré-processar todas as imagens antes de passar para onFilesSelect
      Promise.all(fileArray.map(file =>
        new Promise<File>(resolve => preprocessImage(file, resolve))
      )).then(processedFiles => {
        onFilesSelect(processedFiles);
      });
      event.target.value = '';
    }
  };

  const triggerFileInput = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };
  
  return (
    <div className="w-full flex flex-col items-center justify-center">
      {uploadError && <Alert message={uploadError} type={AlertType.Error} onDismiss={() => setUploadError(null)} />}
      <div className="w-full flex flex-col items-center justify-center gap-2">
        <input
          id="file-upload-input"
          name="file-upload-input"
          type="file"
          className="sr-only"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp, image/heic"
          disabled={disabled}
          multiple
        />
        <button
          type="button"
          onClick={triggerFileInput}
          disabled={disabled}
          className={buttonPrimary + " max-w-xs flex items-center justify-center text-lg " + buttonSize}
          aria-label={UI_TEXT.addDocumentButton}
          title="Adicionar documentos (imagens)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 mr-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {UI_TEXT.addDocumentButton}
        </button>
        <p className="text-sm text-center text-slate-500 mt-2">{UI_TEXT.uploadInstructions}</p>
      </div>
    </div>
  );
};
