

import React, { useRef } from 'react';
import { UI_TEXT } from '../constants';
import { Alert, AlertType } from './Alert'; 

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
  
  const purpleGradientUploadButton = "w-full flex items-center justify-center px-4 py-3 text-white font-semibold rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";

  return (
    <div>
      {uploadError && <Alert message={uploadError} type={AlertType.Error} onDismiss={() => setUploadError(null)} />}
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
        className={purpleGradientUploadButton}
        aria-label={UI_TEXT.addDocumentButton}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5 mr-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {UI_TEXT.addDocumentButton}
      </button>
      <p className="text-xs text-center text-slate-500 mt-2">{UI_TEXT.uploadInstructions}</p>
    </div>
  );
};
