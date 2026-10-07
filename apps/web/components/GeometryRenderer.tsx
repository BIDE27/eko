import React, { useMemo } from 'react';

interface Point {
    type: 'point';
    id: string;
    label: string;
    x: number;
    y: number;
}

interface Circle {
    type: 'circle';
    center: string;
    radius: number;
    label?: string;
    color?: string;
}

interface Segment {
    type: 'segment';
    points: [string, string];
    label?: string;
    color?: string;
}

type GeometryObject = Point | Circle | Segment;

interface GeometryRendererProps {
    objects: GeometryObject[];
}

const SCALE = 40;
const PADDING = 20;

const GeometryRenderer: React.FC<GeometryRendererProps> = ({ objects }) => {
    const pointsMap = useMemo(() => {
        const map = new Map<string, { x: number; y: number }>();
        objects.forEach(obj => {
            if (obj.type === 'point') {
                map.set(obj.id, { x: obj.x, y: obj.y });
            }
        });
        return map;
    }, [objects]);

    const bounds = useMemo(() => {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        if (pointsMap.size === 0) return { minX: -1, maxX: 1, minY: -1, maxY: 1 };

        objects.forEach(obj => {
            if (obj.type === 'point') {
                minX = Math.min(minX, obj.x);
                maxX = Math.max(maxX, obj.x);
                minY = Math.min(minY, obj.y);
                maxY = Math.max(maxY, obj.y);
            } else if (obj.type === 'circle') {
                const center = pointsMap.get(obj.center);
                if (center) {
                    minX = Math.min(minX, center.x - obj.radius);
                    maxX = Math.max(maxX, center.x + obj.radius);
                    minY = Math.min(minY, center.y - obj.radius);
                    maxY = Math.max(maxY, center.y + obj.radius);
                }
            }
        });
        
        if (minX === Infinity) return { minX: -1, maxX: 1, minY: -1, maxY: 1 };
        
        if (minX === maxX) { minX -= 1; maxX += 1; }
        if (minY === maxY) { minY -= 1; maxY += 1; }

        return { minX, maxX, minY, maxY };
    }, [objects, pointsMap]);

    const viewBox = useMemo(() => {
        const vbWidth = (bounds.maxX - bounds.minX) * SCALE + 2 * PADDING;
        const vbHeight = (bounds.maxY - bounds.minY) * SCALE + 2 * PADDING;
        const vbX = bounds.minX * SCALE - PADDING;
        const vbY = -bounds.maxY * SCALE - PADDING;
        return `${vbX} ${vbY} ${vbWidth} ${vbHeight}`;
    }, [bounds]);

    const transform = (x: number, y: number) => ({
        x: x * SCALE,
        y: -y * SCALE,
    });

    return (
        <div className="w-full aspect-square bg-[var(--color-bg-secondary)] rounded-lg overflow-hidden">
            <svg viewBox={viewBox} width="100%" height="100%" className="text-[var(--color-text-primary)]">
                <defs>
                    <pattern id="smallGrid" width={SCALE/5} height={SCALE/5} patternUnits="userSpaceOnUse">
                        <path d={`M ${SCALE/5} 0 L 0 0 0 ${SCALE/5}`} fill="none" stroke="var(--color-border)" strokeWidth="0.5"/>
                    </pattern>
                    <pattern id="grid" width={SCALE} height={SCALE} patternUnits="userSpaceOnUse">
                        <rect width={SCALE} height={SCALE} fill="url(#smallGrid)"/>
                        <path d={`M ${SCALE} 0 L 0 0 0 ${SCALE}`} fill="none" stroke="var(--color-text-secondary)" strokeWidth="1"/>
                    </pattern>
                </defs>
                <rect x={viewBox.split(' ')[0]} y={viewBox.split(' ')[1]} width={viewBox.split(' ')[2]} height={viewBox.split(' ')[3]} fill="url(#grid)" />
                <line x1={viewBox.split(' ')[0]} y1="0" x2={parseFloat(viewBox.split(' ')[0]) + parseFloat(viewBox.split(' ')[2])} y2="0" stroke="var(--color-accent)" strokeWidth="1.5" />
                <line x1="0" y1={viewBox.split(' ')[1]} x2="0" y2={parseFloat(viewBox.split(' ')[1]) + parseFloat(viewBox.split(' ')[3])} stroke="var(--color-accent)" strokeWidth="1.5" />


                {objects.map((obj, index) => {
                    switch (obj.type) {
                        case 'segment': {
                            const p1 = pointsMap.get(obj.points[0]);
                            const p2 = pointsMap.get(obj.points[1]);
                            if (!p1 || !p2) return null;
                            const t1 = transform(p1.x, p1.y);
                            const t2 = transform(p2.x, p2.y);
                            const midX = (t1.x + t2.x) / 2;
                            const midY = (t1.y + t2.y) / 2;
                            return (
                                <g key={index}>
                                    <line
                                        x1={t1.x} y1={t1.y}
                                        x2={t2.x} y2={t2.y}
                                        stroke={obj.color || 'var(--color-text-primary)'}
                                        strokeWidth="2"
                                    />
                                    {obj.label && <text x={midX} y={midY - 5} fontSize="12" textAnchor="middle" fill={obj.color || 'var(--color-text-primary)'} className="font-semibold" style={{ paintOrder: 'stroke', stroke: 'var(--color-bg-secondary)', strokeWidth: '3px', strokeLinejoin: 'round' }}>{obj.label}</text>}
                                </g>
                            );
                        }
                        case 'circle': {
                            const center = pointsMap.get(obj.center);
                            if (!center) return null;
                            const { x, y } = transform(center.x, center.y);
                            return (
                                <g key={index}>
                                    <circle
                                        cx={x} cy={y}
                                        r={obj.radius * SCALE}
                                        fill="none"
                                        stroke={obj.color || 'var(--color-text-primary)'}
                                        strokeWidth="2"
                                    />
                                </g>
                            );
                        }
                        case 'point': {
                            const { x, y } = transform(obj.x, obj.y);
                            return (
                                <g key={index}>
                                    <circle cx={x} cy={y} r="3" fill="var(--color-text-primary)" />
                                    <text x={x + 5} y={y - 5} fontSize="12" fill="var(--color-text-primary)" className="font-semibold" style={{ paintOrder: 'stroke', stroke: 'var(--color-bg-secondary)', strokeWidth: '3px', strokeLinejoin: 'round' }}>{obj.label}</text>
                                </g>
                            );
                        }
                        default:
                            return null;
                    }
                })}
            </svg>
        </div>
    );
};

export default GeometryRenderer;
