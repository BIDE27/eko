import React, { useState, useEffect } from 'react';
import type { RenderHints } from '../types';
import { generateImageFromPrompt } from '../services/geminiService';
import { biologyAssets } from './biologyAssets';
import GeometryRenderer from './GeometryRenderer';

interface ExplanationRendererProps {
  renderHints: RenderHints;
}

// --- Helper for calculating 'nice' tick values for a chart axis ---
const calculateNiceTicks = (min: number, max: number, maxTicks: number = 10) => {
    const range = max - min;
    if (!isFinite(range)) {
        return [];
    }
    if (range === 0) return [min];

    const rawStep = range / (maxTicks - 1);
    const power = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalizedStep = rawStep / power;
    
    let niceNormalizedStep;
    if (normalizedStep < 1.5) {
        niceNormalizedStep = 1;
    } else if (normalizedStep < 3) {
        niceNormalizedStep = 2;
    } else if (normalizedStep < 7) {
        niceNormalizedStep = 5;
    } else {
        niceNormalizedStep = 10;
    }

    const niceStep = niceNormalizedStep * power;
    
    const start = Math.floor(min / niceStep) * niceStep;
    const end = Math.ceil(max / niceStep) * niceStep;

    const ticks = [];
    for (let i = start; i <= end; i += niceStep) {
        ticks.push(parseFloat(i.toPrecision(15)));
    }
    return ticks;
};


// --- Specific Renderers ---

