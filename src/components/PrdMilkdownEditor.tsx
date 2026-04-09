import { Crepe, CrepeFeature } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import React, { useLayoutEffect, useRef } from 'react';

export type PrdMilkdownEditorProps = {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
};

export const PrdMilkdownEditor: React.FC<PrdMilkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeCrepeRef = useRef<Crepe | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 每次挂载使用独立子节点，避免 React Strict Mode 下两次 effect 共用同一 DOM 根时
    // Crepe 创建/销毁竞态导致 Context（如 editorView）错乱。
    const root = document.createElement('div');
    root.className = 'prd-milkdown-inner';
    container.appendChild(root);

    const crepe = new Crepe({
      root,
      defaultValue: value,
      featureConfigs: {
        [CrepeFeature.Placeholder]: {
          text: placeholder,
          mode: 'block',
        },
      },
    });
    activeCrepeRef.current = crepe;

    crepe.on((listen) => {
      listen.markdownUpdated((_ctx, markdown) => {
        if (activeCrepeRef.current === crepe) {
          onChangeRef.current(markdown);
        }
      });
    });

    const createPromise = crepe.create();

    return () => {
      activeCrepeRef.current = null;
      void createPromise
        .then(
          () => crepe.destroy(),
          () => crepe.destroy()
        )
        .finally(() => {
          root.remove();
        });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={containerRef} className="prd-milkdown-root" />;
};
