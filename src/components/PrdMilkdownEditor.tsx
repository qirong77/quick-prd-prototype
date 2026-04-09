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
  const rootRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

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

    crepe.on((listen) => {
      listen.markdownUpdated((_ctx, markdown) => {
        onChangeRef.current(markdown);
      });
    });

    void crepe.create();

    return () => {
      void crepe.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={rootRef} className="prd-milkdown-root" />;
};
