import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { FiX, FiPlus, FiMinus, FiChevronLeft, FiChevronRight, FiDownload } from 'react-icons/fi';
import { CgSpinner } from 'react-icons/cg';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

// Realistic mock document content generator based on category & page number
const getMockDocContent = (doc, pageNum) => {
  const category = (doc.category || '').toLowerCase();
  const title = doc.fullName || doc.name;

  if (category.includes('research')) {
    if (pageNum === 1) {
      return (
        <div className="space-y-4">
          <div className="text-center space-y-2 pb-6 border-b border-gray-200">
            <h1 className="text-2xl font-serif font-bold tracking-tight text-gray-900">{title}</h1>
            <p className="text-sm font-medium text-gray-600">Dept. of Computer Science & Artificial Intelligence</p>
            <p className="text-xs text-gray-400">Published: January 2026</p>
          </div>
          <div className="space-y-2 pt-4">
            <h2 className="text-sm font-bold tracking-wider text-gray-800 uppercase">Abstract</h2>
            <p className="text-xs text-gray-600 leading-relaxed text-justify first-letter:text-3xl first-letter:font-bold first-letter:text-[#5b4fd4] first-letter:float-left first-letter:mr-2">
              This paper presents an in-depth analysis of next-generation architectural constructs within the scope of our primary research dataset. We explore the design space, evaluating tradeoffs in computational efficiency, latency profiles, and developer ergonomics. Through rigorous benchmarking, we show that our proposed system outperforms current state-of-the-art baselines by up to 43% under simulated workloads. We conclude by identifying key areas for future exploration.
            </p>
          </div>
          <div className="space-y-2 pt-4">
            <h2 className="text-sm font-bold tracking-wider text-gray-800 uppercase">1. Introduction</h2>
            <p className="text-xs text-gray-600 leading-relaxed text-justify">
              Modern engineering tasks often necessitate the integration of highly distributed processing frameworks. Over the past decade, several architectural designs have emerged, each targeting specific latency and scalability constraints. However, as dataset scales grow exponentially, these legacy configurations struggle with overhead.
            </p>
          </div>
        </div>
      );
    } else if (pageNum === 2) {
      return (
        <div className="space-y-4">
          <h2 className="text-sm font-bold tracking-wider text-gray-800 uppercase pb-2 border-b border-gray-100">2. Methodology & Architecture</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Our framework relies on a dual-phase indexing pipeline. In the first phase, raw binary streams are tokenized and processed through our parser layer, which extracts structural metadata tags. In the second phase, these tags are fed into a vector embedding matrix.
          </p>
          <div className="my-6 p-4 bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center">
            <div className="text-[10px] font-bold text-gray-500 mb-2">Figure 1: High-level System Pipeline Architecture</div>
            <div className="w-full flex items-center justify-around h-20 bg-white border border-gray-300 rounded p-2">
              <div className="bg-blue-50 border border-blue-200 text-blue-700 text-[9px] px-2 py-1 rounded font-mono font-bold">Input Docs</div>
              <div className="text-gray-400">➔</div>
              <div className="bg-[#151130]/10 border border-[#5b4fd4]/20 text-[#5b4fd4] text-[9px] px-2 py-1 rounded font-mono font-bold">Vector Embed</div>
              <div className="text-gray-400">➔</div>
              <div className="bg-green-50 border border-green-200 text-green-700 text-[9px] px-2 py-1 rounded font-mono font-bold">RAG Retrieval</div>
            </div>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            By offloading dense token lookups to our optimized indexing matrix, we achieve significant throughput improvements compared to vanilla CPU-bound database scans.
          </p>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <h2 className="text-sm font-bold tracking-wider text-gray-800 uppercase pb-2 border-b border-gray-100">3. Results & Discussion</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            We evaluated our approach across a synthetic test suite consisting of 10,000 document queries. The results demonstrate a clear advantage for our architecture across all tested dimensions.
          </p>
          <table className="w-full border-collapse border border-gray-200 text-[10px] my-3">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="border border-gray-200 p-1.5 font-bold">Algorithm</th>
                <th className="border border-gray-200 p-1.5 font-bold">Latency (ms)</th>
                <th className="border border-gray-200 p-1.5 font-bold">Memory (MB)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 p-1.5">Legacy Baseline</td>
                <td className="border border-gray-200 p-1.5">248 ms</td>
                <td className="border border-gray-200 p-1.5">1420 MB</td>
              </tr>
              <tr className="font-bold text-[#5b4fd4]">
                <td className="border border-gray-200 p-1.5">Our Proposed</td>
                <td className="border border-gray-200 p-1.5">142 ms</td>
                <td className="border border-gray-200 p-1.5">850 MB</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-600 leading-relaxed">
            Future work will investigate end-to-end optimizations to integrate local neural networks directly on consumer hardware.
          </p>
        </div>
      );
    }
  } else if (category.includes('financial') || category.includes('report')) {
    if (pageNum === 1) {
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">{title}</h1>
              <p className="text-xs text-gray-500">FISCAL YEAR PERFORMANCE ANALYSIS</p>
            </div>
            <div className="bg-[#151130]/10 border border-[#5b4fd4]/20 text-[#5b4fd4] text-xs font-bold px-3 py-1 rounded">
              Confidential
            </div>
          </div>
          <div className="pt-4 grid grid-cols-3 gap-3">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Total Revenue</span>
              <span className="text-lg font-bold text-green-600">$14.2M</span>
              <span className="text-[9px] text-gray-400 block mt-1">+12% YoY</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Operating Margin</span>
              <span className="text-lg font-bold text-gray-800">28.4%</span>
              <span className="text-[9px] text-gray-400 block mt-1">+1.8 pts YoY</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-center">
              <span className="text-[10px] font-bold text-gray-400 block uppercase">Net Cashflow</span>
              <span className="text-lg font-bold text-blue-600">+$3.1M</span>
              <span className="text-[9px] text-gray-400 block mt-1">Healthy</span>
            </div>
          </div>
          <div className="space-y-2 pt-4">
            <h2 className="text-xs font-bold text-gray-800 uppercase">Executive Summary</h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              We closed the fiscal period with strong revenue and profit expansion. Subscriptions grew at a record clip, fueled by enterprise adoption. Operating expense management remained disciplined, boosting gross and net margins.
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-800 uppercase pb-1 border-b border-gray-200">Segment Breakdown & Forecasts</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Domestic markets contributed 68% of overall revenue, with international markets scaling up fast, registering 44% year-over-year gains.
          </p>
          <table className="w-full border-collapse border border-gray-200 text-[10px] my-3">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="border border-gray-200 p-1.5">Region</th>
                <th className="border border-gray-200 p-1.5">Q1-Q3 Actuals</th>
                <th className="border border-gray-200 p-1.5">Q4 Forecast</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-200 p-1.5">North America</td>
                <td className="border border-gray-200 p-1.5">$7.1M</td>
                <td className="border border-gray-200 p-1.5">$2.4M</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-1.5">Europe</td>
                <td className="border border-gray-200 p-1.5">$3.2M</td>
                <td className="border border-gray-200 p-1.5">$1.1M</td>
              </tr>
              <tr>
                <td className="border border-gray-200 p-1.5">Asia-Pacific</td>
                <td className="border border-gray-200 p-1.5">$2.8M</td>
                <td className="border border-gray-200 p-1.5">$0.9M</td>
              </tr>
            </tbody>
          </table>
          <p className="text-xs text-gray-600 leading-relaxed">
            Looking ahead, we project a 15% revenue expansion next fiscal year, assuming stable market tailwinds.
          </p>
        </div>
      );
    }
  } else if (category.includes('legal') || category.includes('contract')) {
    return (
      <div className="space-y-4 font-mono text-[11px] text-gray-800 leading-normal">
        <div className="text-center font-bold border-b border-gray-300 pb-4">
          <div className="text-base font-serif">STANDARD SERVICE AGREEMENT</div>
          <div className="text-[10px] text-gray-400 mt-1">Ref ID: {doc.id}-LEGAL-2026</div>
        </div>
        <p className="text-justify">
          This Agreement is entered into as of this day, between <strong>DocsMind Solutions Inc.</strong> (hereinafter referred to as the "Company"), and the executing party subscribing to the services of the Company (hereinafter referred to as the "Client").
        </p>
        <p className="font-bold uppercase mt-4">1. Scope of Services</p>
        <p className="text-justify">
          The Company agrees to provide cloud processing, PDF rendering, metadata parsing, and related intelligence utilities to the Client under the terms of this Agreement.
        </p>
        <p className="font-bold uppercase mt-4">2. Payment & Subscription Fees</p>
        <p className="text-justify">
          Client shall remit monthly fees in accordance with the selected tier. Unpaid invoices outstanding for more than thirty (30) days will result in automated account suspension.
        </p>
        <div className="pt-12 grid grid-cols-2 gap-8 font-sans">
          <div className="border-t border-gray-400 pt-2 text-center text-[10px]">
            <p className="font-bold">DocsMind Inc. Signatory</p>
            <p className="text-gray-400 mt-6">[Authorized Signature]</p>
          </div>
          <div className="border-t border-gray-400 pt-2 text-center text-[10px]">
            <p className="font-bold">Client Signatory</p>
            <p className="text-gray-400 mt-6">[Authorized Signature]</p>
          </div>
        </div>
      </div>
    );
  } else {
    // Default fallback placeholder (Meeting notes, project docs, training etc)
    return (
      <div className="space-y-4">
        <div className="border-b border-gray-200 pb-3">
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          <p className="text-xs text-gray-400">Category: {doc.category || 'General Documentation'}</p>
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5b4fd4]" />
            <h3 className="text-xs font-bold text-gray-800">Objectives & Deliverables</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed pl-3.5">
            This document sets out the critical operational guidelines, schedules, and workflows for project success. Teams should review their items and update tracking matrices daily.
          </p>
        </div>
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5b4fd4]" />
            <h3 className="text-xs font-bold text-gray-800">Key Action Items</h3>
          </div>
          <ul className="list-disc pl-8 text-xs text-gray-600 space-y-1.5">
            <li>Refactor modular layouts and split components.</li>
            <li>Connect PDF viewer popup modal with react-pdf package.</li>
            <li>Implement folder-specific action buttons and toolbar searches.</li>
          </ul>
        </div>
      </div>
    );
  }
};

