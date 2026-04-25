import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, Cpu, HardDrive, Shield } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiProvider: 'gemini' | 'ollama';
  setAiProvider: (provider: 'gemini' | 'ollama') => void;
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
  ollamaModel: string;
  setOllamaModel: (model: string) => void;
  llmModel: string;
  setLlmModel: (model: string) => void;
  llmTemperature: number;
  setLlmTemperature: (temp: number) => void;
  orbitApiKey: string;
  setOrbitApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  aiProvider,
  setAiProvider,
  ollamaUrl,
  setOllamaUrl,
  ollamaModel,
  setOllamaModel,
  llmModel,
  setLlmModel,
  llmTemperature,
  setLlmTemperature,
  orbitApiKey,
  setOrbitApiKey
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-xl w-full bg-[#0A0A0A] border border-blue-500/30 rounded-[2rem] p-6 md:p-10 shadow-[0_0_50px_rgba(59,130,246,0.15)] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                  <Settings className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-widest text-white">Engine Settings</h2>
                  <p className="text-[10px] dot-matrix text-white/40 mt-1">Configure your LLM Provider</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 border border-white/5 rounded-full hover:bg-white/5 transition-colors">
                <X className="w-5 h-5 text-white/50 hover:text-white" />
              </button>
            </div>

            <div className="space-y-8 relative z-10">
              {/* Provider Selection */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">AI Engine Provider</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setAiProvider('gemini')}
                    className={cn(
                      "p-4 rounded-xl border flex flex-col items-center gap-3 transition-all",
                      aiProvider === 'gemini' 
                        ? "bg-blue-500/10 border-blue-500 text-white" 
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                    )}
                  >
                    <Cpu className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Google Gemini</span>
                  </button>
                  <button
                    onClick={() => setAiProvider('ollama')}
                    className={cn(
                      "p-4 rounded-xl border flex flex-col items-center gap-3 transition-all",
                      aiProvider === 'ollama' 
                        ? "bg-emerald-500/10 border-emerald-500 text-white" 
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10"
                    )}
                  >
                    <HardDrive className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Local Ollama</span>
                  </button>
                </div>
              </div>

              {/* Ollama Settings */}
              {aiProvider === 'ollama' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-4 border-t border-white/10"
                >
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex gap-3 text-emerald-400 text-xs mb-4">
                    <Shield className="w-4 h-4 shrink-0" />
                    <p>Ensure Ollama is running on your machine and CORS is enabled via OLLAMA_ORIGINS="*".</p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Ollama API URL</label>
                    <input 
                      type="text" 
                      value={ollamaUrl}
                      onChange={(e) => setOllamaUrl(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                      placeholder="http://localhost:11434"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Ollama Model Name</label>
                    <input 
                      type="text" 
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white font-mono focus:border-emerald-500 focus:outline-none"
                      placeholder="e.g. llama3, mistral"
                    />
                  </div>
                </motion.div>
              )}

              {/* Gemini Settings */}
              {aiProvider === 'gemini' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4 pt-4 border-t border-white/10"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Gemini Model</label>
                    <input 
                      type="text" 
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white font-mono focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">ORBIT Engine API Key</label>
                    <input 
                      type="password" 
                      value={orbitApiKey}
                      onChange={(e) => setOrbitApiKey(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-lg p-3 text-sm text-white font-mono focus:border-blue-500 focus:outline-none"
                      placeholder="Enter your Google Gemini API key"
                    />
                    <p className="text-[10px] text-white/40 mt-2">Get your API key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline">Google AI Studio</a></p>
                  </div>
                </motion.div>
              )}

              <div className="space-y-2 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-white/50">Temperature</label>
                  <span className="text-[10px] text-white/70 font-mono">{llmTemperature.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="1" step="0.05"
                  value={llmTemperature}
                  onChange={(e) => setLlmTemperature(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
