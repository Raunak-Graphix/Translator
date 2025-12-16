import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { translateTextStream } from './services/geminiService';
import { storageService } from './services/storage';
import { TranslationStatus, TranslationHistoryItem, ToastMessage, TranslationDirection, Script, ViewMode } from './types';
import { 
  ArrowRightLeft, Copy, Check, Sparkles, Languages, X, Loader2, History, Trash2,
  Maximize2, Minimize2, FileText, Bold, Italic, 
  Underline, Highlighter, LinkIcon, ImageIcon, Heading1, Heading2, Plus,
  Palette, Type, Download
} from './components/Icons';

// --- Helper Functions ---
const generateId = () => Math.random().toString(36).substr(2, 9);
const getWordCount = (text: string) => text.trim() ? text.trim().split(/\s+/).length : 0;
const gradients = [
  "from-blue-600/10 to-indigo-900/10",
  "from-sky-600/10 to-blue-950/10",
  "from-cyan-600/10 to-blue-900/10",
];
const getRandomGradient = () => `bg-gradient-to-br ${gradients[Math.floor(Math.random() * gradients.length)]}`;

// --- Components ---

const RichTextEditor: React.FC<{
  script: Script;
  onSave: (script: Script) => void;
  onBack: () => void;
}> = ({ script, onSave, onBack }) => {
  const [title, setTitle] = useState(script.title);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLInputElement>(null);
  const highlightColorRef = useRef<HTMLInputElement>(null);
  
  // Initialize content
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = script.content;
    }
  }, [script.id]);

  // Auto-save when content changes
  const handleInput = () => {
    if (editorRef.current) {
       // Optional: Auto-save logic could go here if we wanted real-time persistence
    }
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const handleToolbarAction = (e: React.MouseEvent, command: string, value?: string) => {
    e.preventDefault();
    executeCommand(command, value);
  };

  const handleExportPDF = () => {
    if (!editorRef.current) return;
    setIsExporting(true);

    const element = editorRef.current;
    const opt = {
      margin: [0.5, 0.5],
      filename: `${title || 'script'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    // @ts-ignore
    if (window.html2pdf) {
      // @ts-ignore
      window.html2pdf().set(opt).from(element).save().then(() => {
        setIsExporting(false);
      });
    } else {
      alert('PDF export library not loaded. Please refresh the page.');
      setIsExporting(false);
    }
    
    // Save state internally
    onSave({
        ...script,
        title,
        content: editorRef.current.innerHTML,
        lastModified: Date.now()
    });
  };

  // Image insertion
  const addImage = (e: React.MouseEvent) => {
    e.preventDefault();
    const selection = window.getSelection();
    let range: Range | null = null;
    if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
    }

    const url = prompt('Enter image URL:');
    
    if (editorRef.current) editorRef.current.focus();
    if (range && selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }

    if (url) {
      document.execCommand('insertImage', false, url);
    }
  };

  const addLink = (e: React.MouseEvent) => {
    e.preventDefault();
    const selection = window.getSelection();
    let range: Range | null = null;
    if (selection && selection.rangeCount > 0) {
        range = selection.getRangeAt(0);
    }

    const url = prompt('Enter URL:');
    
    if (editorRef.current) editorRef.current.focus();
    if (range && selection) {
        selection.removeAllRanges();
        selection.addRange(range);
    }

    if (url) {
      document.execCommand('createLink', false, url);
    }
  };

  const triggerColorPicker = (e: React.MouseEvent, ref: React.RefObject<HTMLInputElement>) => {
    e.preventDefault();
    ref.current?.click();
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>, command: string) => {
    executeCommand(command, e.target.value);
  };

  const EditorUI = (
    <div className={`flex flex-col bg-white overflow-hidden ${isFullScreen ? 'h-screen w-screen' : 'h-full rounded-2xl shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4'}`}>
      {/* Hidden Color Inputs */}
      <input 
        type="color" 
        ref={textColorRef} 
        onChange={(e) => handleColorChange(e, 'foreColor')} 
        className="hidden" 
      />
      <input 
        type="color" 
        ref={highlightColorRef} 
        onChange={(e) => handleColorChange(e, 'backColor')} 
        className="hidden" 
      />

      {/* Toolbar */}
      <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          {!isFullScreen && (
            <button onClick={onBack} className="p-2 hover:bg-slate-200 rounded-lg text-slate-500" title="Back to Scripts">
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          )}
          <input 
            type="text" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            className="bg-transparent font-bold text-slate-700 focus:outline-none border-b border-transparent focus:border-brand-500 px-1 py-1 w-40 sm:w-auto"
            placeholder="Script Title"
          />
        </div>
        
        <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
          <button onMouseDown={(e) => handleToolbarAction(e, 'bold')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Bold"><Bold className="w-4 h-4" /></button>
          <button onMouseDown={(e) => handleToolbarAction(e, 'italic')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Italic"><Italic className="w-4 h-4" /></button>
          <button onMouseDown={(e) => handleToolbarAction(e, 'underline')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Underline"><Underline className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-slate-200 mx-1 shrink-0"></div>
          
          <button onMouseDown={(e) => handleToolbarAction(e, 'formatBlock', 'H1')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
          <button onMouseDown={(e) => handleToolbarAction(e, 'formatBlock', 'H2')} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-slate-200 mx-1 shrink-0"></div>
          
          <button onMouseDown={(e) => triggerColorPicker(e, textColorRef)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 relative group" title="Text Color">
            <Type className="w-4 h-4" />
            <span className="absolute bottom-1 right-1 w-2 h-2 bg-gradient-to-tr from-red-500 to-blue-500 rounded-full border border-white"></span>
          </button>
          <button onMouseDown={(e) => triggerColorPicker(e, highlightColorRef)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 relative" title="Highlight Color">
            <Highlighter className="w-4 h-4" />
            <span className="absolute bottom-1 right-1 w-2 h-2 bg-yellow-400 rounded-full border border-white"></span>
          </button>
          
          <div className="w-px h-4 bg-slate-200 mx-1 shrink-0"></div>
          <button onMouseDown={addLink} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Link"><LinkIcon className="w-4 h-4" /></button>
          <button onMouseDown={addImage} className="p-1.5 hover:bg-slate-100 rounded text-slate-600" title="Image"><ImageIcon className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors shadow-sm"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Export PDF</span>
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div 
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="flex-grow p-8 overflow-y-auto focus:outline-none prose prose-slate max-w-none prose-p:my-2 prose-headings:mb-4 prose-headings:mt-6 cursor-text bg-white"
        style={{ minHeight: isFullScreen ? 'calc(100vh - 60px)' : '500px' }}
      >
      </div>
      
      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex justify-end">
        UnlistedSync Pro Editor {isFullScreen && '(Full Screen)'}
      </div>
    </div>
  );

  // Use Portal for Full Screen
  if (isFullScreen) {
    return ReactDOM.createPortal(
      <div className="fixed inset-0 z-[100] bg-white text-slate-900 font-sans">
        {EditorUI}
      </div>,
      document.body
    );
  }

  return <div className="h-full relative">{EditorUI}</div>;
};


// --- Main App Component ---

const App: React.FC = () => {
  // Global State
  const [view, setView] = useState<ViewMode>('TRANSLATOR');
  const [bgClass] = useState(() => getRandomGradient());
  
  // Translator State
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [direction, setDirection] = useState<TranslationDirection>('HI_TO_EN');
  const [status, setStatus] = useState<TranslationStatus>(TranslationStatus.IDLE);
  const [history, setHistory] = useState<TranslationHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [fullScreenPanel, setFullScreenPanel] = useState<'input' | 'output' | null>(null);
  const outputEndRef = useRef<HTMLDivElement>(null);

  // Script Editor State
  const [scripts, setScripts] = useState<Script[]>([]);
  const [currentScript, setCurrentScript] = useState<Script | null>(null);

  // --- Effects ---

  // Load data on Mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const data = storageService.getData();
    if (data.history) setHistory(data.history);
    if (data.scripts) setScripts(data.scripts);
  };

  // Save Translation History
  useEffect(() => {
    if (history.length > 0) {
      storageService.saveData({ history });
    }
  }, [history]);

  // Auto-scroll output
  useEffect(() => {
    if (status === TranslationStatus.STREAMING) {
      outputEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [outputText, status]);

  // --- Handlers ---

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = generateId();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  // Translation Handlers
  const handleTranslate = async () => {
    if (!inputText.trim()) { addToast("Please enter text", "error"); return; }
    setStatus(TranslationStatus.LOADING);
    setOutputText('');
    let accumulatedText = '';

    try {
      const stream = translateTextStream(inputText, direction);
      setStatus(TranslationStatus.STREAMING);
      for await (const chunk of stream) {
        accumulatedText += chunk;
        setOutputText(accumulatedText);
      }
      setStatus(TranslationStatus.SUCCESS);
      
      const newItem: TranslationHistoryItem = {
        id: generateId(), original: inputText, translated: accumulatedText,
        timestamp: Date.now(), direction
      };
      setHistory((prev) => [newItem, ...prev].slice(0, 50));
    } catch (error) {
      console.error(error);
      setStatus(TranslationStatus.ERROR);
      addToast("Translation failed", "error");
    }
  };

  const handleSwap = () => {
    setDirection(prev => prev === 'HI_TO_EN' ? 'EN_TO_HI' : 'HI_TO_EN');
    const temp = inputText; setInputText(outputText); setOutputText(temp);
    if (!outputText && !temp) setStatus(TranslationStatus.IDLE);
    else setStatus(TranslationStatus.SUCCESS);
  };

  // Script Editor Handlers
  const createNewScript = () => {
    const newScript: Script = {
      id: generateId(),
      title: 'Untitled Script',
      content: '<p>Start writing your script here...</p>',
      lastModified: Date.now()
    };
    setCurrentScript(newScript);
  };

  const saveScript = (updatedScript: Script) => {
    storageService.saveScript(updatedScript);
    setScripts(prev => {
      const idx = prev.findIndex(s => s.id === updatedScript.id);
      if (idx >= 0) {
        const newScripts = [...prev];
        newScripts[idx] = updatedScript;
        return newScripts;
      }
      return [updatedScript, ...prev];
    });
  };

  const deleteScript = (scriptId: string) => {
    if (confirm("Are you sure you want to delete this script?")) {
      storageService.deleteScript(scriptId);
      setScripts(prev => prev.filter(s => s.id !== scriptId));
      if (currentScript?.id === scriptId) setCurrentScript(null);
      addToast('Script deleted', 'info');
    }
  };

  // --- Render Helpers ---
  const isHiToEn = direction === 'HI_TO_EN';
  const isProcessing = status === TranslationStatus.LOADING || status === TranslationStatus.STREAMING;

  return (
    <div className={`min-h-screen ${bgClass} bg-white bg-fixed flex flex-col transition-all duration-1000 ease-in-out`}>
      
      {/* Navigation Bar */}
      {!fullScreenPanel && (
        <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-brand-600 to-indigo-700 p-1.5 rounded-lg">
                <Languages className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-slate-800 text-lg hidden sm:block">Unlisted<span className="text-brand-600">Sync</span></span>
            </div>

            <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border border-slate-200/50">
              <button 
                onClick={() => setView('TRANSLATOR')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === 'TRANSLATOR' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <ArrowRightLeft className="w-4 h-4" /> Translator
              </button>
              <button 
                onClick={() => setView('EDITOR')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${view === 'EDITOR' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <FileText className="w-4 h-4" /> Script Writer
              </button>
            </div>
            
            {/* Empty div for layout balance since login is removed */}
            <div className="w-8"></div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-4 py-6 max-w-6xl flex flex-col h-full flex-grow">
        
        {view === 'TRANSLATOR' ? (
          /* --- Translator View --- */
          <>
            {/* Header */}
            {!fullScreenPanel && (
              <header className="flex items-center justify-between mb-6">
                <div>
                   <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Translator <span className="text-slate-400 font-light text-sm ml-1">Pro</span></h1>
                   <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    {isHiToEn ? "Hindi to US English Script Converter" : "US English to Hinglish Script Converter"}
                  </p>
                </div>
                <button 
                  onClick={() => setShowHistory(!showHistory)}
                  className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-brand-100 text-brand-700' : 'bg-white hover:bg-slate-50 text-slate-600 shadow-sm border border-slate-200'}`}
                >
                  <History className="w-5 h-5" />
                </button>
              </header>
            )}

            <main className={`flex-grow flex flex-col md:flex-row gap-6 items-stretch relative`}>
               {/* History Sidebar */}
              {showHistory && !fullScreenPanel && (
                <div className="absolute top-0 right-0 z-50 w-full md:w-80 h-full min-h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col animate-in slide-in-from-right-10 duration-200">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
                    <h3 className="font-semibold text-slate-700">History</h3>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setHistory([]); storageService.saveData({ history: [] }); }} className="p-1 text-slate-400 hover:text-red-500 mr-2"><Trash2 className="w-4 h-4"/></button>
                      <button onClick={() => setShowHistory(false)}><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex-grow overflow-y-auto p-2 space-y-2">
                    {history.length === 0 ? (
                      <div className="text-center py-10 text-slate-400 text-sm">
                         No history yet
                      </div>
                    ) : history.map((item) => (
                      <button key={item.id} onClick={() => { setInputText(item.original); setOutputText(item.translated); setShowHistory(false); }} className="w-full text-left p-3 rounded-lg hover:bg-brand-50 border border-transparent hover:border-brand-100 transition-all">
                        <p className="text-sm font-medium line-clamp-1">{item.original}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">{item.translated}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Box */}
              <div className={fullScreenPanel === 'input' ? "fixed inset-0 z-50 bg-white flex flex-col" : (fullScreenPanel === 'output' ? "hidden" : "flex-1 flex flex-col bg-white/60 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-brand-100/50 overflow-hidden relative min-h-[500px]")}>
                 <div className="bg-brand-50/50 p-4 border-b border-brand-100/50 flex items-center justify-between backdrop-blur-sm">
                    <span className={`text-sm font-semibold text-brand-700 flex items-center gap-2`}><span className={`w-2 h-2 rounded-full ${isHiToEn ? "bg-orange-400" : "bg-blue-500"}`}></span> {isHiToEn ? "Hindi / Hinglish" : "US English"}</span>
                    <div className="flex gap-1">
                      {inputText && <button onClick={() => setInputText('')} className="p-1.5 text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>}
                      <button onClick={() => { navigator.clipboard.writeText(inputText); addToast("Copied!", "success"); }} className="p-1.5 text-slate-400 hover:text-brand-600"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => setFullScreenPanel(fullScreenPanel === 'input' ? null : 'input')} className="p-1.5 text-slate-400 hover:text-brand-600">{fullScreenPanel === 'input' ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}</button>
                    </div>
                 </div>
                 <textarea 
                    className="flex-grow w-full p-6 focus:outline-none text-lg text-slate-800 placeholder:text-slate-300 font-sans bg-transparent resize-none"
                    placeholder={isHiToEn ? "Paste script here..." : "Paste script here..."}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                 />
                 <div className="p-4 border-t border-brand-100/50 text-xs text-slate-500">{getWordCount(inputText)} words</div>
              </div>

               {/* Controls */}
              {!fullScreenPanel && (
                <div className="hidden md:flex flex-col justify-center items-center gap-6 px-2 relative z-20">
                  <button onClick={handleSwap} className="p-3 bg-white rounded-full text-slate-400 hover:text-brand-600 shadow-md border border-slate-100 hover:rotate-180 transition-all"><ArrowRightLeft className="w-5 h-5" /></button>
                  <button onClick={handleTranslate} disabled={isProcessing || !inputText.trim()} className={`group relative flex items-center justify-center p-4 rounded-full shadow-xl transition-all ${isProcessing ? 'bg-slate-100' : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:scale-105'}`}>
                    {isProcessing ? <Loader2 className="w-6 h-6 text-brand-600 animate-spin" /> : <Sparkles className="w-6 h-6 text-white" />}
                  </button>
                </div>
              )}
               {/* Mobile Controls */}
               {!fullScreenPanel && (
                 <div className="md:hidden flex justify-center gap-4 -my-3 z-20">
                    <button onClick={handleSwap} className="p-3 bg-white rounded-full shadow-lg border border-slate-100"><ArrowRightLeft className="w-5 h-5 rotate-90" /></button>
                    <button onClick={handleTranslate} className="px-6 py-2 bg-brand-600 text-white rounded-full shadow-lg font-medium">Translate</button>
                 </div>
               )}

              {/* Output Box */}
              <div className={fullScreenPanel === 'output' ? "fixed inset-0 z-50 bg-white flex flex-col" : (fullScreenPanel === 'input' ? "hidden" : "flex-1 flex flex-col bg-white/60 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-brand-100/50 overflow-hidden relative min-h-[500px]")}>
                <div className="bg-brand-50/50 p-4 border-b border-brand-100/50 flex items-center justify-between backdrop-blur-sm">
                    <span className={`text-sm font-semibold text-brand-700 flex items-center gap-2`}><span className={`w-2 h-2 rounded-full ${isHiToEn ? "bg-blue-500" : "bg-orange-400"}`}></span> {isHiToEn ? "US English" : "Hindi / Hinglish"}</span>
                    <div className="flex gap-1">
                      <button onClick={() => { navigator.clipboard.writeText(outputText); addToast("Copied!", "success"); }} className="p-1.5 text-slate-400 hover:text-brand-600"><Copy className="w-4 h-4" /></button>
                      <button onClick={() => setFullScreenPanel(fullScreenPanel === 'output' ? null : 'output')} className="p-1.5 text-slate-400 hover:text-brand-600">{fullScreenPanel === 'output' ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}</button>
                    </div>
                 </div>
                 <div className="flex-grow p-6 relative overflow-y-auto">
                    {outputText ? (
                      <div className="prose prose-slate max-w-none pb-8 text-lg text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {outputText}
                        {status === TranslationStatus.STREAMING && <span className="inline-block w-2 h-5 bg-brand-500 ml-1 animate-pulse align-middle"></span>}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-60">
                        <div className="w-16 h-16 rounded-full bg-slate-200/50 flex items-center justify-center"><ArrowRightLeft className="w-8 h-8 text-slate-300" /></div>
                        <p className="text-sm">Translation appears here</p>
                      </div>
                    )}
                    <div ref={outputEndRef} />
                 </div>
                 <div className="p-4 border-t border-brand-100/50 text-xs text-slate-500 text-right">{getWordCount(outputText)} words</div>
              </div>
            </main>
          </>
        ) : (
          /* --- Script Editor View --- */
          <div className="flex flex-col md:flex-row h-full gap-6 flex-grow min-h-[600px]">
            {/* Sidebar Scripts List */}
            <div className={`w-full md:w-64 flex-shrink-0 bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-brand-100/50 flex flex-col ${currentScript && 'hidden md:flex'}`}>
              <div className="p-4 border-b border-brand-100/50 flex justify-between items-center">
                <h3 className="font-bold text-slate-700">My Scripts</h3>
                <button onClick={createNewScript} className="p-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex-grow overflow-y-auto p-2 space-y-2">
                {scripts.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">No scripts yet.<br/>Create one to start writing!</div>
                ) : (
                  scripts.map(s => (
                    <div key={s.id} onClick={() => setCurrentScript(s)} className={`group p-3 rounded-lg border cursor-pointer transition-all ${currentScript?.id === s.id ? 'bg-brand-50 border-brand-200 shadow-sm' : 'bg-white border-transparent hover:border-slate-200'}`}>
                      <h4 className="font-medium text-slate-800 line-clamp-1">{s.title}</h4>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[10px] text-slate-400">{new Date(s.lastModified).toLocaleDateString()}</span>
                        <button onClick={(e) => { e.stopPropagation(); deleteScript(s.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Editor */}
            <div className={`flex-grow ${!currentScript && 'hidden md:block'}`}>
              {currentScript ? (
                <RichTextEditor 
                  key={currentScript.id} // Forces re-render on script switch to refresh DOM content
                  script={currentScript} 
                  onSave={saveScript} 
                  onBack={() => setCurrentScript(null)} 
                />
              ) : (
                <div className="h-full bg-white/40 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-4">
                  <FileText className="w-16 h-16 opacity-20" />
                  <p>Select a script or create a new one</p>
                  <button onClick={createNewScript} className="px-4 py-2 bg-white border border-slate-200 hover:border-brand-300 rounded-lg shadow-sm text-sm font-medium transition-colors">Create New Script</button>
                </div>
              )}
            </div>
          </div>
        )}

        <footer className={`mt-8 text-center text-slate-400 text-sm ${fullScreenPanel ? 'hidden' : ''}`}>
          <p>© {new Date().getFullYear()} UnlistedSync Pro. Optimized for Long-Form Scripts.</p>
        </footer>

        {/* Toasts */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 pointer-events-none">
          {toasts.map((toast) => (
            <div key={toast.id} className={`px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in ${toast.type === 'success' ? 'bg-emerald-600 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'}`}>
              {toast.type === 'success' && <Check className="w-3 h-3" />} {toast.message}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default App;