const PolygonRenderer: React.FC<{ nSides: number, radius?: number, showLabels?: boolean }> = ({ nSides, radius = 80, showLabels }) => {
    // FIX: Ensure nSides is a valid number greater than 2 before rendering.
    // This prevents crashes if the AI provides incorrect or non-numeric data.
    const sides = typeof nSides === 'string' ? parseInt(nSides, 10) : nSides;
    if (isNaN(sides) || sides < 3) return null;

    const size = (radius * 2) + 20;
    const center = size / 2;
    
    const points = Array.from({ length: sides }, (_, i) => {
        const angle = (i / sides) * 2 * Math.PI - Math.PI / 2; // Start from top
        const x = center + radius * Math.cos(angle);
        const y = center + radius * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="my-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
                <polygon points={points} fill="var(--color-accent-light-bg)" stroke="var(--color-accent)" strokeWidth="2" />
                {showLabels && <text x={center} y={center + 5} textAnchor="middle" fill="var(--color-text-primary)" fontSize="12">n={sides}</text>}
            </svg>
        </div>
    );
};

const TriangleRenderer: React.FC<{ type: 'isosceles' | 'equilateral' | 'right' | 'scalene', showLabels?: boolean }> = ({ type, showLabels }) => {
    const size = 160;
    const padding = 20;
    
    let points: string;
    // FIX: Replaced `JSX.Element` with `React.ReactElement` to resolve issue where the global JSX namespace is not found.
    const tickMarks: React.ReactElement[] = [];

    const tickMark = (x1: number, y1: number, x2: number, y2: number, key: number) => {
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const tickLength = 6;
        const tick1X = midX + tickLength * Math.sin(angle);
        const tick1Y = midY - tickLength * Math.cos(angle);
        const tick2X = midX - tickLength * Math.sin(angle);
        const tick2Y = midY + tickLength * Math.cos(angle);
        return <line key={key} x1={tick1X} y1={tick1Y} x2={tick2X} y2={tick2Y} stroke="var(--color-accent)" strokeWidth="2" strokeLinecap="round" />;
    };

    const p1 = { x: size / 2, y: padding };
    const p2 = { x: padding, y: size - padding };
    const p3 = { x: size - padding, y: size - padding };
    
    switch (type) {
        case 'isosceles':
            points = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`;
            if (showLabels) {
                tickMarks.push(tickMark(p1.x, p1.y, p2.x, p2.y, 1));
                tickMarks.push(tickMark(p1.x, p1.y, p3.x, p3.y, 2));
            }
            break;
        case 'equilateral':
            const height = (Math.sqrt(3) / 2) * (size - 2 * padding);
            const eq_p1 = { x: size/2, y: padding };
            const eq_p2 = { x: padding, y: padding + height };
            const eq_p3 = { x: size - padding, y: padding + height };
            points = `${eq_p1.x},${eq_p1.y} ${eq_p2.x},${eq_p2.y} ${eq_p3.x},${eq_p3.y}`;
            if (showLabels) {
                tickMarks.push(tickMark(eq_p1.x, eq_p1.y, eq_p2.x, eq_p2.y, 1));
                tickMarks.push(tickMark(eq_p2.x, eq_p2.y, eq_p3.x, eq_p3.y, 2));
                tickMarks.push(tickMark(eq_p3.x, eq_p3.y, eq_p1.x, eq_p1.y, 3));
            }
            break;
        case 'right':
             points = `${padding},${padding} ${padding},${size - padding} ${size - padding},${size - padding}`;
             if(showLabels){
                const cornerSize = 12;
                const path = `M ${padding},${size - padding - cornerSize} L ${padding + cornerSize},${size - padding - cornerSize} L ${padding + cornerSize},${size - padding}`;
                tickMarks.push(<path key={1} d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" />);
             }
             break;
        default: // scalene
            points = `${size/2},${padding} ${padding},${size - padding} ${size - padding - 10},${size - padding - 30}`;
            break;
    }

    return (
        <div className="my-4 flex justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <polygon points={points} fill="var(--color-accent-light-bg)" stroke="var(--color-accent)" strokeWidth="2" />
                {tickMarks}
            </svg>
        </div>
    );
};

const FunctionPlotRenderer: React.FC<{ 
    expr: string, 
    xRange: [number, number],
    yRange?: [number, number],
    samples?: number,
    annotations?: any[]
}> = ({ expr, xRange, yRange, samples = 100, annotations = [] }) => {
    const width = 300;
    const height = 200;
    const padding = 20;

    const safeEval = (x: number): number | null => {
        try {
            // Ensure implicit multiplication is handled (e.g., '4x' -> '4*x', '2(x+1)' -> '2*(x+1)')
            const exprWithMul = expr.replace(/(\d)x/g, '$1*x').replace(/(\d)\(/g, '$1*(');
            const safeExpr = exprWithMul.replace(/\^/g, '**'); // Handle '^' for exponents
            const func = new Function('x', `return ${safeExpr}`);
            const result = func(x);
            return isFinite(result) ? result : null;
        } catch (e) {
            console.error("Error evaluating expression:", e);
            return null;
        }
    };
    
    const points: { x: number, y: number }[] = [];
    let yMin, yMax;

    if (yRange) {
        [yMin, yMax] = yRange;
        // Need to calculate points for the path even if range is given
        for (let i = 0; i <= samples; i++) {
            const x = xRange[0] + (i / samples) * (xRange[1] - xRange[0]);
            const y = safeEval(x);
            if (y !== null) {
                points.push({ x, y });
            }
        }
    } else {
        let calculatedYMin = Infinity, calculatedYMax = -Infinity;

        for (let i = 0; i <= samples; i++) {
            const x = xRange[0] + (i / samples) * (xRange[1] - xRange[0]);
            const y = safeEval(x);
            if (y !== null) {
                points.push({ x, y });
                if (y < calculatedYMin) calculatedYMin = y;
                if (y > calculatedYMax) calculatedYMax = y;
            }
        }
        
        // Also consider annotation points for y-range calculation
        (annotations || []).forEach(ann => {
            if (ann.type === 'point' && Array.isArray(ann.coordinates) && ann.coordinates.length >= 2) {
                const [, annY] = ann.coordinates;
                if (annY < calculatedYMin) calculatedYMin = annY;
                if (annY > calculatedYMax) calculatedYMax = annY;
            }
        });

        yMin = calculatedYMin === Infinity ? -5 : calculatedYMin;
        yMax = calculatedYMax === -Infinity ? 5 : calculatedYMax;
        
        if (yMin === yMax) { yMin -= 1; yMax += 1; }
        
        const yRangeVal = yMax - yMin;
        yMin -= yRangeVal * 0.1;
        yMax += yRangeVal * 0.1;
    }

    const toSvgX = (x: number) => padding + ((x - xRange[0]) / (xRange[1] - xRange[0])) * (width - 2 * padding);
    const toSvgY = (y: number) => (height - padding) - ((y - yMin) / (yMax - yMin)) * (height - 2 * padding);

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toSvgX(p.x)} ${toSvgY(p.y)}`).join(' ');

    const originX = toSvgX(0);
    const originY = toSvgY(0);

    const tickLength = 5;
    const xTickValues = calculateNiceTicks(xRange[0], xRange[1], 10);
    const yTickValues = calculateNiceTicks(yMin, yMax, 8);

    const xTicks = xTickValues.map(tickValue => {
        if (tickValue === 0) return null;
        const x = toSvgX(tickValue);
        return (
            <g key={`x-tick-${tickValue}`}>
                <line x1={x} y1={originY - tickLength / 2} x2={x} y2={originY + tickLength / 2} stroke="var(--color-border)" strokeWidth="1" />
                <text x={x} y={originY + 15} textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)">{tickValue}</text>
            </g>
        );
    }).filter(Boolean);
    
    const yTicks = yTickValues.map(tickValue => {
        if (tickValue === 0) return null;
        const y = toSvgY(tickValue);
        return (
            <g key={`y-tick-${tickValue}`}>
                <line x1={originX - tickLength / 2} y1={y} x2={originX + tickLength / 2} y2={y} stroke="var(--color-border)" strokeWidth="1" />
                <text x={originX - 12} y={y + 3} textAnchor="end" fontSize="10" fill="var(--color-text-secondary)">{tickValue}</text>
            </g>
        );
    }).filter(Boolean);

    const annotationElements = (annotations || []).map((ann, index) => {
        if (ann.type === 'point' && Array.isArray(ann.coordinates) && ann.coordinates.length >= 2) {
            const [annX, annY] = ann.coordinates;
            if (annX >= xRange[0] && annX <= xRange[1] && annY >= yMin && annY <= yMax) {
                const svgX = toSvgX(annX);
                const svgY = toSvgY(annY);
                return (
                    <g key={`ann-${index}`}>
                        <circle cx={svgX} cy={svgY} r="4" fill={ann.color || '#D0021B'} stroke="var(--color-card-bg)" strokeWidth="1.5" />
                        {ann.label && (
                            <text 
                                x={svgX + 6} 
                                y={svgY - 6} 
                                fontSize="10" 
                                fill={ann.color || 'var(--color-text-primary)'}
                                style={{textShadow: '0 0 2px var(--color-card-bg), 0 0 2px var(--color-card-bg)'}}
                            >
                                {ann.label}
                            </text>
                        )}
                    </g>
                );
            }
        }
        return null;
    }).filter(Boolean);

    return (
      <div className="my-4 flex justify-center">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            {/* Axes */}
            <line x1={originX} y1={padding} x2={originX} y2={height - padding} stroke="var(--color-border)" strokeWidth="1" />
            <line x1={padding} y1={originY} x2={width - padding} y2={originY} stroke="var(--color-border)" strokeWidth="1" />
            
            {/* Ticks */}
            {xTicks}
            {yTicks}
            <text x={originX - 10} y={originY + 12} fontSize="10" fill="var(--color-text-secondary)">0</text>
            
            {/* Function Path */}
            <path d={pathData} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" />
            
            {/* Annotations */}
            {annotationElements}
        </svg>
      </div>
    );
};


