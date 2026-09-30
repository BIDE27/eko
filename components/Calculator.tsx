import React, { useState, useEffect, useRef } from 'react';
import { ChevronDownIcon } from './icons';

// Component for individual calculator buttons
const CalcButton: React.FC<{
  onClick: (value: string) => void;
  value: string;
  className?: string;
  children: React.ReactNode;
}> = ({ onClick, value, className = '', children }) => {
  return (
    <button
      onClick={() => onClick(value)}
      className={`rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg-secondary)] focus:ring-[var(--color-accent)] transition-all duration-200 font-semibold ${className}`}
    >
      {children}
    </button>
  );
};

// --- Core Evaluation Logic ---
const evaluateExpression = (expr: string, angleMode: 'deg' | 'rad'): number | null => {
    if (!expr) return 0;
    try {
        // 1. Pre-processing and cleaning
        let processedExpr = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π/g, 'Math.PI')
            .replace(/e/g, 'Math.E')
            .replace(/\^/g, '**');

        // 2. Auto-close parentheses
        const openParenCount = (processedExpr.match(/\(/g) || []).length;
        const closeParenCount = (processedExpr.match(/\)/g) || []).length;
        if (openParenCount > closeParenCount) {
            processedExpr += ')'.repeat(openParenCount - closeParenCount);
        }

        // 3. Handle implicit multiplication (e.g., 2(3), (2)(3), 3π)
        processedExpr = processedExpr
            .replace(/(\d|\))(\(|Math\.PI|Math\.E)/g, '$1*$2') // 5( or )( -> 5*( or )*(
            .replace(/(\d*\.?\d+)%/g, '($1/100)');

        // 4. Handle functions (sqrt, log, ln, trig)
        processedExpr = processedExpr
            .replace(/sqrt\(/g, 'Math.sqrt(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(');

        // 5. Handle trigonometry with angle conversion
        const trigFuncs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan'];
        trigFuncs.forEach(f => {
            const regex = new RegExp(`${f}\\(`, 'g');
            let replacement = `Math.${f}(`;
            if (angleMode === 'deg') {
                if (['sin', 'cos', 'tan'].includes(f)) {
                    replacement = `Math.${f}((Math.PI/180)*`;
                } else { // Inverse trig functions
                    replacement = `(180/Math.PI)*Math.${f}(`;
                }
            }
            processedExpr = processedExpr.replace(regex, replacement);
        });
        
        // 6. Handle factorial
        processedExpr = processedExpr.replace(/(\d+)!/g, (_, num) => `factorial(${num})`);

        const factorial = (n: number): number => {
            if (n < 0 || n % 1 !== 0) return NaN;
            if (n > 170) return Infinity; // Max for JS numbers
            if (n === 0) return 1;
            let result = 1;
            for (let i = 2; i <= n; i++) result *= i;
            return result;
        };
        
        // 7. Evaluate the final expression
        // Using Function constructor is safer than eval()
        const result = new Function('factorial', `return ${processedExpr}`)(factorial);
        
        if (typeof result !== 'number' || !isFinite(result)) {
            throw new Error("Invalid result");
        }
        return result;

    } catch (e) {
        console.error("Evaluation error:", e, "Original expr:", expr);
        return null;
    }
};


