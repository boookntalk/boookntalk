// 경로: frontend/src/components/common/WordCloudChart.tsx
// 역할 및 기능: ECharts 기반 워드 클라우드 (단어 누락 방지, 가독성 및 5mm~1cm 간격 최적화)

'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import 'echarts-wordcloud';

interface TagData {
    text: string;
}

interface WordCloudChartProps {
    data: TagData[];
    onWordClick: (word: string) => void;
}

// 기능: Echarts 옵션을 생성하고 단어 클릭 이벤트를 처리하며, 긴 단어의 누락을 방지합니다.
export default function WordCloudChart({ data, onWordClick }: WordCloudChartProps) {
    const echartsData = useMemo(() => {
        return data.map((tag, index) => {
            let cleanText = tag.text.replace(/#/g, '');
            
            let fill = '#A0AABF';
            let fontWeight = 500;
            let sizeWeight = 10; 
            
            // 데이터 순위에 따른 스타일 차등 부여 (가중치 비율을 현실적으로 조정)
            if (index <= 1) { fill = '#1F3A5F'; fontWeight = 900; sizeWeight = 100; }
            else if (index <= 3) { 
                fill = '#C89B3C'; 
                fontWeight = 800; 
                sizeWeight = 80; 
                cleanText += ' 🔥'; 
            }
            else if (index <= 6) { fill = '#667085'; fontWeight = 700; sizeWeight = 60; }
            else { sizeWeight = Math.max(10, 50 - index); } 
            
            return {
                name: cleanText,
                value: sizeWeight,
                textStyle: { color: fill, fontWeight: fontWeight }
            };
        });
    }, [data]);

    const option = {
        tooltip: { show: false },
        series: [{
            type: 'wordCloud',
            shape: 'square',
            keepAspect: true,
            left: 'center', top: 'center',
            width: '100%', height: '100%',
            
            // 1. 긴 단어('무라카미 하루키' 등)가 캔버스 밖으로 밀려 누락되지 않도록 최대 폰트 축소 (56 -> 36)
            sizeRange: [12, 36], 
            
            // 2. 가독성을 극대화하고 누락을 막기 위해 텍스트를 모두 가로로만 배치 (세로 배치 금지)
            rotationRange: [0, 0], 
            rotationStep: 0, 
            
            // 3. 단어 간 간격을 요청하신 5mm ~ 1cm (약 20~30픽셀) 수준으로 대폭 확대
            gridSize: 24, 
            
            drawOutOfBound: false,
            layoutAnimation: true,
            textStyle: { fontFamily: 'sans-serif' },
            data: echartsData
        }]
    };

    const onEvents = {
        click: (params: any) => {
            if (params.data && params.data.name) {
                onWordClick(params.data.name);
            }
        }
    };

    return (
        <ReactECharts 
            option={option} 
            onEvents={onEvents}
            style={{ width: '100%', height: '100%', cursor: 'pointer' }} 
            opts={{ renderer: 'canvas' }}
        />
    );
}