import React, { useRef } from 'react';
import { UI_TEXT } from '../constants';
import { Alert, AlertType } from './Alert'; 
import { buttonPrimary, buttonSize } from './uiClasses';

interface FileUploadProps {
  onFilesSelect: (files: File[]) => void; 
  disabled?: boolean;
}

const MAX_FILES_UPLOAD = 25;

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
      onFilesSelect(fileArray);
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