const Molecule2DRenderer: React.FC<{ formula?: string, labels?: boolean }> = ({ formula, labels }) => {
  if (formula === 'H2O') {
    const viewBoxSize = 120;
    const center = viewBoxSize / 2;
    const oxygenRadius = 20;
    const hydrogenRadius = 10;
    const bondLength = 40;
    const angle = 104.5 * (Math.PI / 180); // convert to radians

    const h1_x = center - bondLength * Math.sin(angle / 2);
    const h1_y = center + bondLength * Math.cos(angle / 2);
    const h2_x = center + bondLength * Math.sin(angle / 2);
    const h2_y = center + bondLength * Math.cos(angle / 2);

    return (
      <div className="my-4 flex justify-center">
        <svg width="100" height="100" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}>
          <line x1={center} y1={center} x2={h1_x} y2={h1_y} stroke="var(--color-text-secondary)" strokeWidth="2" />
          <line x1={center} y1={center} x2={h2_x} y2={h2_y} stroke="var(--color-text-secondary)" strokeWidth="2" />
          <circle cx={center} cy={center} r={oxygenRadius} fill="#ef4444" />
          <text x={center} y={center + 5} textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">O</text>
          <circle cx={h1_x} cy={h1_y} r={hydrogenRadius} fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
          <text x={h1_x} y={h1_y + 4} textAnchor="middle" fill="var(--color-text-primary)" fontSize="12" fontWeight="bold">H</text>
          <circle cx={h2_x} cy={h2_y} r={hydrogenRadius} fill="#e5e7eb" stroke="#d1d5db" strokeWidth="1" />
          <text x={h2_x} y={h2_y + 4} textAnchor="middle" fill="var(--color-text-primary)" fontSize="12" fontWeight="bold">H</text>
        </svg>
      </div>
    );
  }

  return <PlaceholderRenderer type="Molecule2D" props={{ formula, error: "Le rendu pour cette molécule n'est pas implémenté." }} />;
};

