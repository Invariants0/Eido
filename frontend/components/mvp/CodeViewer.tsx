'use client';

import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'motion/react';
import {
    FileCode, ChevronRight, ChevronDown, Copy, CheckCircle,
    FolderOpen, Folder, File
} from 'lucide-react';

// ── Mock project file tree & contents ─────────────────────────────────────

interface FileNode {
    name: string;
    type: 'file' | 'dir';
    lang?: string;
    children?: FileNode[];
    content?: string;
}

const PROJECT_TREE: FileNode[] = [
    {
        name: 'frontend', type: 'dir', children: [
            {
                name: 'src', type: 'dir', children: [
                    {
                        name: 'App.tsx', type: 'file', lang: 'tsx',
                        content: `import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { AnalyzePage } from './pages/AnalyzePage';
import { Navbar } from './components/Navbar';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/analyze" element={<AnalyzePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;`
                    },
                    {
                        name: 'components', type: 'dir', children: [
                            {
                                name: 'Navbar.tsx', type: 'file', lang: 'tsx',
                                content: `import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';

export function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-slate-800">ResumeAI</span>
        </Link>
        <Link
          to="/analyze"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          Get Started
        </Link>
      </div>
    </nav>
  );
}`
                            },
                            {
                                name: 'UploadZone.tsx', type: 'file', lang: 'tsx',
                                content: `import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';

interface UploadZoneProps {
  onFileAccepted: (file: File) => void;
}

export function UploadZone({ onFileAccepted }: UploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) onFileAccepted(acceptedFiles[0]);
  }, [onFileAccepted]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] },
    maxFiles: 1,
  });

  return (
    <div
      {...getRootProps()}
      className={\`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all
        \${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'}\`}
    >
      <input {...getInputProps()} />
      <Upload className="w-8 h-8 text-blue-400 mx-auto mb-3" />
      <p className="text-slate-600 font-medium">Drop your resume here</p>
      <p className="text-sm text-slate-400 mt-1">PDF or DOCX, up to 10MB</p>
    </div>
  );
}`
                            },
                        ]
                    },
                    {
                        name: 'pages', type: 'dir', children: [
                            {
                                name: 'HomePage.tsx', type: 'file', lang: 'tsx',
                                content: `import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Zap, CheckCircle2 } from 'lucide-react';

export function HomePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16 text-center">
      <span className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-medium mb-6 border border-blue-100">
        AI-Powered · ATS-Optimized
      </span>
      <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-5">
        Land Your Dream Job with a{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">
          Smarter Resume
        </span>
      </h1>
      <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8 leading-relaxed">
        Our AI analyzes job descriptions and tailors your resume to pass ATS filters and impress hiring managers — in seconds.
      </p>
      <Link
        to="/analyze"
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all"
      >
        Analyze My Resume <ArrowRight className="w-4 h-4" />
      </Link>
    </main>
  );
}`
                            },
                        ]
                    },
                ]
            },
            {
                name: 'package.json', type: 'file', lang: 'json',
                content: `{
  "name": "resumeai-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-dropzone": "^14.2.3",
    "lucide-react": "^0.344.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "typescript": "^5.2.2",
    "vite": "^5.0.8",
    "tailwindcss": "^3.4.0",
    "@vitejs/plugin-react": "^4.2.1"
  }
}`
            },
        ]
    },
    {
        name: 'backend', type: 'dir', children: [
            {
                name: 'main.py', type: 'file', lang: 'python',
                content: `from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from .services.analyzer import ResumeAnalyzer

app = FastAPI(title="ResumeAI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

analyzer = ResumeAnalyzer()

@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

@app.post("/api/analyze")
async def analyze_resume(file: UploadFile = File(...), job_description: str = ""):
    content = await file.read()
    result = await analyzer.analyze(content, file.filename, job_description)
    return result`
            },
            {
                name: 'requirements.txt', type: 'file', lang: 'text',
                content: `fastapi>=0.109.0
uvicorn>=0.27.0
python-multipart>=0.0.6
pydantic>=2.5.0
openai>=1.10.0
PyPDF2>=3.0.1
python-docx>=1.1.0`
            },
            {
                name: 'Dockerfile', type: 'file', lang: 'docker',
                content: `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`
            },
        ]
    },
];

// ── Tree Node ──────────────────────────────────────────────────────────────