const PDFViewerModal = ({ doc, onClose }) => {
  const [numPages, setNumPages] = useState(3); // Default mock page count
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfLoadError, setPdfLoadError] = useState(false);

  if (!doc) return null;

  const handleDocumentLoadSuccess = ({ numPages: nextNumPages }) => {
    setNumPages(nextNumPages);
    setIsLoading(false);
    setPdfLoadError(false);
  };

  const handleDocumentLoadError = () => {
    setPdfLoadError(true);
    setIsLoading(false);
  };

  const changePage = (offset) => {
    setPageNumber((prev) => Math.max(1, Math.min(numPages, prev + offset)));
  };

  const zoom = (factor) => {
    setScale((prev) => Math.max(0.5, Math.min(2.0, prev + factor)));
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col z-50 overflow-hidden font-sans">
      {/* Toolbar */}
      <header className="h-12 shrink-0 bg-[#10121a] border-b border-[#1c1f30] px-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#1a1c2e] border border-[#20223a] flex items-center justify-center text-[#5b4fd4] shrink-0">
            <FiX size={16} className="rotate-45" />
          </div>
          <h2 className="text-xs font-semibold text-[#e4e4e7] truncate">{doc.fullName || doc.name}</h2>
        </div>

        {/* Page controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-1.5 bg-[#1a1c2e] hover:bg-[#20223a] disabled:opacity-30 disabled:cursor-not-allowed border border-[#20223a] text-white rounded transition-colors"
          >
            <FiChevronLeft size={14} />
          </button>
          <span className="text-[11px] font-mono text-[#a1a1aa] px-2 min-w-[70px] text-center">
            {pageNumber} / {numPages}
          </span>
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= numPages}
            className="p-1.5 bg-[#1a1c2e] hover:bg-[#20223a] disabled:opacity-30 disabled:cursor-not-allowed border border-[#20223a] text-white rounded transition-colors"
          >
            <FiChevronRight size={14} />
          </button>
        </div>

        {/* Zoom & Action controls */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-[#1a1c2e] border border-[#20223a] rounded p-0.5">
            <button
              onClick={() => zoom(-0.1)}
              className="p-1 hover:bg-[#20223a] text-white rounded transition-colors"
              title="Zoom Out"
            >
              <FiMinus size={13} />
            </button>
            <span className="text-[10px] font-mono text-[#a1a1aa] px-1.5 min-w-[40px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => zoom(0.1)}
              className="p-1 hover:bg-[#20223a] text-white rounded transition-colors"
              title="Zoom In"
            >
              <FiPlus size={13} />
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors cursor-pointer"
            title="Close Viewer"
          >
            <FiX size={15} />
          </button>
        </div>
      </header>

      {/* PDF Viewport */}
      <div className="flex-1 overflow-auto bg-[#0c0d12] flex items-start justify-center p-6 relative">
        {isLoading && (
          <div className="absolute inset-0 bg-[#0c0d12]/60 flex items-center justify-center z-10">
            <CgSpinner size={28} className="text-[#5b4fd4] animate-spin" />
          </div>
        )}

        <div
          className="transition-transform duration-150 origin-top shadow-2xl relative"
          style={{ transform: `scale(${scale})` }}
        >
          {doc.url && !pdfLoadError ? (
            <Document
              file={doc.url}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-20">
                  <CgSpinner size={24} className="text-[#5b4fd4] animate-spin" />
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-2xl rounded"
              />
            </Document>
          ) : (
            /* Premium Category-specific simulated PDF document page */
            <div className="bg-white text-black p-12 max-w-[620px] w-[620px] min-h-[840px] aspect-[1/1.35] shadow-2xl rounded-md flex flex-col justify-between select-text relative border border-gray-300">
              {/* Watermark in center of mock */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none">
                <div className="text-6xl font-sans font-bold tracking-widest text-[#5b4fd4] rotate-45 select-none uppercase">
                  DocsMind
                </div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 border-b border-gray-100 pb-2">
                <span>DocsMind PDF Simulation Portal</span>
                <span>{doc.fullName || doc.name}</span>
              </div>

              {/* Main mock content */}
              <div className="flex-1 py-8">
                {getMockDocContent(doc, pageNumber)}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-100 pt-2 font-mono">
                <span>Page {pageNumber} of {numPages}</span>
                <span>File Size: {doc.size || 'N/A'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewerModal;