const Calculator: React.FC = () => {
    const [display, setDisplay] = useState('0');
    const [expression, setExpression] = useState('');
    const [isScientificPanelOpen, setIsScientificPanelOpen] = useState(false);
    const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
    const [isSecondFunction, setIsSecondFunction] = useState(false);
    const [error, setError] = useState(false);
    const [justEvaluated, setJustEvaluated] = useState(false);

    const displayRef = useRef<HTMLDivElement>(null);
    
    // Auto-scroll display to the end
    useEffect(() => {
        if (displayRef.current) {
            displayRef.current.scrollLeft = displayRef.current.scrollWidth;
        }
    }, [display]);


    const handleButtonClick = (value: string) => {
        if (error && value !== 'AC') {
            return;
        }

        const isOperator = (v: string) => ['+', '-', '×', '÷', '^'].includes(v);
        const lastChar = expression.slice(-1);

        const updateState = (newDisplay: string, newExpression: string) => {
            setDisplay(newDisplay || '0');
            setExpression(newExpression || '');
        };

        // If a number is pressed after an evaluation, start a new calculation
        if (justEvaluated && !isOperator(value) && value !== '=' && value !== '%') {
             if (/[0-9.]/.test(value)) {
                updateState(value, value);
                setJustEvaluated(false);
                return;
             }
        }
        setJustEvaluated(false);

        switch (value) {
            case 'AC':
                updateState('0', '');
                setError(false);
                break;
            case 'DEL':
                if (display.length > 1) {
                    // Handle multi-character functions like 'sin('
                    const funcs = ['sin(', 'cos(', 'tan(', 'log(', 'ln(', '√('];
                    let removed = false;
                    for (const func of funcs) {
                        if (display.endsWith(func)) {
                            const exprFunc = func === '√(' ? 'sqrt(' : func;
                            updateState(display.slice(0, -func.length), expression.slice(0, -exprFunc.length));
                            removed = true;
                            break;
                        }
                    }
                    if (!removed) {
                        updateState(display.slice(0, -1), expression.slice(0, -1));
                    }
                } else {
                    updateState('0', '');
                }
                break;
            case '=':
                const result = evaluateExpression(expression, angleMode);
                if (result !== null) {
                    const formattedResult = String(Number(result.toPrecision(15)));
                    updateState(formattedResult, formattedResult);
                    setJustEvaluated(true);
                } else {
                    setDisplay('Error');
                    setError(true);
                }
                break;
            case '.':
                 const parts = expression.split(/[+\-×÷^()]/);
                 if (!parts[parts.length - 1].includes('.')) {
                    updateState(display + value, expression + value);
                 }
                break;
            case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
                if (display === '0' || (justEvaluated && !isOperator(lastChar))) {
                    updateState(value, value);
                } else {
                    updateState(display + value, expression + value);
                }
                break;
            case '+': case '-': case '×': case '÷': case '^':
                if (isOperator(lastChar)) {
                    updateState(display.slice(0, -1) + value, expression.slice(0, -1) + value);
                } else if (expression !== '') { // Allow starting with '-' but not other operators
                    updateState(display + value, expression + value);
                } else if (value === '-') {
                    updateState(value, value);
                }
                break;
            case '%':
                if(expression && !isOperator(lastChar)) {
                    updateState(display + value, expression + value);
                }
                break;
            case '(':
                if (display === '0') {
                    updateState(value, value);
                } else if (!isOperator(lastChar) && expression !== '' && lastChar !== '(') {
                    updateState(display + '×(', expression + '*(');
                } else {
                    updateState(display + value, expression + value);
                }
                break;
            case ')':
                updateState(display + value, expression + value);
                break;
            case 'sin': case 'cos': case 'tan': case 'log': case 'ln':
            case 'sqrt':
                 const func = value === 'sqrt' ? '√' : value;
                 if (display === '0') {
                    updateState(`${func}(`, `${value}(`);
                 } else if (!isOperator(lastChar) && lastChar !== '(') {
                    updateState(`${display}×${func}(`, `${expression}*${value}(`);
                 } else {
                    updateState(`${display}${func}(`, `${expression}${value}(`);
                 }
                break;
            case 'x²':
                if(expression && !isOperator(lastChar)) {
                   updateState(`${display}²`, `${expression}**2`);
                }
                break;
            case '10^x':
                if (display === '0') {
                    updateState(`10^`, `10^`);
                } else if (!isOperator(lastChar) && lastChar !== '(') {
                    updateState(`${display}×10^`, `${expression}*10^`);
                } else {
                    updateState(`${display}10^`, `${expression}10^`);
                }
                break;
            case 'x!':
                 if(expression && !isOperator(lastChar)) {
                    updateState(`${display}!`, `${expression}!`);
                 }
                break;
            case '1/x':
                 if(expression && !isOperator(lastChar)) {
                    // find last number to wrap
                    const lastNumMatch = expression.match(/[\d.]*$/);
                    if (lastNumMatch) {
                        const lastNum = lastNumMatch[0];
                        const exprBase = expression.slice(0, -lastNum.length);
                        const displayBase = display.slice(0, -lastNum.length);
                        updateState(`${displayBase}1/(${lastNum})`, `${exprBase}1/(${lastNum})`);
                    }
                 }
                break;
            case 'π': case 'e':
                 if (display === '0') {
                    updateState(value, value);
                 } else if (!isOperator(lastChar) && lastChar !== '(') {
                    updateState(`${display}×${value}`, `${expression}*${value}`);
                 } else {
                    updateState(display + value, expression + value);
                 }
                break;
            case 'deg/rad':
                setAngleMode(prev => (prev === 'deg' ? 'rad' : 'deg'));
                break;
            case '2nd':
                setIsSecondFunction(prev => !prev);
                break;
            default:
                break;
        }
    };
    
    const sizeClass = isScientificPanelOpen ? 'h-12 text-base md:text-lg' : 'h-16 text-xl';
    const opSymbolClass = isScientificPanelOpen ? 'font-bold text-xl' : 'font-bold text-2xl';
    const digitBtnClass = `bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 ${sizeClass}`;
    const opBtnClass = `bg-indigo-100 hover:bg-indigo-200 text-indigo-700 dark:bg-indigo-900/50 dark:hover:bg-indigo-900 dark:text-indigo-300 ${sizeClass}`;
    const specialOpBtnClass = `bg-slate-500 hover:bg-slate-600 text-white dark:bg-slate-600 dark:hover:bg-slate-500 ${sizeClass}`;
    const acBtnClass = `bg-red-500 hover:bg-red-600 text-white ${sizeClass}`;
    const equalsBtnClass = `bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500 dark:hover:bg-indigo-600 ${sizeClass}`;

    const scientificButtons = [
        { val: 'deg/rad', display: angleMode.toUpperCase() },
        { val: 'x²', display: <>{'x'}<sup className="text-[0.6em]">2</sup></> },
        { val: '10^x', display: <>{'10'}<sup className="text-[0.6em]">x</sup></> },
        { val: 'sqrt', display: '√' },
        { val: '2nd', display: '2nd', className: isSecondFunction ? 'bg-[var(--color-accent)] text-white' : '' },
        { val: 'sin', display: 'sin' }, { val: 'cos', display: 'cos' }, { val: 'tan', display: 'tan' },
        { val: 'x!', display: 'x!' }, { val: '1/x', display: '⅟ₓ' }, { val: 'log', display: 'log' }, { val: 'ln', display: 'ln' },
        { val: '(', display: '(' }, { val: ')', display: ')' }, { val: '%', display: '%' }, { val: '^', display: '^' },
    ];
    
    return (
        <div className="p-4 max-w-sm mx-auto flex flex-col h-full">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4 text-center flex-shrink-0">Calculatrice Scientifique</h1>
            
            <div className="bg-[var(--color-card-bg)] p-4 rounded-lg shadow-md flex flex-col flex-grow min-h-0">
                {/* Display */}
                <div className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] p-6 rounded-lg mb-4 flex-shrink-0 min-h-24 flex flex-col justify-end">
                    <div ref={displayRef} className={`text-5xl font-mono text-right break-all overflow-x-auto ${error ? 'text-red-500' : ''}`} style={{scrollSnapType: 'x mandatory', scrollBehavior: 'smooth'}}>
                       <div className="w-max ml-auto">{error ? 'Error' : display}</div>
                    </div>
                </div>

                {/* Scrollable Buttons Container */}
                <div className="flex-1 overflow-y-auto -mx-1 px-1" role="grid">
                    <div className="grid grid-cols-4 gap-2">
                        {/* Chevron to toggle scientific panel */}
                        <div className="col-span-4 flex justify-center items-center">
                            <button onClick={() => setIsScientificPanelOpen(!isScientificPanelOpen)} className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] transition-colors" aria-label="Afficher les fonctions scientifiques" aria-expanded={isScientificPanelOpen}>
                                <ChevronDownIcon className={`w-6 h-6 transition-transform duration-300 ${isScientificPanelOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>

                        {/* Scientific Panel */}
                        <div className={`col-span-4 grid grid-cols-4 gap-2 transition-all duration-300 ease-in-out overflow-hidden ${isScientificPanelOpen ? 'max-h-[40rem]' : 'max-h-0'}`}>
                            {scientificButtons.map(({ val, display, className }) => (
                                <CalcButton key={val} value={val} onClick={handleButtonClick} className={`${specialOpBtnClass} ${className || ''}`}>
                                    {display}
                                </CalcButton>
                            ))}
                        </div>

                        {/* Basic Buttons */}
                        <CalcButton value="AC" onClick={handleButtonClick} className={acBtnClass}>AC</CalcButton>
                        <CalcButton value="DEL" onClick={handleButtonClick} className={`${specialOpBtnClass} flex items-center justify-center`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.12c.36.53.9.88 1.59.88h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"/>
                            </svg>
                        </CalcButton>
                        <CalcButton value="π" onClick={handleButtonClick} className={specialOpBtnClass}>π</CalcButton>
                        <CalcButton value="÷" onClick={handleButtonClick} className={opBtnClass}><span className={opSymbolClass}>÷</span></CalcButton>
                        
                        <CalcButton value="7" onClick={handleButtonClick} className={digitBtnClass}>7</CalcButton>
                        <CalcButton value="8" onClick={handleButtonClick} className={digitBtnClass}>8</CalcButton>
                        <CalcButton value="9" onClick={handleButtonClick} className={digitBtnClass}>9</CalcButton>
                        <CalcButton value="×" onClick={handleButtonClick} className={opBtnClass}><span className={opSymbolClass}>×</span></CalcButton>

                        <CalcButton value="4" onClick={handleButtonClick} className={digitBtnClass}>4</CalcButton>
                        <CalcButton value="5" onClick={handleButtonClick} className={digitBtnClass}>5</CalcButton>
                        <CalcButton value="6" onClick={handleButtonClick} className={digitBtnClass}>6</CalcButton>
                        <CalcButton value="-" onClick={handleButtonClick} className={opBtnClass}><span className={opSymbolClass}>-</span></CalcButton>

                        <CalcButton value="1" onClick={handleButtonClick} className={digitBtnClass}>1</CalcButton>
                        <CalcButton value="2" onClick={handleButtonClick} className={digitBtnClass}>2</CalcButton>
                        <CalcButton value="3" onClick={handleButtonClick} className={digitBtnClass}>3</CalcButton>
                        <CalcButton value="+" onClick={handleButtonClick} className={opBtnClass}><span className={opSymbolClass}>+</span></CalcButton>

                        <CalcButton value="0" onClick={handleButtonClick} className={`${digitBtnClass} col-span-2`}>0</CalcButton>
                        <CalcButton value="." onClick={handleButtonClick} className={digitBtnClass}>.</CalcButton>
                        <CalcButton value="=" onClick={handleButtonClick} className={equalsBtnClass}><span className={opSymbolClass}>=</span></CalcButton>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Calculator;