function TreeNode({
    node,
    depth,
    selectedPath,
    onSelect,
    path,
}: {
    node: FileNode;
    depth: number;
    selectedPath: string;
    onSelect: (path: string, node: FileNode) => void;
    path: string;
}) {
    const [open, setOpen] = useState(depth === 0);
    const isDir = node.type === 'dir';
    const isSelected = path === selectedPath;

    return (
        <div>
            <button
                onClick={() => {
                    if (isDir) setOpen((p) => !p);
                    else onSelect(path, node);
                }}
                className={`w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left text-[11px] transition-colors group ${isSelected
                    ? 'bg-[#22D3EE]/10 text-[#22D3EE]'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]'
                    }`}
                style={{ paddingLeft: `${depth * 12 + 8}px` }}
            >
                {isDir ? (
                    open
                        ? <FolderOpen className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                        : <Folder className="w-3.5 h-3.5 text-[#F59E0B] shrink-0" />
                ) : (
                    <File className="w-3.5 h-3.5 text-[#4B5563] shrink-0 group-hover:text-[#9CA3AF]" />
                )}
                <span className="truncate font-mono">{node.name}</span>
                {isDir && (
                    open
                        ? <ChevronDown className="w-3 h-3 ml-auto shrink-0 text-[#374151]" />
                        : <ChevronRight className="w-3 h-3 ml-auto shrink-0 text-[#374151]" />
                )}
            </button>

            {isDir && open && node.children && (
                <div>
                    {node.children.map((child) => (
                        <TreeNode
                            key={child.name}
                            node={child}
                            depth={depth + 1}
                            selectedPath={selectedPath}
                            onSelect={onSelect}
                            path={`${path}/${child.name}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────

export function CodeViewer() {
    const [selectedPath, setSelectedPath] = useState('frontend/src/App.tsx');
    const [selectedNode, setSelectedNode] = useState<FileNode | null>(() => {
        // Find default file
        const src = PROJECT_TREE[0]?.children?.[0]; // frontend/src
        return src?.children?.find((n) => n.name === 'App.tsx') ?? null;
    });
    const [copied, setCopied] = useState(false);

    const handleSelect = (path: string, node: FileNode) => {
        setSelectedPath(path);
        setSelectedNode(node);
    };

    const handleCopy = () => {
        if (selectedNode?.content) {
            navigator.clipboard.writeText(selectedNode.content);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="flex h-full overflow-hidden bg-[#0B0F19] rounded-none">

            {/* ── File Tree ──────────────────────────────────────────────────── */}
            <div className="w-[200px] shrink-0 border-r border-white/[0.06] overflow-y-auto no-scrollbar bg-[#0F1117]">
                <div className="px-3 py-2.5 border-b border-white/[0.05]">
                    <div className="flex items-center gap-2 text-[10px] font-mono text-[#374151] uppercase tracking-wider">
                        <FileCode className="w-3 h-3" />
                        Explorer
                    </div>
                </div>
                <div className="py-1.5">
                    {PROJECT_TREE.map((node) => (
                        <TreeNode
                            key={node.name}
                            node={node}
                            depth={0}
                            selectedPath={selectedPath}
                            onSelect={handleSelect}
                            path={node.name}
                        />
                    ))}
                </div>
            </div>

            {/* ── Editor Area ────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Tab bar */}
                <div className="h-9 flex items-center border-b border-white/[0.06] bg-[#111827] shrink-0 px-2 gap-1 overflow-x-auto no-scrollbar">
                    {selectedNode && (
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#0B0F19] border border-white/[0.06] rounded-t-md border-b-0 text-[11px] font-mono text-white shrink-0">
                            <File className="w-3 h-3 text-[#4B5563]" />
                            {selectedNode.name}
                        </div>
                    )}
                    <div className="ml-auto flex items-center gap-1 shrink-0 pr-1">
                        <button
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono text-[#4B5563] hover:text-white hover:bg-white/[0.06] transition-colors"
                        >
                            {copied
                                ? <><CheckCircle className="w-3 h-3 text-emerald-400" /> Copied</>
                                : <><Copy className="w-3 h-3" /> Copy</>
                            }
                        </button>
                    </div>
                </div>

                {/* Code content */}
                <div className="flex-1 overflow-auto no-scrollbar">
                    <AnimatePresence mode="wait">
                        {selectedNode ? (
                            <motion.div
                                key={selectedPath}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.12 }}
                                className="min-h-full"
                            >
                                <SyntaxHighlighter
                                    language={selectedNode.lang === 'tsx' ? 'tsx'
                                        : selectedNode.lang === 'python' ? 'python'
                                            : selectedNode.lang === 'json' ? 'json'
                                                : selectedNode.lang === 'docker' ? 'dockerfile'
                                                    : 'text'}
                                    style={oneDark}
                                    showLineNumbers
                                    lineNumberStyle={{
                                        color: '#374151',
                                        fontSize: '11px',
                                        paddingRight: '16px',
                                        userSelect: 'none',
                                        minWidth: '40px',
                                    }}
                                    customStyle={{
                                        margin: 0,
                                        padding: '16px 0',
                                        background: 'transparent',
                                        fontSize: '12px',
                                        lineHeight: '1.7',
                                        height: '100%',
                                    }}
                                    codeTagProps={{ style: { fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace" } }}
                                    wrapLongLines={false}
                                >
                                    {selectedNode.content ?? ''}
                                </SyntaxHighlighter>
                            </motion.div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full gap-3 text-[#374151]">
                                <FileCode className="w-10 h-10 opacity-20" />
                                <p className="text-sm font-mono">Select a file to view</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