const MoleculeBohrRenderer: React.FC<{ Z: number, labels?: boolean, scale?: number }> = ({ Z, labels, scale = 1 }) => {
    if (Z < 1 || Z > 118) {
        return <PlaceholderRenderer type="MoleculeBohr" props={{ error: "Numéro atomique (Z) invalide.", Z }} />;
    }

    const shellCapacities = [2, 8, 8, 18, 18, 32, 32];
    const electronShells: { shell: number, electrons: number }[] = [];
    let electronsRemaining = Z;
    let shellIndex = 0;

    while (electronsRemaining > 0 && shellIndex < shellCapacities.length) {
        const capacity = shellCapacities[shellIndex];
        const electronsInShell = Math.min(electronsRemaining, capacity);
        electronShells.push({ shell: shellIndex + 1, electrons: electronsInShell });
        electronsRemaining -= electronsInShell;
        shellIndex++;
    }
    
    const baseRadius = 30;
    const shellSpacing = 20;
    const maxRadius = baseRadius + (electronShells.length > 0 ? electronShells.length - 1 : 0) * shellSpacing;
    const size = (maxRadius * 2 + 20) * scale;
    const center = size / 2;

    const nucleusRadius = 15 * scale;
    const electronRadius = 4 * scale;

    return (
        <div className="my-4">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
                {/* Orbits */}
                {electronShells.map(({ shell }) => (
                    <circle
                        key={`shell-${shell}`}
                        cx={center}
                        cy={center}
                        r={(baseRadius + (shell - 1) * shellSpacing) * scale}
                        fill="none"
                        stroke="var(--color-border)"
                        strokeWidth="1"
                    />
                ))}

                {/* Nucleus */}
                <circle cx={center} cy={center} r={nucleusRadius} fill="var(--color-accent-light-bg)" />
                {labels && (
                    <text x={center} y={center + 5 * scale} textAnchor="middle" fill="var(--color-accent-text)" fontSize={12 * scale} fontWeight="bold">
                        {Z}p+
                    </text>
                )}

                {/* Electrons */}
                {electronShells.map(({ shell, electrons }) => {
                    const orbitRadius = (baseRadius + (shell - 1) * shellSpacing) * scale;
                    return Array.from({ length: electrons }).map((_, i) => {
                        const angle = (i / electrons) * 2 * Math.PI + (shell * 0.5); // Add offset to stagger electrons
                        const x = center + orbitRadius * Math.cos(angle);
                        const y = center + orbitRadius * Math.sin(angle);
                        return <circle key={`e-${shell}-${i}`} cx={x} cy={y} r={electronRadius} fill="var(--color-text-primary)" />;
                    });
                })}
            </svg>
        </div>
    );
};


