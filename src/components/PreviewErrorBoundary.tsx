import { Alert } from 'antd';
import React from 'react';

type State = { error?: Error };
type Props = { children: React.ReactNode };

export class PreviewErrorBoundary extends React.Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Alert
          type="error"
          showIcon
          message="预览运行时错误"
          description={
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                margin: 0,
                fontSize: 12,
                maxHeight: 320,
                overflow: 'auto',
              }}
            >
              {this.state.error.message}
            </pre>
          }
        />
      );
    }
    return this.props.children;
  }
}
