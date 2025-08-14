import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CorrectedMaterialItem, ProcessedDocumentEntry } from '../types';
import { UI_TEXT } from '../constants';
import { Modal } from './Modal';
import { tableHeader, tableCell, zebraRow, buttonPrimary, buttonLight, buttonSecondary, inputBase, buttonSize, cardLarge, cardBase, sectionGap } from './uiClasses';
import CreatableSelect from 'react-select/creatable';

interface MaterialCorrectionScreenProps {
    hospitalName: string;
    processedDocuments: ProcessedDocumentEntry[];
    onConfirmCorrections: (
        updatedDocs: ProcessedDocumentEntry[],
        correctedForDb: CorrectedMaterialItem[]
    ) => void;
    onSkip: () => void;
    onGoBack: () => void;
    onRetryErroredDocuments?: () => void;
    materialDbItems?: import('../types').MaterialDatabaseItem[];
    onMaterialDbUpdate?: (updatedDb: import('../types').MaterialDatabaseItem[]) => void;
}

interface GroupedEditableDocuments {
    [patientNameOrGenericKey: string]: ProcessedDocumentEntry[];
}

export const MaterialCorrectionScreen: React.FC<MaterialCorrectionScreenProps> = ({
    hospitalName,
    processedDocuments,
    onConfirmCorrections,
    onSkip,
    onGoBack,
    onRetryErroredDocuments,
    materialDbItems = [],
    onMaterialDbUpdate,
}) => {
    const [editableDocuments, setEditableDocuments] = useState<ProcessedDocumentEntry[]>([]);
    const [viewingDocument, setViewingDocument] = useState<ProcessedDocumentEntry | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [zoomed, setZoomed] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState<{ [key: string]: number | null }>({});
    const [highlightedIndex, setHighlightedIndex] = useState<{ [key: string]: number }>({});
    const [showSuggestionIdx, setShowSuggestionIdx] = useState<string | null>(null);
    const [highlightedIdx, setHighlightedIdx] = useState<number>(-1);
    const suggestionsRef = useRef<HTMLUListElement>(null);
    const [showAddMaterialModal, setShowAddMaterialModal] = useState<{ docId: string, index: number, desc: string } | null>(null);
    const [newQuickMaterialCode, setNewQuickMaterialCode] = useState('');
    const [addMaterialError, setAddMaterialError] = useState<string | null>(null);
    const [showFooterButtons, setShowFooterButtons] = useState(false);
    const [showSuccessTooltip, setShowSuccessTooltip] = useState<{ key: string, message: string } | null>(null);
    const [highlightedNewMaterialId, setHighlightedNewMaterialId] = useState<string | null>(null);

    const successfullyProcessedOriginalDocs = useMemo(() => {
        return processedDocuments.filter(doc => doc.status === 'success' && doc.extractedData);
    }, [processedDocuments]);

    // Contadores para estatísticas do sidebar
    const docsComErro = processedDocuments.filter(doc => doc.status === 'error');
    const docsComSucesso = processedDocuments.filter(doc => doc.status === 'success');
    const docsPendentes = processedDocuments.filter(doc => doc.status === 'pending' || doc.status === 'processing');

    useEffect(() => {
        setEditableDocuments(JSON.parse(JSON.stringify(successfullyProcessedOriginalDocs)));
    }, [successfullyProcessedOriginalDocs]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node)
            ) {
                setShowSuggestions({});
                setHighlightedIndex({});
                setShowSuggestionIdx(null);
                setHighlightedIdx(-1);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY || window.pageYOffset;
            const windowHeight = window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;
            setShowFooterButtons(scrollY + windowHeight >= docHeight - 32);
        };
        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleMaterialChange = (
        docId: string,
        materialIndex: number,
        field: 'description' | 'code' | 'quantity' | 'lotNumber' | 'observation' | 'observacaoUsuario',
        value: string
    ) => {
        setEditableDocuments(prevDocs =>
            prevDocs.map(doc => {
                if (doc.id === docId && doc.extractedData) {
                    const newMaterialsUsed = [...doc.extractedData.materialsUsed];
                    if (newMaterialsUsed[materialIndex]) {
                        newMaterialsUsed[materialIndex] = {
                            ...newMaterialsUsed[materialIndex],
                            [field]: field === 'quantity' ? Number(value) : value || (field === 'code' || field === 'lotNumber' || field === 'observation' ? null : ''),
                        };
                        return { ...doc, extractedData: { ...doc.extractedData, materialsUsed: newMaterialsUsed } };
                    }
                }
                return doc;
            })
        );
    };

    const handleAddMaterial = (docId: string) => {
        setEditableDocuments(prevDocs =>
            prevDocs.map(doc => {
                if (doc.id === docId && doc.extractedData) {
                    return {
                        ...doc,
                        extractedData: {
                            ...doc.extractedData,
                            materialsUsed: [
                                ...doc.extractedData.materialsUsed,
                                { description: '', quantity: 1, code: null, lotNumber: null, observation: null },
                            ],
                        },
                    };
                }
                return doc;
            })
        );
    };

    const handleRemoveMaterial = (docId: string, materialIndex: number) => {
        setEditableDocuments(prevDocs =>
            prevDocs.map(doc => {
                if (doc.id === docId && doc.extractedData) {
                    const newMaterialsUsed = doc.extractedData.materialsUsed.filter((_, idx) => idx !== materialIndex);
                    return { ...doc, extractedData: { ...doc.extractedData, materialsUsed: newMaterialsUsed } };
                }
                return doc;
            })
        );
    };

    const handlePatientNameChange = (docId: string, newName: string) => {
        setEditableDocuments(prevDocs =>
            prevDocs.map(doc => {
                if (doc.id === docId && doc.extractedData) {
                    return {
                        ...doc,
                        extractedData: {
                            ...doc.extractedData,
                            patientName: newName || null,
                        },
                    };
                }
                return doc;
            })
        );
    };

    const handlePatientInfoChange = (docId: string, field: string, value: string) => {
        setEditableDocuments(prevDocs =>
            prevDocs.map(doc => {
                if (doc.id === docId && doc.extractedData) {
                    return {
                        ...doc,
                        extractedData: {
                            ...doc.extractedData,
                            [field]: value || null,
                        },
                    };
                }
                return doc;
            })
        );
    };

    const handleSubmitCorrections = () => {
        const correctedItemsForDb: CorrectedMaterialItem[] = [];

        const finalEditableDocuments = editableDocuments.map(doc => {
            if (doc.extractedData && doc.extractedData.patientName) {
                return {
                    ...doc,
                    extractedData: {
                        ...doc.extractedData,
                        patientName: doc.extractedData.patientName.trim() || null
                    }
                };
            }
            return doc;
        });

        finalEditableDocuments.forEach(editedDoc => {
            const originalDoc = successfullyProcessedOriginalDocs.find(od => od.id === editedDoc.id);
            if (originalDoc && originalDoc.extractedData && editedDoc.extractedData) {
                editedDoc.extractedData.materialsUsed.forEach((editedMaterial, index) => {
                    const originalMaterial = originalDoc.extractedData!.materialsUsed[index];
                    if (originalMaterial &&
                        (editedMaterial.description !== originalMaterial.description || editedMaterial.code !== originalMaterial.code)) {
                        correctedItemsForDb.push({
                            originalDescription: originalMaterial.description,
                            originalCode: originalMaterial.code,
                            correctedDescription: editedMaterial.description,
                            correctedCode: editedMaterial.code,
                        });
                    }
                });
            }
        });
        onConfirmCorrections(finalEditableDocuments, correctedItemsForDb);
    };

    const handleViewDocument = (docId: string) => {
        const docToView = editableDocuments.find(doc => doc.id === docId) || successfullyProcessedOriginalDocs.find(doc => doc.id === docId);
        if (docToView) {
            setViewingDocument(docToView);
        }
    };

    const handleCloseViewDocumentModal = () => {
        setViewingDocument(null);
    };

    const handleDeletePatient = (patientKey: string) => {
        // Remove todos os documentos deste paciente
        const docsToRemove = groupedEditableDocs[patientKey] || [];
        const docIdsToRemove = docsToRemove.map(doc => doc.id);

        setEditableDocuments(prevDocs =>
            prevDocs.filter(doc => !docIdsToRemove.includes(doc.id))
        );

        // Se o paciente deletado estava selecionado, limpa a busca
        if (searchTerm === patientKey) {
            setSearchTerm('');
        }
    };
    const groupedEditableDocs = useMemo(() => {
        return successfullyProcessedOriginalDocs.reduce<GroupedEditableDocuments>((acc, originalDoc) => {
            if (originalDoc.status === 'success' && originalDoc.extractedData) {
                const patientName = originalDoc.extractedData.patientName?.trim();
                const key = patientName || UI_TEXT.patientGroupHeader(null);

                const editableVersion = editableDocuments.find(ed => ed.id === originalDoc.id);
                if (editableVersion) {
                    if (!acc[key]) {
                        acc[key] = [];
                    }
                    acc[key].push(editableVersion);
                }
            }
            return acc;
        }, {});
    }, [successfullyProcessedOriginalDocs, editableDocuments]);

    const patientGroups = Object.keys(groupedEditableDocs).sort((a, b) => {
        const unknownKey = UI_TEXT.patientGroupHeader(null);
        if (a === unknownKey) return 1;
        if (b === unknownKey) return -1;
        return a.localeCompare(b);
    });

    const filteredPatientGroups = useMemo(() => {
        if (!searchTerm.trim()) return patientGroups;
        return patientGroups.filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [patientGroups, searchTerm]);

    const purpleGradientPrimary = "w-full md:w-auto text-white font-semibold py-2.5 px-6 rounded-lg shadow-lg bg-gradient-to-br from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
    const purpleGradientSecondary = "w-full md:w-auto text-white font-medium py-2.5 px-6 rounded-lg shadow-md bg-gradient-to-br from-purple-400 to-indigo-500 hover:from-purple-500 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400 focus:ring-offset-white transform hover:-translate-y-0.5 transition-all duration-300 ease-in-out disabled:opacity-60 disabled:saturate-50 disabled:cursor-not-allowed disabled:transform-none";
    const purpleGradientLight = "w-full md:w-auto text-purple-700 font-medium py-2.5 px-6 rounded-lg shadow-sm bg-gradient-to-br from-purple-100 to-indigo-200 hover:from-purple-200 hover:to-indigo-300 border border-purple-300 hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 focus:ring-offset-white transition-all duration-300 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed";
    const modalPurpleGradientLight = purpleGradientLight.replace("w-full md:w-auto ", "");

    if (successfullyProcessedOriginalDocs.length === 0) {
        return (
            <div className="w-full max-w-3xl mx-auto bg-white/90 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-xl text-center border border-gray-200">
                <div className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:space-x-4 justify-center">
                    <button
                        onClick={onGoBack}
                        className={purpleGradientLight.replace("md:w-auto", "sm:w-auto")}
                    >
                        {UI_TEXT.backToDocumentManagementButton}
                    </button>
                    <button
                        onClick={onSkip}
                        className={purpleGradientSecondary.replace("md:w-auto", "sm:w-auto")}
                    >
                        {UI_TEXT.skipCorrectionsButton.replace("Pular Correção e ", "")}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-start pt-4 px-4 bg-gradient-to-br from-white via-indigo-50 to-purple-50">
            <div style={{ height: '8px' }} />

            {/* Modal de detalhes técnicos dos documentos */}
            <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Detalhes dos Documentos Processados" size="2xl">
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="min-w-full text-sm text-left border border-gray-200">
                        <thead className="sticky top-0 z-10 bg-gray-100">
                            <tr>
                                <th className={tableHeader}>Arquivo</th>
                                <th className={tableHeader}>Status</th>
                                <th className={tableHeader}>Erro</th>
                            </tr>
                        </thead>
                        <tbody>
                            {processedDocuments.map((doc, idx) => (
                                <tr key={doc.id} className={zebraRow + (doc.status === 'error' ? ' bg-red-50' : doc.status === 'success' ? ' bg-green-50' : ' bg-yellow-50')}>
                                    <td className={tableCell + " font-mono"}>{doc.fileName}</td>
                                    <td className={tableCell + " font-semibold"}>{doc.status === 'success' ? 'Sucesso' : doc.status === 'error' ? 'Erro' : 'Pendente'}</td>
                                    <td className={tableCell + " text-xs text-red-700"}>{doc.errorMessage || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {docsComErro.length > 0 && onRetryErroredDocuments && (
                    <div className="mt-4 flex items-center justify-end">
                        <button
                            onClick={onRetryErroredDocuments}
                            className={"px-6 py-2 rounded-lg bg-gradient-to-br from-red-500 to-red-700 text-white font-bold shadow-lg hover:from-red-600 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-400 text-base " + buttonSize}
                            title="Tentar novamente processar todos os documentos com erro"
                        >Reprocessar documentos com erro</button>
                    </div>
                )}
            </Modal>
            {showFooterButtons && (
                <div className="fixed bottom-0 left-0 w-full flex justify-center bg-white/95 backdrop-blur-sm border-t border-indigo-200/60 py-4 z-30 shadow-lg">
                    <button
                        onClick={handleSubmitCorrections}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-200 text-base flex items-center gap-2"
                        title="Salvar correções e continuar para revisão"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Salvar e Avançar
                    </button>
                </div>
            )}

            {/* Conteúdo principal da tela */}
            <div className={"flex-1 w-full h-full flex flex-row font-['Inter','Roboto','Montserrat',sans-serif] " + sectionGap} style={{ paddingBottom: '120px' }}>
                {/* Sidebar Premium Responsivo */}
                <div className="min-w-[280px] max-w-[400px] w-auto h-fit bg-gradient-to-b from-white/95 via-indigo-50/90 to-purple-50/95 backdrop-blur-sm border-r border-indigo-200/60 shadow-2xl flex flex-col" style={{ boxShadow: '4px 0 24px 0 rgba(80,60,180,0.12)', width: 'fit-content' }}>
                    {/* Header do Sidebar */}
                    <div className="p-6 border-b border-indigo-200/50">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-indigo-800 leading-tight">Correção IA</h2>
                                <p className="text-xs text-slate-600 font-medium">Documentos & Materiais</p>
                            </div>
                        </div>

                        {/* Estatísticas Compactas */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-gradient-to-br from-green-100/80 to-white/90 rounded-lg p-2 border border-green-200/40">
                                <div className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-1">Sucesso</div>
                                <div className="text-sm font-bold text-green-800">{docsComSucesso.length}</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-100/80 to-white/90 rounded-lg p-2 border border-red-200/40">
                                <div className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Erro</div>
                                <div className="text-sm font-bold text-red-800">{docsComErro.length}</div>
                            </div>
                            <div className="bg-gradient-to-br from-amber-100/80 to-white/90 rounded-lg p-2 border border-amber-200/40">
                                <div className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-1">Pend.</div>
                                <div className="text-sm font-bold text-amber-800">{docsPendentes.length}</div>
                            </div>
                        </div>
                    </div>

                    {/* Ações Principais */}
                    <div className="p-6 border-b border-indigo-200/50">
                        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">Ações</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowStatusModal(true)}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold shadow-lg transition-all duration-200 text-sm"
                                style={{ minWidth: '260px' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Ver detalhes dos documentos</span>
                            </button>

                            <button
                                onClick={onRetryErroredDocuments}
                                disabled={docsComErro.length === 0}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg transition-all duration-200 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                style={{ minWidth: '260px' }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Reprocessar documentos com erro</span>
                            </button>
                        </div>
                    </div>

                    {/* Busca de Pacientes */}
                    <div className="p-6" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99, 102, 241, 0.3) rgba(99, 102, 241, 0.1)' }}>
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Localizar Paciente</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar paciente..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="px-4 py-2.5 pl-10 text-sm font-medium text-slate-800 placeholder:text-slate-400 bg-white rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 border border-indigo-200 transition-all duration-200 outline-none"
                                    style={{ minWidth: '240px', width: 'auto' }}
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Lista de Pacientes */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                                Pacientes ({filteredPatientGroups.length})
                            </h4>

                            {filteredPatientGroups.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-300 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <p className="text-sm text-slate-500 font-medium">Nenhum paciente encontrado</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {filteredPatientGroups.map(patientKey => (
                                        <div
                                            key={patientKey}
                                            className={`w-full rounded-lg font-semibold transition-all duration-200 text-sm flex items-center gap-2 ${patientKey === searchTerm
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-700 text-white shadow-lg scale-[1.02]'
                                                : 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 hover:from-purple-200 hover:to-indigo-200 hover:scale-[1.01] shadow-sm'
                                                }`}
                                            
                                        >
                                            <button
                                                className="flex-1 min-w-0 text-left px-4 py-3 flex items-center gap-3"
                                                onClick={() => setSearchTerm(patientKey)}
                                                title={patientKey === searchTerm ? 'Paciente selecionado' : 'Selecionar paciente'}
                                            >
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${patientKey === searchTerm ? 'bg-white/20' : 'bg-purple-200'
                                                    }`}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${patientKey === searchTerm ? 'text-white' : 'text-purple-600'
                                                        }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                                <span className="font-medium truncate">{patientKey}</span>
                                                {groupedEditableDocs[patientKey] && (
                                                    <span className={`ml-auto text-xs px-2 py-1 rounded-full font-bold flex-shrink-0 ${patientKey === searchTerm
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-purple-200 text-purple-700'
                                                        }`}>
                                                        {groupedEditableDocs[patientKey].length}
                                                    </span>
                                                )}
                                            </button>

                                            {/* Botão de Delete */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm(`Tem certeza que deseja deletar o paciente "${patientKey}" e todos os seus documentos?`)) {
                                                        handleDeletePatient(patientKey);
                                                    }
                                                }}
                                                className={`p-2 rounded-lg transition-all duration-200 mr-2 ${patientKey === searchTerm
                                                    ? 'hover:bg-white/20 text-white/80 hover:text-white'
                                                    : 'hover:bg-red-200 text-red-600 hover:text-red-700'
                                                    }`}
                                                title="Deletar paciente"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer com Navegação */}
                    <div className="p-6 border-t border-indigo-200/50 bg-gradient-to-r from-white/80 to-indigo-50/80">
                        <div className="space-y-2">
                            <button
                                onClick={onGoBack}
                                className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg transition-all duration-200 text-sm whitespace-nowrap"
                                style={{ minWidth: 'fit-content', width: '100%' }}
                            >
                                ← Voltar
                            </button>
                            <button
                                onClick={onSkip}
                                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-2.5 px-4 rounded-lg shadow-lg transition-all duration-200 text-sm whitespace-nowrap"
                                style={{ minWidth: 'fit-content', width: '100%' }}
                            >
                                Pular Correções
                            </button>
                        </div>
                    </div>
                </div>
                {/* Coluna direita: Dados e correções do paciente selecionado */}
                <div className="flex-1 px-8 pt-0 pb-8 overflow-y-auto flex flex-col gap-8 relative">
                    {/* Para cada paciente/documento selecionado, renderize um card editável completo */}
                    {filteredPatientGroups.map(patientKey => (
                        <section key={patientKey} className="mb-8">
                            {groupedEditableDocs[patientKey]?.map(doc => (
                                <div key={doc.id} className="mb-6 bg-gradient-to-br from-white/95 via-indigo-50 to-purple-50/80 rounded-2xl shadow-xl border border-indigo-100 overflow-hidden">
                                    {/* Header do Card com Nome do Paciente */}
                                    <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
                                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            {doc.extractedData?.patientName || 'Paciente Não Identificado'}
                                        </h2>
                                    </div>

                                    <div className="p-6">
                                        {/* Seção de Dados do Paciente */}
                                        <div className="mb-6">
                                            <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                Dados do Paciente
                                            </h3>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Nome do Paciente</label>
                                                    <input
                                                        type="text"
                                                        value={doc.extractedData?.patientName || ''}
                                                        onChange={e => handlePatientNameChange(doc.id, e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-800 bg-white shadow-sm transition-all duration-200"
                                                        placeholder="Nome do paciente"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Data de Nascimento</label>
                                                    <input
                                                        type="text"
                                                        value={doc.extractedData?.patientDOB || ''}
                                                        onChange={e => handlePatientInfoChange(doc.id, 'patientDOB', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-800 bg-white shadow-sm transition-all duration-200"
                                                        placeholder="Data de nascimento"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Data da Cirurgia</label>
                                                    <input
                                                        type="text"
                                                        value={doc.extractedData?.surgeryDate || ''}
                                                        onChange={e => handlePatientInfoChange(doc.id, 'surgeryDate', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-800 bg-white shadow-sm transition-all duration-200"
                                                        placeholder="Data da cirurgia"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Procedimento</label>
                                                    <input
                                                        type="text"
                                                        value={doc.extractedData?.procedureName || ''}
                                                        onChange={e => handlePatientInfoChange(doc.id, 'procedureName', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-800 bg-white shadow-sm transition-all duration-200"
                                                        placeholder="Procedimento"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Médico Responsável</label>
                                                    <input
                                                        type="text"
                                                        value={doc.extractedData?.doctorName || ''}
                                                        onChange={e => handlePatientInfoChange(doc.id, 'doctorName', e.target.value)}
                                                        className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-800 bg-white shadow-sm transition-all duration-200"
                                                        placeholder="Médico responsável"
                                                    />
                                                </div>

                                                {doc.imagePreviewUrl && (
                                                    <div className="flex items-end">
                                                        <button
                                                            onClick={() => handleViewDocument(doc.id)}
                                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-sm font-semibold shadow-lg transition-all duration-200"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            Ver Documento
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Divisor */}
                                        <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent my-6" />

                                        {/* Seção de Materiais */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                    </svg>
                                                    Materiais Utilizados ({doc.extractedData?.materialsUsed.length || 0})
                                                </h3>
                                                <button
                                                    onClick={() => handleAddMaterial(doc.id)}
                                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-semibold shadow-lg transition-all duration-200"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                    </svg>
                                                    Adicionar Material
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                {doc.extractedData?.materialsUsed.map((material, index) => (
                                                    <div key={index} className={`p-3 rounded-xl border-2 transition-all duration-300 ${material.contaminated
                                                        ? 'border-red-300 bg-gradient-to-r from-red-50 to-red-25'
                                                        : 'border-indigo-200 bg-gradient-to-r from-white to-indigo-50/30'
                                                        }`}>
                                                        {/* Header do Material com Checkbox Contaminado */}
                                                        <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-sm font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                                                                    #{index + 1}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!material.contaminated}
                                                                        onChange={e => {
                                                                            setEditableDocuments(prevDocs =>
                                                                                prevDocs.map(docItem => {
                                                                                    if (docItem.id === doc.id && docItem.extractedData) {
                                                                                        const newMaterials = [...docItem.extractedData.materialsUsed];
                                                                                        newMaterials[index] = {
                                                                                            ...newMaterials[index],
                                                                                            contaminated: e.target.checked
                                                                                        };
                                                                                        return { ...docItem, extractedData: { ...docItem.extractedData, materialsUsed: newMaterials } };
                                                                                    }
                                                                                    return docItem;
                                                                                })
                                                                            );
                                                                        }}
                                                                        className="accent-red-500 w-4 h-4 rounded border-2 border-red-300"
                                                                        id={`contaminated-${doc.id}-${index}`}
                                                                    />
                                                                    <label htmlFor={`contaminated-${doc.id}-${index}`} className="text-sm font-semibold text-red-600 cursor-pointer">
                                                                        Contaminado
                                                                    </label>
                                                                    {material.contaminated && (
                                                                        <span className="px-2 py-1 bg-red-200 text-red-800 rounded-full text-xs font-bold">
                                                                            ⚠️ CONTAMINADO
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleRemoveMaterial(doc.id, index)}
                                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold shadow-sm transition-all duration-200"
                                                                title="Remover material"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                </svg>
                                                                Remover
                                                            </button>
                                                        </div>

                                                        {/* Campos do Material em Grid Compacto */}
                                                        <div className="grid grid-cols-1 gap-2 mb-2">
                                                            {/* Primeira linha: Descrição e Código */}
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                                                                <div className="md:col-span-2">
                                                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Descrição</label>
                                                                    <CreatableSelect
                                                                        isClearable
                                                                        placeholder="Selecione ou digite..."
                                                                        formatCreateLabel={inputValue => `Cadastrar: "${inputValue}"`}
                                                                        value={material.description ? { label: material.description, value: material.description } : null}
                                                                        options={materialDbItems.map(m => ({ label: m.description, value: m.description, code: m.code }))}
                                                                        onChange={option => {
                                                                            if (!option) {
                                                                                handleMaterialChange(doc.id, index, 'description', '');
                                                                                handleMaterialChange(doc.id, index, 'code', '');
                                                                                return;
                                                                            }
                                                                            const selected = materialDbItems.find(m => m.description === option.value);
                                                                            handleMaterialChange(doc.id, index, 'description', option.value);
                                                                            handleMaterialChange(doc.id, index, 'code', selected ? selected.code : '');
                                                                        }}
                                                                        onCreateOption={inputValue => {
                                                                            const newMaterial = {
                                                                                id: `db-mat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                                                                                description: inputValue,
                                                                                code: '',
                                                                            };
                                                                            onMaterialDbUpdate && onMaterialDbUpdate([...materialDbItems, newMaterial]);
                                                                            handleMaterialChange(doc.id, index, 'description', inputValue);
                                                                            handleMaterialChange(doc.id, index, 'code', '');
                                                                        }}
                                                                        classNamePrefix="react-select"
                                                                        styles={{
                                                                            control: (base) => ({
                                                                                ...base,
                                                                                minHeight: '32px',
                                                                                fontSize: '14px'
                                                                            })
                                                                        }}
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Código</label>
                                                                    <CreatableSelect
                                                                        isClearable
                                                                        placeholder="Código..."
                                                                        formatCreateLabel={inputValue => `Cadastrar: "${inputValue}"`}
                                                                        value={material.code ? { label: material.code, value: material.code } : null}
                                                                        options={materialDbItems.map(m => ({ label: m.code, value: m.code, description: m.description }))}
                                                                        onChange={option => {
                                                                            if (!option) {
                                                                                handleMaterialChange(doc.id, index, 'code', '');
                                                                                handleMaterialChange(doc.id, index, 'description', '');
                                                                                return;
                                                                            }
                                                                            const selected = materialDbItems.find(m => m.code === option.value);
                                                                            handleMaterialChange(doc.id, index, 'code', option.value);
                                                                            handleMaterialChange(doc.id, index, 'description', selected ? selected.description : '');
                                                                        }}
                                                                        onCreateOption={inputValue => {
                                                                            const newMaterial = {
                                                                                id: `db-mat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                                                                                description: '',
                                                                                code: inputValue,
                                                                            };
                                                                            onMaterialDbUpdate && onMaterialDbUpdate([...materialDbItems, newMaterial]);
                                                                            handleMaterialChange(doc.id, index, 'code', inputValue);
                                                                            handleMaterialChange(doc.id, index, 'description', '');
                                                                        }}
                                                                        classNamePrefix="react-select"
                                                                        styles={{
                                                                            control: (base) => ({
                                                                                ...base,
                                                                                minHeight: '32px',
                                                                                fontSize: '14px'
                                                                            })
                                                                        }}
                                                                    />
                                                                </div>

                                                            </div>
                                                        </div>

                                                        {/* Segunda linha: Quantidade, Lote e Observação */}
                                                        <div className="grid grid-cols-3 gap-2">
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Qtd</label>
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={material.quantity}
                                                                    onChange={e => handleMaterialChange(doc.id, index, 'quantity', e.target.value)}
                                                                    className="w-full px-2 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-800 bg-white shadow-sm transition-all duration-200"
                                                                    placeholder="Qtd"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Lote</label>
                                                                <input
                                                                    type="text"
                                                                    value={material.lotNumber || ''}
                                                                    onChange={e => handleMaterialChange(doc.id, index, 'lotNumber', e.target.value)}
                                                                    className="w-full px-2 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-800 bg-white shadow-sm transition-all duration-200"
                                                                    placeholder="Lote"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">Observação</label>
                                                                <input
                                                                    type="text"
                                                                    value={material.observacaoUsuario || ''}
                                                                    onChange={e => handleMaterialChange(doc.id, index, 'observacaoUsuario', e.target.value)}
                                                                    className="w-full px-2 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-medium text-slate-800 bg-white shadow-sm transition-all duration-200"
                                                                    placeholder="Observação"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Mensagem quando não há materiais */}
                                                {(!doc.extractedData?.materialsUsed || doc.extractedData.materialsUsed.length === 0) && (
                                                    <div className="col-span-full text-center py-8 text-slate-500">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8l-4 4m0 0l-4-4m4 4V3" />
                                                        </svg>
                                                        <p className="font-medium">Nenhum material cadastrado</p>
                                                        <p className="text-sm">Clique em "Adicionar Material" para começar</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </section>
                    ))}
                </div>
            </div>

            {/* Modal para visualizar documento */}
            {viewingDocument && (
                <Modal isOpen={!!viewingDocument} onClose={handleCloseViewDocumentModal} title={`Documento: ${viewingDocument.fileName}`} size="4xl">
                    <div className="flex justify-center">
                        <img
                            src={viewingDocument.imagePreviewUrl}
                            alt={`Preview de ${viewingDocument.fileName}`}
                            className={`max-w-full h-auto border border-gray-300 rounded-lg shadow-lg transition-transform duration-300 ${zoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
                            onClick={() => setZoomed(!zoomed)}
                            style={{ maxHeight: zoomed ? 'none' : '70vh' }}
                        />
                    </div>
                </Modal>
            )}

            {/* Modal para adicionar material à base */}
            {showAddMaterialModal && (
                <Modal isOpen={!!showAddMaterialModal} onClose={() => setShowAddMaterialModal(null)} title="Adicionar Material à Base" size="md">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição do Material</label>
                            <input
                                type="text"
                                value={showAddMaterialModal.desc}
                                readOnly
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código do Material</label>
                            <input
                                type="text"
                                value={newQuickMaterialCode}
                                onChange={e => setNewQuickMaterialCode(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Digite o código do material"
                            />
                        </div>
                        {addMaterialError && (
                            <div className="text-red-600 text-sm">{addMaterialError}</div>
                        )}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowAddMaterialModal(null)}
                                className={modalPurpleGradientLight}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => {
                                    if (!newQuickMaterialCode.trim()) {
                                        setAddMaterialError('Código é obrigatório');
                                        return;
                                    }

                                    const newMaterial = {
                                        id: `db-mat-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                                        description: showAddMaterialModal.desc,
                                        code: newQuickMaterialCode.trim(),
                                    };

                                    onMaterialDbUpdate && onMaterialDbUpdate([...materialDbItems, newMaterial]);
                                    handleMaterialChange(showAddMaterialModal.docId, showAddMaterialModal.index, 'code', newQuickMaterialCode.trim());

                                    setShowAddMaterialModal(null);
                                    setNewQuickMaterialCode('');
                                    setAddMaterialError(null);

                                    setHighlightedNewMaterialId(newMaterial.id);
                                    setTimeout(() => setHighlightedNewMaterialId(null), 3000);
                                }}
                                className={purpleGradientPrimary.replace("w-full md:w-auto ", "")}
                            >
                                Adicionar à Base
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Tooltip de sucesso */}
            {showSuccessTooltip && (
                <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
                    {showSuccessTooltip.message}
                </div>
            )}
        </div>
    );
};