const ImageGenerator: React.FC<{ prompt: string; width?: number; height?: number; }> = ({ prompt, width, height }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generate = async () => {
      if (!prompt) return;
      setIsLoading(true);
      setError(null);
      try {
        const url = await generateImageFromPrompt(prompt);
        setImageUrl(url);
      } catch (err) {
        setError("Désolé, la génération de l'image a échoué. Cela peut être dû à une restriction de contenu ou à un problème temporaire. Veuillez essayer avec une autre description.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    generate();
  }, [prompt]);

  if (isLoading) {
    return (
      <div className="my-4 p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-xs">
        <p className="font-bold text-[var(--color-text-primary)]">Génération de l'image en cours...</p>
        <div className="mt-2 h-48 bg-gray-300 dark:bg-gray-600 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg text-xs text-red-700 dark:text-red-300">
        <p>{error}</p>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="my-4 rounded-lg overflow-hidden border border-[var(--color-border)]">
        <img
          src={imageUrl}
          alt={prompt}
          className="w-full h-auto"
          style={{ maxWidth: width || '100%', maxHeight: height || 'auto' }}
        />
      </div>
    );
  }

  return null;
};

const BiologySVGRenderer: React.FC<{ asset: string, highlight?: string[], labels?: boolean }> = ({ asset, highlight = [] }) => {
    const AssetComponent = biologyAssets[asset];

    if (!AssetComponent) {
        return <PlaceholderRenderer type="BiologySVG" props={{ asset, error: `Asset '${asset}' non trouvé.` }} />;
    }

    return (
        <div className="my-4 flex justify-center">
            <div className="w-48 h-48">
               <AssetComponent highlights={highlight} />
            </div>
        </div>
    );
};

const SimpleDisplayRenderer: React.FC<{ mainText: string, subText?: string, style?: string }> = ({ mainText, subText, style }) => {
    switch (style) {
        case 'chemical-symbol':
            return (
                <div className="my-4 flex justify-center">
                    <div className="w-24 h-24 bg-[var(--color-bg-secondary)] rounded-lg flex flex-col items-center justify-center border border-[var(--color-border)] shadow-inner">
                        <span className="text-4xl font-bold font-sans text-[var(--color-text-primary)]">{mainText}</span>
                        {subText && <span className="text-sm text-[var(--color-text-secondary)] mt-1">{subText}</span>}
                    </div>
                </div>
            );
        case 'formula':
             return (
                <div className="my-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg text-center border border-[var(--color-border)]">
                     <p className="text-xl font-mono text-[var(--color-text-primary)]">{mainText}</p>
                     {subText && <p className="text-sm text-[var(--color-text-secondary)] mt-2">{subText}</p>}
                </div>
            );
        default:
            return (
                <div className="my-4 p-4 bg-[var(--color-bg-secondary)] rounded-lg text-center">
                     <p className="text-2xl font-semibold text-[var(--color-text-primary)]">{mainText}</p>
                     {subText && <p className="text-md text-[var(--color-text-secondary)]">{subText}</p>}
                </div>
            );
    }
};

// --- Fallback Renderer ---

const PlaceholderRenderer: React.FC<{ type: string, props: Record<string, any> }> = ({ type, props }) => (
    <div className="my-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-amber-800 dark:text-amber-300">
        <p className="font-bold">Aide visuelle non prise en charge</p>
        <p className="mt-1">Fumi a suggéré une aide visuelle de type '{type.replace('Type Inconnu: ', '')}', qui n'est pas encore implémentée.</p>
        <details className="mt-2 text-xs">
            <summary className="cursor-pointer font-medium hover:text-[var(--color-text-primary)]">Afficher les détails techniques</summary>
            <pre className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-wrap bg-[var(--color-bg-primary)] p-2 rounded">
                {JSON.stringify(props, null, 2)}
            </pre>
        </details>
    </div>
);

// --- Main Renderer Component ---

const ExplanationRenderer: React.FC<ExplanationRendererProps> = ({ renderHints }) => {
    const type = renderHints.type;
    const props = renderHints.props || {};

    if (typeof type !== 'string' || !type) {
        return <PlaceholderRenderer type="Invalide" props={{ error: "Le type de l'aide visuelle est manquant ou invalide.", received: renderHints }} />;
    }

    // Normalize type to handle potential casing/whitespace inconsistencies from the AI
    const normalizedType = type.trim().toLowerCase();

    switch (normalizedType) {
        case 'polygon': {
            // Be more flexible with the prop name from the AI
            let nSidesValue: any = props.nSides || props.sides || props.numberOfSides;
            
            // Attempt to parse if it's a string number
            if (typeof nSidesValue === 'string') {
                const parsed = parseInt(nSidesValue, 10);
                if (!isNaN(parsed)) {
                    nSidesValue = parsed;
                }
            }
            
            if (typeof nSidesValue === 'number' && nSidesValue >= 3) {
                return <PolygonRenderer nSides={nSidesValue} radius={props.radius} showLabels={props.showLabels} />;
            }

            return <PlaceholderRenderer type="Polygon" props={{ error: "Propriété 'nSides' (ou alias) invalide. Doit être un nombre >= 3.", received: props }} />;
        }

        case 'triangle': {
            const { type: triangleType, showLabels } = props;
            if (['isosceles', 'equilateral', 'right', 'scalene'].includes(triangleType)) {
                 return <TriangleRenderer type={triangleType} showLabels={showLabels} />;
            }
            return <PlaceholderRenderer type="Triangle" props={{ error: "Propriété 'type' invalide ou manquante.", received: props }} />;
        }
        
        case 'functionplot': {
            const normalizeFunctionPlotProps = (plotProps: any) => {
                const p = plotProps || {};
                let expr: string | undefined;
                let xRange: [number, number] | undefined;
                let yRange: [number, number] | undefined;
                let annotations: any[] | undefined;

                // 1. Get expression: Check for various possible keys
                expr = p.expr || p.expression || p.function || p.equation || p.formula;
                if (!expr && Array.isArray(p.functions) && p.functions.length > 0) {
                    const func = p.functions[0] || {};
                    expr = func.fn || func.equation || func.function;
                }

                const isValidRange = (arr: any): arr is [number, number] => 
                    Array.isArray(arr) && 
                    arr.length === 2 && 
                    typeof arr[0] === 'number' && 
                    typeof arr[1] === 'number' &&
                    isFinite(arr[0]) &&
                    isFinite(arr[1]);

                // 2. Get xRange: Check for various possible keys and formats
                const potentialXRanges = [p.xRange, p.xAxisRange, p.options?.xDomain];
                for (const range of potentialXRanges) {
                    if (isValidRange(range)) {
                        xRange = range;
                        break;
                    }
                }
                if (!xRange) {
                    const xMin = p.xMin ?? p.xAxis?.min;
                    const xMax = p.xMax ?? p.xAxis?.max;
                    if (typeof xMin === 'number' && typeof xMax === 'number' && isFinite(xMin) && isFinite(xMax)) {
                        xRange = [xMin, xMax];
                    }
                }
                
                // 3. Get yRange: Check for various possible keys and formats
                const potentialYRanges = [p.yRange, p.yAxisRange, p.options?.yDomain];
                 for (const range of potentialYRanges) {
                    if (isValidRange(range)) {
                        yRange = range;
                        break;
                    }
                }
                if (!yRange) {
                    const yMin = p.yMin ?? p.yAxis?.min;
                    const yMax = p.yMax ?? p.yAxis?.max;
                    if (typeof yMin === 'number' && typeof yMax === 'number' && isFinite(yMin) && isFinite(yMax)) {
                        yRange = [yMin, yMax];
                    }
                }
                
                // 4. Get annotations: Standardize from various possible keys
                annotations = p.annotations;
                if (!annotations && Array.isArray(p.highlightPoints)) {
                    annotations = p.highlightPoints
                        .map((point: any) => {
                            if (!point || typeof point !== 'object') return null;
                            const x = Number(point.x ?? (Array.isArray(point.coordinates) ? point.coordinates[0] : undefined));
                            const y = Number(point.y ?? (Array.isArray(point.coordinates) ? point.coordinates[1] : undefined));
                            if (isNaN(x) || isNaN(y)) {
                                console.warn('Invalid coordinates for annotation point, skipping:', point);
                                return null;
                            }
                            return { type: 'point', coordinates: [x, y], label: point.label, color: point.color };
                        })
                        .filter(Boolean) as any[];
                }
                
                // 5. Fallback: If xRange is still missing, set a default
                if (!xRange && expr) {
                   xRange = [-10, 10];
                }

                return { expr, xRange, yRange, annotations, samples: p.samples };
            }

            const { expr, xRange, yRange, annotations, samples } = normalizeFunctionPlotProps(props);
            
            if (expr && xRange) {
                return <FunctionPlotRenderer expr={expr} xRange={xRange} yRange={yRange} samples={samples} annotations={annotations} />;
            }
            
            return <PlaceholderRenderer type="FunctionPlot" props={{ error: "Props invalides : 'expr'/'functions' ou 'xRange' incorrect.", received: props }} />;
        }

        case 'realisticimage': {
            // FIX: Changed 'image_prompt' to 'prompt' to correctly handle image generation requests from the dictionary.
            // The Gemini service prompt was configured to return a 'prompt' property, but the renderer was expecting 'image_prompt'.
            const { image_url, prompt, width, height } = props;
            if (image_url) {
                return <div className="my-4 rounded-lg overflow-hidden"><img src={image_url} alt={prompt || 'Visualisation'} className="w-full h-auto" style={{maxWidth: width || '100%', maxHeight: height || 'auto' }} /></div>;
            }
            if (prompt) {
                return <ImageGenerator prompt={prompt} width={width} height={height} />;
            }
            return null;
        }

        case 'molecule2d': {
            const { formula, labels } = props;
             return <Molecule2DRenderer formula={formula} labels={labels} />;
        }

        case 'moleculebohr': {
            const Z = props.Z || props.atomicNumber;
            const { labels, scale } = props;
            if (typeof Z === 'number') {
                return <MoleculeBohrRenderer Z={Z} labels={labels} scale={scale} />;
            }
            return <PlaceholderRenderer type="MoleculeBohr" props={{ error: "Propriété 'Z' (ou 'atomicNumber') invalide.", received: props }} />;
        }

        case 'simpledisplay': {
            const mainText = props.mainText || props.text || props.content;
            const { subText, style } = props;
            const imageSrc = props.image || props.imageUrl;
            const altText = props.altText || props.alt;

            if (typeof imageSrc === 'string') {
                return (
                    <div className="my-4 rounded-lg overflow-hidden border border-[var(--color-border)]">
                        <img src={imageSrc} alt={altText || 'Visualisation'} className="w-full h-auto object-cover" />
                    </div>
                );
            }

            if (typeof mainText === 'string') {
                return <SimpleDisplayRenderer mainText={mainText} subText={subText} style={style} />;
            }
            return <PlaceholderRenderer type="SimpleDisplay" props={{ error: "Propriété 'mainText' (ou 'text'/'content' ou 'image') invalide.", received: props }} />;
        }

        case 'biologysvg': {
            const { asset, highlight, labels } = props;
            if (typeof asset === 'string') {
                return <BiologySVGRenderer asset={asset} highlight={highlight} labels={labels} />;
            }
            return <PlaceholderRenderer type="BiologySVG" props={{ error: "Propriété 'asset' invalide.", received: props }} />;
        }
        
        case 'geometry': {
            const { objects } = props;
            if (Array.isArray(objects)) {
                return <GeometryRenderer objects={objects} />;
            }
            return <PlaceholderRenderer type="Geometry" props={{ error: "La propriété 'objects' (un tableau) est invalide ou manquante.", received: props }} />;
        }

        case 'svgdisplay': {
            const { svg, altText } = props;
            if (typeof svg === 'string') {
                // WARNING: Using dangerouslySetInnerHTML. In a real-world application,
                // you should sanitize the SVG content to prevent XSS attacks.
                // Libraries like DOMPurify can be used for this purpose.
                return (
                    <div
                        className="my-4 flex justify-center"
                        aria-label={altText || 'Visualisation SVG'}
                        dangerouslySetInnerHTML={{ __html: svg }}
                    />
                );
            }
            return <PlaceholderRenderer type="SVGDisplay" props={{ error: "Propriété 'svg' invalide ou manquante.", received: props }} />;
        }

        case 'diagram':
        case 'circuit': {
            const { prompt, width, height } = props;
            if (typeof prompt === 'string' && prompt) {
                return <ImageGenerator prompt={prompt} width={width} height={height} />;
            }
            return <PlaceholderRenderer type={type} props={{ error: "Propriété 'prompt' requise pour générer le diagramme.", received: props }} />;
        }

        case 'none':
            return null;

        default:
            if (normalizedType && normalizedType !== 'none') {
              return <PlaceholderRenderer type={`Type Inconnu: ${type}`} props={props} />;
            }
            return null;
    }
};

export default ExplanationRenderer;
