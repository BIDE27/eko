import React from 'react';
import type { FumiStructuredResponse, ExplanationStep } from '../types';
import ExplanationRenderer from './ExplanationRenderer';
import GeometryRenderer from './GeometryRenderer';
import { FumiAvatarIcon } from './icons';

// Helper function to parse and style text with markdown and mathematical operators
const parseAndStyleText = (text: string) => {
    if (!text) return null;
    // Regex to find **bold** text, numbers, and operators/parentheses
    const parts = text.split(/(\*\*.*?\*\*|\b\d+(?:[.,]\d+)?\b|[+\-*/=()^])/g);

    return parts.map((part, index) => {
        if (!part) return null;
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="font-bold text-[var(--color-text-primary)]">{part.slice(2, -2)}</strong>;
        }
        if (/\b\d+(?:[.,]\d+)?\b/.test(part)) {
            return <span key={index} className="font-medium text-[var(--color-text-primary)]">{part}</span>;
        }
        if (/[+\-*/=()^]/.test(part)) {
            return <span key={index} className="text-[var(--color-text-secondary)] mx-1">{part}</span>;
        }
        // For other text parts, like variables 'x'
        return <span key={index}>{part}</span>;
    });
};

const StepRenderer: React.FC<{ step: ExplanationStep }> = ({ step }) => {
    return (
        <div className="py-4">
            <h3 className="font-semibold text-sm text-[var(--color-accent-text)] mb-2">{step.title}</h3>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    {parseAndStyleText(step.explanation)}
                </div>
                {step.result && (
                    <div className="bg-[var(--color-bg-primary)] p-2 rounded-md text-right min-w-[100px] max-w-[45%] border border-[var(--color-border)]">
                        <p className="font-bold text-md text-[var(--color-accent)] font-mono">
                            {parseAndStyleText(step.result)}
                        </p>
                    </div>
                )}
            </div>
            {step.renderHints && (
                <div className="mt-4">
                    <ExplanationRenderer renderHints={step.renderHints} />
                </div>
            )}
        </div>
    );
};

const FumiMessageContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-end space-x-2 max-w-lg">
    <div className="flex-shrink-0 self-start w-8 h-8 rounded-full bg-[var(--color-card-bg)] p-1 border border-[var(--color-border)]">
      <FumiAvatarIcon className="w-full h-full" />
    </div>
    <div className="flex-1 min-w-0">
      {children}
    </div>
  </div>
);


const FumiMessageRenderer: React.FC<{ content: string }> = ({ content }) => {
    let parsedContent: any = null;
    try {
        let cleanContent = content.trim();
        if (cleanContent.startsWith("```json")) {
            cleanContent = cleanContent.substring(7, cleanContent.length - 3).trim();
        } else if (cleanContent.startsWith("```")) {
            cleanContent = cleanContent.substring(3, cleanContent.length - 3).trim();
        }
        parsedContent = JSON.parse(cleanContent);
    } catch (e) {
        // Not a valid JSON, will render as plain text below
    }

    if (parsedContent) {
        // Handle structured step-by-step explanations
        if (parsedContent.steps && Array.isArray(parsedContent.steps)) {
            return (
                <FumiMessageContainer>
                    <div className="rounded-2xl w-full bg-[var(--color-card-bg)] text-[var(--color-text-primary)] rounded-bl-none shadow-sm border border-[var(--color-border)] overflow-hidden">
                        <div className="divide-y divide-[var(--color-border)]">
                            {parsedContent.steps.map((step, index) => (
                                <div key={index} className="px-4">
                                    <StepRenderer step={step} />
                                </div>
                            ))}
                        </div>
                    </div>
                </FumiMessageContainer>
            );
        }

        // Handle geometry visualizations
        if (parsedContent.type === 'geometry' && Array.isArray(parsedContent.objects)) {
            return (
                <FumiMessageContainer>
                    <div className="rounded-2xl w-full bg-[var(--color-card-bg)] text-[var(--color-text-primary)] rounded-bl-none shadow-sm border border-[var(--color-border)] overflow-hidden p-2">
                        <GeometryRenderer objects={parsedContent.objects} />
                    </div>
                </FumiMessageContainer>
            );
        }

        // Handle structured explanation with render hints (new format)
        if (parsedContent.explanation && parsedContent.renderHints) {
            return (
                <FumiMessageContainer>
                    <div className="rounded-2xl w-full bg-[var(--color-card-bg)] text-[var(--color-text-primary)] rounded-bl-none shadow-sm border border-[var(--color-border)] overflow-hidden">
                        <div className="p-4 space-y-4">
                            {parsedContent.answer && (
                                <div className="p-3 bg-green-100 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg">
                                    <p className="text-green-800 dark:text-green-100 font-semibold">Réponse: {parsedContent.answer}</p>
                                </div>
                            )}
                            <div className="text-[var(--color-text-secondary)] space-y-2 prose prose-sm max-w-none dark:prose-invert">
                                {parsedContent.explanation}
                            </div>
                            <ExplanationRenderer renderHints={parsedContent.renderHints} />
                        </div>
                    </div>
                </FumiMessageContainer>
            );
        }
    }
    
    // Fallback for plain text (initial message, errors, etc.)
    return (
        <FumiMessageContainer>
            <div className="rounded-2xl p-3 bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] rounded-bl-none">
                <p className="text-sm whitespace-pre-wrap">{content}</p>
            </div>
        </FumiMessageContainer>
    );
};

export default FumiMessageRenderer;